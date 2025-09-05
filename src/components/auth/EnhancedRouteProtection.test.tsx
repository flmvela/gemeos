import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { EnhancedRouteProtection } from './EnhancedRouteProtection';
import { AccessManagementService } from '@/services/access-management.service';
import { useAuth } from '@/hooks/useAuth';

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock the AccessManagementService
vi.mock('@/services/access-management.service', () => ({
  AccessManagementService: {
    getInstance: vi.fn(() => ({
      checkAccess: vi.fn(),
      hasPermission: vi.fn(),
      hasRoleOrHigher: vi.fn(),
      isPlatformAdmin: vi.fn(),
      logAccess: vi.fn(),
    })),
  },
}));

// Mock the Navigate component from react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: vi.fn(({ to, replace, state }) => (
      <div data-testid="navigate" data-to={to} data-replace={replace} data-state={JSON.stringify(state)}>
        Navigate to {to}
      </div>
    )),
    useLocation: vi.fn(() => ({
      pathname: '/test-path',
      search: '',
      hash: '',
      state: null,
    })),
  };
});

describe('EnhancedRouteProtection', () => {
  let mockAccessService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccessService = AccessManagementService.getInstance();
  });

  describe('Authentication Check', () => {
    it('should show loading state while checking authentication', () => {
      vi.mocked(useAuth).mockReturnValue({
        session: null,
        loading: true,
        tenantContext: null,
        error: null,
        switchTenant: vi.fn(),
        refresh: vi.fn(),
        hasPermission: vi.fn(),
        isPlatformAdmin: false,
        isTenantAdmin: false,
        isTeacher: false,
        isStudent: false,
      });

      render(
        <BrowserRouter>
          <EnhancedRouteProtection>
            <div>Protected Content</div>
          </EnhancedRouteProtection>
        </BrowserRouter>
      );

      expect(screen.getByTestId('route-protection-loading')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should redirect to login when not authenticated', () => {
      vi.mocked(useAuth).mockReturnValue({
        session: null,
        loading: false,
        tenantContext: null,
        error: null,
        switchTenant: vi.fn(),
        refresh: vi.fn(),
        hasPermission: vi.fn(),
        isPlatformAdmin: false,
        isTenantAdmin: false,
        isTeacher: false,
        isStudent: false,
      });

      render(
        <BrowserRouter>
          <EnhancedRouteProtection>
            <div>Protected Content</div>
          </EnhancedRouteProtection>
        </BrowserRouter>
      );

      const navigate = screen.getByTestId('navigate');
      expect(navigate).toHaveAttribute('data-to', '/login');
      expect(navigate).toHaveAttribute('data-replace', 'true');
    });

    it('should preserve location state when redirecting to login', () => {
      vi.mocked(useAuth).mockReturnValue({
        session: null,
        loading: false,
        tenantContext: null,
        error: null,
        switchTenant: vi.fn(),
        refresh: vi.fn(),
        hasPermission: vi.fn(),
        isPlatformAdmin: false,
        isTenantAdmin: false,
        isTeacher: false,
        isStudent: false,
      });

      render(
        <BrowserRouter>
          <EnhancedRouteProtection>
            <div>Protected Content</div>
          </EnhancedRouteProtection>
        </BrowserRouter>
      );

      const navigate = screen.getByTestId('navigate');
      const state = JSON.parse(navigate.getAttribute('data-state') || '{}');
      expect(state.from.pathname).toBe('/test-path');
    });
  });

  describe('Platform Admin Access', () => {
    it('should grant universal access to platform admins', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: { 
          user_id: 'admin-123',
          email: 'admin@gemeos.ai',
          tenants: [],
          current_tenant: null,
          is_platform_admin: true,
        },
        loading: false,
        tenantContext: null,
        error: null,
        switchTenant: vi.fn(),
        refresh: vi.fn(),
        hasPermission: vi.fn(),
        isPlatformAdmin: true,
        isTenantAdmin: false,
        isTeacher: false,
        isStudent: false,
      });

      mockAccessService.isPlatformAdmin.mockResolvedValue(true);

      render(
        <BrowserRouter>
          <EnhancedRouteProtection requiredRole="admin">
            <div>Protected Admin Content</div>
          </EnhancedRouteProtection>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Admin Content')).toBeInTheDocument();
      });
    });

    it('should bypass permission checks for platform admins', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: { 
          user_id: 'admin-123',
          email: 'admin@gemeos.ai',
          tenants: [],
          current_tenant: null,
          is_platform_admin: true,
        },
        loading: false,
        tenantContext: null,
        error: null,
        switchTenant: vi.fn(),
        refresh: vi.fn(),
        hasPermission: vi.fn(),
        isPlatformAdmin: true,
        isTenantAdmin: false,
        isTeacher: false,
        isStudent: false,
      });

      mockAccessService.isPlatformAdmin.mockResolvedValue(true);
      mockAccessService.hasPermission.mockResolvedValue(true);

      render(
        <BrowserRouter>
          <EnhancedRouteProtection 
            requiredPermission={{ resource: 'users', action: 'delete' }}
          >
            <div>Protected Content</div>
          </EnhancedRouteProtection>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      // Should not check specific permissions for platform admin
      expect(mockAccessService.hasPermission).not.toHaveBeenCalled();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow access when user has required role', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: { 
          user_id: 'teacher-123',
          email: 'teacher@example.com',
          tenants: [],
          current_tenant: null,
          is_platform_admin: false,
        },
        loading: false,
        tenantContext: null,
        error: null,
        switchTenant: vi.fn(),
        refresh: vi.fn(),
        hasPermission: vi.fn(),
        isPlatformAdmin: false,
        isTenantAdmin: false,
        isTeacher: true,
        isStudent: false,
      });

      mockAccessService.hasRoleOrHigher.mockResolvedValue(true);
      mockAccessService.isPlatformAdmin.mockResolvedValue(false);

      render(
        <BrowserRouter>
          <EnhancedRouteProtection requiredRole="teacher">
            <div>Teacher Content</div>
          </EnhancedRouteProtection>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Teacher Content')).toBeInTheDocument();
      });
    });

    it('should deny access when user lacks required role', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: { 
          user_id: 'student-123',
          email: 'student@example.com',
          tenants: [],
          current_tenant: null,
          is_platform_admin: false,
        },
        loading: false,
        tenantContext: null,
        error: null,
        switchTenant: vi.fn(),
        refresh: vi.fn(),
        hasPermission: vi.fn(),
        isPlatformAdmin: false,
        isTenantAdmin: false,
        isTeacher: false,
        isStudent: true,
      });

      mockAccessService.hasRoleOrHigher.mockResolvedValue(false);
      mockAccessService.isPlatformAdmin.mockResolvedValue(false);

      render(
        <BrowserRouter>
          <EnhancedRouteProtection requiredRole="teacher">
            <div>Teacher Content</div>
          </EnhancedRouteProtection>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('access-denied')).toBeInTheDocument();
        expect(screen.queryByText('Teacher Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Permission-Based Access Control', () => {
    it('should allow access when user has required permission', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: { 
          user_id: 'user-123',
          email: 'user@example.com',
          tenants: [],
          current_tenant: null,
          is_platform_admin: false,
        },
        loading: false,
        tenantContext: null,
        error: null,
        switchTenant: vi.fn(),
        refresh: vi.fn(),
        hasPermission: vi.fn(),
        isPlatformAdmin: false,
        isTenantAdmin: false,
        isTeacher: true,
        isStudent: false,
      });

      mockAccessService.hasPermission.mockResolvedValue(true);
      mockAccessService.isPlatformAdmin.mockResolvedValue(false);

      render(
        <BrowserRouter>
          <EnhancedRouteProtection 
            requiredPermission={{ resource: 'concepts', action: 'create' }}
          >
            <div>Create Concept Form</div>
          </EnhancedRouteProtection>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Create Concept Form')).toBeInTheDocument();
      });
    });

    it('should deny access when user lacks required permission', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: { 
          user_id: 'user-123',
          email: 'user@example.com',
          tenants: [],
          current_tenant: null,
          is_platform_admin: false,
        },
        loading: false,
        tenantContext: null,
        error: null,
        switchTenant: vi.fn(),
        refresh: vi.fn(),
        hasPermission: vi.fn(),
        isPlatformAdmin: false,
        isTenantAdmin: false,
        isTeacher: true,
        isStudent: false,
      });

      mockAccessService.hasPermission.mockResolvedValue(false);
      mockAccessService.isPlatformAdmin.mockResolvedValue(false);

      render(
        <BrowserRouter>
          <EnhancedRouteProtection 
            requiredPermission={{ resource: 'users', action: 'delete' }}
          >
            <div>Delete User Button</div>
          </EnhancedRouteProtection>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('access-denied')).toBeInTheDocument();
        expect(screen.queryByText('Delete User Button')).not.toBeInTheDocument();
      });
    });
  });

  describe('Path-Based Access Control', () => {
    it('should check path access when checkPath is enabled', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: { 
          user_id: 'user-123',
          email: 'user@example.com',
          tenants: [],
          current_tenant: null,
          is_platform_admin: false,
        },
        loading: false,
        tenantContext: null,
        error: null,
        switchTenant: vi.fn(),
        refresh: vi.fn(),
        hasPermission: vi.fn(),
        isPlatformAdmin: false,
        isTenantAdmin: false,
        isTeacher: true,
        isStudent: false,
      });

      mockAccessService.checkAccess.mockResolvedValue(true);
      mockAccessService.isPlatformAdmin.mockResolvedValue(false);

      render(
        <BrowserRouter>
          <EnhancedRouteProtection checkPath>
            <div>Path Protected Content</div>
          </EnhancedRouteProtection>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Path Protected Content')).toBeInTheDocument();
      });

      expect(mockAccessService.checkAccess).toHaveBeenCalledWith('/test-path');
    });

    it('should deny access when path check fails', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: { 
          user_id: 'user-123',
          email: 'user@example.com',
          tenants: [],
          current_tenant: null,
          is_platform_admin: false,
        },
        loading: false,
        tenantContext: null,
        error: null,
        switchTenant: vi.fn(),
        refresh: vi.fn(),
        hasPermission: vi.fn(),
        isPlatformAdmin: false,
        isTenantAdmin: false,
        isTeacher: true,
        isStudent: false,
      });

      mockAccessService.checkAccess.mockResolvedValue(false);
      mockAccessService.isPlatformAdmin.mockResolvedValue(false);

      render(
        <BrowserRouter>
          <EnhancedRouteProtection checkPath>
            <div>Path Protected Content</div>
          </EnhancedRouteProtection>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('access-denied')).toBeInTheDocument();
        expect(screen.queryByText('Path Protected Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Custom Unauthorized Component', () => {
    it('should render custom unauthorized component when provided', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: { 
          user_id: 'user-123',
          email: 'user@example.com',
          tenants: [],
          current_tenant: null,
          is_platform_admin: false,
        },
        loading: false,
        tenantContext: null,
        error: null,
        switchTenant: vi.fn(),
        refresh: vi.fn(),
        hasPermission: vi.fn(),
        isPlatformAdmin: false,
        isTenantAdmin: false,
        isTeacher: false,
        isStudent: true,
      });

      mockAccessService.hasRoleOrHigher.mockResolvedValue(false);
      mockAccessService.isPlatformAdmin.mockResolvedValue(false);

      const CustomUnauthorized = () => <div>Custom Unauthorized Message</div>;

      render(
        <BrowserRouter>
          <EnhancedRouteProtection 
            requiredRole="teacher"
            unauthorizedComponent={<CustomUnauthorized />}
          >
            <div>Protected Content</div>
          </EnhancedRouteProtection>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Custom Unauthorized Message')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Audit Logging', () => {
    it('should log successful access attempts', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: { 
          user_id: 'user-123',
          email: 'user@example.com',
          tenants: [],
          current_tenant: null,
          is_platform_admin: false,
        },
        loading: false,
        tenantContext: null,
        error: null,
        switchTenant: vi.fn(),
        refresh: vi.fn(),
        hasPermission: vi.fn(),
        isPlatformAdmin: false,
        isTenantAdmin: false,
        isTeacher: true,
        isStudent: false,
      });

      mockAccessService.checkAccess.mockResolvedValue(true);
      mockAccessService.isPlatformAdmin.mockResolvedValue(false);
      mockAccessService.logAccess.mockResolvedValue(undefined);

      render(
        <BrowserRouter>
          <EnhancedRouteProtection checkPath enableAudit>
            <div>Protected Content</div>
          </EnhancedRouteProtection>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      expect(mockAccessService.logAccess).toHaveBeenCalledWith(
        'access',
        'route',
        '/test-path',
        true
      );
    });

    it('should log failed access attempts', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: { 
          user_id: 'user-123',
          email: 'user@example.com',
          tenants: [],
          current_tenant: null,
          is_platform_admin: false,
        },
        loading: false,
        tenantContext: null,
        error: null,
        switchTenant: vi.fn(),
        refresh: vi.fn(),
        hasPermission: vi.fn(),
        isPlatformAdmin: false,
        isTenantAdmin: false,
        isTeacher: false,
        isStudent: true,
      });

      mockAccessService.hasRoleOrHigher.mockResolvedValue(false);
      mockAccessService.isPlatformAdmin.mockResolvedValue(false);
      mockAccessService.logAccess.mockResolvedValue(undefined);

      render(
        <BrowserRouter>
          <EnhancedRouteProtection requiredRole="teacher" enableAudit>
            <div>Protected Content</div>
          </EnhancedRouteProtection>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('access-denied')).toBeInTheDocument();
      });

      expect(mockAccessService.logAccess).toHaveBeenCalledWith(
        'access_denied',
        'route',
        '/test-path',
        false
      );
    });
  });

  describe('Combined Requirements', () => {
    it('should check both role and permission when both are specified', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: { 
          user_id: 'user-123',
          email: 'user@example.com',
          tenants: [],
          current_tenant: null,
          is_platform_admin: false,
        },
        loading: false,
        tenantContext: null,
        error: null,
        switchTenant: vi.fn(),
        refresh: vi.fn(),
        hasPermission: vi.fn(),
        isPlatformAdmin: false,
        isTenantAdmin: false,
        isTeacher: true,
        isStudent: false,
      });

      mockAccessService.hasRoleOrHigher.mockResolvedValue(true);
      mockAccessService.hasPermission.mockResolvedValue(true);
      mockAccessService.isPlatformAdmin.mockResolvedValue(false);

      render(
        <BrowserRouter>
          <EnhancedRouteProtection 
            requiredRole="teacher"
            requiredPermission={{ resource: 'concepts', action: 'create' }}
          >
            <div>Protected Content</div>
          </EnhancedRouteProtection>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      expect(mockAccessService.hasRoleOrHigher).toHaveBeenCalledWith('teacher');
      expect(mockAccessService.hasPermission).toHaveBeenCalledWith('concepts', 'create');
    });

    it('should deny access if any requirement fails', async () => {
      vi.mocked(useAuth).mockReturnValue({
        session: { 
          user_id: 'user-123',
          email: 'user@example.com',
          tenants: [],
          current_tenant: null,
          is_platform_admin: false,
        },
        loading: false,
        tenantContext: null,
        error: null,
        switchTenant: vi.fn(),
        refresh: vi.fn(),
        hasPermission: vi.fn(),
        isPlatformAdmin: false,
        isTenantAdmin: false,
        isTeacher: true,
        isStudent: false,
      });

      mockAccessService.hasRoleOrHigher.mockResolvedValue(true);
      mockAccessService.hasPermission.mockResolvedValue(false); // Permission check fails
      mockAccessService.isPlatformAdmin.mockResolvedValue(false);

      render(
        <BrowserRouter>
          <EnhancedRouteProtection 
            requiredRole="teacher"
            requiredPermission={{ resource: 'users', action: 'delete' }}
          >
            <div>Protected Content</div>
          </EnhancedRouteProtection>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('access-denied')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });
  });
});