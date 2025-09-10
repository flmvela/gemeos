/**
 * Permission-Aware Router Component
 * Declarative routing with built-in permission checks
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions, useRole } from '@/hooks/usePermissions';
import { EnhancedRouteProtection } from '@/components/auth/EnhancedRouteProtection';
import { Skeleton } from '@/components/ui/skeleton';

// Route configuration types
export interface RoutePermission {
  resource?: string;
  action?: string;
  resources?: Array<{ resource: string; action: string }>;
  requireAll?: boolean;
}

export interface RouteRole {
  roles: string[];
  requireAll?: boolean;
}

export interface ProtectedRouteConfig {
  path: string;
  element: ReactNode;
  permissions?: RoutePermission;
  roles?: RouteRole;
  isPublic?: boolean;
  redirectTo?: string;
  layout?: React.ComponentType<{ children: ReactNode }>;
  beforeEnter?: () => Promise<boolean>;
  onUnauthorized?: () => void;
  metadata?: {
    title?: string;
    description?: string;
    breadcrumb?: string;
  };
}

interface PermissionRouteProps {
  config: ProtectedRouteConfig;
  children?: ReactNode;
}

/**
 * Individual route with permission checking
 */
export const PermissionRoute: React.FC<PermissionRouteProps> = ({ 
  config,
  children 
}) => {
  const location = useLocation();
  const { can, canAll, canAny, isPlatformAdmin } = usePermissions();
  const { hasAnyRole, hasAllRoles } = useRole();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkRouteAccess = async () => {
      setIsLoading(true);

      try {
        // Public routes don't need auth
        if (config.isPublic) {
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        // Platform admin bypass
        if (isPlatformAdmin) {
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        let authorized = true;

        // Custom beforeEnter hook
        if (config.beforeEnter) {
          const canEnter = await config.beforeEnter();
          authorized = authorized && canEnter;
        }

        // Check role requirements
        if (config.roles) {
          const roleCheck = config.roles.requireAll
            ? hasAllRoles(config.roles.roles)
            : hasAnyRole(config.roles.roles);
          authorized = authorized && roleCheck;
        }

        // Check permission requirements
        if (config.permissions) {
          if (config.permissions.resource && config.permissions.action) {
            const hasPermission = await can(
              config.permissions.resource,
              config.permissions.action
            );
            authorized = authorized && hasPermission;
          }

          if (config.permissions.resources) {
            const permissionCheck = config.permissions.requireAll
              ? await canAll(config.permissions.resources)
              : await canAny(config.permissions.resources);
            authorized = authorized && permissionCheck;
          }
        }

        setIsAuthorized(authorized);

        // Handle unauthorized callback
        if (!authorized && config.onUnauthorized) {
          config.onUnauthorized();
        }

      } catch (error) {
        console.error('Route authorization check failed:', error);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkRouteAccess();
  }, [
    config,
    location.pathname,
    can,
    canAll,
    canAny,
    hasAnyRole,
    hasAllRoles,
    isPlatformAdmin
  ]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
        </div>
      </div>
    );
  }

  // Unauthorized - redirect
  if (isAuthorized === false) {
    const redirectPath = config.redirectTo || '/unauthorized';
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Authorized - render with optional layout
  const content = children || config.element;
  
  if (config.layout) {
    const Layout = config.layout;
    return <Layout>{content}</Layout>;
  }

  return <>{content}</>;
};

/**
 * Route configuration builder
 */
export class RouteConfigBuilder {
  private routes: Map<string, ProtectedRouteConfig> = new Map();

  addRoute(config: ProtectedRouteConfig): RouteConfigBuilder {
    this.routes.set(config.path, config);
    return this;
  }

  addPublicRoute(
    path: string,
    element: ReactNode,
    metadata?: ProtectedRouteConfig['metadata']
  ): RouteConfigBuilder {
    return this.addRoute({
      path,
      element,
      isPublic: true,
      metadata,
    });
  }

  addProtectedRoute(
    path: string,
    element: ReactNode,
    options: Partial<ProtectedRouteConfig> = {}
  ): RouteConfigBuilder {
    return this.addRoute({
      path,
      element,
      isPublic: false,
      ...options,
    });
  }

  addRoleRoute(
    path: string,
    element: ReactNode,
    roles: string[],
    options: Partial<ProtectedRouteConfig> = {}
  ): RouteConfigBuilder {
    return this.addRoute({
      path,
      element,
      isPublic: false,
      roles: { roles, requireAll: false },
      ...options,
    });
  }

  addPermissionRoute(
    path: string,
    element: ReactNode,
    resource: string,
    action: string,
    options: Partial<ProtectedRouteConfig> = {}
  ): RouteConfigBuilder {
    return this.addRoute({
      path,
      element,
      isPublic: false,
      permissions: { resource, action },
      ...options,
    });
  }

  getRoutes(): ProtectedRouteConfig[] {
    return Array.from(this.routes.values());
  }

  getRouteConfig(path: string): ProtectedRouteConfig | undefined {
    return this.routes.get(path);
  }
}

/**
 * Dynamic route generator based on permissions
 */
export const useDynamicRoutes = () => {
  const { userPermissions, isPlatformAdmin } = usePermissions();
  const { currentRole } = useRole();
  const [routes, setRoutes] = useState<ProtectedRouteConfig[]>([]);

  useEffect(() => {
    const generateRoutes = () => {
      const builder = new RouteConfigBuilder();

      // Always add public routes
      builder
        .addPublicRoute('/login', <div>Login</div>)
        .addPublicRoute('/register', <div>Register</div>)
        .addPublicRoute('/forgot-password', <div>Forgot Password</div>);

      // Add role-based routes
      if (isPlatformAdmin) {
        builder
          .addRoleRoute('/admin', <div>Admin Dashboard</div>, ['platform_admin'])
          .addRoleRoute('/admin/tenants', <div>Tenant Management</div>, ['platform_admin'])
          .addRoleRoute('/admin/analytics', <div>Platform Analytics</div>, ['platform_admin']);
      }

      if (currentRole === 'tenant_admin' || isPlatformAdmin) {
        builder
          .addRoleRoute('/tenant-admin', <div>Tenant Admin</div>, ['tenant_admin'])
          .addPermissionRoute('/users', <div>User Management</div>, 'user', 'read')
          .addPermissionRoute('/settings', <div>Settings</div>, 'tenant', 'update');
      }

      if (currentRole === 'teacher' || currentRole === 'tenant_admin' || isPlatformAdmin) {
        builder
          .addPermissionRoute('/domains', <div>Domains</div>, 'domain', 'read')
          .addPermissionRoute('/concepts', <div>Concepts</div>, 'concept', 'read')
          .addPermissionRoute('/learning-goals', <div>Learning Goals</div>, 'learning_goal', 'read');
      }

      if (currentRole === 'student') {
        builder
          .addRoleRoute('/student/dashboard', <div>Student Dashboard</div>, ['student'])
          .addRoleRoute('/student/courses', <div>My Courses</div>, ['student']);
      }

      setRoutes(builder.getRoutes());
    };

    generateRoutes();
  }, [userPermissions, isPlatformAdmin, currentRole]);

  return routes;
};

/**
 * Navigation menu generator based on permissions
 */
export const useNavigationMenu = () => {
  const { can, isPlatformAdmin } = usePermissions();
  const { currentRole } = useRole();
  const [menuItems, setMenuItems] = useState<any[]>([]);

  useEffect(() => {
    const generateMenu = async () => {
      const items = [];

      // Platform Admin menu
      if (isPlatformAdmin) {
        items.push({
          label: 'Platform Admin',
          icon: 'Shield',
          children: [
            { label: 'Dashboard', path: '/admin', icon: 'LayoutDashboard' },
            { label: 'Tenants', path: '/admin/tenants', icon: 'Building' },
            { label: 'Analytics', path: '/admin/analytics', icon: 'BarChart' },
            { label: 'Settings', path: '/admin/settings', icon: 'Settings' },
          ],
        });
      }

      // Tenant Admin menu
      if (currentRole === 'tenant_admin' || isPlatformAdmin) {
        const canManageUsers = await can('user', 'read');
        const canManageTenant = await can('tenant', 'update');

        const tenantItems = [];
        if (canManageUsers) {
          tenantItems.push({ label: 'Users', path: '/users', icon: 'Users' });
        }
        if (canManageTenant) {
          tenantItems.push({ label: 'Settings', path: '/settings', icon: 'Settings' });
        }

        if (tenantItems.length > 0) {
          items.push({
            label: 'Administration',
            icon: 'Building',
            children: tenantItems,
          });
        }
      }

      // Teacher menu
      if (currentRole === 'teacher' || currentRole === 'tenant_admin' || isPlatformAdmin) {
        const canViewDomains = await can('domain', 'read');
        const canViewConcepts = await can('concept', 'read');
        const canViewGoals = await can('learning_goal', 'read');

        const teacherItems = [];
        if (canViewDomains) {
          teacherItems.push({ label: 'Domains', path: '/domains', icon: 'Book' });
        }
        if (canViewConcepts) {
          teacherItems.push({ label: 'Concepts', path: '/concepts', icon: 'Lightbulb' });
        }
        if (canViewGoals) {
          teacherItems.push({ label: 'Learning Goals', path: '/learning-goals', icon: 'Target' });
        }

        if (teacherItems.length > 0) {
          items.push({
            label: 'Teaching',
            icon: 'GraduationCap',
            children: teacherItems,
          });
        }
      }

      // Student menu
      if (currentRole === 'student') {
        items.push({
          label: 'Learning',
          icon: 'BookOpen',
          children: [
            { label: 'Dashboard', path: '/student/dashboard', icon: 'Home' },
            { label: 'My Courses', path: '/student/courses', icon: 'Book' },
            { label: 'Assessments', path: '/student/assessments', icon: 'ClipboardCheck' },
            { label: 'Progress', path: '/student/progress', icon: 'TrendingUp' },
          ],
        });
      }

      setMenuItems(items);
    };

    generateMenu();
  }, [can, isPlatformAdmin, currentRole]);

  return menuItems;
};