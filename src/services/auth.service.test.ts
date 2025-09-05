/**
 * Unit Tests for Authentication Service
 * Following TDD principles - these tests verify all AuthService methods
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuthService } from './auth.service';
import { 
  createMockSupabaseClient, 
  mockSupabaseResponses,
  createConfiguredMockClient 
} from '@/test/mocks/supabase.mock';
import type { 
  AuthSession,
  SystemRole,
  CreateTenantInput,
  InviteUserInput,
  AssignRoleInput,
  PermissionResource,
  PermissionAction,
  AuthorizationError
} from '@/types/auth.types';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockSupabase: any;

  beforeEach(() => {
    // Clear singleton instance
    (AuthService as any).instance = null;
    authService = AuthService.getInstance();
    
    // Reset localStorage
    localStorage.clear();
    
    // Get mock Supabase instance
    const { supabase } = require('@/integrations/supabase/client');
    mockSupabase = supabase;
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AuthService.getInstance();
      const instance2 = AuthService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should maintain state across getInstance calls', () => {
      const instance1 = AuthService.getInstance();
      (instance1 as any).currentTenantId = 'test-tenant';
      
      const instance2 = AuthService.getInstance();
      expect((instance2 as any).currentTenantId).toBe('test-tenant');
    });
  });

  describe('Session Management', () => {
    describe('getCurrentSession', () => {
      it('should return null when no user is authenticated', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
        
        const session = await authService.getCurrentSession();
        
        expect(session).toBeNull();
        expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      });

      it('should return user session with tenant information', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ 
          data: { user: mockSupabaseResponses.user }, 
          error: null 
        });
        mockSupabase.rpc.mockResolvedValue({
          data: mockSupabaseResponses.userTenantWithRoles,
          error: null
        });

        const session = await authService.getCurrentSession();

        expect(session).not.toBeNull();
        expect(session?.user_id).toBe('test-user-123');
        expect(session?.email).toBe('test@example.com');
        expect(session?.tenants).toHaveLength(2);
        expect(session?.current_tenant?.tenant.name).toBe('Test School 1');
        expect(session?.is_platform_admin).toBe(false);
      });

      it('should identify platform admin correctly', async () => {
        const platformAdminTenants = [
          {
            ...mockSupabaseResponses.userTenantWithRoles[0],
            role_name: 'platform_admin',
            role_display_name: 'Platform Administrator',
          }
        ];

        mockSupabase.auth.getUser.mockResolvedValue({ 
          data: { user: mockSupabaseResponses.user }, 
          error: null 
        });
        mockSupabase.rpc.mockResolvedValue({
          data: platformAdminTenants,
          error: null
        });

        const session = await authService.getCurrentSession();

        expect(session?.is_platform_admin).toBe(true);
      });

      it('should handle errors gracefully', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ 
          data: { user: mockSupabaseResponses.user }, 
          error: null 
        });
        mockSupabase.rpc.mockResolvedValue({
          data: null,
          error: new Error('Database error')
        });

        const session = await authService.getCurrentSession();

        expect(session).toBeNull();
        expect(console.error).toHaveBeenCalledWith('Error fetching user tenants:', expect.any(Error));
      });

      it('should set current tenant to primary tenant', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ 
          data: { user: mockSupabaseResponses.user }, 
          error: null 
        });
        mockSupabase.rpc.mockResolvedValue({
          data: mockSupabaseResponses.userTenantWithRoles,
          error: null
        });

        const session = await authService.getCurrentSession();

        expect(session?.current_tenant?.is_primary).toBe(true);
        expect((authService as any).currentTenantId).toBe('tenant-1');
      });
    });
  });

  describe('Tenant Switching', () => {
    describe('switchTenant', () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({ 
          data: { user: mockSupabaseResponses.user }, 
          error: null 
        });
        mockSupabase.rpc.mockResolvedValue({
          data: mockSupabaseResponses.userTenantWithRoles,
          error: null
        });
      });

      it('should successfully switch to an accessible tenant', async () => {
        // First get session to populate tenants
        await authService.getCurrentSession();
        
        const result = await authService.switchTenant('tenant-2');

        expect(result).toBe(true);
        expect((authService as any).currentTenantId).toBe('tenant-2');
        expect(localStorage.getItem('current_tenant_id')).toBe('tenant-2');
      });

      it('should clear permission cache on tenant switch', async () => {
        await authService.getCurrentSession();
        
        // Add something to cache
        (authService as any).cachedPermissions.set('test', []);
        expect((authService as any).cachedPermissions.size).toBe(1);

        await authService.switchTenant('tenant-2');

        expect((authService as any).cachedPermissions.size).toBe(0);
      });

      it('should throw error when switching to inaccessible tenant', async () => {
        await authService.getCurrentSession();

        await expect(authService.switchTenant('unauthorized-tenant')).rejects.toThrow(
          'You do not have access to this tenant'
        );
      });

      it('should return false when no session exists', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ 
          data: { user: null }, 
          error: null 
        });

        const result = await authService.switchTenant('tenant-1');

        expect(result).toBe(false);
      });
    });

    describe('getCurrentTenantId', () => {
      it('should return current tenant ID from instance', () => {
        (authService as any).currentTenantId = 'instance-tenant';
        
        const tenantId = authService.getCurrentTenantId();

        expect(tenantId).toBe('instance-tenant');
      });

      it('should fallback to localStorage if no instance tenant', () => {
        (authService as any).currentTenantId = null;
        localStorage.setItem('current_tenant_id', 'stored-tenant');

        const tenantId = authService.getCurrentTenantId();

        expect(tenantId).toBe('stored-tenant');
      });

      it('should return null if no tenant is set', () => {
        (authService as any).currentTenantId = null;
        localStorage.clear();

        const tenantId = authService.getCurrentTenantId();

        expect(tenantId).toBeNull();
      });
    });
  });

  describe('Tenant Management', () => {
    describe('createTenant', () => {
      it('should create a new tenant successfully', async () => {
        const newTenant: CreateTenantInput = {
          name: 'New School',
          slug: 'new-school',
          description: 'A new test school',
          subscription_tier: 'basic',
          max_users: 50,
          max_domains: 5,
        };

        const expectedTenant = { id: 'new-tenant-id', ...newTenant };
        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: expectedTenant,
          error: null,
        });

        const result = await authService.createTenant(newTenant);

        expect(result).toEqual(expectedTenant);
        expect(mockSupabase.from).toHaveBeenCalledWith('tenants');
        expect(mockSupabase.from().insert).toHaveBeenCalledWith(newTenant);
      });

      it('should throw error on creation failure', async () => {
        const newTenant: CreateTenantInput = {
          name: 'New School',
          slug: 'new-school',
        };

        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: null,
          error: new Error('Duplicate slug'),
        });

        await expect(authService.createTenant(newTenant)).rejects.toThrow('Duplicate slug');
      });
    });

    describe('getTenant', () => {
      it('should retrieve tenant by ID', async () => {
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: mockSupabaseResponses.tenants[0],
          error: null,
        });

        const tenant = await authService.getTenant('tenant-1');

        expect(tenant).toEqual(mockSupabaseResponses.tenants[0]);
        expect(mockSupabase.from).toHaveBeenCalledWith('tenants');
        expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', 'tenant-1');
      });

      it('should return null on error', async () => {
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: null,
          error: new Error('Not found'),
        });

        const tenant = await authService.getTenant('non-existent');

        expect(tenant).toBeNull();
        expect(console.error).toHaveBeenCalled();
      });
    });

    describe('updateTenant', () => {
      it('should update tenant successfully', async () => {
        const updates = { name: 'Updated School Name' };
        const updatedTenant = { ...mockSupabaseResponses.tenants[0], ...updates };

        mockSupabase.from().update().eq().select().single.mockResolvedValue({
          data: updatedTenant,
          error: null,
        });

        const result = await authService.updateTenant('tenant-1', updates);

        expect(result).toEqual(updatedTenant);
        expect(mockSupabase.from().update).toHaveBeenCalledWith(updates);
        expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', 'tenant-1');
      });

      it('should throw error on update failure', async () => {
        mockSupabase.from().update().eq().select().single.mockResolvedValue({
          data: null,
          error: new Error('Update failed'),
        });

        await expect(authService.updateTenant('tenant-1', {})).rejects.toThrow('Update failed');
      });
    });
  });

  describe('User and Role Management', () => {
    describe('inviteUser', () => {
      it('should assign role to existing user', async () => {
        const inviteInput: InviteUserInput = {
          email: 'existing@example.com',
          tenant_id: 'tenant-1',
          role: 'teacher' as SystemRole,
        };

        // User exists
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: { user_id: 'existing-user-id' },
          error: null,
        });

        // Role lookup
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: { id: 'role-teacher' },
          error: null,
        });

        // Upsert user_tenants
        mockSupabase.from().upsert.mockResolvedValue({
          data: null,
          error: null,
        });

        await authService.inviteUser(inviteInput);

        expect(mockSupabase.from().upsert).toHaveBeenCalledWith({
          user_id: 'existing-user-id',
          tenant_id: 'tenant-1',
          role_id: 'role-teacher',
          status: 'active',
          joined_at: expect.any(String),
        });
      });

      it('should send invitation to new user', async () => {
        const inviteInput: InviteUserInput = {
          email: 'new@example.com',
          tenant_id: 'tenant-1',
          role: 'student' as SystemRole,
        };

        // User doesn't exist
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: null,
          error: new Error('Not found'),
        });

        // Auth invite
        mockSupabase.auth.admin.inviteUserByEmail.mockResolvedValue({
          data: null,
          error: null,
        });

        await authService.inviteUser(inviteInput);

        expect(mockSupabase.auth.admin.inviteUserByEmail).toHaveBeenCalledWith(
          'new@example.com',
          {
            data: {
              tenant_id: 'tenant-1',
              role: 'student',
            },
          }
        );
      });

      it('should throw error on invitation failure', async () => {
        const inviteInput: InviteUserInput = {
          email: 'new@example.com',
          tenant_id: 'tenant-1',
          role: 'teacher' as SystemRole,
        };

        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: null,
          error: new Error('Not found'),
        });

        mockSupabase.auth.admin.inviteUserByEmail.mockResolvedValue({
          data: null,
          error: new Error('Email service error'),
        });

        await expect(authService.inviteUser(inviteInput)).rejects.toThrow('Email service error');
      });
    });

    describe('assignRoleToUser', () => {
      it('should assign role successfully', async () => {
        const assignInput: AssignRoleInput = {
          user_id: 'user-123',
          tenant_id: 'tenant-1',
          role: 'teacher' as SystemRole,
        };

        // Role lookup
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: { id: 'role-teacher' },
          error: null,
        });

        // Upsert
        mockSupabase.from().upsert.mockResolvedValue({
          data: null,
          error: null,
        });

        await authService.assignRoleToUser(assignInput);

        expect(mockSupabase.from().upsert).toHaveBeenCalledWith({
          user_id: 'user-123',
          tenant_id: 'tenant-1',
          role_id: 'role-teacher',
          status: 'active',
          joined_at: expect.any(String),
        });
      });

      it('should throw error when role not found', async () => {
        const assignInput: AssignRoleInput = {
          user_id: 'user-123',
          tenant_id: 'tenant-1',
          role: 'invalid_role' as SystemRole,
        };

        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: null,
          error: new Error('Not found'),
        });

        await expect(authService.assignRoleToUser(assignInput)).rejects.toThrow(
          'Role invalid_role not found'
        );
      });
    });

    describe('removeUserFromTenant', () => {
      it('should deactivate user in tenant', async () => {
        mockSupabase.from().update().eq().eq.mockResolvedValue({
          data: null,
          error: null,
        });

        await authService.removeUserFromTenant('user-123', 'tenant-1');

        expect(mockSupabase.from).toHaveBeenCalledWith('user_tenants');
        expect(mockSupabase.from().update).toHaveBeenCalledWith({ status: 'inactive' });
      });

      it('should throw error on removal failure', async () => {
        mockSupabase.from().update().eq().eq.mockResolvedValue({
          data: null,
          error: new Error('Update failed'),
        });

        await expect(
          authService.removeUserFromTenant('user-123', 'tenant-1')
        ).rejects.toThrow('Update failed');
      });
    });
  });

  describe('Permission Management', () => {
    describe('hasPermission', () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({ 
          data: { user: mockSupabaseResponses.user }, 
          error: null 
        });
      });

      it('should return true for platform admin', async () => {
        const platformAdminTenants = [{
          ...mockSupabaseResponses.userTenantWithRoles[0],
          role_name: 'platform_admin',
        }];

        mockSupabase.rpc.mockImplementation((funcName: string) => {
          if (funcName === 'get_user_tenants_with_roles') {
            return Promise.resolve({ data: platformAdminTenants, error: null });
          }
          return Promise.resolve({ data: true, error: null });
        });

        const hasPermission = await authService.hasPermission('users', 'delete');

        expect(hasPermission).toBe(true);
        // Should not call permission check for platform admin
        expect(mockSupabase.rpc).toHaveBeenCalledTimes(1); // Only for getting tenants
      });

      it('should check permission for regular user', async () => {
        mockSupabase.rpc.mockImplementation((funcName: string) => {
          if (funcName === 'get_user_tenants_with_roles') {
            return Promise.resolve({ data: mockSupabaseResponses.userTenantWithRoles, error: null });
          }
          if (funcName === 'user_has_permission') {
            return Promise.resolve({ data: true, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        });

        (authService as any).currentTenantId = 'tenant-1';

        const hasPermission = await authService.hasPermission('domains', 'create');

        expect(hasPermission).toBe(true);
        expect(mockSupabase.rpc).toHaveBeenCalledWith('user_has_permission', {
          p_user_id: 'test-user-123',
          p_tenant_id: 'tenant-1',
          p_resource: 'domains',
          p_action: 'create',
        });
      });

      it('should return false when user lacks permission', async () => {
        mockSupabase.rpc.mockImplementation((funcName: string) => {
          if (funcName === 'get_user_tenants_with_roles') {
            return Promise.resolve({ data: mockSupabaseResponses.userTenantWithRoles, error: null });
          }
          if (funcName === 'user_has_permission') {
            return Promise.resolve({ data: false, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        });

        (authService as any).currentTenantId = 'tenant-1';

        const hasPermission = await authService.hasPermission('tenants', 'delete');

        expect(hasPermission).toBe(false);
      });

      it('should return false when no session exists', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ 
          data: { user: null }, 
          error: null 
        });

        const hasPermission = await authService.hasPermission('users', 'create');

        expect(hasPermission).toBe(false);
      });

      it('should return false when no tenant is selected', async () => {
        mockSupabase.rpc.mockResolvedValue({
          data: mockSupabaseResponses.userTenantWithRoles,
          error: null
        });

        (authService as any).currentTenantId = null;
        localStorage.clear();

        const hasPermission = await authService.hasPermission('users', 'create');

        expect(hasPermission).toBe(false);
      });

      it('should handle RPC errors gracefully', async () => {
        mockSupabase.rpc.mockImplementation((funcName: string) => {
          if (funcName === 'get_user_tenants_with_roles') {
            return Promise.resolve({ data: mockSupabaseResponses.userTenantWithRoles, error: null });
          }
          if (funcName === 'user_has_permission') {
            return Promise.resolve({ data: null, error: new Error('RPC failed') });
          }
          return Promise.resolve({ data: null, error: null });
        });

        (authService as any).currentTenantId = 'tenant-1';

        const hasPermission = await authService.hasPermission('users', 'create');

        expect(hasPermission).toBe(false);
        expect(console.error).toHaveBeenCalledWith('Error checking permission:', expect.any(Error));
      });
    });

    describe('getUserPermissions', () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({ 
          data: { user: mockSupabaseResponses.user }, 
          error: null 
        });
        mockSupabase.rpc.mockResolvedValue({
          data: mockSupabaseResponses.userTenantWithRoles,
          error: null
        });
      });

      it('should fetch and cache user permissions', async () => {
        const permissionData = [
          { permissions: mockSupabaseResponses.permissions[0] },
          { permissions: mockSupabaseResponses.permissions[1] },
        ];

        mockSupabase.from().select().eq().or.mockResolvedValue({
          data: permissionData,
          error: null,
        });

        (authService as any).currentTenantId = 'tenant-1';

        const permissions = await authService.getUserPermissions();

        expect(permissions).toHaveLength(2);
        expect(permissions[0].resource).toBe('users');
        
        // Check cache
        const cacheKey = 'test-user-123:tenant-1';
        expect((authService as any).cachedPermissions.has(cacheKey)).toBe(true);
      });

      it('should return cached permissions on subsequent calls', async () => {
        const cachedPerms = [mockSupabaseResponses.permissions[0]];
        const cacheKey = 'test-user-123:tenant-1';
        
        (authService as any).currentTenantId = 'tenant-1';
        (authService as any).cachedPermissions.set(cacheKey, cachedPerms);

        const permissions = await authService.getUserPermissions();

        expect(permissions).toEqual(cachedPerms);
        // Should not make database call
        expect(mockSupabase.from().select).not.toHaveBeenCalled();
      });

      it('should return empty array when no session', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ 
          data: { user: null }, 
          error: null 
        });

        const permissions = await authService.getUserPermissions();

        expect(permissions).toEqual([]);
      });

      it('should return empty array on error', async () => {
        mockSupabase.from().select().eq().or.mockResolvedValue({
          data: null,
          error: new Error('Query failed'),
        });

        (authService as any).currentTenantId = 'tenant-1';

        const permissions = await authService.getUserPermissions();

        expect(permissions).toEqual([]);
        expect(console.error).toHaveBeenCalled();
      });
    });

    describe('getTenantContext', () => {
      it('should create tenant context with permissions', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ 
          data: { user: mockSupabaseResponses.user }, 
          error: null 
        });
        mockSupabase.rpc.mockResolvedValue({
          data: mockSupabaseResponses.userTenantWithRoles,
          error: null
        });

        const permissionData = [
          { permissions: mockSupabaseResponses.permissions[0] },
          { permissions: mockSupabaseResponses.permissions[1] },
        ];

        mockSupabase.from().select().eq().or.mockResolvedValue({
          data: permissionData,
          error: null,
        });

        (authService as any).currentTenantId = 'tenant-1';

        const context = await authService.getTenantContext();

        expect(context).not.toBeNull();
        expect(context?.tenant.name).toBe('Test School 1');
        expect(context?.user_role.name).toBe('tenant_admin');
        expect(context?.permissions).toHaveLength(2);
        expect(context?.can('users', 'create')).toBe(true);
        expect(context?.can('domains', 'delete')).toBe(false);
      });

      it('should return null when no session', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ 
          data: { user: null }, 
          error: null 
        });

        const context = await authService.getTenantContext();

        expect(context).toBeNull();
      });
    });
  });

  describe('Audit Logging', () => {
    describe('createAuditLog', () => {
      it('should create audit log entry', async () => {
        (authService as any).currentTenantId = 'tenant-1';
        
        mockSupabase.rpc.mockResolvedValue({
          data: null,
          error: null,
        });

        await authService.createAuditLog(
          'user.update',
          'users',
          'user-456',
          { role: 'teacher' }
        );

        expect(mockSupabase.rpc).toHaveBeenCalledWith('create_audit_log', {
          p_tenant_id: 'tenant-1',
          p_action: 'user.update',
          p_resource_type: 'users',
          p_resource_id: 'user-456',
          p_changes: { role: 'teacher' },
        });
      });

      it('should handle audit log errors gracefully', async () => {
        (authService as any).currentTenantId = 'tenant-1';
        
        mockSupabase.rpc.mockResolvedValue({
          data: null,
          error: new Error('Audit failed'),
        });

        // Should not throw
        await authService.createAuditLog('test.action', 'test');

        expect(console.error).toHaveBeenCalledWith('Error creating audit log:', expect.any(Error));
      });
    });

    describe('getAuditLogs', () => {
      it('should fetch audit logs with filters', async () => {
        (authService as any).currentTenantId = 'tenant-1';

        mockSupabase.from().select().eq().order().limit.mockResolvedValue({
          data: mockSupabaseResponses.auditLogs,
          error: null,
        });

        const logs = await authService.getAuditLogs({
          resource_type: 'users',
          user_id: 'test-user-123',
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-12-31'),
        });

        expect(logs).toEqual(mockSupabaseResponses.auditLogs);
        expect(mockSupabase.from().eq).toHaveBeenCalledWith('tenant_id', 'tenant-1');
        expect(mockSupabase.from().eq).toHaveBeenCalledWith('resource_type', 'users');
        expect(mockSupabase.from().eq).toHaveBeenCalledWith('user_id', 'test-user-123');
        expect(mockSupabase.from().gte).toHaveBeenCalledWith('created_at', '2024-01-01T00:00:00.000Z');
        expect(mockSupabase.from().lte).toHaveBeenCalledWith('created_at', '2024-12-31T00:00:00.000Z');
      });

      it('should return empty array when no tenant', async () => {
        (authService as any).currentTenantId = null;
        localStorage.clear();

        const logs = await authService.getAuditLogs();

        expect(logs).toEqual([]);
        expect(mockSupabase.from).not.toHaveBeenCalled();
      });

      it('should handle fetch errors', async () => {
        (authService as any).currentTenantId = 'tenant-1';

        mockSupabase.from().select().eq().order().limit.mockResolvedValue({
          data: null,
          error: new Error('Query failed'),
        });

        const logs = await authService.getAuditLogs();

        expect(logs).toEqual([]);
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('Helper Methods', () => {
    describe('clearCache', () => {
      it('should clear permission cache', () => {
        (authService as any).cachedPermissions.set('key1', []);
        (authService as any).cachedPermissions.set('key2', []);

        authService.clearCache();

        expect((authService as any).cachedPermissions.size).toBe(0);
      });
    });

    describe('Role checking methods', () => {
      const setupMockSession = (roleName: string) => {
        const tenants = [{
          ...mockSupabaseResponses.userTenantWithRoles[0],
          role_name: roleName,
        }];

        mockSupabase.auth.getUser.mockResolvedValue({ 
          data: { user: mockSupabaseResponses.user }, 
          error: null 
        });
        mockSupabase.rpc.mockResolvedValue({
          data: tenants,
          error: null
        });
      };

      it('should identify platform admin', async () => {
        setupMockSession('platform_admin');

        const isAdmin = await authService.isPlatformAdmin();

        expect(isAdmin).toBe(true);
      });

      it('should identify tenant admin', async () => {
        setupMockSession('tenant_admin');

        const isAdmin = await authService.isTenantAdmin();

        expect(isAdmin).toBe(true);
      });

      it('should identify teacher', async () => {
        setupMockSession('teacher');

        const isTeacher = await authService.isTeacher();

        expect(isTeacher).toBe(true);
      });

      it('should identify student', async () => {
        setupMockSession('student');

        const isStudent = await authService.isStudent();

        expect(isStudent).toBe(true);
      });

      it('should return false when no session', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ 
          data: { user: null }, 
          error: null 
        });

        const isAdmin = await authService.isPlatformAdmin();
        const isTenantAdmin = await authService.isTenantAdmin();
        const isTeacher = await authService.isTeacher();
        const isStudent = await authService.isStudent();

        expect(isAdmin).toBe(false);
        expect(isTenantAdmin).toBe(false);
        expect(isTeacher).toBe(false);
        expect(isStudent).toBe(false);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined values gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { ...mockSupabaseResponses.user, email: null } }, 
        error: null 
      });
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null
      });

      const session = await authService.getCurrentSession();

      expect(session).not.toBeNull();
      expect(session?.email).toBe('');
      expect(session?.tenants).toEqual([]);
    });

    it('should handle malformed tenant data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: mockSupabaseResponses.user }, 
        error: null 
      });
      mockSupabase.rpc.mockResolvedValue({
        data: [{ invalid: 'data' }],
        error: null
      });

      const session = await authService.getCurrentSession();

      expect(session).not.toBeNull();
      expect(session?.tenants).toHaveLength(1);
      expect(session?.tenants[0].tenant.name).toBeUndefined();
    });

    it('should handle concurrent permission checks', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: mockSupabaseResponses.user }, 
        error: null 
      });
      mockSupabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'get_user_tenants_with_roles') {
          return Promise.resolve({ data: mockSupabaseResponses.userTenantWithRoles, error: null });
        }
        if (funcName === 'user_has_permission') {
          return new Promise(resolve => {
            setTimeout(() => resolve({ data: true, error: null }), 100);
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      (authService as any).currentTenantId = 'tenant-1';

      // Fire multiple permission checks concurrently
      const results = await Promise.all([
        authService.hasPermission('users', 'create'),
        authService.hasPermission('domains', 'read'),
        authService.hasPermission('concepts', 'update'),
      ]);

      expect(results).toEqual([true, true, true]);
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(4); // 1 for session, 3 for permissions
    });
  });
});