/**
 * Unit Tests for Tenant Admin Service
 * Following TDD principles - testing core tenant admin functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock auth service
vi.mock('@/services/auth.service', () => ({
  authService: {
    getCurrentSession: vi.fn(),
    getCurrentTenantId: vi.fn(() => 'tenant-1'),
    hasPermission: vi.fn(() => Promise.resolve(true)),
    createAuditLog: vi.fn(),
    isTenantAdmin: vi.fn(() => Promise.resolve(true)),
  },
}));

describe('TenantAdminService', () => {
  let TenantAdminService: any;
  let tenantAdminService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Dynamic import after mocks are set up
    const module = await import('../tenantAdmin.service');
    TenantAdminService = module.TenantAdminService;
    
    // Clear singleton and get new instance
    (TenantAdminService as any).instance = null;
    tenantAdminService = TenantAdminService.getInstance();
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
        };

        const mockProfile = {
          user_id: 'new-teacher-id',
          email: teacherData.email,
          first_name: teacherData.firstName,
          last_name: teacherData.lastName,
        };

        const mockRole = {
          id: 'role-teacher',
          name: 'teacher',
        };

        // Mock profile creation
        vi.mocked(supabase.from).mockImplementationOnce(() => ({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        } as any));

        // Mock role lookup
        vi.mocked(supabase.from).mockImplementationOnce(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockRole, error: null }),
        } as any));

        // Mock user_tenants upsert
        vi.mocked(supabase.from).mockImplementationOnce(() => ({
          upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any));

        const result = await tenantAdminService.createTeacher(teacherData);

        expect(result).toBeDefined();
        expect(result.email).toBe(teacherData.email);
        expect(result.user_id).toBe('new-teacher-id');
      });

      it('should validate teacher data', async () => {
        const invalidData = {
          email: 'invalid-email',
          firstName: '',
          lastName: '',
        };

        await expect(
          tenantAdminService.createTeacher(invalidData)
        ).rejects.toThrow('Invalid teacher data');
      });
    });

    describe('suspendTeacher', () => {
      it('should suspend a teacher account', async () => {
        const teacherId = 'teacher-123';

        vi.mocked(supabase.from).mockReturnValue({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { status: 'suspended' }, error: null }),
        } as any);

        const result = await tenantAdminService.suspendTeacher(teacherId);
        expect(result).toBe(true);
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

        vi.mocked(supabase.rpc).mockResolvedValue({
          data: mockTeachers,
          error: null,
        } as any);

        const result = await tenantAdminService.getTeachers();
        expect(result).toEqual(mockTeachers);
        expect(result).toHaveLength(2);
      });
    });
  });

  describe('Tenant Settings Management', () => {
    describe('updateTenantSettings', () => {
      it('should update tenant settings', async () => {
        const updates = {
          name: 'Updated School Name',
          description: 'Updated description',
        };

        const updatedTenant = {
          id: 'tenant-1',
          ...updates,
        };

        vi.mocked(supabase.from).mockReturnValue({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: updatedTenant, error: null }),
        } as any);

        const result = await tenantAdminService.updateTenantSettings(updates);
        expect(result.name).toBe(updates.name);
        expect(result.description).toBe(updates.description);
      });
    });

    describe('getTenantSettings', () => {
      it('should retrieve current tenant settings', async () => {
        const mockTenant = {
          id: 'tenant-1',
          name: 'Test School',
          description: 'A test school',
          settings: {},
        };

        vi.mocked(supabase.from).mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockTenant, error: null }),
        } as any);

        const result = await tenantAdminService.getTenantSettings();
        expect(result).toEqual(mockTenant);
      });
    });
  });

  describe('Domain Assignment', () => {
    describe('enableDomainForTenant', () => {
      it('should enable a domain for the tenant', async () => {
        const domainId = 'domain-123';

        // Mock usage check
        vi.mocked(supabase.rpc).mockResolvedValueOnce({
          data: { total_domains: 5, max_domains: 10 },
          error: null,
        } as any);

        // Mock existing domain check
        vi.mocked(supabase.from).mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
        } as any);

        // Mock domain creation
        vi.mocked(supabase.from).mockReturnValueOnce({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { tenant_id: 'tenant-1', domain_id: domainId, is_active: true },
            error: null 
          }),
        } as any);

        const result = await tenantAdminService.enableDomainForTenant(domainId);
        expect(result).toBe(true);
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

        vi.mocked(supabase.rpc).mockResolvedValue({
          data: mockDomains,
          error: null,
        } as any);

        const result = await tenantAdminService.getTenantDomains();
        expect(result).toEqual(mockDomains);
        expect(result).toHaveLength(2);
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
        };

        const mockInvitation = {
          id: 'invite-123',
          email: invitationData.email,
          tenant_id: 'tenant-1',
          role: 'teacher',
          status: 'pending',
          token: 'unique-token',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };

        // Mock existing invitation check
        vi.mocked(supabase.from).mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
        } as any);

        // Mock invitation creation
        vi.mocked(supabase.from).mockReturnValueOnce({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockInvitation, error: null }),
        } as any);

        // Mock email sending
        vi.mocked(supabase.rpc).mockResolvedValue({
          data: { success: true },
          error: null,
        } as any);

        const result = await tenantAdminService.sendTeacherInvitation(invitationData);
        expect(result).toBeDefined();
        expect(result.id).toBe('invite-123');
        expect(result.status).toBe('pending');
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
          },
          {
            id: 'invite-2',
            email: 'teacher2@test.com',
            role: 'teacher',
            status: 'pending',
          },
        ];

        vi.mocked(supabase.from).mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockInvitations, error: null }),
        } as any);

        const result = await tenantAdminService.getPendingInvitations();
        expect(result).toEqual(mockInvitations);
        expect(result).toHaveLength(2);
      });
    });
  });

  describe('Authorization Checks', () => {
    it('should verify tenant admin authorization', async () => {
      const { authService } = await import('@/services/auth.service');
      
      vi.mocked(authService.isTenantAdmin).mockResolvedValue(false);
      vi.mocked(authService.hasPermission).mockResolvedValue(false);

      await expect(
        tenantAdminService.updateTenantSettings({ name: 'New Name' })
      ).rejects.toThrow('Not authorized to update tenant settings');
    });
  });
});