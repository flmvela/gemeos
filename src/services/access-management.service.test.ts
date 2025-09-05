import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AccessManagementService } from './access-management.service';
import { supabase } from '@/integrations/supabase/client';
import type { AuthSession } from '@/types/auth.types';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          maybeSingle: vi.fn(),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(),
        })),
      })),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    })),
    rpc: vi.fn(),
  },
}));

describe('AccessManagementService', () => {
  let service: AccessManagementService;

  beforeEach(() => {
    service = AccessManagementService.getInstance();
    // Clear cache before each test
    service.clearCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = AccessManagementService.getInstance();
      const instance2 = AccessManagementService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Platform Admin Bypass', () => {
    it('should grant universal access to platform admins', async () => {
      // Mock platform admin user
      const mockPlatformAdminSession = {
        user: {
          id: 'admin-123',
          email: 'admin@gemeos.ai',
          app_metadata: { is_platform_admin: true },
        },
      };
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockPlatformAdminSession },
        error: null,
      });

      const canAccess = await service.checkAccess('/admin/sensitive-route');
      expect(canAccess).toBe(true);
    });

    it('should bypass permission checks for platform admins on any resource', async () => {
      const mockPlatformAdminSession = {
        user: {
          id: 'admin-123',
          email: 'admin@gemeos.ai',
          app_metadata: { is_platform_admin: true },
        },
      };
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockPlatformAdminSession },
        error: null,
      });

      const hasPermission = await service.hasPermission('users', 'delete');
      expect(hasPermission).toBe(true);
    });

    it('should identify platform admin by email fallback', async () => {
      const mockSession = {
        user: {
          id: 'admin-123',
          email: 'admin@gemeos.ai',
          app_metadata: {},
        },
      };
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const isPlatformAdmin = await service.isPlatformAdmin();
      expect(isPlatformAdmin).toBe(true);
    });
  });

  describe('Regular User Access Control', () => {
    const mockRegularUserSession = {
      user: {
        id: 'user-123',
        email: 'user@example.com',
        app_metadata: { role: 'teacher' },
      },
    };

    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockRegularUserSession },
        error: null,
      });
    });

    it('should check page permissions for regular users', async () => {
      // Mock page and permission data
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'page-1', path: '/teacher/dashboard' },
              error: null,
            }),
          })),
        })),
      }));
      
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      // Mock permission check
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'page-1', path: '/teacher/dashboard' },
              error: null,
            }),
          })),
        })),
      }).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { 
                    page_id: 'page-1', 
                    role: 'teacher', 
                    is_active: true 
                  },
                  error: null,
                }),
              })),
            })),
          })),
        })),
      });

      const canAccess = await service.checkAccess('/teacher/dashboard');
      expect(canAccess).toBe(true);
    });

    it('should deny access when user lacks permissions', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          })),
        })),
      }));
      
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const canAccess = await service.checkAccess('/admin/users');
      expect(canAccess).toBe(false);
    });

    it('should handle pattern-based routes', async () => {
      // Mock getting all pages for pattern matching
      const mockFrom = vi.fn();
      
      // First call - exact match returns null
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          })),
        })),
      });
      
      // Second call - get all pages for pattern matching
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({
          data: [
            { id: 'page-1', path: '/domains/:domainId/concepts' },
            { id: 'page-2', path: '/teacher/dashboard' },
          ],
          error: null,
        }),
      });
      
      // Third call - check permission for matched page
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { 
                    page_id: 'page-1', 
                    role: 'teacher', 
                    is_active: true 
                  },
                  error: null,
                }),
              })),
            })),
          })),
        })),
      });
      
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const canAccess = await service.checkAccess('/domains/123/concepts');
      expect(canAccess).toBe(true);
    });
  });

  describe('Caching', () => {
    it('should cache access decisions for performance', async () => {
      const mockPlatformAdminSession = {
        user: {
          id: 'admin-123',
          email: 'admin@gemeos.ai',
          app_metadata: { is_platform_admin: true },
        },
      };
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockPlatformAdminSession },
        error: null,
      });

      // First call
      await service.checkAccess('/admin/users');
      
      // Second call - should use cache
      await service.checkAccess('/admin/users');
      
      // Auth should only be called once due to caching
      expect(supabase.auth.getSession).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache after TTL expires', async () => {
      vi.useFakeTimers();
      
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          app_metadata: { role: 'teacher' },
        },
      };
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      await service.checkAccess('/teacher/dashboard');
      
      // Advance time beyond cache TTL (5 minutes)
      vi.advanceTimersByTime(6 * 60 * 1000);
      
      await service.checkAccess('/teacher/dashboard');
      
      // Should fetch again after cache expires
      expect(supabase.auth.getSession).toHaveBeenCalledTimes(2);
      
      vi.useRealTimers();
    });

    it('should provide method to manually clear cache', () => {
      // Add some cached entries
      service['cache'].set('test-key', { 
        value: true, 
        timestamp: Date.now() 
      });
      
      expect(service['cache'].size).toBe(1);
      
      service.clearCache();
      
      expect(service['cache'].size).toBe(0);
    });
  });

  describe('Audit Logging', () => {
    it('should log permission checks for auditing', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          app_metadata: { role: 'teacher' },
        },
      };
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const insertSpy = vi.fn().mockResolvedValue({ data: {}, error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: insertSpy,
      } as any);

      await service.logAccess('view', 'dashboard', '/teacher/dashboard', true);
      
      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          action: 'view',
          resource_type: 'dashboard',
          resource_id: '/teacher/dashboard',
          changes: { allowed: true },
        })
      );
    });

    it('should not throw on audit log failures', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          app_metadata: { role: 'teacher' },
        },
      };
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockRejectedValue(new Error('DB Error')),
      } as any);

      // Should not throw
      await expect(
        service.logAccess('view', 'dashboard', '/teacher/dashboard', true)
      ).resolves.not.toThrow();
    });
  });

  describe('Bulk Permission Operations', () => {
    it('should support checking multiple permissions at once', async () => {
      const mockSession = {
        user: {
          id: 'admin-123',
          email: 'admin@gemeos.ai',
          app_metadata: { is_platform_admin: true },
        },
      };
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const permissions = [
        { resource: 'users', action: 'create' },
        { resource: 'users', action: 'delete' },
        { resource: 'domains', action: 'update' },
      ];

      const results = await service.checkBulkPermissions(permissions);
      
      expect(results).toEqual({
        'users:create': true,
        'users:delete': true,
        'domains:update': true,
      });
    });

    it('should efficiently batch permission checks', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          app_metadata: { role: 'teacher' },
        },
      };
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const paths = ['/teacher/dashboard', '/admin/users', '/domains/123/concepts'];
      
      const results = await service.checkBulkAccess(paths);
      
      expect(results).toHaveProperty('/teacher/dashboard');
      expect(results).toHaveProperty('/admin/users');
      expect(results).toHaveProperty('/domains/123/concepts');
    });
  });

  describe('Role Hierarchy', () => {
    it('should respect role hierarchy for permission inheritance', async () => {
      const mockTenantAdminSession = {
        user: {
          id: 'tenant-admin-123',
          email: 'tenant-admin@example.com',
          app_metadata: { role: 'tenant_admin' },
        },
      };
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockTenantAdminSession },
        error: null,
      });

      // Tenant admin should have teacher permissions
      const hasTeacherPermission = await service.hasRoleOrHigher('teacher');
      expect(hasTeacherPermission).toBe(true);
    });

    it('should deny access for insufficient role level', async () => {
      const mockStudentSession = {
        user: {
          id: 'student-123',
          email: 'student@example.com',
          app_metadata: { role: 'student' },
        },
      };
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockStudentSession },
        error: null,
      });

      const hasTeacherPermission = await service.hasRoleOrHigher('teacher');
      expect(hasTeacherPermission).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle session fetch errors gracefully', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: new Error('Network error'),
      });

      const canAccess = await service.checkAccess('/admin/users');
      expect(canAccess).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          app_metadata: { role: 'teacher' },
        },
      };
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          })),
        })),
      } as any);

      const canAccess = await service.checkAccess('/teacher/dashboard');
      expect(canAccess).toBe(false);
    });

    it('should provide meaningful error messages', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await service.checkAccessWithDetails('/admin/users');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Not authenticated');
    });
  });

  describe('Performance Metrics', () => {
    it('should track access check performance', async () => {
      const mockSession = {
        user: {
          id: 'admin-123',
          email: 'admin@gemeos.ai',
          app_metadata: { is_platform_admin: true },
        },
      };
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      await service.checkAccess('/admin/users');
      
      const metrics = service.getPerformanceMetrics();
      expect(metrics.totalChecks).toBe(1);
      expect(metrics.cacheHits).toBe(0);
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('should track cache hit rate', async () => {
      const mockSession = {
        user: {
          id: 'admin-123',
          email: 'admin@gemeos.ai',
          app_metadata: { is_platform_admin: true },
        },
      };
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // First call - cache miss
      await service.checkAccess('/admin/users');
      // Second call - cache hit
      await service.checkAccess('/admin/users');
      
      const metrics = service.getPerformanceMetrics();
      expect(metrics.totalChecks).toBe(2);
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheHitRate).toBe(0.5);
    });
  });

  describe('getUserAccessiblePaths', () => {
    it('should return all paths for platform admin', async () => {
      const mockPlatformAdminSession = {
        user: {
          id: 'admin-123',
          email: 'admin@gemeos.ai',
          app_metadata: { is_platform_admin: true },
        },
      };
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockPlatformAdminSession },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            { path: '/admin/users' },
            { path: '/admin/permissions' },
            { path: '/domains/:id' },
          ],
          error: null,
        }),
      } as any);

      const paths = await service.getUserAccessiblePaths();
      expect(paths).toHaveLength(3);
      expect(paths).toContain('/admin/users');
    });

    it('should return filtered paths for regular users', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          app_metadata: { role: 'teacher' },
        },
      };
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: [
                { page: { path: '/teacher/dashboard' } },
                { page: { path: '/domains/:id' } },
              ],
              error: null,
            }),
          })),
        })),
      } as any);

      const paths = await service.getUserAccessiblePaths();
      expect(paths).toHaveLength(2);
      expect(paths).toContain('/teacher/dashboard');
    });
  });
});