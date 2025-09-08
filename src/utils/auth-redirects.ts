/**
 * Authentication redirect utilities
 * Determines the appropriate dashboard URL based on user role
 */

interface UserSession {
  is_platform_admin?: boolean;
  current_tenant?: {
    role: {
      name: string;
    };
  };
  user?: {
    email?: string;
    user_metadata?: {
      role?: string;
    };
  };
}

/**
 * Get the appropriate dashboard URL based on user role
 * Priority: Platform Admin > Tenant Admin > Teacher > Default (tenant)
 */
export function getDashboardUrlForUser(session: UserSession | any | null): string {
  if (!session) {
    return '/tenant/dashboard'; // Default fallback
  }

  // Check if this is a Supabase session object (from login)
  if (session.user && !session.is_platform_admin && !session.current_tenant) {
    // For Supabase sessions, check the user's email for platform admin
    // admin@gemeos.ai is always a platform admin
    if (session.user.email === 'admin@gemeos.ai') {
      return '/admin/dashboard';
    }
    
    // Check user metadata for role hint
    const metadataRole = session.user.user_metadata?.role;
    if (metadataRole === 'platform_admin') {
      return '/admin/dashboard';
    }
    if (metadataRole === 'tenant_admin') {
      return '/tenant/dashboard';
    }
    if (metadataRole === 'teacher') {
      return '/teacher/dashboard';
    }
    
    // Default for basic Supabase session
    return '/tenant/dashboard';
  }

  // This is our custom session object (from useAuth)
  // Platform Admin - highest priority
  if (session.is_platform_admin) {
    return '/admin/dashboard';
  }

  // Role-based redirects
  const roleName = session.current_tenant?.role.name;
  
  switch (roleName) {
    case 'tenant_admin':
      return '/tenant/dashboard';
    case 'teacher':
      return '/teacher/dashboard';
    case 'student':
      return '/tenant/dashboard'; // Students go to tenant dashboard for now
    default:
      return '/tenant/dashboard'; // Default fallback
  }
}

/**
 * Get dashboard URL using auth hook data
 */
export function getDashboardUrlFromAuthHook(
  isPlatformAdmin: boolean,
  isTenantAdmin: boolean,
  isTeacher: boolean
): string {
  if (isPlatformAdmin) {
    return '/admin/dashboard';
  }
  
  if (isTenantAdmin) {
    return '/tenant/dashboard';
  }
  
  if (isTeacher) {
    return '/teacher/dashboard';
  }
  
  return '/tenant/dashboard'; // Default fallback
}