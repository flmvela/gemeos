/**
 * Enhanced Route Protection Component
 * Provides comprehensive access control with platform admin bypass
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { accessManagementService } from '@/services/access-management.service';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Shield, Lock, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EnhancedRouteProtectionProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermission?: {
    resource: string;
    action: string;
  };
  isPublic?: boolean;
  showAdminBadge?: boolean;
  loadingComponent?: ReactNode;
  unauthorizedComponent?: ReactNode;
  loginPath?: string;
}

export const EnhancedRouteProtection: React.FC<EnhancedRouteProtectionProps> = ({
  children,
  requiredRole,
  requiredPermission,
  isPublic = false,
  showAdminBadge = false,
  loadingComponent,
  unauthorizedComponent,
  loginPath = '/login',
}) => {
  const location = useLocation();
  const { session, loading, isPlatformAdmin, isTenantAdmin, isTeacher, isStudent } = useAuth();
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      // Public routes don't require authentication
      if (isPublic) {
        setAccessGranted(true);
        setCheckingAccess(false);
        return;
      }

      // No session means not authenticated
      if (!session) {
        setAccessGranted(false);
        setCheckingAccess(false);
        return;
      }

      try {
        setCheckingAccess(true);
        setError(null);
        
        // PLATFORM ADMIN BYPASS - Critical for universal access
        // Platform admins have complete access to everything
        if (isPlatformAdmin) {
          setAccessGranted(true);
          setCheckingAccess(false);
          return;
        }

        // For regular users, check all requirements
        let hasAccess = true;

        // Check role requirement
        if (requiredRole) {
          const userRole = session.current_tenant?.role?.name;
          const roleMatches = 
            userRole === requiredRole ||
            (requiredRole === 'tenant_admin' && isTenantAdmin) ||
            (requiredRole === 'teacher' && isTeacher) ||
            (requiredRole === 'student' && isStudent);
          
          if (!roleMatches) {
            hasAccess = false;
          }
        }

        // Check permission requirement
        if (requiredPermission && hasAccess) {
          const hasPermission = await accessManagementService.checkAccess(
            requiredPermission.resource,
            requiredPermission.action
          );
          if (!hasPermission) {
            hasAccess = false;
          }
        }

        // Check route-based access (always check unless explicitly public)
        if (hasAccess && !requiredRole && !requiredPermission) {
          const canAccessRoute = await accessManagementService.canAccessRoute(location.pathname);
          if (!canAccessRoute) {
            hasAccess = false;
          }
        }

        setAccessGranted(hasAccess);
      } catch (err) {
        console.error('Error checking access:', err);
        setError(err as Error);
        setAccessGranted(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [
    session,
    location.pathname,
    requiredRole,
    requiredPermission,
    isPublic,
    isPlatformAdmin,
    isTenantAdmin,
    isTeacher,
    isStudent,
  ]);

  // Show loading state while checking authentication
  if (loading || checkingAccess) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div 
        className="flex items-center justify-center min-h-screen"
        data-testid="route-protection-loading"
      >
        <div className="space-y-4 w-full max-w-md">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  // Show error state if there was an error checking permissions
  if (error) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen bg-background"
        data-testid="route-protection-error"
      >
        <div className="max-w-md w-full px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Error checking permissions</AlertTitle>
            <AlertDescription>
              {error.message || 'An unexpected error occurred while checking your permissions.'}
            </AlertDescription>
          </Alert>
          
          <div className="mt-6 flex flex-col gap-3">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              Retry
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (and route is not public)
  if (!session && !isPublic) {
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  // Show unauthorized component or redirect if access is denied
  if (accessGranted === false) {
    if (unauthorizedComponent) {
      return <>{unauthorizedComponent}</>;
    }

    // For non-authenticated users, redirect to login
    if (!session) {
      return <Navigate to={loginPath} replace state={{ from: location }} />;
    }

    // For authenticated but unauthorized users, redirect to unauthorized page
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }

  // Access granted - render children with optional admin badge
  return (
    <>
      {showAdminBadge && isPlatformAdmin && (
        <div className="fixed top-4 right-4 z-50" data-testid="platform-admin-badge">
          <Badge variant="default" className="bg-primary">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Platform Admin
          </Badge>
        </div>
      )}
      {children}
    </>
  );
};

// Default export for backward compatibility
export default EnhancedRouteProtection;