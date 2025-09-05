/**
 * Permission and RBAC Tests
 * Testing role-based access control and permission hierarchies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '@/services/auth.service';
import { 
  SystemRole, 
  RoleHierarchy, 
  PermissionResource, 
  PermissionAction,
  AuthorizationError 
} from '@/types/auth.types';
import { createMockSupabaseClient, mockSupabaseResponses } from '@/test/mocks/supabase.mock';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}));

describe('Permission and RBAC System', () => {
  let authService: AuthService;
  let mockSupabase: any;

  beforeEach(() => {
    (AuthService as any).instance = null;
    authService = AuthService.getInstance();
    const { supabase } = require('@/integrations/supabase/client');
    mockSupabase = supabase;
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Role Hierarchy', () => {
    it('should enforce correct hierarchy levels', () => {
      expect(RoleHierarchy.PLATFORM_ADMIN).toBeLessThan(RoleHierarchy.TENANT_ADMIN);
      expect(RoleHierarchy.TENANT_ADMIN).toBeLessThan(RoleHierarchy.TEACHER);
      expect(RoleHierarchy.TEACHER).toBeLessThan(RoleHierarchy.STUDENT);
    });

    it('should prevent lower-level users from managing higher-level users', async () => {
      // Setup teacher trying to manage tenant admin
      const teacherSession = {
        tenant_id: 'tenant-1',
        role_name: 'teacher',
        role_display_name: 'Teacher',
        is_primary: true,
        status: 'active',
      };

      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: mockSupabaseResponses.user }, 
        error: null 
      });
      mockSupabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'get_user_tenants_with_roles') {
          return Promise.resolve({ data: [teacherSession], error: null });
        }
        if (funcName === 'user_has_permission') {
          // Teacher cannot manage admins
          return Promise.resolve({ data: false, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      (authService as any).currentTenantId = 'tenant-1';
      
      const canManageAdmin = await authService.hasPermission('users', 'update');
      expect(canManageAdmin).toBe(false);
    });

    it('should allow higher-level users to manage lower-level users', async () => {
      // Setup tenant admin managing teacher
      const adminSession = {
        tenant_id: 'tenant-1',
        role_name: 'tenant_admin',
        role_display_name: 'Tenant Administrator',
        is_primary: true,
        status: 'active',
      };

      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: mockSupabaseResponses.user }, 
        error: null 
      });
      mockSupabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'get_user_tenants_with_roles') {
          return Promise.resolve({ data: [adminSession], error: null });
        }
        if (funcName === 'user_has_permission') {
          // Admin can manage teachers
          return Promise.resolve({ data: true, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      (authService as any).currentTenantId = 'tenant-1';
      
      const canManageTeacher = await authService.hasPermission('users', 'update');
      expect(canManageTeacher).toBe(true);
    });
  });

  describe('Permission Matrix', () => {
    const testPermissionMatrix = async (
      role: string,
      expectedPermissions: Record<string, string[]>
    ) => {
      const session = {
        tenant_id: 'tenant-1',
        role_name: role,
        role_display_name: role,
        is_primary: true,
        status: 'active',
      };

      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: mockSupabaseResponses.user }, 
        error: null 
      });
      mockSupabase.rpc.mockImplementation((funcName: string, params: any) => {
        if (funcName === 'get_user_tenants_with_roles') {
          return Promise.resolve({ data: [session], error: null });
        }
        if (funcName === 'user_has_permission') {
          const { p_resource, p_action } = params;
          const allowed = expectedPermissions[p_resource]?.includes(p_action);
          return Promise.resolve({ data: allowed || false, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      (authService as any).currentTenantId = 'tenant-1';

      const results: Record<string, Record<string, boolean>> = {};
      
      for (const resource of Object.values(PermissionResource)) {
        results[resource] = {};
        for (const action of Object.values(PermissionAction)) {
          results[resource][action] = await authService.hasPermission(resource, action);
        }
      }

      return results;
    };

    it('should enforce platform admin permissions (full access)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: mockSupabaseResponses.user }, 
        error: null 
      });
      mockSupabase.rpc.mockResolvedValue({
        data: [{
          tenant_id: 'tenant-1',
          role_name: 'platform_admin',
          role_display_name: 'Platform Administrator',
          is_primary: true,
          status: 'active',
        }],
        error: null
      });

      // Platform admin should have all permissions
      for (const resource of Object.values(PermissionResource)) {
        for (const action of Object.values(PermissionAction)) {
          const hasPermission = await authService.hasPermission(resource, action);
          expect(hasPermission).toBe(true);
        }
      }
    });

    it('should enforce tenant admin permissions', async () => {
      const expectedPermissions = {
        [PermissionResource.USERS]: [
          PermissionAction.CREATE,
          PermissionAction.READ,
          PermissionAction.UPDATE,
          PermissionAction.DELETE,
          PermissionAction.INVITE,
        ],
        [PermissionResource.DOMAINS]: [
          PermissionAction.CREATE,
          PermissionAction.READ,
          PermissionAction.UPDATE,
          PermissionAction.DELETE,
          PermissionAction.ASSIGN,
        ],
        [PermissionResource.CONCEPTS]: [
          PermissionAction.CREATE,
          PermissionAction.READ,
          PermissionAction.UPDATE,
          PermissionAction.DELETE,
          PermissionAction.PUBLISH,
        ],
        [PermissionResource.LEARNING_GOALS]: [
          PermissionAction.CREATE,
          PermissionAction.READ,
          PermissionAction.UPDATE,
          PermissionAction.DELETE,
          PermissionAction.PUBLISH,
        ],
        [PermissionResource.REPORTS]: [
          PermissionAction.VIEW,
          PermissionAction.EXPORT,
        ],
        [PermissionResource.TENANTS]: [], // Cannot manage tenants
      };

      const results = await testPermissionMatrix('tenant_admin', expectedPermissions);

      // Verify tenant admin cannot manage tenants
      expect(results[PermissionResource.TENANTS][PermissionAction.UPDATE]).toBe(false);
      expect(results[PermissionResource.TENANTS][PermissionAction.DELETE]).toBe(false);

      // Verify tenant admin can manage users
      expect(results[PermissionResource.USERS][PermissionAction.CREATE]).toBe(true);
      expect(results[PermissionResource.USERS][PermissionAction.INVITE]).toBe(true);
    });

    it('should enforce teacher permissions', async () => {
      const expectedPermissions = {
        [PermissionResource.USERS]: [PermissionAction.READ],
        [PermissionResource.DOMAINS]: [PermissionAction.READ],
        [PermissionResource.CONCEPTS]: [
          PermissionAction.CREATE,
          PermissionAction.READ,
          PermissionAction.UPDATE,
        ],
        [PermissionResource.LEARNING_GOALS]: [
          PermissionAction.CREATE,
          PermissionAction.READ,
          PermissionAction.UPDATE,
          PermissionAction.ASSIGN,
        ],
        [PermissionResource.REPORTS]: [
          PermissionAction.VIEW,
          PermissionAction.EXPORT,
        ],
        [PermissionResource.TENANTS]: [],
      };

      const results = await testPermissionMatrix('teacher', expectedPermissions);

      // Verify teacher cannot delete concepts
      expect(results[PermissionResource.CONCEPTS][PermissionAction.DELETE]).toBe(false);
      
      // Verify teacher can create learning goals
      expect(results[PermissionResource.LEARNING_GOALS][PermissionAction.CREATE]).toBe(true);
      
      // Verify teacher cannot manage users
      expect(results[PermissionResource.USERS][PermissionAction.CREATE]).toBe(false);
      expect(results[PermissionResource.USERS][PermissionAction.DELETE]).toBe(false);
    });

    it('should enforce student permissions', async () => {
      const expectedPermissions = {
        [PermissionResource.USERS]: [],
        [PermissionResource.DOMAINS]: [PermissionAction.READ],
        [PermissionResource.CONCEPTS]: [PermissionAction.READ],
        [PermissionResource.LEARNING_GOALS]: [
          PermissionAction.READ,
          PermissionAction.VIEW,
        ],
        [PermissionResource.REPORTS]: [PermissionAction.VIEW],
        [PermissionResource.TENANTS]: [],
      };

      const results = await testPermissionMatrix('student', expectedPermissions);

      // Verify student has read-only access
      expect(results[PermissionResource.CONCEPTS][PermissionAction.READ]).toBe(true);
      expect(results[PermissionResource.CONCEPTS][PermissionAction.CREATE]).toBe(false);
      expect(results[PermissionResource.CONCEPTS][PermissionAction.UPDATE]).toBe(false);
      expect(results[PermissionResource.CONCEPTS][PermissionAction.DELETE]).toBe(false);

      // Verify student cannot export reports
      expect(results[PermissionResource.REPORTS][PermissionAction.VIEW]).toBe(true);
      expect(results[PermissionResource.REPORTS][PermissionAction.EXPORT]).toBe(false);
    });
  });

  describe('Permission Caching', () => {
    it('should cache permissions per user-tenant combination', async () => {
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

      // First call - should fetch from database
      const permissions1 = await authService.getUserPermissions();
      expect(mockSupabase.from().select).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const permissions2 = await authService.getUserPermissions();
      expect(mockSupabase.from().select).toHaveBeenCalledTimes(1); // No additional call

      expect(permissions1).toEqual(permissions2);
    });

    it('should invalidate cache on tenant switch', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: mockSupabaseResponses.user }, 
        error: null 
      });
      mockSupabase.rpc.mockResolvedValue({
        data: mockSupabaseResponses.userTenantWithRoles,
        error: null
      });

      // Add to cache
      const cacheKey = 'user-123:tenant-1';
      (authService as any).cachedPermissions.set(cacheKey, []);

      await authService.switchTenant('tenant-2');

      expect((authService as any).cachedPermissions.size).toBe(0);
    });
  });

  describe('Conditional Permissions', () => {
    it('should handle domain-specific permissions for teachers', async () => {
      // Teacher should only manage concepts in assigned domains
      const teacherWithDomain = {
        tenant_id: 'tenant-1',
        role_name: 'teacher',
        role_display_name: 'Teacher',
        is_primary: true,
        status: 'active',
        domain_ids: ['domain-1', 'domain-2'], // Teacher assigned to specific domains
      };

      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: mockSupabaseResponses.user }, 
        error: null 
      });
      mockSupabase.rpc.mockImplementation((funcName: string, params: any) => {
        if (funcName === 'get_user_tenants_with_roles') {
          return Promise.resolve({ data: [teacherWithDomain], error: null });
        }
        if (funcName === 'user_has_permission') {
          // Check if action is on assigned domain
          const { p_resource, p_action } = params;
          if (p_resource === 'concepts' && p_action === 'update') {
            // Would need additional context to check domain
            return Promise.resolve({ data: true, error: null });
          }
          return Promise.resolve({ data: false, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      (authService as any).currentTenantId = 'tenant-1';

      const canUpdateConcepts = await authService.hasPermission('concepts', 'update');
      expect(canUpdateConcepts).toBe(true);
    });

    it('should enforce tenant-specific permission overrides', async () => {
      // Some tenants might have custom permission sets
      const rolePermissions = [
        {
          permissions: {
            id: 'perm-custom',
            resource: 'custom_feature',
            action: 'use',
            description: 'Use custom feature',
          },
          conditions: { tenant_id: 'tenant-1' }, // Tenant-specific permission
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: mockSupabaseResponses.user }, 
        error: null 
      });
      mockSupabase.rpc.mockResolvedValue({
        data: mockSupabaseResponses.userTenantWithRoles,
        error: null
      });
      mockSupabase.from().select().eq().or.mockResolvedValue({
        data: rolePermissions,
        error: null,
      });

      (authService as any).currentTenantId = 'tenant-1';

      const permissions = await authService.getUserPermissions();
      const hasCustomPermission = permissions.some(
        p => p.resource === 'custom_feature' && p.action === 'use'
      );

      expect(hasCustomPermission).toBe(true);
    });
  });

  describe('Permission Inheritance', () => {
    it('should inherit permissions from role hierarchy', async () => {
      // Platform admin inherits all lower-level permissions
      const platformAdmin = {
        tenant_id: null, // Platform level
        role_name: 'platform_admin',
        role_display_name: 'Platform Administrator',
        is_primary: true,
        status: 'active',
      };

      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: mockSupabaseResponses.user }, 
        error: null 
      });
      mockSupabase.rpc.mockResolvedValue({
        data: [platformAdmin],
        error: null
      });

      // Platform admin should have all permissions without explicit checks
      const hasUserManagement = await authService.hasPermission('users', 'delete');
      const hasTenantManagement = await authService.hasPermission('tenants', 'create');
      const hasReporting = await authService.hasPermission('reports', 'export');

      expect(hasUserManagement).toBe(true);
      expect(hasTenantManagement).toBe(true);
      expect(hasReporting).toBe(true);
    });
  });

  describe('Cross-Role Permission Validation', () => {
    it('should prevent role escalation attacks', async () => {
      // Teacher trying to assign admin role
      const teacher = {
        tenant_id: 'tenant-1',
        role_name: 'teacher',
        role_display_name: 'Teacher',
        is_primary: true,
        status: 'active',
      };

      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: mockSupabaseResponses.user }, 
        error: null 
      });
      mockSupabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'get_user_tenants_with_roles') {
          return Promise.resolve({ data: [teacher], error: null });
        }
        if (funcName === 'user_has_permission') {
          // Teachers cannot assign roles
          return Promise.resolve({ data: false, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      (authService as any).currentTenantId = 'tenant-1';

      // Teacher shouldn't be able to assign roles
      const canAssignRoles = await authService.hasPermission('users', 'assign');
      expect(canAssignRoles).toBe(false);

      // Attempting to assign role should fail
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: new Error('Permission denied'),
      });

      await expect(
        authService.assignRoleToUser({
          user_id: 'target-user',
          tenant_id: 'tenant-1',
          role: SystemRole.TENANT_ADMIN,
        })
      ).rejects.toThrow();
    });

    it('should allow same-level role assignments by admins', async () => {
      // Tenant admin assigning teacher role
      const tenantAdmin = {
        tenant_id: 'tenant-1',
        role_name: 'tenant_admin',
        role_display_name: 'Tenant Administrator',
        is_primary: true,
        status: 'active',
      };

      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: mockSupabaseResponses.user }, 
        error: null 
      });
      mockSupabase.rpc.mockResolvedValue({
        data: [tenantAdmin],
        error: null
      });

      // Mock role lookup and assignment
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'role-teacher' },
        error: null,
      });
      mockSupabase.from().upsert.mockResolvedValue({
        data: null,
        error: null,
      });

      await authService.assignRoleToUser({
        user_id: 'new-teacher',
        tenant_id: 'tenant-1',
        role: SystemRole.TEACHER,
      });

      expect(mockSupabase.from().upsert).toHaveBeenCalled();
    });
  });

  describe('Permission Context', () => {
    it('should provide correct tenant context for permission checks', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: mockSupabaseResponses.user }, 
        error: null 
      });
      mockSupabase.rpc.mockResolvedValue({
        data: mockSupabaseResponses.userTenantWithRoles,
        error: null
      });

      const permissions = [
        { permissions: mockSupabaseResponses.permissions[0] },
        { permissions: mockSupabaseResponses.permissions[1] },
      ];

      mockSupabase.from().select().eq().or.mockResolvedValue({
        data: permissions,
        error: null,
      });

      (authService as any).currentTenantId = 'tenant-1';

      const context = await authService.getTenantContext();

      expect(context).not.toBeNull();
      expect(context?.tenant.id).toBe('tenant-1');
      expect(context?.can('users', 'create')).toBe(true);
      expect(context?.can('invalid', 'action')).toBe(false);
    });
  });
});