/**
 * Centralized Access Management Service
 * Provides centralized authorization decisions with platform admin bypass
 * Includes performance optimizations through caching
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  AuthSession,
  Permission,
  PermissionResource,
  PermissionAction,
  AuthorizationError
} from '@/types/auth.types';

interface CacheEntry {
  value: boolean;
  timestamp: number;
}

interface AccessCheckResult {
  hasAccess: boolean;
  reason?: string;
  requiredRole?: string;
}

interface PermissionUpdate {
  user_id: string;
  resource: string;
  action: string;
  granted: boolean;
}

interface AuditLogEntry {
  action: string;
  resource_type?: string;
  resource_action?: string;
  resource_id?: string;
  user_id?: string;
  result?: boolean;
  changes?: Record<string, any>;
}

export class AccessManagementService {
  private static instance: AccessManagementService;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private auditLoggingEnabled = false;
  private currentTenantId: string | null = null;

  private constructor() {}

  /**
   * Get singleton instance of AccessManagementService
   */
  static getInstance(): AccessManagementService {
    if (!AccessManagementService.instance) {
      AccessManagementService.instance = new AccessManagementService();
    }
    return AccessManagementService.instance;
  }

  /**
   * Check if user has access to a resource/action
   * Platform admins bypass all checks
   */
  async checkAccess(
    resource: string, 
    action: string
  ): Promise<boolean> {
    try {
      // Check if user is authenticated
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.user) {
        return false;
      }

      const userId = session.user.id;
      const email = session.user.email;

      // PLATFORM ADMIN BYPASS - Critical for universal access
      const isPlatformAdmin = 
        session.user.app_metadata?.is_platform_admin === true ||
        email === 'admin@gemeos.ai';
      
      if (isPlatformAdmin) {
        if (this.auditLoggingEnabled) {
          await this.createAuditLog({
            action: 'permission_check',
            resource_type: resource,
            resource_action: action,
            user_id: userId,
            result: true,
          });
        }
        return true;
      }

      // Check cache for non-admin users
      const cacheKey = `${userId}:${resource}:${action}`;
      const cachedEntry = this.cache.get(cacheKey);
      
      if (cachedEntry && Date.now() - cachedEntry.timestamp < this.CACHE_TTL) {
        if (this.auditLoggingEnabled) {
          await this.createAuditLog({
            action: 'permission_check',
            resource_type: resource,
            resource_action: action,
            user_id: userId,
            result: cachedEntry.value,
          });
        }
        return cachedEntry.value;
      }

      // Query database for permission
      const userRole = session.user.app_metadata?.role;
      
      if (!userRole) {
        return false;
      }

      const { data, error: permError } = await supabase
        .from('role_permissions')
        .select('*, permission:permissions!inner(*)')
        .eq('permission.resource', resource)
        .eq('permission.action', action)
        .eq('role_id', userRole)
        .maybeSingle();

      const hasAccess = !!data && !permError;

      // Cache the result
      this.cache.set(cacheKey, { 
        value: hasAccess, 
        timestamp: Date.now() 
      });

      if (this.auditLoggingEnabled) {
        await this.createAuditLog({
          action: 'permission_check',
          resource_type: resource,
          resource_action: action,
          user_id: userId,
          result: hasAccess,
        });
      }

      return hasAccess;
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  }

  /**
   * Check access with detailed result information
   */
  async checkAccessWithDetails(
    resource: string,
    action: string
  ): Promise<AccessCheckResult> {
    try {
      const hasAccess = await this.checkAccess(resource, action);
      
      if (hasAccess) {
        return { hasAccess: true };
      }

      // Get additional details for denied access
      const { data: { session } } = await supabase.auth.getSession();
      const userRole = session?.user?.app_metadata?.role || 'unknown';

      // Find what role would be needed
      const { data: requiredPermission } = await supabase
        .from('role_permissions')
        .select('role:roles!inner(name)')
        .eq('permission.resource', resource)
        .eq('permission.action', action)
        .limit(1)
        .maybeSingle();

      return {
        hasAccess: false,
        reason: `User with role '${userRole}' has insufficient permissions for ${action} on ${resource}`,
        requiredRole: requiredPermission?.role?.name,
      };
    } catch (error) {
      return {
        hasAccess: false,
        reason: 'Error checking permissions',
      };
    }
  }

  /**
   * Check if user can access a specific route
   * Platform admins can access all routes
   */
  async canAccessRoute(path: string): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.user) {
        return false;
      }

      // PLATFORM ADMIN BYPASS for routes
      const isPlatformAdmin = 
        session.user.app_metadata?.is_platform_admin === true ||
        session.user.email === 'admin@gemeos.ai';
      
      if (isPlatformAdmin) {
        return true;
      }

      // Check route permissions for regular users
      const userRole = session.user.app_metadata?.role;
      
      if (!userRole) {
        return false;
      }

      // Try exact match first
      let { data: pageData } = await supabase
        .from('pages')
        .select('id, path')
        .eq('path', path)
        .maybeSingle();

      // If no exact match, try pattern matching
      if (!pageData) {
        const { data: allPages } = await supabase
          .from('pages')
          .select('id, path');

        // Find matching pattern
        const matchingPage = allPages?.find(page => {
          if (!page.path.includes(':')) return false;
          const pattern = page.path.replace(/:[\w-]+/g, '[^/]+');
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(path);
        });

        if (matchingPage) {
          pageData = matchingPage;
        }
      }

      if (!pageData) {
        return false;
      }

      // Check if user role has access to this page
      const { data: permission } = await supabase
        .from('page_permissions')
        .select('*')
        .eq('page_id', pageData.id)
        .eq('role', userRole)
        .eq('is_active', true)
        .maybeSingle();

      return !!permission;
    } catch (error) {
      console.error('Error checking route access:', error);
      return false;
    }
  }

  /**
   * Check multiple permissions at once (efficient bulk operation)
   */
  async checkMultiplePermissions(
    permissions: Array<{ resource: string; action: string }>
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.user) {
        // Return all false for unauthenticated users
        permissions.forEach(p => {
          results[`${p.resource}:${p.action}`] = false;
        });
        return results;
      }

      // PLATFORM ADMIN BYPASS for bulk operations
      const isPlatformAdmin = 
        session.user.app_metadata?.is_platform_admin === true ||
        session.user.email === 'admin@gemeos.ai';
      
      if (isPlatformAdmin) {
        // Grant all permissions for platform admin
        permissions.forEach(p => {
          results[`${p.resource}:${p.action}`] = true;
        });
        return results;
      }

      // For regular users, check each permission
      // In production, this could be optimized with a single query
      const userRole = session.user.app_metadata?.role;
      
      if (!userRole) {
        permissions.forEach(p => {
          results[`${p.resource}:${p.action}`] = false;
        });
        return results;
      }

      // Build permission queries
      const permissionQueries = permissions.map(p => 
        `(resource.eq.${p.resource},action.eq.${p.action})`
      );

      // Get all matching permissions for the user's role
      const { data: userPermissions } = await supabase
        .from('role_permissions')
        .select('permission:permissions!inner(resource, action)')
        .eq('role_id', userRole)
        .in('permission.resource', permissions.map(p => p.resource));

      // Build results
      permissions.forEach(p => {
        const hasPermission = userPermissions?.some(
          up => up.permission?.resource === p.resource && 
                up.permission?.action === p.action
        );
        results[`${p.resource}:${p.action}`] = !!hasPermission;
      });

      return results;
    } catch (error) {
      console.error('Error checking multiple permissions:', error);
      // Return all false on error
      permissions.forEach(p => {
        results[`${p.resource}:${p.action}`] = false;
      });
      return results;
    }
  }

  /**
   * Update a permission for a user
   */
  async updatePermission(
    userId: string,
    resource: string,
    action: string,
    granted: boolean
  ): Promise<void> {
    try {
      // Log the permission change
      await this.createAuditLog({
        action: 'permission_update',
        resource_type: 'permission',
        changes: { user_id: userId, resource, action, granted },
      });

      // Update permission in database
      if (granted) {
        await supabase
          .from('user_permissions')
          .upsert({
            user_id: userId,
            resource,
            action,
            created_at: new Date().toISOString(),
          });
      } else {
        await supabase
          .from('user_permissions')
          .delete()
          .eq('user_id', userId)
          .eq('resource', resource)
          .eq('action', action);
      }

      // Clear cache for this user
      this.clearUserCache(userId);
    } catch (error) {
      console.error('Error updating permission:', error);
      throw error;
    }
  }

  /**
   * Bulk update permissions
   */
  async bulkUpdatePermissions(updates: PermissionUpdate[]): Promise<void> {
    try {
      for (const update of updates) {
        await this.updatePermission(
          update.user_id,
          update.resource,
          update.action,
          update.granted
        );
      }
    } catch (error) {
      console.error('Error in bulk permission update:', error);
      throw error;
    }
  }

  /**
   * Switch tenant context
   */
  async switchTenant(tenantId: string): Promise<void> {
    this.currentTenantId = tenantId;
    this.cache.clear(); // Clear all cached permissions
    localStorage.setItem('current_tenant_id', tenantId);
  }

  /**
   * Clear cache for a specific user
   */
  private clearUserCache(userId: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear entire permission cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size (for monitoring)
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Enable or disable audit logging
   */
  enableAuditLogging(enabled: boolean): void {
    this.auditLoggingEnabled = enabled;
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      await supabase.from('audit_logs').insert({
        tenant_id: this.currentTenantId,
        user_id: entry.user_id || session?.user?.id,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id,
        changes: {
          ...entry.changes,
          resource_action: entry.resource_action,
          result: entry.result,
        },
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw - audit logging should not break the main flow
    }
  }

  /**
   * Get user's accessible routes
   */
  async getUserAccessibleRoutes(): Promise<string[]> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.user) {
        return [];
      }

      // Platform admin gets all routes
      const isPlatformAdmin = 
        session.user.app_metadata?.is_platform_admin === true ||
        session.user.email === 'admin@gemeos.ai';
      
      if (isPlatformAdmin) {
        const { data: allPages } = await supabase
          .from('pages')
          .select('path');
        return allPages?.map(p => p.path) || [];
      }

      // Regular users get filtered routes
      const userRole = session.user.app_metadata?.role;
      
      if (!userRole) {
        return [];
      }

      const { data: permissions } = await supabase
        .from('page_permissions')
        .select('page:pages!inner(path)')
        .eq('role', userRole)
        .eq('is_active', true);

      return permissions?.map(p => p.page.path) || [];
    } catch (error) {
      console.error('Error getting accessible routes:', error);
      return [];
    }
  }
}

// Export singleton instance
export const accessManagementService = AccessManagementService.getInstance();