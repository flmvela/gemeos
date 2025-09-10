/**
 * PermissionGuard Component
 * Protects UI components based on RBAC permissions
 */

import React from 'react';
import { usePermission, usePermissions } from '@/hooks/usePermissions';
import { Alert } from '@/components/ui/alert';
import { Lock, AlertTriangle } from 'lucide-react';

interface PermissionGuardProps {
  resource: string;
  action?: string;
  fallback?: React.ReactNode;
  showFallback?: boolean;
  children: React.ReactNode;
}

interface MultiPermissionGuardProps {
  permissions: Array<{ resource: string; action?: string }>;
  mode?: 'all' | 'any'; // 'all' = must have ALL permissions, 'any' = must have at least ONE
  fallback?: React.ReactNode;
  showFallback?: boolean;
  children: React.ReactNode;
}

interface RoleGuardProps {
  roles: string | string[];
  fallback?: React.ReactNode;
  showFallback?: boolean;
  children: React.ReactNode;
}

/**
 * Basic permission guard for single resource/action
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  resource,
  action = 'read',
  fallback = null,
  showFallback = true,
  children
}) => {
  const { allowed, loading } = usePermission(resource, action);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!allowed) {
    if (!showFallback) return null;
    
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Access Denied</h3>
            <p className="text-sm">You don't have permission to access this resource.</p>
          </div>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Guard that checks multiple permissions
 */
export const MultiPermissionGuard: React.FC<MultiPermissionGuardProps> = ({
  permissions,
  mode = 'all',
  fallback = null,
  showFallback = true,
  children
}) => {
  const { checkBatchPermissions, loading } = usePermissions();
  
  const results = checkBatchPermissions(permissions);
  const hasAccess = mode === 'all' 
    ? Object.values(results).every(Boolean)
    : Object.values(results).some(Boolean);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    if (!showFallback) return null;
    
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Access Denied</h3>
            <p className="text-sm">
              You don't have the required permissions to access this resource.
            </p>
          </div>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Role-based guard
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  roles,
  fallback = null,
  showFallback = true,
  children
}) => {
  const { hasRole, loading } = usePermissions();
  
  const hasAccess = Array.isArray(roles)
    ? roles.some(role => hasRole(role))
    : hasRole(roles);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    if (!showFallback) return null;
    
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Access Denied</h3>
            <p className="text-sm">
              You don't have the required role to access this resource.
            </p>
          </div>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Inline permission check component (renders differently based on permission)
 */
interface ConditionalRenderProps {
  resource: string;
  action?: string;
  hasPermission?: React.ReactNode;
  noPermission?: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  resource,
  action = 'read',
  hasPermission,
  noPermission = null
}) => {
  const { allowed, loading } = usePermission(resource, action);

  if (loading) return null;
  
  return allowed ? <>{hasPermission}</> : <>{noPermission}</>;
};

/**
 * Permission-aware button wrapper
 */
interface PermissionButtonProps {
  resource: string;
  action?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  resource,
  action = 'read',
  children,
  fallback,
  disabled = false,
  className = '',
  onClick
}) => {
  const { allowed, loading } = usePermission(resource, action);

  if (loading) {
    return (
      <button disabled className={`opacity-50 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          Loading...
        </div>
      </button>
    );
  }

  if (!allowed) {
    return fallback || (
      <button 
        disabled 
        className={`opacity-50 cursor-not-allowed ${className}`}
        title="You don't have permission for this action"
      >
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          {children}
        </div>
      </button>
    );
  }

  return (
    <button 
      disabled={disabled}
      className={className}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

/**
 * Show different content for different permission levels
 */
interface PermissionSwitchProps {
  resource: string;
  cases: Array<{
    action: string;
    content: React.ReactNode;
  }>;
  defaultContent?: React.ReactNode;
}

export const PermissionSwitch: React.FC<PermissionSwitchProps> = ({
  resource,
  cases,
  defaultContent = null
}) => {
  const { checkBatchPermissions, loading } = usePermissions();
  
  const permissions = cases.map(c => ({ resource, action: c.action }));
  const results = checkBatchPermissions(permissions);

  if (loading) return null;

  // Find the first matching case (order matters - put most restrictive first)
  for (const caseItem of cases) {
    const key = `${resource}:${caseItem.action}`;
    if (results[key]) {
      return <>{caseItem.content}</>;
    }
  }

  return <>{defaultContent}</>;
};

/**
 * Debug component to show current user's permissions
 */
export const PermissionDebug: React.FC = () => {
  const { permissions, loading, error } = usePermissions();

  if (loading) return <div>Loading permissions...</div>;
  if (error) return <div>Error loading permissions: {error}</div>;

  return (
    <div className="p-4 bg-gray-100 rounded border">
      <h3 className="font-bold mb-2">Debug: Current User Permissions</h3>
      <div className="space-y-2 text-sm">
        {permissions.length === 0 ? (
          <p>No permissions found</p>
        ) : (
          permissions.map((perm, index) => (
            <div key={index} className="flex gap-2">
              <span className="font-mono bg-gray-200 px-1 rounded">
                {perm.resource_key}
              </span>
              <span className="text-gray-600">
                [{perm.actions.join(', ')}]
              </span>
              <span className="text-blue-600">
                ({perm.role_name})
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};