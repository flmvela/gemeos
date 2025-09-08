/**
 * Authentication and Authorization React Hooks
 */

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from 'react';
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

interface AuthContextType {
  session: AuthSession | null;
  user: { id: string; email: string } | null;
  tenantContext: TenantContext | null;
  loading: boolean;
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
  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantContext, setTenantContext] = useState<TenantContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isProcessingAuthRef = useRef(false);
  const hasSubscribedRef = useRef(false);

  const switchTenant = useCallback(async (tenantId: string) => {
    try {
      setLoading(true);
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
      setLoading(false);
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
    // Prevent multiple subscriptions
    if (hasSubscribedRef.current) {
      console.log('🔄 Auth state listener already exists, skipping setup');
      return;
    }
    
    hasSubscribedRef.current = true;
    console.log('🔄 Setting up auth state listener...');
    
    // Listen to auth state changes instead of calling getSession directly
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, supabaseSession) => {
        console.log('🔄 Auth state changed:', event, supabaseSession?.user?.email || 'no user');
        
        if (event === 'SIGNED_OUT' || !supabaseSession?.user) {
          console.log('🔄 User signed out or no session, clearing state');
          authService.clearSessionCache(); // Clear cache on sign out
          setSession(null);
          setTenantContext(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          if (supabaseSession?.user && !isProcessingAuthRef.current) {
            console.log('🔄 User authenticated, fetching full session data...');
            isProcessingAuthRef.current = true;
            
            // Clear cache on sign in to ensure fresh data
            if (event === 'SIGNED_IN') {
              authService.clearSessionCache();
            }
            
            try {
              // Use the auth service to get the full session with tenant data
              const fullSession = await authService.getCurrentSession();
              
              if (fullSession) {
                console.log('🔄 Full session loaded:', {
                  email: fullSession.email,
                  tenants: fullSession.tenants?.length || 0,
                  isPlatformAdmin: fullSession.is_platform_admin,
                  currentTenant: fullSession.current_tenant?.tenant?.name
                });
                
                setSession(fullSession);
                
                // If user has a current tenant, get the tenant context
                if (fullSession.current_tenant) {
                  const context = await authService.getTenantContext();
                  setTenantContext(context);
                }
              } else {
                console.log('🔄 No session data available');
                setSession(null);
                setTenantContext(null);
              }
            } catch (error) {
              console.error('🔄 Error loading session:', error);
              setSession(null);
              setTenantContext(null);
            } finally {
              // Always reset the processing flag
              isProcessingAuthRef.current = false;
            }
          } else if (supabaseSession?.user && isProcessingAuthRef.current) {
            console.log('🔄 Already processing auth, skipping duplicate event');
          } else {
            console.log('🔄 No user in auth state');
            setSession(null);
            setTenantContext(null);
          }
          setLoading(false);
        }
      }
    );

    // Reduced timeout fallback 
    const timeout = setTimeout(() => {
      console.log('⚠️ Auth state timeout, setting loading to false');
      setLoading(false);
    }, 2000);

    return () => {
      console.log('🔄 Cleaning up auth state listener');
      hasSubscribedRef.current = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []); // Empty dependency array - we only want ONE auth listener

  const value: AuthContextType = {
    session,
    user: session ? { id: session.user_id, email: session.email } : null,
    tenantContext,
    loading,
    error,
    switchTenant,
    refresh: async () => {
      // Trigger auth state refresh by getting current session
      const fullSession = await authService.getCurrentSession();
      if (fullSession) {
        setSession(fullSession);
        if (fullSession.current_tenant) {
          const context = await authService.getTenantContext();
          setTenantContext(context);
        }
      }
    },
    hasPermission,
    isPlatformAdmin: session?.is_platform_admin || false,
    isTenantAdmin: session?.current_tenant?.role.name === 'tenant_admin' || false,
    isTeacher: session?.current_tenant?.role.name === 'teacher' || false,
    isStudent: session?.current_tenant?.role.name === 'student' || false
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