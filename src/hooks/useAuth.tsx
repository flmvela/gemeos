/**
 * Authentication and Authorization React Hooks
 */

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { authService } from '@/services/auth.service';
import { supabase } from '@/integrations/supabase/client';
import type { 
  AuthSession, 
  TenantContext, 
  Tenant,
  PermissionResource,
  PermissionAction
} from '@/types/auth.types';

// ============================================================
// AUTH CONTEXT
// ============================================================

type AuthState = 'authenticating' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  authState: AuthState;
  session: AuthSession | null;
  user: { id: string; email: string } | null;
  tenantContext: TenantContext | null;
  loading: boolean; // Keep for backwards compatibility
  enrichmentLoading: boolean;
  error: Error | null;
  switchTenant: (tenantId: string) => Promise<void>;
  refresh: () => Promise<void>;
  hasPermission: (resource: PermissionResource | string, action: PermissionAction | string) => boolean;
  isPlatformAdmin: boolean;
  isTenantAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// AUTH PROVIDER COMPONENT
// ============================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>('authenticating');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantContext, setTenantContext] = useState<TenantContext | null>(null);
  const [enrichmentLoading, setEnrichmentLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Derive loading for backwards compatibility
  const loading = authState === 'authenticating';

  const switchTenant = useCallback(async (tenantId: string) => {
    try {
      setEnrichmentLoading(true);
      await authService.switchTenant(tenantId);
      // After switching tenant, reload the full session
      const fullSession = await authService.getCurrentSession();
      if (fullSession) {
        setSession(fullSession);
        // Update tenant context for the new tenant
        const context = await authService.getTenantContext();
        setTenantContext(context);
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setEnrichmentLoading(false);
    }
  }, []);

  const hasPermission = useCallback((
    resource: PermissionResource | string, 
    action: PermissionAction | string
  ): boolean => {
    // Platform admin always has all permissions
    if (session?.is_platform_admin) return true;
    
    // Check tenant context permissions for regular users
    return tenantContext?.can(resource as PermissionResource, action as PermissionAction) || false;
  }, [session, tenantContext]);

  useEffect(() => {
    let disposed = false;

    // 1) Subscribe first so we never miss an event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, supabaseSession) => {
        console.log('🔄 Auth state changed:', event, supabaseSession?.user?.email || 'no user');
        
        // Handle sign out events
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          console.log('🔄 User signed out, clearing state');
          authService.clearSessionCache();
          setSession(null);
          setTenantContext(null);
          setAuthState('unauthenticated');
        }
        // Handle sign in and token refresh events (keeps session alive)
        else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (supabaseSession?.user) {
            console.log('🔄 User authenticated/refreshed');
            
            // Set basic session immediately - don't wait for enrichment
            const basicSession: AuthSession = {
              user_id: supabaseSession.user.id,
              email: supabaseSession.user.email!,
              tenants: [],
              current_tenant: null,
              is_platform_admin: supabaseSession.user.email === 'admin@gemeos.ai'
            };
            
            setSession(basicSession);
            setAuthState('authenticated');
            
            // Start enrichment asynchronously (don't await)
            setEnrichmentLoading(true);
            authService.getCurrentSession().then(fullSession => {
              if (fullSession && !disposed) {
                console.log('🔄 Full session loaded:', {
                  email: fullSession.email,
                  tenants: fullSession.tenants?.length || 0,
                  isPlatformAdmin: fullSession.is_platform_admin,
                  currentTenant: fullSession.current_tenant?.tenant?.name,
                  role: fullSession.current_tenant?.role?.name,
                  roleId: fullSession.current_tenant?.role_id
                });
                
                setSession(fullSession);
                
                // If user has a current tenant, get the tenant context
                if (fullSession.current_tenant) {
                  authService.getTenantContext().then(context => {
                    if (!disposed && context) {
                      setTenantContext(context);
                    }
                  });
                }
              }
            }).catch(error => {
              console.error('🔄 Error loading full session:', error);
              // Keep basic session on error
            }).finally(() => {
              if (!disposed) {
                setEnrichmentLoading(false);
              }
            });
          }
        }
      }
    );

    // 2) Seed with current session
    supabase.auth.getSession().then(({ data }) => {
      if (disposed) return;
      
      if (data.session?.user) {
        // Set basic session immediately
        const basicSession: AuthSession = {
          user_id: data.session.user.id,
          email: data.session.user.email!,
          tenants: [],
          current_tenant: null,
          is_platform_admin: data.session.user.email === 'admin@gemeos.ai'
        };
        
        setSession(basicSession);
        setAuthState('authenticated');
        
        // Start enrichment asynchronously
        setEnrichmentLoading(true);
        console.log('🔄 Starting enrichment for user:', data.session.user.email);
        authService.getCurrentSession().then(fullSession => {
          if (fullSession && !disposed) {
            console.log('🔄 Enrichment complete:', {
              email: fullSession.email,
              tenants: fullSession.tenants?.length || 0,
              currentTenant: fullSession.current_tenant?.tenant?.name,
              role: fullSession.current_tenant?.role?.name,
              isPlatformAdmin: fullSession.is_platform_admin
            });
            setSession(fullSession);
            
            if (fullSession.current_tenant) {
              authService.getTenantContext().then(context => {
                if (!disposed && context) {
                  setTenantContext(context);
                }
              });
            }
          }
        }).catch(error => {
          console.error('🔄 Error loading initial full session:', error);
        }).finally(() => {
          if (!disposed) {
            console.log('🔄 Enrichment loading complete');
            setEnrichmentLoading(false);
          }
        });
      } else {
        // No session
        setAuthState('unauthenticated');
      }
    });

    return () => {
      console.log('🔄 Cleaning up auth state listener');
      disposed = true;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - we only want ONE auth listener

  const value: AuthContextType = {
    authState,
    session,
    user: session ? { id: session.user_id, email: session.email } : null,
    tenantContext,
    loading, // For backwards compatibility
    enrichmentLoading,
    error,
    switchTenant,
    refresh: async () => {
      // Trigger auth state refresh by getting current session
      setEnrichmentLoading(true);
      try {
        const fullSession = await authService.getCurrentSession();
        if (fullSession) {
          setSession(fullSession);
          if (fullSession.current_tenant) {
            const context = await authService.getTenantContext();
            setTenantContext(context);
          }
        }
      } finally {
        setEnrichmentLoading(false);
      }
    },
    hasPermission,
    isPlatformAdmin: session?.is_platform_admin || false,
    isTenantAdmin: session?.current_tenant?.role?.name === 'tenant_admin' || false,
    isTeacher: session?.current_tenant?.role?.name === 'teacher' || false,
    isStudent: session?.user?.user_metadata?.role === 'student' || 
               session?.user?.app_metadata?.role === 'student' || 
               false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// MAIN AUTH HOOK
// ============================================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// ============================================================
// PERMISSION HOOK
// ============================================================

export function usePermission(
  resource: PermissionResource | string, 
  action: PermissionAction | string
): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(resource, action);
}

// ============================================================
// ROLE-BASED HOOKS
// ============================================================

export function useIsPlatformAdmin(): boolean {
  const { isPlatformAdmin } = useAuth();
  return isPlatformAdmin;
}

export function useIsTenantAdmin(): boolean {
  const { isTenantAdmin } = useAuth();
  return isTenantAdmin;
}

export function useIsTeacher(): boolean {
  const { isTeacher } = useAuth();
  return isTeacher;
}

export function useIsStudent(): boolean {
  const { isStudent } = useAuth();
  return isStudent;
}

// ============================================================
// TENANT HOOKS
// ============================================================

export function useCurrentTenant(): Tenant | null {
  const { session } = useAuth();
  return session?.current_tenant?.tenant as Tenant || null;
}

export function useTenantSwitcher() {
  const { session, switchTenant, loading } = useAuth();
  const [switching, setSwitching] = useState(false);
  
  const handleSwitch = useCallback(async (tenantId: string) => {
    setSwitching(true);
    try {
      await switchTenant(tenantId);
    } finally {
      setSwitching(false);
    }
  }, [switchTenant]);

  return {
    tenants: session?.tenants || [],
    currentTenant: session?.current_tenant,
    switchTenant: handleSwitch,
    loading: loading || switching
  };
}

// ============================================================
// AUTHORIZATION GUARD HOOK
// ============================================================

interface UseAuthGuardOptions {
  requiredRole?: string;
  requiredPermission?: {
    resource: PermissionResource | string;
    action: PermissionAction | string;
  };
  redirectTo?: string;
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { session, tenantContext, loading } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;

    let isAuthorized = true;

    // Check if user is authenticated
    if (!session) {
      isAuthorized = false;
    }

    // Check role requirement
    if (options.requiredRole && session) {
      // Platform admins bypass all role requirements
      if (!session.is_platform_admin) {
        const hasRole = session.current_tenant?.role.name === options.requiredRole;
        if (!hasRole) {
          isAuthorized = false;
        }
      }
    }

    // Check permission requirement
    if (options.requiredPermission && tenantContext) {
      const hasPermission = session?.is_platform_admin ||
                          tenantContext.can(
                            options.requiredPermission.resource as PermissionResource,
                            options.requiredPermission.action as PermissionAction
                          );
      if (!hasPermission) {
        isAuthorized = false;
      }
    }

    setAuthorized(isAuthorized);

    // Redirect if not authorized and redirectTo is specified
    if (!isAuthorized && options.redirectTo) {
      window.location.href = options.redirectTo;
    }
  }, [session, tenantContext, loading, options]);

  return {
    authorized,
    loading,
    session
  };
}

// ============================================================
// AUDIT LOG HOOK
// ============================================================

export function useAuditLog() {
  const logAction = useCallback(async (
    action: string,
    resourceType: string,
    resourceId?: string,
    changes?: Record<string, any>
  ) => {
    try {
      await authService.createAuditLog(action, resourceType, resourceId, changes);
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }, []);

  return { logAction };
}