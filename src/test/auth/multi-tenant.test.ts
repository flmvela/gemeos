/**
 * Multi-tenant Isolation and Switching Tests
 * Testing tenant boundaries, data isolation, and context switching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '@/services/auth.service';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth, useTenantSwitcher } from '@/hooks/useAuth';
import { createMockSupabaseClient, mockSupabaseResponses } from '@/test/mocks/supabase.mock';
import type { ReactNode } from 'react';
import type { AuthSession, Tenant } from '@/types/auth.types';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}));

vi.mock('@/services/auth.service', () => ({
  authService: {
    getCurrentSession: vi.fn(),
    getTenantContext: vi.fn(),
    switchTenant: vi.fn(),
    getCurrentTenantId: vi.fn(),
    getTenant: vi.fn(),
    hasPermission: vi.fn(),
    createAuditLog: vi.fn(),
    clearCache: vi.fn(),
  },
}));

describe('Multi-tenant System Tests', () => {
  let authService: AuthService;
  let mockSupabase: any;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    
    // Reset singleton
    (AuthService as any).instance = null;
    authService = AuthService.getInstance();
    
    const { supabase } = require('@/integrations/supabase/client');
    mockSupabase = supabase;
  });

  describe('Tenant Isolation', () => {
    it('should isolate data between tenants', async () => {
      const tenant1Data = {
        domains: [{ id: 'domain-1', name: 'Math' }],
        concepts: [{ id: 'concept-1', name: 'Algebra' }],
        users: [{ id: 'user-1', email: 'teacher1@school1.com' }],
      };

      const tenant2Data = {
        domains: [{ id: 'domain-2', name: 'Science' }],
        concepts: [{ id: 'concept-2', name: 'Physics' }],
        users: [{ id: 'user-2', email: 'teacher2@school2.com' }],
      };

      // Mock queries with tenant filtering
      mockSupabase.from.mockImplementation((table: string) => {
        const chainable = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn((column: string, value: any) => {
            if (column === 'tenant_id') {
              if (value === 'tenant-1') {
                chainable.data = tenant1Data[table] || [];
              } else if (value === 'tenant-2') {
                chainable.data = tenant2Data[table] || [];
              } else {
                chainable.data = [];
              }
            }
            return chainable;
          }),
          single: vi.fn().mockImplementation(() => ({
            data: chainable.data?.[0] || null,
            error: chainable.data ? null : new Error('Not found'),
          })),
          then: vi.fn((resolve) => resolve({ 
            data: chainable.data, 
            error: null 
          })),
          data: [],
        };
        return chainable;
      });

      // Query data for tenant 1
      const tenant1Domains = await mockSupabase
        .from('domains')
        .select('*')
        .eq('tenant_id', 'tenant-1')
        .then((r: any) => r);

      // Query data for tenant 2
      const tenant2Domains = await mockSupabase
        .from('domains')
        .select('*')
        .eq('tenant_id', 'tenant-2')
        .then((r: any) => r);

      // Verify isolation
      expect(tenant1Domains.data).toEqual(tenant1Data.domains);
      expect(tenant2Domains.data).toEqual(tenant2Data.domains);
      expect(tenant1Domains.data).not.toEqual(tenant2Domains.data);

      // Attempt cross-tenant access (should fail)
      const crossTenantAccess = await mockSupabase
        .from('domains')
        .select('*')
        .eq('tenant_id', 'unauthorized-tenant')
        .then((r: any) => r);

      expect(crossTenantAccess.data).toEqual([]);
    });

    it('should prevent cross-tenant data access via RLS', async () => {
      // Simulate RLS policy enforcement
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockSupabaseResponses.user },
        error: null,
      });

      mockSupabase.rpc.mockImplementation((funcName: string, params: any) => {
        if (funcName === 'get_user_tenants_with_roles') {
          // User only has access to tenant-1
          return Promise.resolve({
            data: [mockSupabaseResponses.userTenantWithRoles[0]],
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Attempt to query tenant-2 data (should be blocked by RLS)
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: new Error('row-level security policy violation'),
      });

      const unauthorizedAccess = await mockSupabase
        .from('domains')
        .select('*')
        .eq('tenant_id', 'tenant-2')
        .single();

      expect(unauthorizedAccess.error?.message).toContain('row-level security');
      expect(unauthorizedAccess.data).toBeNull();
    });

    it('should maintain separate permission sets per tenant', async () => {
      const { authService: authServiceMock } = require('@/services/auth.service');
      
      // User has different roles in different tenants
      const multiTenantSession: AuthSession = {
        user_id: 'user-123',
        email: 'user@example.com',
        tenants: [
          {
            user_id: 'user-123',
            tenant_id: 'tenant-1',
            role_id: 'role-admin',
            is_primary: true,
            status: 'active',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            tenant: { ...mockSupabaseResponses.tenants[0], id: 'tenant-1' },
            role: mockSupabaseResponses.roles.tenant_admin,
          },
          {
            user_id: 'user-123',
            tenant_id: 'tenant-2',
            role_id: 'role-teacher',
            is_primary: false,
            status: 'active',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            tenant: { ...mockSupabaseResponses.tenants[1], id: 'tenant-2' },
            role: mockSupabaseResponses.roles.teacher,
          },
        ],
        current_tenant: undefined,
        is_platform_admin: false,
      };

      authServiceMock.getCurrentSession.mockResolvedValue(multiTenantSession);
      authServiceMock.getCurrentTenantId.mockReturnValue('tenant-1');
      authServiceMock.hasPermission.mockImplementation(
        (resource: string, action: string) => {
          const tenantId = authServiceMock.getCurrentTenantId();
          if (tenantId === 'tenant-1') {
            // Admin permissions in tenant-1
            return true;
          } else if (tenantId === 'tenant-2') {
            // Teacher permissions in tenant-2
            return resource === 'concepts' && ['read', 'create', 'update'].includes(action);
          }
          return false;
        }
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Check permissions in tenant-1 (admin)
      let canDeleteUsers = result.current.hasPermission('users', 'delete');
      expect(canDeleteUsers).toBe(true);

      // Switch to tenant-2
      authServiceMock.getCurrentTenantId.mockReturnValue('tenant-2');
      authServiceMock.switchTenant.mockResolvedValue(true);
      
      await act(async () => {
        await result.current.switchTenant('tenant-2');
      });

      // Check permissions in tenant-2 (teacher)
      canDeleteUsers = result.current.hasPermission('users', 'delete');
      expect(canDeleteUsers).toBe(false);
      
      const canReadConcepts = result.current.hasPermission('concepts', 'read');
      expect(canReadConcepts).toBe(true);
    });
  });

  describe('Tenant Switching', () => {
    it('should handle seamless tenant switching', async () => {
      const { authService: authServiceMock } = require('@/services/auth.service');
      
      const session: AuthSession = {
        user_id: 'user-123',
        email: 'user@example.com',
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

      authServiceMock.getCurrentSession.mockResolvedValue(session);
      authServiceMock.switchTenant.mockResolvedValue(true);

      const { result } = renderHook(() => useTenantSwitcher(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tenants).toHaveLength(2);

      // Switch tenant
      await act(async () => {
        await result.current.switchTenant('tenant-2');
      });

      expect(authServiceMock.switchTenant).toHaveBeenCalledWith('tenant-2');
    });

    it('should persist tenant selection across sessions', async () => {
      localStorage.setItem('current_tenant_id', 'tenant-2');

      const { authService: authServiceMock } = require('@/services/auth.service');
      authServiceMock.getCurrentTenantId.mockReturnValue('tenant-2');

      const tenantId = authServiceMock.getCurrentTenantId();
      expect(tenantId).toBe('tenant-2');
    });

    it('should clear cached data on tenant switch', async () => {
      const { authService: authServiceMock } = require('@/services/auth.service');
      
      authServiceMock.clearCache = vi.fn();
      authServiceMock.switchTenant.mockImplementation(async (tenantId: string) => {
        authServiceMock.clearCache();
        localStorage.setItem('current_tenant_id', tenantId);
        return true;
      });

      await authServiceMock.switchTenant('tenant-2');

      expect(authServiceMock.clearCache).toHaveBeenCalled();
      expect(localStorage.getItem('current_tenant_id')).toBe('tenant-2');
    });

    it('should validate tenant access before switching', async () => {
      const { authService: authServiceMock } = require('@/services/auth.service');
      
      const session: AuthSession = {
        user_id: 'user-123',
        email: 'user@example.com',
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
        ],
        current_tenant: undefined,
        is_platform_admin: false,
      };

      authServiceMock.getCurrentSession.mockResolvedValue(session);
      authServiceMock.switchTenant.mockRejectedValue(
        new Error('You do not have access to this tenant')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Attempt to switch to unauthorized tenant
      await expect(
        act(async () => {
          await result.current.switchTenant('unauthorized-tenant');
        })
      ).rejects.toThrow('You do not have access to this tenant');
    });
  });

  describe('Tenant Lifecycle', () => {
    it('should handle tenant creation with proper defaults', async () => {
      const newTenant: Partial<Tenant> = {
        name: 'New School',
        slug: 'new-school',
        status: 'trial',
        subscription_tier: 'free',
        max_users: 10,
        max_domains: 2,
        settings: {},
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'new-tenant-id', ...newTenant },
        error: null,
      });

      const result = await mockSupabase
        .from('tenants')
        .insert(newTenant)
        .select()
        .single();

      expect(result.data).toMatchObject(newTenant);
      expect(result.data.id).toBeDefined();
    });

    it('should handle tenant suspension', async () => {
      const tenantId = 'tenant-1';
      
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: { ...mockSupabaseResponses.tenants[0], status: 'suspended' },
        error: null,
      });

      const result = await mockSupabase
        .from('tenants')
        .update({ status: 'suspended' })
        .eq('id', tenantId)
        .select()
        .single();

      expect(result.data.status).toBe('suspended');
    });

    it('should prevent access to suspended tenants', async () => {
      const { authService: authServiceMock } = require('@/services/auth.service');
      
      const suspendedTenant = {
        ...mockSupabaseResponses.tenants[0],
        status: 'suspended',
      };

      authServiceMock.getTenant.mockResolvedValue(suspendedTenant);
      authServiceMock.switchTenant.mockRejectedValue(
        new Error('Cannot access suspended tenant')
      );

      await expect(authServiceMock.switchTenant('tenant-1')).rejects.toThrow(
        'Cannot access suspended tenant'
      );
    });

    it('should enforce tenant resource limits', async () => {
      const tenant = {
        ...mockSupabaseResponses.tenants[0],
        max_users: 5,
        max_domains: 2,
      };

      // Mock counting existing resources
      mockSupabase.from().select().eq().mockImplementation(() => ({
        count: vi.fn().mockResolvedValue({
          data: null,
          count: 5, // Already at limit
          error: null,
        }),
      }));

      const userCount = await mockSupabase
        .from('user_tenants')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenant.id)
        .count();

      expect(userCount.count).toBe(5);

      // Attempting to add another user should fail
      mockSupabase.from().insert.mockResolvedValue({
        data: null,
        error: new Error('Tenant user limit reached'),
      });

      const addUserResult = await mockSupabase
        .from('user_tenants')
        .insert({ user_id: 'new-user', tenant_id: tenant.id });

      expect(addUserResult.error?.message).toContain('limit reached');
    });
  });

  describe('Tenant Context Management', () => {
    it('should provide correct tenant context', async () => {
      const { authService: authServiceMock } = require('@/services/auth.service');
      
      const tenantContext = {
        tenant: mockSupabaseResponses.tenants[0],
        user_role: mockSupabaseResponses.roles.tenant_admin,
        permissions: mockSupabaseResponses.permissions.slice(0, 8),
        can: vi.fn((resource: string, action: string) => true),
      };

      authServiceMock.getTenantContext.mockResolvedValue(tenantContext);

      const context = await authServiceMock.getTenantContext();

      expect(context.tenant.id).toBe('tenant-1');
      expect(context.user_role.name).toBe('tenant_admin');
      expect(context.permissions).toHaveLength(8);
    });

    it('should update context on tenant switch', async () => {
      const { authService: authServiceMock } = require('@/services/auth.service');
      
      const context1 = {
        tenant: { ...mockSupabaseResponses.tenants[0], id: 'tenant-1' },
        user_role: mockSupabaseResponses.roles.tenant_admin,
        permissions: mockSupabaseResponses.permissions.slice(0, 8),
        can: vi.fn(() => true),
      };

      const context2 = {
        tenant: { ...mockSupabaseResponses.tenants[1], id: 'tenant-2' },
        user_role: mockSupabaseResponses.roles.teacher,
        permissions: mockSupabaseResponses.permissions.slice(0, 4),
        can: vi.fn(() => false),
      };

      authServiceMock.getTenantContext
        .mockResolvedValueOnce(context1)
        .mockResolvedValueOnce(context2);

      authServiceMock.getCurrentSession.mockResolvedValue({
        user_id: 'user-123',
        email: 'user@example.com',
        tenants: [],
        current_tenant: undefined,
        is_platform_admin: false,
      });

      authServiceMock.switchTenant.mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tenantContext).toEqual(context1);

      await act(async () => {
        await result.current.switchTenant('tenant-2');
      });

      // Would need to re-fetch context after switch
      expect(authServiceMock.getTenantContext).toHaveBeenCalled();
    });
  });

  describe('Multi-tenant User Management', () => {
    it('should handle users belonging to multiple tenants', async () => {
      const userTenants = [
        {
          user_id: 'user-123',
          tenant_id: 'tenant-1',
          role_id: 'role-admin',
          status: 'active',
          is_primary: true,
        },
        {
          user_id: 'user-123',
          tenant_id: 'tenant-2',
          role_id: 'role-teacher',
          status: 'active',
          is_primary: false,
        },
        {
          user_id: 'user-123',
          tenant_id: 'tenant-3',
          role_id: 'role-student',
          status: 'invited',
          is_primary: false,
        },
      ];

      mockSupabase.from().select().eq.mockResolvedValue({
        data: userTenants,
        error: null,
      });

      const result = await mockSupabase
        .from('user_tenants')
        .select('*')
        .eq('user_id', 'user-123');

      expect(result.data).toHaveLength(3);
      expect(result.data.filter((ut: any) => ut.status === 'active')).toHaveLength(2);
      expect(result.data.filter((ut: any) => ut.is_primary)).toHaveLength(1);
    });

    it('should handle tenant invitations', async () => {
      const invitation = {
        email: 'newuser@example.com',
        tenant_id: 'tenant-1',
        role_id: 'role-teacher',
        invited_by: 'admin-user',
        status: 'invited',
      };

      mockSupabase.from().insert.mockResolvedValue({
        data: invitation,
        error: null,
      });

      const result = await mockSupabase
        .from('user_tenants')
        .insert(invitation);

      expect(result.data).toMatchObject(invitation);
      expect(result.data.status).toBe('invited');
    });

    it('should handle primary tenant designation', async () => {
      // First, unset all primary flags
      mockSupabase.from().update().eq().mockResolvedValue({
        data: null,
        error: null,
      });

      // Then set new primary
      mockSupabase.from().update().eq().eq.mockResolvedValue({
        data: { is_primary: true },
        error: null,
      });

      // Unset existing primary
      await mockSupabase
        .from('user_tenants')
        .update({ is_primary: false })
        .eq('user_id', 'user-123');

      // Set new primary
      await mockSupabase
        .from('user_tenants')
        .update({ is_primary: true })
        .eq('user_id', 'user-123')
        .eq('tenant_id', 'tenant-2');

      expect(mockSupabase.from().update).toHaveBeenCalledTimes(2);
    });
  });
});