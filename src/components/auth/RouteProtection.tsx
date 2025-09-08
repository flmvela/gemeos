import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface RouteProtectionProps {
  children: ReactNode;
}

export const RouteProtection = ({ children }: RouteProtectionProps) => {
  const location = useLocation();
  const { session, loading, isPlatformAdmin, isTenantAdmin, isTeacher } = useAuth();

  if (loading) {
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

  if (!session) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check if user has any tenant associations
  if (!isPlatformAdmin && (!session.tenants || session.tenants.length === 0)) {
    // User is authenticated but has no tenant access
    if (location.pathname !== '/no-access') {
      return <Navigate to="/no-access" replace />;
    }
  }

  // Role-based access control for dashboard routes
  const path = location.pathname;
  
  // Admin dashboard - only platform admin
  if (path === '/admin/dashboard') {
    if (!isPlatformAdmin) {
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  // Teacher dashboard - accessible by admin, tenant admin, and teacher
  if (path === '/teacher/dashboard') {
    if (!isPlatformAdmin && !isTenantAdmin && !isTeacher) {
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  // Tenant dashboard - accessible by admin and tenant admin (not teacher)
  if (path === '/tenant/dashboard') {
    if (!isPlatformAdmin && !isTenantAdmin) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};