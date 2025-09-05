/**
 * Simple Tenant Management Page for Testing
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Building2, Calendar, Users } from 'lucide-react';
import { TenantWizard } from '@/components/tenant-management/TenantWizard';
import { useTenantWizardStore } from '@/stores/tenant-wizard.store';
import { tenantService } from '@/services/tenant.service';
import type { Tenant } from '@/types/auth.types';
import { useToast } from '@/hooks/use-toast';

export const TenantManagementSimple: React.FC = () => {
  const { openCreateWizard } = useTenantWizardStore();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load tenants on component mount
  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      console.log('🔍 [TENANT-LIST] Loading tenants...');
      setIsLoading(true);
      const data = await tenantService.getTenants();
      console.log('✅ [TENANT-LIST] Loaded tenants:', data.length, 'tenants');
      console.log('✅ [TENANT-LIST] Tenant data:', data);
      setTenants(data);
    } catch (error) {
      console.error('❌ [TENANT-LIST] Error loading tenants:', error);
      toast({
        title: "Error Loading Tenants",
        description: "Failed to load tenant list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tenant Management</h1>
          <p className="text-muted-foreground">
            Manage all tenants, their domains, and user assignments
          </p>
        </div>
        
        <Button onClick={openCreateWizard} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{tenants.length}</div>
                <p className="text-xs text-muted-foreground">
                  {tenants.length === 0 ? 'No tenants yet' : 'Active tenants'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant List</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading tenants...' : `${tenants.length} tenant(s) found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No tenants found</p>
              <p className="text-sm">Get started by creating your first tenant.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tenants.map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{tenant.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Slug: {tenant.slug}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created {formatDate(tenant.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {tenant.subscription_tier} tier
                        </span>
                      </div>
                      {tenant.description && (
                        <p className="text-sm text-muted-foreground mt-1">{tenant.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(tenant.status)}>
                      {tenant.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tenant Creation Wizard */}
      <TenantWizard />
    </div>
  );
};