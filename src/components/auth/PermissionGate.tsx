/**
 * PermissionGate Component
 * Declarative permission-based UI rendering
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { usePermissions, useRole } from '@/hooks/usePermissions';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, ShieldX, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PermissionGateProps {
  // Permission requirements
  resource?: string;
  action?: string;
  resources?: Array<{ resource: string; action: string }>;
  requireAll?: boolean; // For multiple permissions
  
  // Role requirements
  role?: string;
  roles?: string[];
  requireAllRoles?: boolean;
  
  // Instance-specific checks
  resourceId?: string;
  checkOwnership?: boolean;
  
  // UI customization
  children: ReactNode;
  fallback?: ReactNode;
  showError?: boolean;
  errorMessage?: string;
  loadingComponent?: ReactNode;
  className?: string;
  
  // Behavior
  hideWhenUnauthorized?: boolean;
  redirectTo?: string;
  onUnauthorized?: () => void;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  resource,
  action,
  resources,
  requireAll = false,
  role,
  roles,
  requireAllRoles = false,
  resourceId,
  checkOwnership = false,
  children,
  fallback,
  showError = false,
  errorMessage,
  loadingComponent,
  className,
  hideWhenUnauthorized = false,
  redirectTo,
  onUnauthorized,
}) => {
  const { 
    can, 
    canAny, 
    canAll, 
    canAccessInstance, 
    isResourceOwner,
    isPlatformAdmin 
  } = usePermissions();
  
  const { hasRole, hasAnyRole, hasAllRoles } = useRole();
  
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthorization = async () => {
      setIsLoading(true);
      setAuthError(null);
      
      try {
        // Platform admin bypass
        if (isPlatformAdmin) {
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        let authorized = true;

        // Check role requirements
        if (role) {
          authorized = authorized && hasRole(role);
        }
        
        if (roles && roles.length > 0) {
          if (requireAllRoles) {
            authorized = authorized && hasAllRoles(roles);
          } else {
            authorized = authorized && hasAnyRole(roles);
          }
        }

        // Check permission requirements
        if (resource && action) {
          if (resourceId) {
            // Instance-level permission check
            const instanceAccess = await canAccessInstance(resource, resourceId, action);
            authorized = authorized && instanceAccess;
            
            // Check ownership if required
            if (checkOwnership && authorized) {
              const isOwner = await isResourceOwner(resource, resourceId);
              authorized = authorized && isOwner;
            }
          } else {
            // Regular permission check
            const hasPermission = await can(resource, action);
            authorized = authorized && hasPermission;
          }
        }

        // Check multiple permissions
        if (resources && resources.length > 0) {
          const permissions = resources.map(r => ({ 
            resource: r.resource, 
            action: r.action 
          }));
          
          if (requireAll) {
            const hasAll = await canAll(permissions);
            authorized = authorized && hasAll;
          } else {
            const hasAny = await canAny(permissions);
            authorized = authorized && hasAny;
          }
        }

        setIsAuthorized(authorized);

        // Handle unauthorized callback
        if (!authorized && onUnauthorized) {
          onUnauthorized();
        }

        // Handle redirect
        if (!authorized && redirectTo) {
          window.location.href = redirectTo;
        }

      } catch (error) {
        console.error('Authorization check failed:', error);
        setAuthError('Failed to check permissions');
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [
    resource,
    action,
    resources,
    requireAll,
    role,
    roles,
    requireAllRoles,
    resourceId,
    checkOwnership,
    can,
    canAny,
    canAll,
    canAccessInstance,
    isResourceOwner,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isPlatformAdmin,
    onUnauthorized,
    redirectTo,
  ]);

  // Loading state
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className={cn("space-y-2", className)}>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  // Error state
  if (authError && showError) {
    return (
      <Alert variant="destructive" className={className}>
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          {errorMessage || authError}
        </AlertDescription>
      </Alert>
    );
  }

  // Unauthorized - hide content
  if (!isAuthorized && hideWhenUnauthorized) {
    return null;
  }

  // Unauthorized - show fallback
  if (!isAuthorized) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <Alert className={cn("border-orange-200 bg-orange-50", className)}>
          <Lock className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {errorMessage || 'You do not have permission to view this content'}
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  // Authorized - render children
  return <>{children}</>;
};

/**
 * Show/Hide component based on permissions
 */
export const CanView: React.FC<{
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ resource, action, children, fallback }) => {
  return (
    <PermissionGate
      resource={resource}
      action={action}
      hideWhenUnauthorized={!fallback}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
};

/**
 * Disable component based on permissions
 */
export const CanInteract: React.FC<{
  resource: string;
  action: string;
  children: (props: { disabled: boolean; reason?: string }) => ReactNode;
}> = ({ resource, action, children }) => {
  const { can } = usePermissions();
  const [disabled, setDisabled] = useState(true);
  const [reason, setReason] = useState<string>();

  useEffect(() => {
    const checkPermission = async () => {
      const allowed = await can(resource, action);
      setDisabled(!allowed);
      if (!allowed) {
        setReason(`Requires ${action} permission on ${resource}`);
      }
    };

    checkPermission();
  }, [resource, action, can]);

  return <>{children({ disabled, reason })}</>;
};

/**
 * Role-based visibility component
 */
export const RoleGate: React.FC<{
  roles: string[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ roles, requireAll = false, children, fallback }) => {
  return (
    <PermissionGate
      roles={roles}
      requireAllRoles={requireAll}
      hideWhenUnauthorized={!fallback}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
};

/**
 * Platform Admin Only Component
 */
export const AdminOnly: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => {
  const { isPlatformAdmin } = usePermissions();
  
  if (!isPlatformAdmin) {
    return fallback ? <>{fallback}</> : null;
  }
  
  return <>{children}</>;
};

/**
 * Feature flag based visibility
 */
export const FeatureGate: React.FC<{
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ feature, children, fallback }) => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const { session } = useRole();

  useEffect(() => {
    const checkFeature = async () => {
      // This would check against your feature flags table
      // For now, returning true for demonstration
      setEnabled(true);
      setLoading(false);
    };

    checkFeature();
  }, [feature, session]);

  if (loading) {
    return <Skeleton className="h-8 w-full" />;
  }

  if (!enabled) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};