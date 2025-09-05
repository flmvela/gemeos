/**
 * Tenant Management Page
 * Main hub for managing all tenants with grid view and wizard
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TenantGridTable } from '@/components/tenant-management/TenantGridTable';
import { TenantWizard } from '@/components/tenant-management/TenantWizard';
import { TenantFilters } from '@/components/tenant-management/TenantFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building2, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { useTenantWizardStore } from '@/stores/tenant-wizard.store';
import type { TenantWithStats, TenantGridOptions } from '@/services/enhanced-tenant.service';
import { Badge } from '@/components/ui/badge';

export const TenantManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { openCreateWizard, openEditWizard } = useTenantWizardStore();
  
  // Filter state
  const [filters, setFilters] = useState<TenantGridOptions>({
    page: 1,
    pageSize: 20,
    search: '',
    status: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Memoized filter handlers to prevent unnecessary re-renders
  const handleSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  }, []);

  const handleStatusFilter = useCallback((status: string) => {
    setFilters(prev => ({ ...prev, status: status || '', page: 1 }));
  }, []);

  const handleSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  // Tenant action handlers
  const handleTenantSelect = useCallback((tenant: TenantWithStats) => {
    // Navigate to tenant detail page or open detail modal
    console.log('View tenant details:', tenant.tenant_id);
    // TODO: Implement tenant detail view
  }, []);

  const handleTenantEdit = useCallback((tenant: TenantWithStats) => {
    // Open edit wizard with tenant data
    const wizardData = {
      basic: {
        name: tenant.name,
        slug: tenant.slug,
        description: tenant.description || '',
        status: tenant.status as any,
        subscription_tier: tenant.subscription_tier as any
      },
      // TODO: Load domain assignments, limits, and admin data
      domains: {
        selectedDomainIds: [],
        domainSettings: new Map()
      },
      limits: {
        global_max_teachers: 50,
        global_max_students: 500,
        enforce_limits: true
      },
      admins: {
        invitations: []
      },
      settings: tenant.settings || {
        features: {},
        customization: {}
      }
    };
    
    openEditWizard(tenant.tenant_id, wizardData);
  }, [openEditWizard]);

  const handleManageDomains = useCallback((tenant: TenantWithStats) => {
    // Open domain management for this tenant
    console.log('Manage domains for tenant:', tenant.tenant_id);
    // TODO: Implement domain management interface
  }, []);

  const handleManageAdmins = useCallback((tenant: TenantWithStats) => {
    // Open admin management for this tenant
    console.log('Manage admins for tenant:', tenant.tenant_id);
    // TODO: Implement admin management interface
  }, []);

  const handleCreateTenant = useCallback(() => {
    openCreateWizard();
  }, [openCreateWizard]);

  // Summary statistics (these would come from an API in a real app)
  const summaryStats = useMemo(() => ({
    totalTenants: 0, // Will be populated from query results
    activeTenants: 0,
    totalDomains: 0,
    totalUsers: 0
  }), []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tenant Management</h1>
          <p className="text-muted-foreground">
            Manage all tenants, their domains, and user assignments
          </p>
        </div>
        
        <Button onClick={handleCreateTenant} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalTenants}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {summaryStats.activeTenants} active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Domains</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalDomains}</div>
            <p className="text-xs text-muted-foreground">
              Across all tenants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Teachers & students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <AlertCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TenantFilters
        searchValue={filters.search || ''}
        statusFilter={filters.status || ''}
        sortBy={filters.sortBy || 'name'}
        sortOrder={filters.sortOrder || 'asc'}
        onSearchChange={handleSearch}
        onStatusFilterChange={handleStatusFilter}
        onSortChange={handleSort}
      />

      {/* Main Tenant Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
          <CardDescription>
            Manage tenant information, domain assignments, and user limits
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <TenantGridTable
            filters={filters}
            onTenantSelect={handleTenantSelect}
            onTenantEdit={handleTenantEdit}
            onManageDomains={handleManageDomains}
            onManageAdmins={handleManageAdmins}
          />
        </CardContent>
      </Card>

      {/* Tenant Creation/Edit Wizard */}
      <TenantWizard />
    </div>
  );
};