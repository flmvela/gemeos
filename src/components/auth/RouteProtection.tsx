import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface RouteProtectionProps {
  children: ReactNode;
}

export const RouteProtection = ({ children }: RouteProtectionProps) => {
  const location = useLocation();
  const { session, authState, isPlatformAdmin, isTenantAdmin, isTeacher, enrichmentLoading } = useAuth();
  
  // Debug logging
  console.log('🔐 RouteProtection Debug:', {
    path: location.pathname,
    authState,
    enrichmentLoading,
    isPlatformAdmin,
    isTenantAdmin,
    isTeacher,
    email: session?.email
  });

  // Check auth state first
  if (authState === 'authenticating') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check if user has any tenant associations (but don't wait for enrichment)
  if (!enrichmentLoading && !isPlatformAdmin && (!session?.tenants || session.tenants.length === 0)) {
    // User is authenticated but has no tenant access
    if (location.pathname !== '/no-access') {
      return <Navigate to="/no-access" replace />;
    }
  }

  // Role-based access control for dashboard routes
  const path = location.pathname;
  
  // Admin dashboard - only platform admin
  if (path === '/admin/dashboard') {
    // Wait for enrichment before checking roles
    if (enrichmentLoading) {
      console.log('🔐 RouteProtection: Admin dashboard - waiting for enrichment');
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="space-y-4 w-full max-w-md p-6">
            <div className="text-center mb-4">
              <p className="text-gray-600">Loading admin dashboard...</p>
            </div>
            <Skeleton className="h-8 w-full bg-gray-200" />
            <Skeleton className="h-4 w-3/4 bg-gray-200" />
            <Skeleton className="h-4 w-1/2 bg-gray-200" />
          </div>
        </div>
      );
    }
    
    if (!isPlatformAdmin) {
      // Redirect to appropriate dashboard based on role
      if (isTenantAdmin) {
        return <Navigate to="/tenant/dashboard" replace />;
      } else if (isTeacher) {
        return <Navigate to="/teacher/dashboard" replace />;
      }
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  // Teacher dashboard - accessible by admin, tenant admin, and teacher
  if (path === '/teacher/dashboard') {
    // Wait for enrichment before checking roles
    if (enrichmentLoading) {
      console.log('🔐 RouteProtection: Teacher dashboard - waiting for enrichment');
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="space-y-4 w-full max-w-md">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      );
    }
    
    if (!isPlatformAdmin && !isTenantAdmin && !isTeacher) {
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  // Tenant dashboard - accessible by admin and tenant admin (not teacher)
  if (path === '/tenant/dashboard') {
    // If enrichment is still loading, show a loading state instead of denying access
    if (enrichmentLoading) {
      console.log('🔐 RouteProtection: Tenant dashboard - waiting for enrichment');
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="space-y-4 w-full max-w-md">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      );
    }
    
    console.log('🔐 RouteProtection: Tenant dashboard check:', {
      isPlatformAdmin,
      isTenantAdmin,
      isTeacher,
      email: session?.email,
      role: session?.current_tenant?.role?.name
    });
    
    if (!isPlatformAdmin && !isTenantAdmin) {
      // Redirect teacher to teacher dashboard
      if (isTeacher) {
        return <Navigate to="/teacher/dashboard" replace />;
      }
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};