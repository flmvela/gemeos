/**
 * EnhancedRouteProtection Component Test Suite
 * Tests for enhanced route protection with better error handling and platform admin bypass
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EnhancedRouteProtection } from '../EnhancedRouteProtection';
import { useAuth } from '@/hooks/useAuth';
import { accessManagementService } from '@/services/access-management.service';

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock the access management service
vi.mock('@/services/access-management.service', () => ({
  accessManagementService: {
    canAccessRoute: vi.fn(),
    checkAccess: vi.fn(),
  },
}));

// Mock Navigate component to track redirects
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: vi.fn(({ to }) => <div data-testid="navigate">Redirecting to {to}</div>),
  };
});

describe('EnhancedRouteProtection', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithRouter = (
    ui: React.ReactElement,
    { route = '/' } = {}
  ) => {
    window.history.pushState({}, 'Test page', route);
    
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {ui}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Platform Admin Access', () => {
    it('should grant immediate access to platform admins without route checks', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: {
          user_id: 'admin-123',
          email: 'admin@gemeos.ai',
          tenants: [],
          current_tenant: null,
          is_platform_admin: true,
        },
        isPlatformAdmin: true,
        loading: false,
        error: null,
      } as any);

      renderWithRouter(
        <EnhancedRouteProtection>
          <div>Protected Content</div>
        </EnhancedRouteProtection>,
        { route: '/admin/sensitive-data' }
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      // Should not call route access check for platform admin
      expect(accessManagementService.canAccessRoute).not.toHaveBeenCalled();
    });

    it('should display platform admin badge when admin accesses protected route', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: {
          user_id: 'admin-123',
          email: 'admin@gemeos.ai',
          tenants: [],
          current_tenant: null,
          is_platform_admin: true,
        },
        isPlatformAdmin: true,
        loading: false,
        error: null,
      } as any);

      renderWithRouter(
        <EnhancedRouteProtection showAdminBadge>
          <div>Protected Content</div>
        </EnhancedRouteProtection>,
        { route: '/admin/users' }
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
        expect(screen.getByTestId('platform-admin-badge')).toBeInTheDocument();
      });
    });
  });

  describe('Regular User Access', () => {
    it('should check route access for non-admin users', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: {
          user_id: 'user-123',
          email: 'teacher@school.com',
          tenants: [],
          current_tenant: null,
          is_platform_admin: false,
        },
        isPlatformAdmin: false,
        loading: false,
        error: null,
      } as any);

      vi.mocked(accessManagementService.canAccessRoute).mockResolvedValueOnce(true);

      renderWithRouter(
        <EnhancedRouteProtection>
          <div>Protected Content</div>
        </EnhancedRouteProtection>,
        { route: '/domains' }
      );

      await waitFor(() => {
        expect(accessManagementService.canAccessRoute).toHaveBeenCalledWith('/domains');
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should redirect to unauthorized page when access denied', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: {
          user_id: 'user-123',
          email: 'student@school.com',
          tenants: [],
          current_tenant: null,
          is_platform_admin: false,
        },
        isPlatformAdmin: false,
        loading: false,
        error: null,
      } as any);

      vi.mocked(accessManagementService.canAccessRoute).mockResolvedValueOnce(false);

      renderWithRouter(
        <EnhancedRouteProtection>
          <div>Protected Content</div>
        </EnhancedRouteProtection>,
        { route: '/admin/users' }
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigate')).toBeInTheDocument();
        expect(screen.getByText('Redirecting to /unauthorized')).toBeInTheDocument();
      });
    });

    it('should show custom unauthorized component when provided', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: {
          user_id: 'user-123',
          email: 'student@school.com',
          tenants: [],
          current_tenant: null,
          is_platform_admin: false,
        },
        isPlatformAdmin: false,
        loading: false,
        error: null,
      } as any);

      vi.mocked(accessManagementService.canAccessRoute).mockResolvedValueOnce(false);

      const UnauthorizedComponent = () => (
        <div>Custom Unauthorized: You need higher privileges</div>
      );

      renderWithRouter(
        <EnhancedRouteProtection 
          unauthorizedComponent={<UnauthorizedComponent />}
        >
          <div>Protected Content</div>
        </EnhancedRouteProtection>,
        { route: '/admin/settings' }
      );

      await waitFor(() => {
        expect(screen.getByText('Custom Unauthorized: You need higher privileges')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Permission-Based Access', () => {
    it('should check specific permissions when required', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: {
          user_id: 'user-123',
          email: 'teacher@school.com',
          tenants: [],
          current_tenant: null,
          is_platform_admin: false,
        },
        isPlatformAdmin: false,
        loading: false,
        error: null,
      } as any);

      vi.mocked(accessManagementService.checkAccess).mockResolvedValueOnce(true);

      renderWithRouter(
        <EnhancedRouteProtection
          requiredPermission={{ resource: 'concepts', action: 'create' }}
        >
          <div>Protected Content</div>
        </EnhancedRouteProtection>
      );

      await waitFor(() => {
        expect(accessManagementService.checkAccess).toHaveBeenCalledWith('concepts', 'create');
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should check both route and permission when both are required', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: {
          user_id: 'user-123',
          email: 'teacher@school.com',
          tenants: [],
          current_tenant: null,
          is_platform_admin: false,
        },
        isPlatformAdmin: false,
        loading: false,
        error: null,
      } as any);

      vi.mocked(accessManagementService.canAccessRoute).mockResolvedValueOnce(true);
      vi.mocked(accessManagementService.checkAccess).mockResolvedValueOnce(true);

      renderWithRouter(
        <EnhancedRouteProtection
          requiredPermission={{ resource: 'domains', action: 'update' }}
        >
          <div>Protected Content</div>
        </EnhancedRouteProtection>,
        { route: '/domains/123' }
      );

      await waitFor(() => {
        expect(accessManagementService.canAccessRoute).toHaveBeenCalledWith('/domains/123');
        expect(accessManagementService.checkAccess).toHaveBeenCalledWith('domains', 'update');
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Access', () => {
    it('should allow access when user has required role', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: {
          user_id: 'user-123',
          email: 'admin@school.com',
          tenants: [],
          current_tenant: {
            role: { name: 'tenant_admin' },
          },
          is_platform_admin: false,
        },
        isPlatformAdmin: false,
        isTenantAdmin: true,
        loading: false,
        error: null,
      } as any);

      renderWithRouter(
        <EnhancedRouteProtection requiredRole="tenant_admin">
          <div>Protected Content</div>
        </EnhancedRouteProtection>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should deny access when user lacks required role', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: {
          user_id: 'user-123',
          email: 'student@school.com',
          tenants: [],
          current_tenant: {
            role: { name: 'student' },
          },
          is_platform_admin: false,
        },
        isPlatformAdmin: false,
        isStudent: true,
        loading: false,
        error: null,
      } as any);

      renderWithRouter(
        <EnhancedRouteProtection requiredRole="teacher">
          <div>Protected Content</div>
        </EnhancedRouteProtection>,
        { route: '/teacher-only' }
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigate')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state while checking permissions', async () => {
      vi.mocked(useAuth).mockReturnValue({
        loading: true,
        session: null,
        isPlatformAdmin: false,
        error: null,
      } as any);

      renderWithRouter(
        <EnhancedRouteProtection>
          <div>Protected Content</div>
        </EnhancedRouteProtection>
      );

      expect(screen.getByTestId('route-protection-loading')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should show custom loading component when provided', async () => {
      vi.mocked(useAuth).mockReturnValue({
        loading: true,
        session: null,
        isPlatformAdmin: false,
        error: null,
      } as any);

      const CustomLoader = () => <div>Custom Loading...</div>;

      renderWithRouter(
        <EnhancedRouteProtection loadingComponent={<CustomLoader />}>
          <div>Protected Content</div>
        </EnhancedRouteProtection>
      );

      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: {
          user_id: 'user-123',
          email: 'user@example.com',
          tenants: [],
          current_tenant: null,
          is_platform_admin: false,
        },
        isPlatformAdmin: false,
        loading: false,
        error: null,
      } as any);

      vi.mocked(accessManagementService.canAccessRoute).mockRejectedValueOnce(
        new Error('Database connection error')
      );

      renderWithRouter(
        <EnhancedRouteProtection>
          <div>Protected Content</div>
        </EnhancedRouteProtection>,
        { route: '/some-route' }
      );

      await waitFor(() => {
        expect(screen.getByTestId('route-protection-error')).toBeInTheDocument();
        expect(screen.getByText(/Error checking permissions/)).toBeInTheDocument();
      });
    });
  });

  describe('Unauthenticated Access', () => {
    it('should redirect to login when user is not authenticated', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: null,
        isPlatformAdmin: false,
        loading: false,
        error: null,
      } as any);

      renderWithRouter(
        <EnhancedRouteProtection>
          <div>Protected Content</div>
        </EnhancedRouteProtection>,
        { route: '/protected' }
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigate')).toBeInTheDocument();
        expect(screen.getByText('Redirecting to /login')).toBeInTheDocument();
      });
    });

    it('should allow specifying custom login redirect path', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: null,
        isPlatformAdmin: false,
        loading: false,
        error: null,
      } as any);

      renderWithRouter(
        <EnhancedRouteProtection loginPath="/auth/signin">
          <div>Protected Content</div>
        </EnhancedRouteProtection>,
        { route: '/protected' }
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigate')).toBeInTheDocument();
        expect(screen.getByText('Redirecting to /auth/signin')).toBeInTheDocument();
      });
    });
  });

  describe('Public Routes', () => {
    it('should allow access to public routes without authentication', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: null,
        isPlatformAdmin: false,
        loading: false,
        error: null,
      } as any);

      renderWithRouter(
        <EnhancedRouteProtection isPublic>
          <div>Public Content</div>
        </EnhancedRouteProtection>
      );

      await waitFor(() => {
        expect(screen.getByText('Public Content')).toBeInTheDocument();
      });

      expect(accessManagementService.canAccessRoute).not.toHaveBeenCalled();
    });
  });
});