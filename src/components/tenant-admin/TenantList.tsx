/**
 * Tenant List Component
 * Displays list of tenants with management actions
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantService, type TenantFilters } from '@/services/tenant.service';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Building2, 
  MoreHorizontal, 
  Users, 
  BookOpen, 
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Settings,
  Link,
  UserPlus
} from 'lucide-react';
import type { Tenant, TenantStatus, SubscriptionTier } from '@/types/auth.types';

interface TenantListProps {
  onEditTenant?: (tenant: Tenant) => void;
  onViewTenant?: (tenant: Tenant) => void;
  onAssignDomains?: (tenant: Tenant) => void;
  onInviteTenantAdmin?: (tenant: Tenant) => void;
}

export function TenantList({ onEditTenant, onViewTenant, onAssignDomains, onInviteTenantAdmin }: TenantListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<TenantFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch tenants
  const { 
    data: tenants = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['tenants', filters],
    queryFn: () => tenantService.getTenants(filters),
  });

  // Delete tenant mutation
  const deleteTenantMutation = useMutation({
    mutationFn: (tenantId: string) => tenantService.deleteTenant(tenantId),
    onSuccess: () => {
      toast({
        title: 'Tenant Deleted',
        description: 'The tenant has been deactivated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete tenant.',
        variant: 'destructive',
      });
    },
  });

  // Apply search filter
  const filteredTenants = tenants.filter(tenant => 
    !searchTerm || 
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (key: keyof TenantFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  const getStatusBadge = (status: TenantStatus) => {
    const variants = {
      active: 'default',
      trial: 'secondary',
      suspended: 'destructive',
      inactive: 'outline',
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getSubscriptionBadge = (tier: SubscriptionTier) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-gold-100 text-gold-800',
    };

    return (
      <Badge className={colors[tier] || 'bg-gray-100 text-gray-800'}>
        {tier}
      </Badge>
    );
  };

  const handleDeleteTenant = (tenant: Tenant) => {
    if (confirm(`Are you sure you want to deactivate "${tenant.name}"? This action will set the tenant status to inactive.`)) {
      deleteTenantMutation.mutate(tenant.id);
    }
  };

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>Error loading tenants: {error.message}</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-2">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.subscription_tier || 'all'} onValueChange={(value) => handleFilterChange('subscription_tier', value)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => refetch()} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tenant Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Domains</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Loading tenants...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tenants found</p>
                  {searchTerm && (
                    <p className="text-sm">Try adjusting your search or filters</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-sm text-muted-foreground">{tenant.slug}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(tenant.status)}
                  </TableCell>
                  <TableCell>
                    {getSubscriptionBadge(tenant.subscription_tier)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">0/{tenant.max_users}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">0/{tenant.max_domains}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onViewTenant && (
                          <DropdownMenuItem onClick={() => onViewTenant(tenant)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        )}
                        {onInviteTenantAdmin && (
                          <DropdownMenuItem onClick={() => onInviteTenantAdmin(tenant)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invite Admin
                          </DropdownMenuItem>
                        )}
                        {onAssignDomains && (
                          <DropdownMenuItem onClick={() => onAssignDomains(tenant)}>
                            <Link className="h-4 w-4 mr-2" />
                            Assign Domains
                          </DropdownMenuItem>
                        )}
                        {onEditTenant && (
                          <DropdownMenuItem onClick={() => onEditTenant(tenant)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Tenant
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTenant(tenant)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      {filteredTenants.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredTenants.length} of {tenants.length} tenants
        </div>
      )}
    </div>
  );
}