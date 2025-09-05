/**
 * Integration Tests for Authentication React Hooks
 * Testing hooks with mocked Supabase and React Testing Library
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import {
  AuthProvider,
  useAuth,
  usePermission,
  useIsPlatformAdmin,
  useIsTenantAdmin,
  useIsTeacher,
  useIsStudent,
  useCurrentTenant,
  useTenantSwitcher,
  useAuthGuard,
  useAuditLog,
} from './useAuth';
import { authService } from '@/services/auth.service';
import { mockSupabaseResponses } from '@/test/mocks/supabase.mock';
import type { AuthSession, TenantContext } from '@/types/auth.types';

// Mock the auth service
vi.mock('@/services/auth.service', () => ({
  authService: {
    getCurrentSession: vi.fn(),
    getTenantContext: vi.fn(),
    switchTenant: vi.fn(),
    hasPermission: vi.fn(),
    createAuditLog: vi.fn(),
    clearCache: vi.fn(),
  },
}));

describe('Authentication React Hooks', () => {
  // Helper to wrap components with AuthProvider
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:3000' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AuthProvider and useAuth', () => {
    it('should provide initial loading state', () => {
      (authService.getCurrentSession as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(null), 100))
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.session).toBeNull();
      expect(result.current.tenantContext).toBeNull();
    });

    it('should load session and tenant context on mount', async () => {
      const mockSession: AuthSession = {
        user_id: 'user-123',
        email: 'test@example.com',
        tenants: [{
          user_id: 'user-123',
          tenant_id: 'tenant-1',
          role_id: 'role-1',
          is_primary: true,
          status: 'active',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          tenant: mockSupabaseResponses.tenants[0],
          role: mockSupabaseResponses.roles.tenant_admin,
        }],
        current_tenant: {
          user_id: 'user-123',
          tenant_id: 'tenant-1',
          role_id: 'role-1',
          is_primary: true,
          status: 'active',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          tenant: mockSupabaseResponses.tenants[0],
          role: mockSupabaseResponses.roles.tenant_admin,
        },
        is_platform_admin: false,
      };

      const mockContext: TenantContext = {
        tenant: mockSupabaseResponses.tenants[0],
        user_role: mockSupabaseResponses.roles.tenant_admin,
        permissions: mockSupabaseResponses.permissions.slice(0, 4),
        can: vi.fn((resource, action) => true),
      };

      (authService.getCurrentSession as any).mockResolvedValue(mockSession);
      (authService.getTenantContext as any).mockResolvedValue(mockContext);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session).toEqual(mockSession);
      expect(result.current.tenantContext).toEqual(mockContext);
      expect(result.current.isPlatformAdmin).toBe(false);
      expect(result.current.isTenantAdmin).toBe(true);
    });

    it('should handle session loading errors', async () => {
      const error = new Error('Session loading failed');
      (authService.getCurrentSession as any).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.session).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error loading session:', error);
    });

    it('should throw error when useAuth is used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within AuthProvider');

      console.error = originalError;
    });
  });

  describe('Tenant Switching', () => {
    it('should switch tenant successfully', async () => {
      const mockSession: AuthSession = {
        user_id: 'user-123',
        email: 'test@example.com',
        tenants: [
          {
            user_id: 'user-123',
            tenant_id: 'tenant-1',
            role_id: 'role-1',
            is_primary: true,
            status: 'active',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            tenant: mockSupabaseResponses.tenants[0],
            role: mockSupabaseResponses.roles.tenant_admin,
          },
          {
            user_id: 'user-123',
            tenant_id: 'tenant-2',
            role_id: 'role-2',
            is_primary: false,
            status: 'active',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            tenant: mockSupabaseResponses.tenants[1],
            role: mockSupabaseResponses.roles.teacher,
          },
        ],
        current_tenant: undefined,
        is_platform_admin: false,
      };

      (authService.getCurrentSession as any).mockResolvedValue(mockSession);
      (authService.getTenantContext as any).mockResolvedValue(null);
      (authService.switchTenant as any).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.switchTenant('tenant-2');
      });

      expect(authService.switchTenant).toHaveBeenCalledWith('tenant-2');
      expect(authService.getCurrentSession).toHaveBeenCalledTimes(2); // Initial + after switch
    });

    it('should handle tenant switch errors', async () => {
      const mockSession: AuthSession = {
        user_id: 'user-123',
        email: 'test@example.com',
        tenants: [],
        current_tenant: undefined,
        is_platform_admin: false,
      };

      const switchError = new Error('Unauthorized tenant access');
      (authService.getCurrentSession as any).mockResolvedValue(mockSession);
      (authService.switchTenant as any).mockRejectedValue(switchError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.switchTenant('unauthorized-tenant');
        })
      ).rejects.toThrow('Unauthorized tenant access');

      expect(result.current.error).toEqual(switchError);
    });
  });

  describe('Permission Checking', () => {
    it('should check permissions correctly for platform admin', async () => {
      const mockSession: AuthSession = {
        user_id: 'user-123',
        email: 'admin@example.com',
        tenants: [],
        current_tenant: undefined,
        is_platform_admin: true,
      };

      (authService.getCurrentSession as any).mockResolvedValue(mockSession);
      (authService.getTenantContext as any).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const hasPermission = result.current.hasPermission('users', 'delete');
      expect(hasPermission).toBe(true); // Platform admin has all permissions
    });

    it('should check permissions through tenant context', async () => {
      const mockContext: TenantContext = {
        tenant: mockSupabaseResponses.tenants[0],
        user_role: mockSupabaseResponses.roles.teacher,
        permissions: mockSupabaseResponses.permissions.slice(0, 4),
        can: vi.fn((resource, action) => {
          return resource === 'users' && action === 'read';
        }),
      };

      const mockSession: AuthSession = {
        user_id: 'user-123',
        email: 'teacher@example.com',
        tenants: [],
        current_tenant: undefined,
        is_platform_admin: false,
      };

      (authService.getCurrentSession as any).mockResolvedValue(mockSession);
      (authService.getTenantContext as any).mockResolvedValue(mockContext);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission('users', 'read')).toBe(true);
      expect(result.current.hasPermission('users', 'delete')).toBe(false);
    });
  });

  describe('usePermission Hook', () => {
    it('should return permission status', async () => {
      const mockContext: TenantContext = {
        tenant: mockSupabaseResponses.tenants[0],
        user_role: mockSupabaseResponses.roles.teacher,
        permissions: [],
        can: vi.fn((resource, action) => resource === 'domains' && action === 'read'),
      };

      const mockSession: AuthSession = {
        user_id: 'user-123',
        email: 'test@example.com',
        tenants: [],
        current_tenant: undefined,
        is_platform_admin: false,
      };

      (authService.getCurrentSession as any).mockResolvedValue(mockSession);
      (authService.getTenantContext as any).mockResolvedValue(mockContext);

      const { result } = renderHook(
        () => usePermission('domains', 'read'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });
  });

  describe('Role-based Hooks', () => {
    const setupRoleTest = async (roleName: string, isPlatformAdmin = false) => {
      const mockSession: AuthSession = {
        user_id: 'user-123',
        email: 'test@example.com',
        tenants: [],
        current_tenant: roleName ? {
          user_id: 'user-123',
          tenant_id: 'tenant-1',
          role_id: 'role-1',
          is_primary: true,
          status: 'active',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          tenant: mockSupabaseResponses.tenants[0],
          role: { ...mockSupabaseResponses.roles.tenant_admin, name: roleName },
        } : undefined,
        is_platform_admin: isPlatformAdmin,
      };

      (authService.getCurrentSession as any).mockResolvedValue(mockSession);
      (authService.getTenantContext as any).mockResolvedValue(null);
    };

    it('should identify platform admin', async () => {
      await setupRoleTest('', true);

      const { result } = renderHook(() => useIsPlatformAdmin(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should identify tenant admin', async () => {
      await setupRoleTest('tenant_admin');

      const { result } = renderHook(() => useIsTenantAdmin(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should identify teacher', async () => {
      await setupRoleTest('teacher');

      const { result } = renderHook(() => useIsTeacher(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should identify student', async () => {
      await setupRoleTest('student');

      const { result } = renderHook(() => useIsStudent(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });
  });

  describe('useCurrentTenant Hook', () => {
    it('should return current tenant', async () => {
      const mockSession: AuthSession = {
        user_id: 'user-123',
        email: 'test@example.com',
        tenants: [],
        current_tenant: {
          user_id: 'user-123',
          tenant_id: 'tenant-1',
          role_id: 'role-1',
          is_primary: true,
          status: 'active',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          tenant: mockSupabaseResponses.tenants[0],
          role: mockSupabaseResponses.roles.tenant_admin,
        },
        is_platform_admin: false,
      };

      (authService.getCurrentSession as any).mockResolvedValue(mockSession);
      (authService.getTenantContext as any).mockResolvedValue(null);

      const { result } = renderHook(() => useCurrentTenant(), { wrapper });

      await waitFor(() => {
        expect(result.current).toEqual(mockSupabaseResponses.tenants[0]);
      });
    });

    it('should return null when no tenant selected', async () => {
      const mockSession: AuthSession = {
        user_id: 'user-123',
        email: 'test@example.com',
        tenants: [],
        current_tenant: undefined,
        is_platform_admin: false,
      };

      (authService.getCurrentSession as any).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useCurrentTenant(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeNull();
      });
    });
  });

  describe('useTenantSwitcher Hook', () => {
    it('should provide tenant switching functionality', async () => {
      const mockSession: AuthSession = {
        user_id: 'user-123',
        email: 'test@example.com',
        tenants: [
          {
            user_id: 'user-123',
            tenant_id: 'tenant-1',
            role_id: 'role-1',
            is_primary: true,
            status: 'active',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            tenant: mockSupabaseResponses.tenants[0],
            role: mockSupabaseResponses.roles.tenant_admin,
          },
          {
            user_id: 'user-123',
            tenant_id: 'tenant-2',
            role_id: 'role-2',
            is_primary: false,
            status: 'active',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            tenant: mockSupabaseResponses.tenants[1],
            role: mockSupabaseResponses.roles.teacher,
          },
        ],
        current_tenant: undefined,
        is_platform_admin: false,
      };

      (authService.getCurrentSession as any).mockResolvedValue(mockSession);
      (authService.getTenantContext as any).mockResolvedValue(null);
      (authService.switchTenant as any).mockResolvedValue(true);

      const { result } = renderHook(() => useTenantSwitcher(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tenants).toHaveLength(2);
      expect(result.current.currentTenant).toBeUndefined();

      await act(async () => {
        await result.current.switchTenant('tenant-2');
      });

      expect(authService.switchTenant).toHaveBeenCalledWith('tenant-2');
    });

    it('should show loading state during switch', async () => {
      const mockSession: AuthSession = {
        user_id: 'user-123',
        email: 'test@example.com',
        tenants: [{
          user_id: 'user-123',
          tenant_id: 'tenant-1',
          role_id: 'role-1',
          is_primary: true,
          status: 'active',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          tenant: mockSupabaseResponses.tenants[0],
          role: mockSupabaseResponses.roles.tenant_admin,
        }],
        current_tenant: undefined,
        is_platform_admin: false,
      };

      (authService.getCurrentSession as any).mockResolvedValue(mockSession);
      (authService.switchTenant as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(true), 100))
      );

      const { result } = renderHook(() => useTenantSwitcher(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let switchPromise: Promise<void>;
      act(() => {
        switchPromise = result.current.switchTenant('tenant-1');
      });

      // Should be loading during switch
      expect(result.current.loading).toBe(true);

      await act(async () => {
        await switchPromise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('useAuthGuard Hook', () => {
    it('should authorize authenticated user', async () => {
      const mockSession: AuthSession = {
        user_id: 'user-123',
        email: 'test@example.com',
        tenants: [],
        current_tenant: undefined,
        is_platform_admin: false,
      };

      (authService.getCurrentSession as any).mockResolvedValue(mockSession);
      (authService.getTenantContext as any).mockResolvedValue(null);

      const { result } = renderHook(() => useAuthGuard(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.authorized).toBe(true);
      expect(result.current.session).toEqual(mockSession);
    });

    it('should deny unauthenticated user', async () => {
      (authService.getCurrentSession as any).mockResolvedValue(null);

      const { result } = renderHook(() => useAuthGuard(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.authorized).toBe(false);
      expect(result.current.session).toBeNull();
    });

    it('should check required role', async () => {
      const mockSession: AuthSession = {
        user_id: 'user-123',
        email: 'test@example.com',
        tenants: [],
        current_tenant: {
          user_id: 'user-123',
          tenant_id: 'tenant-1',
          role_id: 'role-1',
          is_primary: true,
          status: 'active',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          tenant: mockSupabaseResponses.tenants[0],
          role: { ...mockSupabaseResponses.roles.teacher, name: 'teacher' },
        },
        is_platform_admin: false,
      };

      (authService.getCurrentSession as any).mockResolvedValue(mockSession);
      (authService.getTenantContext as any).mockResolvedValue(null);

      const { result: teacherResult } = renderHook(
        () => useAuthGuard({ requiredRole: 'teacher' }),
        { wrapper }
      );

      const { result: adminResult } = renderHook(
        () => useAuthGuard({ requiredRole: 'tenant_admin' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(teacherResult.current.loading).toBe(false);
        expect(adminResult.current.loading).toBe(false);
      });

      expect(teacherResult.current.authorized).toBe(true);
      expect(adminResult.current.authorized).toBe(false);
    });

    it('should check required permission', async () => {
      const mockContext: TenantContext = {
        tenant: mockSupabaseResponses.tenants[0],
        user_role: mockSupabaseResponses.roles.teacher,
        permissions: [],
        can: vi.fn((resource, action) => {
          return resource === 'domains' && action === 'read';
        }),
      };

      const mockSession: AuthSession = {
        user_id: 'user-123',
        email: 'test@example.com',
        tenants: [],
        current_tenant: {
          user_id: 'user-123',
          tenant_id: 'tenant-1',
          role_id: 'role-1',
          is_primary: true,
          status: 'active',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          tenant: mockSupabaseResponses.tenants[0],
          role: mockSupabaseResponses.roles.teacher,
        },
        is_platform_admin: false,
      };

      (authService.getCurrentSession as any).mockResolvedValue(mockSession);
      (authService.getTenantContext as any).mockResolvedValue(mockContext);

      const { result: allowedResult } = renderHook(
        () => useAuthGuard({ 
          requiredPermission: { resource: 'domains', action: 'read' } 
        }),
        { wrapper }
      );

      const { result: deniedResult } = renderHook(
        () => useAuthGuard({ 
          requiredPermission: { resource: 'users', action: 'delete' } 
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(allowedResult.current.loading).toBe(false);
        expect(deniedResult.current.loading).toBe(false);
      });

      expect(allowedResult.current.authorized).toBe(true);
      expect(deniedResult.current.authorized).toBe(false);
    });

    it('should redirect when not authorized', async () => {
      (authService.getCurrentSession as any).mockResolvedValue(null);

      const mockHref = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { 
          href: 'http://localhost:3000',
          set href(value: string) {
            mockHref(value);
          }
        },
        writable: true,
      });

      const { result } = renderHook(
        () => useAuthGuard({ redirectTo: '/login' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.authorized).toBe(false);
      expect(mockHref).toHaveBeenCalledWith('/login');
    });

    it('should allow platform admin to bypass role checks', async () => {
      const mockSession: AuthSession = {
        user_id: 'user-123',
        email: 'admin@example.com',
        tenants: [],
        current_tenant: undefined,
        is_platform_admin: true,
      };

      (authService.getCurrentSession as any).mockResolvedValue(mockSession);
      (authService.getTenantContext as any).mockResolvedValue(null);

      const { result } = renderHook(
        () => useAuthGuard({ requiredRole: 'tenant_admin' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.authorized).toBe(true);
    });
  });

  describe('useAuditLog Hook', () => {
    it('should log audit actions', async () => {
      (authService.createAuditLog as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuditLog());

      await act(async () => {
        await result.current.logAction(
          'user.update',
          'users',
          'user-456',
          { role: 'teacher' }
        );
      });

      expect(authService.createAuditLog).toHaveBeenCalledWith(
        'user.update',
        'users',
        'user-456',
        { role: 'teacher' }
      );
    });

    it('should handle audit log errors gracefully', async () => {
      (authService.createAuditLog as any).mockRejectedValue(new Error('Audit failed'));

      const { result } = renderHook(() => useAuditLog());

      // Should not throw
      await act(async () => {
        await result.current.logAction('test.action', 'test');
      });

      expect(console.error).toHaveBeenCalledWith(
        'Failed to create audit log:',
        expect.any(Error)
      );
    });
  });

  describe('Edge Cases and Concurrent Operations', () => {
    it('should handle rapid tenant switches', async () => {
      const mockSession: AuthSession = {
        user_id: 'user-123',
        email: 'test@example.com',
        tenants: [
          {
            user_id: 'user-123',
            tenant_id: 'tenant-1',
            role_id: 'role-1',
            is_primary: true,
            status: 'active',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            tenant: mockSupabaseResponses.tenants[0],
            role: mockSupabaseResponses.roles.tenant_admin,
          },
          {
            user_id: 'user-123',
            tenant_id: 'tenant-2',
            role_id: 'role-2',
            is_primary: false,
            status: 'active',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            tenant: mockSupabaseResponses.tenants[1],
            role: mockSupabaseResponses.roles.teacher,
          },
        ],
        current_tenant: undefined,
        is_platform_admin: false,
      };

      (authService.getCurrentSession as any).mockResolvedValue(mockSession);
      (authService.switchTenant as any).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Fire multiple switches rapidly
      await act(async () => {
        const promises = [
          result.current.switchTenant('tenant-1'),
          result.current.switchTenant('tenant-2'),
          result.current.switchTenant('tenant-1'),
        ];
        await Promise.all(promises);
      });

      expect(authService.switchTenant).toHaveBeenCalledTimes(3);
    });

    it('should handle session refresh', async () => {
      const mockSession1: AuthSession = {
        user_id: 'user-123',
        email: 'test@example.com',
        tenants: [],
        current_tenant: undefined,
        is_platform_admin: false,
      };

      const mockSession2: AuthSession = {
        ...mockSession1,
        is_platform_admin: true,
      };

      (authService.getCurrentSession as any)
        .mockResolvedValueOnce(mockSession1)
        .mockResolvedValueOnce(mockSession2);
      (authService.getTenantContext as any).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isPlatformAdmin).toBe(false);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.isPlatformAdmin).toBe(true);
    });

    it('should maintain state consistency during errors', async () => {
      const mockSession: AuthSession = {
        user_id: 'user-123',
        email: 'test@example.com',
        tenants: [],
        current_tenant: undefined,
        is_platform_admin: false,
      };

      (authService.getCurrentSession as any).mockResolvedValue(mockSession);
      (authService.getTenantContext as any).mockResolvedValue(null);
      (authService.switchTenant as any).mockRejectedValue(new Error('Switch failed'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialSession = result.current.session;

      try {
        await act(async () => {
          await result.current.switchTenant('invalid-tenant');
        });
      } catch (e) {
        // Expected error
      }

      // Session should remain unchanged after error
      expect(result.current.session).toBe(initialSession);
      expect(result.current.loading).toBe(false);
    });
  });
});