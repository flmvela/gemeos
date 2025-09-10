/**
 * Authentication redirect utilities
 * Determines the appropriate dashboard URL based on user role
 * Resilient to partial session data
 */

import type { Session } from '@supabase/supabase-js';

/**
 * Get the appropriate dashboard URL based on user role
 * Checks multiple sources for role information with fallbacks
 */
export function getDashboardUrlForUser(session: Session | any | null): string {
  if (!session) {
    return '/welcome';
  }

  // Handle Supabase Session object
  if (session.user) {
    const user = session.user;
    
    // Check known platform admins by email
    if (user.email === 'admin@gemeos.ai') {
      return '/admin/dashboard';
    }
    
    // Check app_metadata first (server-side set)
    const appRole = user.app_metadata?.role;
    if (appRole) {
      return getRoleBasedUrl(appRole);
    }
    
    // Check user_metadata (client-side set)
    const userRole = user.user_metadata?.role;
    if (userRole) {
      return getRoleBasedUrl(userRole);
    }
    
    // Check custom session properties (from our enriched session)
    if (session.is_platform_admin) {
      return '/admin/dashboard';
    }
    
    if (session.current_tenant?.role?.name) {
      return getRoleBasedUrl(session.current_tenant.role.name);
    }
  }
  
  // Handle our custom AuthSession object
  if (session.is_platform_admin) {
    return '/admin/dashboard';
  }
  
  if (session.current_tenant?.role?.name) {
    return getRoleBasedUrl(session.current_tenant.role.name);
  }
  
  // Default fallback - tenant dashboard is the safest default
  return '/tenant/dashboard';
}

/**
 * Map role name to dashboard URL
 */
function getRoleBasedUrl(role: string): string {
  const roleMap: Record<string, string> = {
    'platform_admin': '/admin/dashboard',
    'super_admin': '/admin/dashboard',
    'tenant_admin': '/tenant/dashboard',
    'teacher': '/teacher/dashboard',
    'student': '/student/dashboard',
    // Add any other role mappings here
  };
  
  return roleMap[role.toLowerCase()] || '/tenant/dashboard';
}

/**
 * Get dashboard URL using auth hook data
 * Legacy helper for backwards compatibility
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
  
  return '/tenant/dashboard';
}