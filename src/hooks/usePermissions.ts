/**
 * RBAC Permission Hook - Phase 1 Implementation
 * Simple, fast permission checking with caching
 * Based on new RBAC foundation system
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTenant } from './useTenant';

// Types for RBAC Phase 1
interface UserPermission {
  resource_key: string;
  resource_kind: string;
  resource_description: string;
  actions: string[];
  role_name: string;
  expires_at: string | null;
}

interface PermissionCache {
  permissions: UserPermission[];
  timestamp: number;
  userId: string;
  tenantId: string | null;
}

interface UsePermissionsReturn {
  permissions: UserPermission[];
  checkPermission: (resource: string, action?: string) => boolean;
  checkBatchPermissions: (checks: Array<{ resource: string; action?: string }>) => Record<string, boolean>;
  hasRole: (roleName: string) => boolean;
  refreshPermissions: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const permissionCache = new Map<string, PermissionCache>();

/**
 * Main RBAC permissions hook
 */
export const usePermissions = (): UsePermissionsReturn => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCacheKey = useCallback(() => {
    return `${user?.id || 'anonymous'}:${currentTenant?.id || 'no-tenant'}`;
  }, [user?.id, currentTenant?.id]);

  const isValidCache = useCallback((cache: PermissionCache): boolean => {
    return Date.now() - cache.timestamp < CACHE_TTL &&
           cache.userId === (user?.id || 'anonymous') &&
           cache.tenantId === (currentTenant?.id || null);
  }, [user?.id, currentTenant?.id]);

  const loadPermissions = useCallback(async () => {
    if (!user?.id) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cacheKey = getCacheKey();
      const cached = permissionCache.get(cacheKey);
      
      if (cached && isValidCache(cached)) {
        setPermissions(cached.permissions);
        setLoading(false);
        return;
      }

      // Load from database using RBAC function
      const { data, error: dbError } = await supabase
        .rpc('get_user_permissions', {
          p_tenant_id: currentTenant?.id || null
        });

      if (dbError) {
        throw new Error(`Failed to load permissions: ${dbError.message}`);
      }

      const userPermissions = data || [];
      
      // Cache the results
      permissionCache.set(cacheKey, {
        permissions: userPermissions,
        timestamp: Date.now(),
        userId: user.id,
        tenantId: currentTenant?.id || null
      });

      setPermissions(userPermissions);
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentTenant?.id, getCacheKey, isValidCache]);

  const checkPermission = useCallback((
    resource: string,
    action: string = 'read'
  ): boolean => {
    if (!user?.id) return false;

    // Platform admins have access to everything
    if (permissions.some(p => p.role_name === 'platform_admin')) {
      return true;
    }

    // Check specific permissions
    return permissions.some(permission => {
      // Check if permission is expired
      if (permission.expires_at && new Date(permission.expires_at) < new Date()) {
        return false;
      }

      return permission.resource_key === resource && 
             permission.actions.includes(action);
    });
  }, [user?.id, permissions]);

  const checkBatchPermissions = useCallback((
    checks: Array<{ resource: string; action?: string }>
  ): Record<string, boolean> => {
    const results: Record<string, boolean> = {};
    
    checks.forEach(check => {
      const key = `${check.resource}:${check.action || 'read'}`;
      results[key] = checkPermission(check.resource, check.action);
    });
    
    return results;
  }, [checkPermission]);

  const hasRole = useCallback((roleName: string): boolean => {
    return permissions.some(permission => permission.role_name === roleName);
  }, [permissions]);

  const refreshPermissions = useCallback(async () => {
    // Clear cache and reload
    const cacheKey = getCacheKey();
    permissionCache.delete(cacheKey);
    await loadPermissions();
  }, [getCacheKey, loadPermissions]);

  // Load permissions when user or tenant changes
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  return {
    permissions,
    checkPermission,
    checkBatchPermissions,
    hasRole,
    refreshPermissions,
    loading,
    error
  };
};

// Utility hook for checking a specific permission
export const usePermission = (
  resource: string,
  action: string = 'read'
): { allowed: boolean; loading: boolean } => {
  const { checkPermission, loading } = usePermissions();
  const allowed = checkPermission(resource, action);
  
  return { allowed, loading };
};

// Utility hook for checking if user has any of the specified roles
export const useHasRole = (roles: string | string[]): boolean => {
  const { hasRole } = usePermissions();
  
  if (typeof roles === 'string') {
    return hasRole(roles);
  }
  
  return roles.some(role => hasRole(role));
};

// Batch permission check hook
export const useBatchPermissions = (
  checks: Array<{ resource: string; action?: string }>
): Record<string, boolean> => {
  const { checkBatchPermissions } = usePermissions();
  return checkBatchPermissions(checks);
};