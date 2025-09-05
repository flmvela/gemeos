/**
 * Tests for TenantAdminDashboard Component
 * Following TDD principles - defining expected behavior first
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TenantAdminDashboard } from '../TenantAdminDashboard';
import { useAuth } from '@/hooks/useAuth';
import { tenantAdminService } from '@/services/tenantAdmin.service';

// Mock dependencies
vi.mock('@/hooks/useAuth');
vi.mock('@/services/tenantAdmin.service');

// Test wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('TenantAdminDashboard', () => {
  const mockTenant = {
    id: 'tenant-1',
    name: 'Test School',
    description: 'A test school',
    status: 'active',
    subscription_tier: 'premium',
  };

  const mockUsageStats = {
    total_users: 45,
    max_users: 100,
    total_domains: 8,
    max_domains: 10,
    active_teachers: 12,
    active_students: 33,
    storage_used_gb: 15.5,
    storage_limit_gb: 100,
  };

  const mockTeacherStats = {
    total: 12,
    active: 10,
    suspended: 2,
  };

  const mockDomainStats = {
    total: 8,
    active: 7,
    inactive: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup auth mock
    vi.mocked(useAuth).mockReturnValue({
      session: {
        user_id: 'admin-user',
        email: 'admin@test.com',
        tenants: [],
        current_tenant: {
          tenant: mockTenant,
          role: { name: 'tenant_admin', display_name: 'Tenant Administrator' },
        },
        is_platform_admin: false,
      },
      tenantContext: null,
      loading: false,
      error: null,
      isTenantAdmin: true,
      isPlatformAdmin: false,
      isTeacher: false,
      isStudent: false,
      hasPermission: () => true,
      switchTenant: vi.fn(),
      refresh: vi.fn(),
    } as any);

    // Setup service mocks
    vi.mocked(tenantAdminService.getTenantSettings).mockResolvedValue(mockTenant as any);
    vi.mocked(tenantAdminService.getTenantUsageStatistics).mockResolvedValue(mockUsageStats);
    vi.mocked(tenantAdminService.getTeachers).mockResolvedValue([]);
    vi.mocked(tenantAdminService.getTenantDomains).mockResolvedValue([]);
  });

  describe('Dashboard Layout', () => {
    it('should render the dashboard header with tenant name', async () => {
      const Wrapper = createWrapper();
      render(<TenantAdminDashboard />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Test School')).toBeInTheDocument();
        expect(screen.getByText('Tenant Administration')).toBeInTheDocument();
      });
    });

    it('should display key navigation sections', async () => {
      const Wrapper = createWrapper();
      render(<TenantAdminDashboard />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Teachers')).toBeInTheDocument();
        expect(screen.getByText('Domains')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Invitations')).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching data', () => {
      vi.mocked(useAuth).mockReturnValue({
        loading: true,
      } as any);

      const Wrapper = createWrapper();
      render(<TenantAdminDashboard />, { wrapper: Wrapper });

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Usage Statistics', () => {
    it('should display usage statistics cards', async () => {
      const Wrapper = createWrapper();
      render(<TenantAdminDashboard />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('45 / 100')).toBeInTheDocument(); // Users
        expect(screen.getByText('8 / 10')).toBeInTheDocument(); // Domains
        expect(screen.getByText('15.5 GB / 100 GB')).toBeInTheDocument(); // Storage
      });
    });

    it('should show warning when approaching limits', async () => {
      vi.mocked(tenantAdminService.getTenantUsageStatistics).mockResolvedValue({
        ...mockUsageStats,
        total_users: 95,
        total_domains: 9,
      });

      const Wrapper = createWrapper();
      render(<TenantAdminDashboard />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText(/Approaching user limit/i)).toBeInTheDocument();
        expect(screen.getByText(/Approaching domain limit/i)).toBeInTheDocument();
      });
    });

    it('should display subscription tier badge', async () => {
      const Wrapper = createWrapper();
      render(<TenantAdminDashboard />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Premium')).toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    it('should display quick action buttons', async () => {
      const Wrapper = createWrapper();
      render(<TenantAdminDashboard />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Teacher/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Manage Domains/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send Invitation/i })).toBeInTheDocument();
      });
    });

    it('should navigate to add teacher when button clicked', async () => {
      const Wrapper = createWrapper();
      render(<TenantAdminDashboard />, { wrapper: Wrapper });

      await waitFor(() => {
        const addTeacherBtn = screen.getByRole('button', { name: /Add Teacher/i });
        fireEvent.click(addTeacherBtn);
      });

      // Check if the add teacher modal or page is shown
      await waitFor(() => {
        expect(screen.getByText(/Create New Teacher/i)).toBeInTheDocument();
      });
    });
  });

  describe('Teacher Overview', () => {
    it('should display teacher statistics', async () => {
      vi.mocked(tenantAdminService.getTeachers).mockResolvedValue([
        { user_id: '1', status: 'active' } as any,
        { user_id: '2', status: 'active' } as any,
        { user_id: '3', status: 'suspended' } as any,
      ]);

      const Wrapper = createWrapper();
      render(<TenantAdminDashboard />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Total teachers
        expect(screen.getByText('2 Active')).toBeInTheDocument();
        expect(screen.getByText('1 Suspended')).toBeInTheDocument();
      });
    });

    it('should display recent teacher activity', async () => {
      vi.mocked(tenantAdminService.getTeachers).mockResolvedValue([
        {
          user_id: '1',
          email: 'teacher1@test.com',
          first_name: 'John',
          last_name: 'Doe',
          status: 'active',
          domains: ['Math'],
        } as any,
      ]);

      const Wrapper = createWrapper();
      render(<TenantAdminDashboard />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('teacher1@test.com')).toBeInTheDocument();
      });
    });
  });

  describe('Domain Overview', () => {
    it('should display domain statistics', async () => {
      vi.mocked(tenantAdminService.getTenantDomains).mockResolvedValue([
        { domain_id: '1', is_active: true } as any,
        { domain_id: '2', is_active: true } as any,
        { domain_id: '3', is_active: false } as any,
      ]);

      const Wrapper = createWrapper();
      render(<TenantAdminDashboard />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('3 Total Domains')).toBeInTheDocument();
        expect(screen.getByText('2 Active')).toBeInTheDocument();
      });
    });

    it('should display domain usage chart', async () => {
      const Wrapper = createWrapper();
      render(<TenantAdminDashboard />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('domain-usage-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Recent Activity', () => {
    it('should display recent activity feed', async () => {
      const Wrapper = createWrapper();
      render(<TenantAdminDashboard />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      });
    });

    it('should refresh activity on pull to refresh', async () => {
      const Wrapper = createWrapper();
      render(<TenantAdminDashboard />, { wrapper: Wrapper });

      await waitFor(() => {
        const refreshBtn = screen.getByRole('button', { name: /Refresh/i });
        fireEvent.click(refreshBtn);
      });

      expect(tenantAdminService.getTenantUsageStatistics).toHaveBeenCalledTimes(2);
    });
  });

  describe('Authorization', () => {
    it('should redirect if not a tenant admin', () => {
      vi.mocked(useAuth).mockReturnValue({
        isTenantAdmin: false,
        isTeacher: true,
      } as any);

      const Wrapper = createWrapper();
      render(<TenantAdminDashboard />, { wrapper: Wrapper });

      expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
    });

    it('should show limited view for users with partial permissions', () => {
      vi.mocked(useAuth).mockReturnValue({
        isTenantAdmin: false,
        hasPermission: (resource: string) => resource === 'users' ? true : false,
      } as any);

      const Wrapper = createWrapper();
      render(<TenantAdminDashboard />, { wrapper: Wrapper });

      // Should see teacher management but not settings
      expect(screen.getByText('Teachers')).toBeInTheDocument();
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when data fetch fails', async () => {
      vi.mocked(tenantAdminService.getTenantUsageStatistics).mockRejectedValue(
        new Error('Failed to fetch usage statistics')
      );

      const Wrapper = createWrapper();
      render(<TenantAdminDashboard />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText(/Failed to load dashboard data/i)).toBeInTheDocument();
      });
    });

    it('should allow retry on error', async () => {
      vi.mocked(tenantAdminService.getTenantUsageStatistics).mockRejectedValueOnce(
        new Error('Network error')
      ).mockResolvedValueOnce(mockUsageStats);

      const Wrapper = createWrapper();
      render(<TenantAdminDashboard />, { wrapper: Wrapper });

      await waitFor(() => {
        const retryBtn = screen.getByRole('button', { name: /Retry/i });
        fireEvent.click(retryBtn);
      });

      await waitFor(() => {
        expect(screen.getByText('45 / 100')).toBeInTheDocument();
      });
    });
  });
});