Great, thanks for the artifacts + the log. The flow is getting stuck
right after `SIGNED_IN` because your auth layer waits for a "full
session fetch" that's gated by a custom timeout. You then show the
welcome page ("Auth check timeout") even though Supabase already
authenticated the user.

Below is a targeted plan for **exact files to open** and **exact changes
to make**. This will remove the artificial timeouts, stop
double-navigation, and redirect immediately after login while still
fetching tenant/role data in the background.

------------------------------------------------------------------------

# ✅ What to change (file by file)

## 1) `/src/integrations/supabase/client.ts`

**Goal:** Make sure session persistence + refresh are on and stable.

**Action (ensure these options):**

``` ts
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'gemeos.supabase.auth',
    flowType: 'pkce', // optional but recommended
  },
});
```

------------------------------------------------------------------------

## 2) `/src/services/auth.service.ts`

**Goal:** Remove "timeout → null session" behavior. Cache last good
session to avoid flicker.

**Replace your session functions with:**

``` ts
// auth.service.ts
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

let lastGoodSession: Session | null = null;

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn('getSession error:', error);
    return lastGoodSession; // don’t force-logout on transient errors
  }
  if (data.session) lastGoodSession = data.session;
  return data.session ?? lastGoodSession ?? null;
}

// Call this ONLY on explicit logout
export async function logout() {
  await supabase.auth.signOut();
  lastGoodSession = null;
}
```

**Remove any custom timeouts** and any "Clearing session cache" calls
outside of `logout()`.

------------------------------------------------------------------------

## 3) `/src/hooks/useAuth.tsx`

**Goal:** Treat Supabase auth events as authoritative; don't wait on a
slow "fetch full session" before setting `session`. Fetch extra
profile/tenant info **after** you're authenticated.

**Pattern to implement:**

``` tsx
// useAuth.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

type AuthCtx = { session: Session | null; loading: boolean; };
const AuthContext = createContext<AuthCtx>({ session: null, loading: true });

export function AuthProvider({ children }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;

    // Subscribe FIRST so we never miss events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      // SIGNED_IN / TOKEN_REFRESHED → set session immediately
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(sess);
        setLoading(false);
      }
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setSession(null);
        setLoading(false);
      }
    });

    // Seed with current session
    supabase.auth.getSession().then(({ data }) => {
      if (disposed) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    return () => {
      disposed = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

> If you need tenant/profile enrichment, trigger it **after** `session`
> is set (in a separate effect) and don't flip `loading` back to true
> for it. That enrichment should not block redirects.

------------------------------------------------------------------------

## 4) `/src/utils/auth-redirects.ts`

**Goal:** Be tolerant: accept a `Session | null`; if null, return a safe
default. Don't throw.

**Keep it simple:**

``` ts
import type { Session } from '@supabase/supabase-js';

export function getDashboardUrlForUser(session: Session | null): string {
  if (!session) return '/welcome';

  // Use your profile/role claims if present, else a sensible default
  const role = session.user?.user_metadata?.role || 'teacher';
  switch (role) {
    case 'platform_admin': return '/admin/dashboard';
    case 'tenant_admin':   return '/tenant/dashboard';
    case 'teacher':        return '/teacher/dashboard';
    case 'student':        return '/student/dashboard';
    default:               return '/welcome';
  }
}
```

------------------------------------------------------------------------

## 5) `/src/pages/Login.tsx`

**Goal:** Navigate once, immediately after `signInWithPassword`
succeeds. Remove backup `setTimeout` and avoid double redirect with
`useAuth`.

**Change submit handler to:**

``` ts
const { data, error } = await supabase.auth.signInWithPassword({
  email: email.trim(),
  password,
});
if (error) throw error;

// Grab current session (sometimes not included in 'data' in older libs)
const sess = data.session ?? (await supabase.auth.getSession()).data.session;
if (sess) {
  navigate(getDashboardUrlForUser(sess), { replace: true });
  return;
}

// If somehow no session yet, let useAuth do the redirect shortly
```

**Also:** Don't call any "clear cache" function here.

------------------------------------------------------------------------

## 6) `/src/pages/Welcome.tsx`

**Goal:** Remove the "Auth check timeout -- showing welcome page"
fallback that fights the auth flow. Render based on
`useAuth.loading/session` only.

**Simplify the auth gate at the top:**

``` ts
const { session, loading } = useAuth();
// while loading, show skeleton/spinner, not a hard timeout
if (loading) return <YourNiceSplash />;

if (session) {
  // You can also redirect here if Welcome is not meant for signed-in users:
  navigate(getDashboardUrlForUser(session), { replace: true });
  return null;
}
```

**Remove any custom timers** that set a "timeout" flag and force the
hero/welcome render while auth is still resolving.

------------------------------------------------------------------------

## 7) `/src/components/auth/RouteProtection.tsx`

**Goal:** Respect the `loading` flag; only decide when
`loading === false`. If `session === null`, redirect to `/welcome`. If
present, allow.

``` tsx
const { session, loading } = useAuth();
if (loading) return <PageLoader />;

return session ? children : <Navigate to="/welcome" replace />;
```

------------------------------------------------------------------------

# 🧪 How to verify (manual)

1)  Hard refresh.\
2)  Open DevTools → Application → Local Storage and confirm you have a
    stable `gemeos.supabase.auth` entry after login.\
3)  Login from the modal.
    -   You should no longer see "Auth check timeout".\
    -   You should be redirected immediately.\
4)  Refresh on the dashboard: you should *stay* signed in (auto-refresh
    token working).\
5)  Logout → verify storage cleared and you land on `/welcome`.

------------------------------------------------------------------------

# 📣 Instructions for Claude Code

1.  Open the following files and apply the changes above **exactly**:

    -   `src/integrations/supabase/client.ts`
    -   `src/services/auth.service.ts`
    -   `src/hooks/useAuth.tsx`
    -   `src/utils/auth-redirects.ts`
    -   `src/pages/Login.tsx`
    -   `src/pages/Welcome.tsx`
    -   `src/components/auth/RouteProtection.tsx`

2.  Remove any functions or calls that:

    -   "clear session cache" on startup or on auth change,
    -   wrap `getSession()` in a manual timeout and return `null`,
    -   trigger a second delayed redirect (remove `setTimeout`
        fallbacks).

3.  Ensure only **one** navigation occurs after login (either in
    `Login.tsx` immediately or centrally in `useAuth`---we've chosen
    **immediate** in the form handler).

4.  Run the app, log in, and confirm:

    -   `SIGNED_IN` event → instant redirect,
    -   no "Auth check timeout" logs,
    -   no auto-logout,
    -   refresh keeps the session alive.

If anything still blocks, search the project for: -
`Auth check timeout` - `Clearing session cache` - `fetchCurrentSession`
timeouts ...and remove or refactor those to match the patterns above.
