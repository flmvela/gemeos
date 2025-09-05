/**
 * Access Management Dashboard Test Suite
 * Tests for the centralized access management interface
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import AccessManagement from '../AccessManagement';
import { useAuth } from '@/hooks/useAuth';
import { accessManagementService } from '@/services/access-management.service';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/services/access-management.service', () => ({
  accessManagementService: {
    getUserAccessibleRoutes: vi.fn(),
    checkMultiplePermissions: vi.fn(),
    updatePermission: vi.fn(),
    bulkUpdatePermissions: vi.fn(),
    enableAuditLogging: vi.fn(),
    getCacheSize: vi.fn(),
    clearCache: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null,
        })),
        eq: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      update: vi.fn(),
      insert: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

describe('AccessManagement Dashboard', () => {
  let queryClient: QueryClient;
  const user = userEvent.setup();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {ui}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Platform Admin Universal Access', () => {
    it('should display platform admin indicator prominently', async () => {
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
      } as any);

      renderWithProviders(<AccessManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('platform-admin-badge')).toBeInTheDocument();
        expect(screen.getByText(/Universal Access Enabled/i)).toBeInTheDocument();
      });
    });

    it('should show all resources as accessible for platform admin', async () => {
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
      } as any);

      vi.mocked(accessManagementService.getUserAccessibleRoutes).mockResolvedValue([
        '/admin/users',
        '/admin/permissions',
        '/admin/domains',
        '/admin/reports',
      ]);

      renderWithProviders(<AccessManagement />);

      await waitFor(() => {
        expect(screen.getByText('All Routes Accessible')).toBeInTheDocument();
        expect(screen.getByText('Full System Control')).toBeInTheDocument();
      });
    });

    it('should not allow platform admin to modify their own universal access', async () => {
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
      } as any);

      renderWithProviders(<AccessManagement />);

      await waitFor(() => {
        const adminToggle = screen.queryByTestId('toggle-platform-admin');
        expect(adminToggle).toBeDisabled();
      });
    });
  });

  describe('Permission Matrix', () => {
    it('should display permission matrix with roles and resources', async () => {
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
      } as any);

      const mockPermissions = {
        'users:create': true,
        'users:read': true,
        'users:update': true,
        'users:delete': false,
        'domains:create': true,
        'domains:read': true,
        'domains:update': false,
        'domains:delete': false,
      };

      vi.mocked(accessManagementService.checkMultiplePermissions).mockResolvedValue(mockPermissions);

      renderWithProviders(<AccessManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('permission-matrix')).toBeInTheDocument();
        expect(screen.getByText('Users')).toBeInTheDocument();
        expect(screen.getByText('Domains')).toBeInTheDocument();
        expect(screen.getByText('Create')).toBeInTheDocument();
        expect(screen.getByText('Read')).toBeInTheDocument();
        expect(screen.getByText('Update')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    it('should allow toggling permissions for non-admin users', async () => {
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
      } as any);

      vi.mocked(accessManagementService.updatePermission).mockResolvedValue();

      renderWithProviders(<AccessManagement />);

      await waitFor(() => {
        const permissionToggle = screen.getByTestId('permission-toggle-users-create-teacher');
        expect(permissionToggle).toBeInTheDocument();
      });

      const toggle = screen.getByTestId('permission-toggle-users-create-teacher');
      await user.click(toggle);

      await waitFor(() => {
        expect(accessManagementService.updatePermission).toHaveBeenCalledWith(
          expect.any(String),
          'users',
          'create',
          expect.any(Boolean)
        );
      });
    });

    it('should support bulk permission operations', async () => {
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
      } as any);

      vi.mocked(accessManagementService.bulkUpdatePermissions).mockResolvedValue();

      renderWithProviders(<AccessManagement />);

      await waitFor(() => {
        const bulkSelectAll = screen.getByTestId('bulk-select-all');
        expect(bulkSelectAll).toBeInTheDocument();
      });

      // Select all checkboxes
      await user.click(screen.getByTestId('bulk-select-all'));

      // Apply bulk action
      await user.click(screen.getByTestId('bulk-action-button'));
      await user.click(screen.getByText('Grant Selected'));

      await waitFor(() => {
        expect(accessManagementService.bulkUpdatePermissions).toHaveBeenCalled();
      });
    });
  });

  describe('Audit Log', () => {
    it('should display audit log with filtering options', async () => {
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
      } as any);

      const mockAuditLogs = [
        {
          id: '1',
          user_id: 'user-1',
          action: 'permission_grant',
          resource_type: 'users',
          changes: { resource: 'users', action: 'create' },
          created_at: '2024-01-01T10:00:00Z',
        },
        {
          id: '2',
          user_id: 'user-2',
          action: 'permission_revoke',
          resource_type: 'domains',
          changes: { resource: 'domains', action: 'delete' },
          created_at: '2024-01-01T11:00:00Z',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockAuditLogs,
          error: null,
        }),
      } as any);

      renderWithProviders(<AccessManagement />);

      // Navigate to audit log tab
      await user.click(screen.getByTestId('tab-audit-log'));

      await waitFor(() => {
        expect(screen.getByTestId('audit-log-table')).toBeInTheDocument();
        expect(screen.getByText('permission_grant')).toBeInTheDocument();
        expect(screen.getByText('permission_revoke')).toBeInTheDocument();
      });
    });

    it('should allow filtering audit logs by action type', async () => {
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
      } as any);

      renderWithProviders(<AccessManagement />);

      await user.click(screen.getByTestId('tab-audit-log'));

      await waitFor(() => {
        const filterSelect = screen.getByTestId('audit-filter-action');
        expect(filterSelect).toBeInTheDocument();
      });

      await user.selectOptions(
        screen.getByTestId('audit-filter-action'),
        'permission_grant'
      );

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });
    });

    it('should allow exporting audit logs', async () => {
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
      } as any);

      renderWithProviders(<AccessManagement />);

      await user.click(screen.getByTestId('tab-audit-log'));

      await waitFor(() => {
        const exportButton = screen.getByTestId('export-audit-logs');
        expect(exportButton).toBeInTheDocument();
      });

      const exportButton = screen.getByTestId('export-audit-logs');
      await user.click(exportButton);

      // Should trigger download
      await waitFor(() => {
        expect(screen.getByText(/Exporting/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should display cache statistics', async () => {
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
      } as any);

      vi.mocked(accessManagementService.getCacheSize).mockReturnValue(42);

      renderWithProviders(<AccessManagement />);

      await user.click(screen.getByTestId('tab-performance'));

      await waitFor(() => {
        expect(screen.getByText('Cache Size: 42 entries')).toBeInTheDocument();
      });
    });

    it('should allow clearing the cache', async () => {
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
      } as any);

      vi.mocked(accessManagementService.clearCache).mockImplementation(() => {});

      renderWithProviders(<AccessManagement />);

      await user.click(screen.getByTestId('tab-performance'));

      await waitFor(() => {
        const clearCacheButton = screen.getByTestId('clear-cache-button');
        expect(clearCacheButton).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('clear-cache-button'));

      await waitFor(() => {
        expect(accessManagementService.clearCache).toHaveBeenCalled();
        expect(screen.getByText('Cache cleared successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Role Management', () => {
    it('should display role hierarchy', async () => {
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
      } as any);

      renderWithProviders(<AccessManagement />);

      await waitFor(() => {
        expect(screen.getByText('Platform Admin')).toBeInTheDocument();
        expect(screen.getByText('Tenant Admin')).toBeInTheDocument();
        expect(screen.getByText('Teacher')).toBeInTheDocument();
        expect(screen.getByText('Student')).toBeInTheDocument();
      });
    });

    it('should show role inheritance relationships', async () => {
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
      } as any);

      renderWithProviders(<AccessManagement />);

      await waitFor(() => {
        const roleHierarchy = screen.getByTestId('role-hierarchy');
        expect(roleHierarchy).toBeInTheDocument();
        expect(screen.getByText(/inherits from/i)).toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    it('should provide quick action buttons for common tasks', async () => {
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
      } as any);

      renderWithProviders(<AccessManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('quick-action-grant-all')).toBeInTheDocument();
        expect(screen.getByTestId('quick-action-revoke-all')).toBeInTheDocument();
        expect(screen.getByTestId('quick-action-reset-defaults')).toBeInTheDocument();
      });
    });

    it('should confirm before executing destructive actions', async () => {
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
      } as any);

      renderWithProviders(<AccessManagement />);

      await waitFor(() => {
        const revokeAllButton = screen.getByTestId('quick-action-revoke-all');
        expect(revokeAllButton).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('quick-action-revoke-all'));

      await waitFor(() => {
        expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
        expect(screen.getByTestId('confirm-action')).toBeInTheDocument();
        expect(screen.getByTestId('cancel-action')).toBeInTheDocument();
      });
    });
  });
});