/**
 * Unit Tests for Tenant Admin Service
 * Following TDD principles - these tests define the expected behavior
 * for all tenant admin operations before implementation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  createMockSupabaseClient, 
  mockSupabaseResponses,
  createConfiguredMockClient 
} from '@/test/mocks/supabase.mock';
import type { 
  SystemRole,
  TenantStatus,
  SubscriptionTier,
  UserTenantStatus,
  AuthorizationError
} from '@/types/auth.types';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}));

// Mock the auth service
vi.mock('./auth.service', () => ({
  authService: {
    getCurrentSession: vi.fn(),
    getCurrentTenantId: vi.fn(),
    hasPermission: vi.fn(),
    createAuditLog: vi.fn(),
    isTenantAdmin: vi.fn(),
  },
}));

describe('TenantAdminService', () => {
  let tenantAdminService: any;
  let mockSupabase: any;

  beforeEach(async () => {
    // Dynamically import after mocks are set
    const { TenantAdminService } = await import('./tenantAdmin.service');
    const { authService } = await import('./auth.service');
    
    // Clear singleton instance
    (TenantAdminService as any).instance = null;
    tenantAdminService = TenantAdminService.getInstance();
    
    // Get mock Supabase instance
    const { supabase } = require('@/integrations/supabase/client');
    mockSupabase = supabase;
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default auth service mocks
    vi.mocked(authService.getCurrentSession).mockResolvedValue({
      user_id: 'test-user-123',
      email: 'admin@test.com',
      tenants: mockSupabaseResponses.userTenantWithRoles,
      current_tenant: mockSupabaseResponses.userTenantWithRoles[0],
      is_platform_admin: false,
    });
    
    vi.mocked(authService.getCurrentTenantId).mockReturnValue('tenant-1');
    vi.mocked(authService.isTenantAdmin).mockResolvedValue(true);
    vi.mocked(authService.hasPermission).mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TenantAdminService.getInstance();
      const instance2 = TenantAdminService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Teacher Management', () => {
    describe('createTeacher', () => {
      it('should create a new teacher account', async () => {
        const teacherData = {
          email: 'teacher@test.com',
          firstName: 'John',
          lastName: 'Doe',
          domains: ['domain-1', 'domain-2'],
        };

        // Mock profile creation
        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: { 
            user_id: 'new-teacher-id',
            email: teacherData.email,
            first_name: teacherData.firstName,
            last_name: teacherData.lastName,
          },
          error: null,
        });

        // Mock role assignment
        mockSupabase.from().upsert.mockResolvedValue({
          data: null,
          error: null,
        });

        // Mock domain assignments
        mockSupabase.from().insert.mockResolvedValue({
          data: null,
          error: null,
        });

        const result = await tenantAdminService.createTeacher(teacherData);

        expect(result).toBeDefined();
        expect(result.email).toBe(teacherData.email);
        expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
        expect(authService.createAuditLog).toHaveBeenCalledWith(
          'teacher.create',
          'users',
          expect.any(String),
          expect.objectContaining({ email: teacherData.email })
        );
      });

      it('should throw error if not authorized', async () => {
        vi.mocked(authService.isTenantAdmin).mockResolvedValue(false);
        vi.mocked(authService.hasPermission).mockResolvedValue(false);

        await expect(
          tenantAdminService.createTeacher({
            email: 'teacher@test.com',
            firstName: 'John',
            lastName: 'Doe',
          })
        ).rejects.toThrow('Not authorized to create teachers');
      });

      it('should handle duplicate email error gracefully', async () => {
        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: null,
          error: new Error('Duplicate email'),
        });

        await expect(
          tenantAdminService.createTeacher({
            email: 'existing@test.com',
            firstName: 'Jane',
            lastName: 'Smith',
          })
        ).rejects.toThrow('Duplicate email');
      });
    });

    describe('assignTeacherToDomains', () => {
      it('should assign teacher to specified domains', async () => {
        const teacherId = 'teacher-123';
        const domainIds = ['domain-1', 'domain-2'];

        // Mock existing assignments check
        mockSupabase.from().select().eq().eq.mockResolvedValue({
          data: [],
          error: null,
        });

        // Mock new assignments
        mockSupabase.from().insert.mockResolvedValue({
          data: domainIds.map(id => ({
            user_id: teacherId,
            domain_id: id,
            tenant_id: 'tenant-1',
          })),
          error: null,
        });

        const result = await tenantAdminService.assignTeacherToDomains(teacherId, domainIds);

        expect(result).toBe(true);
        expect(mockSupabase.from).toHaveBeenCalledWith('user_domains');
        expect(authService.createAuditLog).toHaveBeenCalledWith(
          'teacher.assign_domains',
          'users',
          teacherId,
          { domains: domainIds }
        );
      });

      it('should remove domains not in the new list', async () => {
        const teacherId = 'teacher-123';
        const newDomainIds = ['domain-2'];

        // Mock existing assignments
        mockSupabase.from().select().eq().eq.mockResolvedValue({
          data: [
            { domain_id: 'domain-1' },
            { domain_id: 'domain-2' },
          ],
          error: null,
        });

        // Mock deletion
        mockSupabase.from().delete().eq().in.mockResolvedValue({
          data: null,
          error: null,
        });

        const result = await tenantAdminService.assignTeacherToDomains(teacherId, newDomainIds);

        expect(result).toBe(true);
        expect(mockSupabase.from().delete).toHaveBeenCalled();
      });

      it('should throw error if not authorized', async () => {
        vi.mocked(authService.hasPermission).mockResolvedValue(false);

        await expect(
          tenantAdminService.assignTeacherToDomains('teacher-123', ['domain-1'])
        ).rejects.toThrow('Not authorized to assign teachers to domains');
      });
    });

    describe('suspendTeacher', () => {
      it('should suspend a teacher account', async () => {
        const teacherId = 'teacher-123';

        mockSupabase.from().update().eq().eq.mockResolvedValue({
          data: { status: 'suspended' },
          error: null,
        });

        const result = await tenantAdminService.suspendTeacher(teacherId);

        expect(result).toBe(true);
        expect(mockSupabase.from).toHaveBeenCalledWith('user_tenants');
        expect(mockSupabase.from().update).toHaveBeenCalledWith({ 
          status: 'suspended',
          updated_at: expect.any(String),
        });
        expect(authService.createAuditLog).toHaveBeenCalledWith(
          'teacher.suspend',
          'users',
          teacherId,
          { status: 'suspended' }
        );
      });

      it('should throw error if teacher not found', async () => {
        mockSupabase.from().update().eq().eq.mockResolvedValue({
          data: null,
          error: new Error('Not found'),
        });

        await expect(
          tenantAdminService.suspendTeacher('non-existent')
        ).rejects.toThrow('Not found');
      });
    });

    describe('reactivateTeacher', () => {
      it('should reactivate a suspended teacher account', async () => {
        const teacherId = 'teacher-123';

        mockSupabase.from().update().eq().eq.mockResolvedValue({
          data: { status: 'active' },
          error: null,
        });

        const result = await tenantAdminService.reactivateTeacher(teacherId);

        expect(result).toBe(true);
        expect(mockSupabase.from().update).toHaveBeenCalledWith({ 
          status: 'active',
          updated_at: expect.any(String),
        });
        expect(authService.createAuditLog).toHaveBeenCalledWith(
          'teacher.reactivate',
          'users',
          teacherId,
          { status: 'active' }
        );
      });
    });

    describe('getTeachers', () => {
      it('should retrieve all teachers in the tenant', async () => {
        const mockTeachers = [
          {
            user_id: 'teacher-1',
            email: 'teacher1@test.com',
            first_name: 'John',
            last_name: 'Doe',
            status: 'active',
            domains: ['domain-1'],
          },
          {
            user_id: 'teacher-2',
            email: 'teacher2@test.com',
            first_name: 'Jane',
            last_name: 'Smith',
            status: 'active',
            domains: ['domain-2'],
          },
        ];

        mockSupabase.rpc.mockResolvedValue({
          data: mockTeachers,
          error: null,
        });

        const result = await tenantAdminService.getTeachers();

        expect(result).toEqual(mockTeachers);
        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_tenant_teachers', {
          p_tenant_id: 'tenant-1',
        });
      });

      it('should filter teachers by status', async () => {
        mockSupabase.rpc.mockResolvedValue({
          data: [
            {
              user_id: 'teacher-1',
              email: 'teacher1@test.com',
              status: 'active',
            },
          ],
          error: null,
        });

        const result = await tenantAdminService.getTeachers({ status: 'active' });

        expect(result).toHaveLength(1);
        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_tenant_teachers', {
          p_tenant_id: 'tenant-1',
          p_status: 'active',
        });
      });

      it('should filter teachers by domain', async () => {
        mockSupabase.rpc.mockResolvedValue({
          data: [
            {
              user_id: 'teacher-1',
              email: 'teacher1@test.com',
              domains: ['domain-1'],
            },
          ],
          error: null,
        });

        const result = await tenantAdminService.getTeachers({ domainId: 'domain-1' });

        expect(result).toHaveLength(1);
        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_tenant_teachers', {
          p_tenant_id: 'tenant-1',
          p_domain_id: 'domain-1',
        });
      });
    });

    describe('getTeacherStatistics', () => {
      it('should retrieve teacher activity statistics', async () => {
        const teacherId = 'teacher-123';
        const mockStats = {
          total_students: 25,
          active_courses: 3,
          completed_lessons: 45,
          average_student_progress: 67.5,
          last_active: '2024-01-15T10:00:00Z',
        };

        mockSupabase.rpc.mockResolvedValue({
          data: mockStats,
          error: null,
        });

        const result = await tenantAdminService.getTeacherStatistics(teacherId);

        expect(result).toEqual(mockStats);
        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_teacher_statistics', {
          p_teacher_id: teacherId,
          p_tenant_id: 'tenant-1',
        });
      });
    });
  });

  describe('Tenant Settings Management', () => {
    describe('updateTenantSettings', () => {
      it('should update tenant information', async () => {
        const updates = {
          name: 'Updated School Name',
          description: 'Updated description',
          settings: { theme: 'dark', locale: 'en-US' },
        };

        mockSupabase.from().update().eq().select().single.mockResolvedValue({
          data: { ...mockSupabaseResponses.tenants[0], ...updates },
          error: null,
        });

        const result = await tenantAdminService.updateTenantSettings(updates);

        expect(result.name).toBe(updates.name);
        expect(mockSupabase.from).toHaveBeenCalledWith('tenants');
        expect(authService.createAuditLog).toHaveBeenCalledWith(
          'tenant.update_settings',
          'tenants',
          'tenant-1',
          updates
        );
      });

      it('should throw error if not tenant admin', async () => {
        vi.mocked(authService.isTenantAdmin).mockResolvedValue(false);

        await expect(
          tenantAdminService.updateTenantSettings({ name: 'New Name' })
        ).rejects.toThrow('Not authorized to update tenant settings');
      });

      it('should validate subscription limits', async () => {
        const updates = {
          max_users: 1000, // Exceeds subscription tier limit
        };

        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: { ...mockSupabaseResponses.tenants[0], subscription_tier: 'basic' },
          error: null,
        });

        await expect(
          tenantAdminService.updateTenantSettings(updates)
        ).rejects.toThrow('Exceeds subscription tier limits');
      });
    });

    describe('getTenantSettings', () => {
      it('should retrieve current tenant settings', async () => {
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: mockSupabaseResponses.tenants[0],
          error: null,
        });

        const result = await tenantAdminService.getTenantSettings();

        expect(result).toEqual(mockSupabaseResponses.tenants[0]);
        expect(mockSupabase.from).toHaveBeenCalledWith('tenants');
      });
    });

    describe('getTenantUsageStatistics', () => {
      it('should retrieve tenant usage statistics', async () => {
        const mockUsage = {
          total_users: 45,
          max_users: 100,
          total_domains: 8,
          max_domains: 10,
          active_teachers: 12,
          active_students: 33,
          storage_used_gb: 15.5,
          storage_limit_gb: 100,
        };

        mockSupabase.rpc.mockResolvedValue({
          data: mockUsage,
          error: null,
        });

        const result = await tenantAdminService.getTenantUsageStatistics();

        expect(result).toEqual(mockUsage);
        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_tenant_usage_statistics', {
          p_tenant_id: 'tenant-1',
        });
      });
    });

    describe('getSubscriptionLimits', () => {
      it('should retrieve subscription tier limits', async () => {
        const mockLimits = {
          tier: 'premium',
          max_users: 500,
          max_domains: 20,
          max_storage_gb: 500,
          features: ['advanced_analytics', 'custom_branding', 'api_access'],
        };

        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: mockLimits,
          error: null,
        });

        const result = await tenantAdminService.getSubscriptionLimits();

        expect(result).toEqual(mockLimits);
      });
    });
  });

  describe('Domain Assignment', () => {
    describe('enableDomainForTenant', () => {
      it('should enable a domain for the tenant', async () => {
        const domainId = 'domain-123';

        // Check domain doesn't exist
        mockSupabase.from().select().eq().eq().single.mockResolvedValue({
          data: null,
          error: new Error('Not found'),
        });

        // Insert new domain assignment
        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: {
            tenant_id: 'tenant-1',
            domain_id: domainId,
            is_active: true,
            max_teachers: 10,
            max_students: 100,
          },
          error: null,
        });

        const result = await tenantAdminService.enableDomainForTenant(domainId);

        expect(result).toBe(true);
        expect(authService.createAuditLog).toHaveBeenCalledWith(
          'domain.enable',
          'domains',
          domainId,
          { tenant_id: 'tenant-1', is_active: true }
        );
      });

      it('should reactivate existing disabled domain', async () => {
        const domainId = 'domain-123';

        // Domain exists but is disabled
        mockSupabase.from().select().eq().eq().single.mockResolvedValue({
          data: { is_active: false },
          error: null,
        });

        // Update to active
        mockSupabase.from().update().eq().eq().select().single.mockResolvedValue({
          data: { is_active: true },
          error: null,
        });

        const result = await tenantAdminService.enableDomainForTenant(domainId);

        expect(result).toBe(true);
        expect(mockSupabase.from().update).toHaveBeenCalledWith({ 
          is_active: true,
          updated_at: expect.any(String),
        });
      });

      it('should throw error if domain limit reached', async () => {
        vi.mocked(authService.hasPermission).mockResolvedValue(true);

        // Mock usage check
        mockSupabase.rpc.mockResolvedValue({
          data: { total_domains: 10, max_domains: 10 },
          error: null,
        });

        await expect(
          tenantAdminService.enableDomainForTenant('domain-123')
        ).rejects.toThrow('Domain limit reached for tenant');
      });
    });

    describe('disableDomainForTenant', () => {
      it('should disable a domain for the tenant', async () => {
        const domainId = 'domain-123';

        mockSupabase.from().update().eq().eq().select().single.mockResolvedValue({
          data: { is_active: false },
          error: null,
        });

        const result = await tenantAdminService.disableDomainForTenant(domainId);

        expect(result).toBe(true);
        expect(mockSupabase.from().update).toHaveBeenCalledWith({ 
          is_active: false,
          updated_at: expect.any(String),
        });
        expect(authService.createAuditLog).toHaveBeenCalledWith(
          'domain.disable',
          'domains',
          domainId,
          { tenant_id: 'tenant-1', is_active: false }
        );
      });
    });

    describe('getTenantDomains', () => {
      it('should retrieve all domains for the tenant', async () => {
        const mockDomains = [
          {
            domain_id: 'domain-1',
            domain_name: 'Mathematics',
            is_active: true,
            teacher_count: 5,
            student_count: 50,
          },
          {
            domain_id: 'domain-2',
            domain_name: 'Science',
            is_active: true,
            teacher_count: 3,
            student_count: 30,
          },
        ];

        mockSupabase.rpc.mockResolvedValue({
          data: mockDomains,
          error: null,
        });

        const result = await tenantAdminService.getTenantDomains();

        expect(result).toEqual(mockDomains);
        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_tenant_domains', {
          p_tenant_id: 'tenant-1',
        });
      });

      it('should filter domains by active status', async () => {
        mockSupabase.rpc.mockResolvedValue({
          data: [
            {
              domain_id: 'domain-1',
              domain_name: 'Mathematics',
              is_active: true,
            },
          ],
          error: null,
        });

        const result = await tenantAdminService.getTenantDomains({ activeOnly: true });

        expect(result).toHaveLength(1);
        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_tenant_domains', {
          p_tenant_id: 'tenant-1',
          p_active_only: true,
        });
      });
    });

    describe('getDomainUsageStatistics', () => {
      it('should retrieve domain usage statistics', async () => {
        const domainId = 'domain-123';
        const mockStats = {
          total_teachers: 5,
          total_students: 75,
          active_courses: 12,
          completed_lessons: 234,
          average_progress: 68.5,
        };

        mockSupabase.rpc.mockResolvedValue({
          data: mockStats,
          error: null,
        });

        const result = await tenantAdminService.getDomainUsageStatistics(domainId);

        expect(result).toEqual(mockStats);
        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_domain_usage_statistics', {
          p_domain_id: domainId,
          p_tenant_id: 'tenant-1',
        });
      });
    });
  });

  describe('User Invitation System', () => {
    describe('sendTeacherInvitation', () => {
      it('should send invitation email to new teacher', async () => {
        const invitationData = {
          email: 'newteacher@test.com',
          firstName: 'Alice',
          lastName: 'Johnson',
          domains: ['domain-1'],
          message: 'Welcome to our school!',
        };

        // Create invitation record
        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: {
            id: 'invite-123',
            email: invitationData.email,
            tenant_id: 'tenant-1',
            role: 'teacher',
            status: 'pending',
            token: 'unique-token-123',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          error: null,
        });

        // Send email (mocked)
        mockSupabase.rpc.mockResolvedValue({
          data: { success: true },
          error: null,
        });

        const result = await tenantAdminService.sendTeacherInvitation(invitationData);

        expect(result).toBeDefined();
        expect(result.id).toBe('invite-123');
        expect(result.status).toBe('pending');
        expect(mockSupabase.from).toHaveBeenCalledWith('invitations');
        expect(authService.createAuditLog).toHaveBeenCalledWith(
          'invitation.send',
          'invitations',
          'invite-123',
          { email: invitationData.email, role: 'teacher' }
        );
      });

      it('should throw error if email already invited', async () => {
        // Check existing invitation
        mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
          data: { status: 'pending' },
          error: null,
        });

        await expect(
          tenantAdminService.sendTeacherInvitation({
            email: 'existing@test.com',
            firstName: 'Bob',
            lastName: 'Smith',
          })
        ).rejects.toThrow('User already has a pending invitation');
      });
    });

    describe('resendInvitation', () => {
      it('should resend invitation email', async () => {
        const invitationId = 'invite-123';

        // Get invitation
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: {
            id: invitationId,
            email: 'teacher@test.com',
            status: 'pending',
          },
          error: null,
        });

        // Update expiry
        mockSupabase.from().update().eq().select().single.mockResolvedValue({
          data: {
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          error: null,
        });

        // Resend email
        mockSupabase.rpc.mockResolvedValue({
          data: { success: true },
          error: null,
        });

        const result = await tenantAdminService.resendInvitation(invitationId);

        expect(result).toBe(true);
        expect(authService.createAuditLog).toHaveBeenCalledWith(
          'invitation.resend',
          'invitations',
          invitationId,
          null
        );
      });

      it('should throw error if invitation already accepted', async () => {
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: { status: 'accepted' },
          error: null,
        });

        await expect(
          tenantAdminService.resendInvitation('invite-123')
        ).rejects.toThrow('Invitation has already been accepted');
      });
    });

    describe('cancelInvitation', () => {
      it('should cancel pending invitation', async () => {
        const invitationId = 'invite-123';

        mockSupabase.from().update().eq().select().single.mockResolvedValue({
          data: { status: 'cancelled' },
          error: null,
        });

        const result = await tenantAdminService.cancelInvitation(invitationId);

        expect(result).toBe(true);
        expect(mockSupabase.from().update).toHaveBeenCalledWith({
          status: 'cancelled',
          updated_at: expect.any(String),
        });
        expect(authService.createAuditLog).toHaveBeenCalledWith(
          'invitation.cancel',
          'invitations',
          invitationId,
          { status: 'cancelled' }
        );
      });
    });

    describe('getPendingInvitations', () => {
      it('should retrieve all pending invitations', async () => {
        const mockInvitations = [
          {
            id: 'invite-1',
            email: 'teacher1@test.com',
            role: 'teacher',
            status: 'pending',
            created_at: '2024-01-01T10:00:00Z',
            expires_at: '2024-01-08T10:00:00Z',
          },
          {
            id: 'invite-2',
            email: 'teacher2@test.com',
            role: 'teacher',
            status: 'pending',
            created_at: '2024-01-02T10:00:00Z',
            expires_at: '2024-01-09T10:00:00Z',
          },
        ];

        mockSupabase.from().select().eq().eq().order.mockResolvedValue({
          data: mockInvitations,
          error: null,
        });

        const result = await tenantAdminService.getPendingInvitations();

        expect(result).toEqual(mockInvitations);
        expect(mockSupabase.from().eq).toHaveBeenCalledWith('tenant_id', 'tenant-1');
        expect(mockSupabase.from().eq).toHaveBeenCalledWith('status', 'pending');
      });
    });

    describe('getInvitationStatistics', () => {
      it('should retrieve invitation statistics', async () => {
        const mockStats = {
          total_sent: 50,
          pending: 5,
          accepted: 42,
          expired: 2,
          cancelled: 1,
          acceptance_rate: 84.0,
        };

        mockSupabase.rpc.mockResolvedValue({
          data: mockStats,
          error: null,
        });

        const result = await tenantAdminService.getInvitationStatistics();

        expect(result).toEqual(mockStats);
        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_invitation_statistics', {
          p_tenant_id: 'tenant-1',
        });
      });
    });
  });

  describe('Bulk Operations', () => {
    describe('bulkSuspendTeachers', () => {
      it('should suspend multiple teachers', async () => {
        const teacherIds = ['teacher-1', 'teacher-2', 'teacher-3'];

        mockSupabase.from().update().eq().in.mockResolvedValue({
          data: null,
          error: null,
        });

        const result = await tenantAdminService.bulkSuspendTeachers(teacherIds);

        expect(result).toBe(true);
        expect(mockSupabase.from().in).toHaveBeenCalledWith('user_id', teacherIds);
        expect(authService.createAuditLog).toHaveBeenCalledWith(
          'teacher.bulk_suspend',
          'users',
          null,
          { teacher_ids: teacherIds }
        );
      });
    });

    describe('bulkAssignDomains', () => {
      it('should assign multiple teachers to domains', async () => {
        const assignments = [
          { teacherId: 'teacher-1', domains: ['domain-1', 'domain-2'] },
          { teacherId: 'teacher-2', domains: ['domain-2', 'domain-3'] },
        ];

        // Mock successful assignments
        for (const assignment of assignments) {
          mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
            data: [],
            error: null,
          });
          mockSupabase.from().insert.mockResolvedValueOnce({
            data: null,
            error: null,
          });
        }

        const result = await tenantAdminService.bulkAssignDomains(assignments);

        expect(result).toBe(true);
        expect(authService.createAuditLog).toHaveBeenCalledWith(
          'teacher.bulk_assign_domains',
          'users',
          null,
          { assignments }
        );
      });
    });
  });

  describe('Authorization Checks', () => {
    it('should verify tenant admin authorization for all operations', async () => {
      vi.mocked(authService.isTenantAdmin).mockResolvedValue(false);
      vi.mocked(authService.hasPermission).mockResolvedValue(false);

      const operations = [
        () => tenantAdminService.createTeacher({ email: 'test@test.com', firstName: 'Test', lastName: 'User' }),
        () => tenantAdminService.suspendTeacher('teacher-123'),
        () => tenantAdminService.updateTenantSettings({ name: 'New Name' }),
        () => tenantAdminService.enableDomainForTenant('domain-123'),
        () => tenantAdminService.sendTeacherInvitation({ email: 'new@test.com', firstName: 'New', lastName: 'Teacher' }),
      ];

      for (const operation of operations) {
        await expect(operation()).rejects.toThrow(/Not authorized/);
      }
    });

    it('should allow operations for users with specific permissions', async () => {
      vi.mocked(authService.isTenantAdmin).mockResolvedValue(false);
      vi.mocked(authService.hasPermission).mockImplementation(async (resource, action) => {
        return resource === 'users' && action === 'read';
      });

      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await tenantAdminService.getTeachers();
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockSupabase.from().select().eq().single.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        tenantAdminService.getTenantSettings()
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle rate limiting', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Rate limit exceeded', code: '429' },
      });

      await expect(
        tenantAdminService.getTeachers()
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle invalid input gracefully', async () => {
      await expect(
        tenantAdminService.createTeacher({
          email: 'invalid-email',
          firstName: '',
          lastName: '',
        })
      ).rejects.toThrow('Invalid teacher data');
    });
  });
});