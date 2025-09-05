/**
 * Tenant Grid Table Component
 * High-performance table with virtual scrolling for 100+ tenants
 * Target: <1.5 second initial load time
 */

import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getEnhancedTenantService, 
  type TenantWithStats, 
  type TenantGridOptions 
} from '@/services/enhanced-tenant.service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  MoreHorizontal,
  Users,
  GraduationCap,
  BookOpen,
  Edit,
  Eye,
  UserPlus,
  Settings,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface TenantGridTableProps {
  filters: TenantGridOptions;
  onTenantSelect: (tenant: TenantWithStats) => void;
  onTenantEdit: (tenant: TenantWithStats) => void;
  onManageDomains: (tenant: TenantWithStats) => void;
  onManageAdmins: (tenant: TenantWithStats) => void;
}

// Row height constant for virtual scrolling
const ROW_HEIGHT = 72;

export const TenantGridTable: React.FC<TenantGridTableProps> = ({
  filters,
  onTenantSelect,
  onTenantEdit,
  onManageDomains,
  onManageAdmins
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const tenantService = useMemo(() => getEnhancedTenantService(queryClient), [queryClient]);

  // Fetch tenants with React Query
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['tenants-grid', filters],
    queryFn: () => tenantService.getTenantsWithStats(filters),
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 60000 // Refresh every minute for real-time stats
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = tenantService.onStatsUpdate((update) => {
      // Update specific tenant in the grid without refetching all
      queryClient.setQueryData(['tenants-grid', filters], (old: any) => {
        if (!old) return old;
        
        const newData = {
          ...old,
          data: old.data.map((tenant: TenantWithStats) =>
            tenant.tenant_id === update.tenant_id
              ? {
                  ...tenant,
                  domain_count: update.domain_count ?? tenant.domain_count,
                  teacher_count: update.teacher_count ?? tenant.teacher_count,
                  student_count: update.student_count ?? tenant.student_count
                }
              : tenant
          )
        };
        
        return newData;
      });
    });

    return unsubscribe;
  }, [tenantService, queryClient, filters]);

  // Virtual scrolling setup
  const rowVirtualizer = useVirtualizer({
    count: data?.data.length || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => ROW_HEIGHT, []),
    overscan: 5, // Render 5 items outside viewport
    measureElement: typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
      ? (element) => element?.getBoundingClientRect().height
      : undefined,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Calculate padding for virtual scrolling
  const paddingTop = virtualItems.length > 0 
    ? virtualItems[0]?.start || 0 
    : 0;
    
  const paddingBottom = virtualItems.length > 0
    ? rowVirtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end || 0)
    : 0;

  // Prefetch next page when scrolling near bottom
  useEffect(() => {
    if (!parentRef.current || !data) return;

    const handleScroll = () => {
      const element = parentRef.current;
      if (!element) return;

      const { scrollTop, scrollHeight, clientHeight } = element;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      // When 80% scrolled, prefetch next page
      if (scrollPercentage > 0.8 && data.page < data.totalPages) {
        queryClient.prefetchQuery({
          queryKey: ['tenants-grid', { ...filters, page: data.page + 1 }],
          queryFn: () => tenantService.getTenantsWithStats({ ...filters, page: data.page + 1 }),
          staleTime: 60000,
        });
      }
    };

    const element = parentRef.current;
    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [data, filters, queryClient, tenantService]);

  if (isLoading) {
    return <TenantGridSkeleton />;
  }

  if (error) {
    return <TenantGridError error={error as Error} />;
  }

  if (!data || data.data.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="relative rounded-lg border bg-card">
      {/* Loading indicator for background refresh */}
      {isFetching && (
        <div className="absolute top-2 right-2 z-20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Updating...
          </div>
        </div>
      )}
      
      <div 
        ref={parentRef} 
        className="overflow-auto max-h-[calc(100vh-300px)] relative"
        style={{ contain: 'strict' }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
            <TableRow>
              <TableHead className="w-[300px]">Tenant</TableHead>
              <TableHead className="text-center w-[100px]">
                <div className="flex items-center justify-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  Domains
                </div>
              </TableHead>
              <TableHead className="text-center w-[100px]">
                <div className="flex items-center justify-center gap-1">
                  <Users className="h-4 w-4" />
                  Teachers
                </div>
              </TableHead>
              <TableHead className="text-center w-[100px]">
                <div className="flex items-center justify-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  Students
                </div>
              </TableHead>
              <TableHead className="text-center w-[100px]">
                <div className="flex items-center justify-center gap-1">
                  <Settings className="h-4 w-4" />
                  Admins
                </div>
              </TableHead>
              <TableHead className="text-center w-[120px]">Status</TableHead>
              <TableHead className="text-center w-[150px]">Last Activity</TableHead>
              <TableHead className="text-center w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: paddingTop }} />
              </tr>
            )}
            {virtualItems.map((virtualRow) => {
              const tenant = data.data[virtualRow.index];
              if (!tenant) return null;

              return (
                <TenantGridRow
                  key={tenant.tenant_id}
                  tenant={tenant}
                  onSelect={onTenantSelect}
                  onEdit={onTenantEdit}
                  onManageDomains={onManageDomains}
                  onManageAdmins={onManageAdmins}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start - virtualRow.index * virtualRow.size}px)`,
                  }}
                />
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: paddingBottom }} />
              </tr>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Individual row component
const TenantGridRow: React.FC<{
  tenant: TenantWithStats;
  onSelect: (tenant: TenantWithStats) => void;
  onEdit: (tenant: TenantWithStats) => void;
  onManageDomains: (tenant: TenantWithStats) => void;
  onManageAdmins: (tenant: TenantWithStats) => void;
  style: React.CSSProperties;
}> = React.memo(({ 
  tenant, 
  onSelect, 
  onEdit, 
  onManageDomains, 
  onManageAdmins, 
  style 
}) => {
  const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    trial: 'bg-blue-100 text-blue-800 border-blue-200',
    suspended: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const tierColors = {
    free: 'bg-gray-100 text-gray-800',
    basic: 'bg-blue-100 text-blue-800',
    premium: 'bg-purple-100 text-purple-800',
    enterprise: 'bg-amber-100 text-amber-800',
  };

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onSelect(tenant)}
      style={style}
    >
      <TableCell>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{tenant.name}</div>
            <div className="text-sm text-muted-foreground truncate">{tenant.slug}</div>
            <Badge 
              variant="outline" 
              className={cn("mt-1 text-xs", tierColors[tenant.subscription_tier as keyof typeof tierColors])}
            >
              {tenant.subscription_tier}
            </Badge>
          </div>
        </div>
      </TableCell>
      
      <TableCell className="text-center">
        <div className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
          {tenant.domain_count}
        </div>
      </TableCell>
      
      <TableCell className="text-center">
        <div className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
          {tenant.teacher_count}
        </div>
      </TableCell>
      
      <TableCell className="text-center">
        <div className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
          {tenant.student_count}
        </div>
      </TableCell>
      
      <TableCell className="text-center">
        <div className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
          {tenant.admin_count}
        </div>
      </TableCell>
      
      <TableCell className="text-center">
        <Badge 
          variant="outline"
          className={cn("capitalize", statusColors[tenant.status as keyof typeof statusColors])}
        >
          {tenant.status}
        </Badge>
      </TableCell>
      
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <Activity className="h-3 w-3" />
          {formatDistanceToNow(new Date(tenant.last_activity), { addSuffix: true })}
        </div>
      </TableCell>
      
      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onSelect(tenant)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(tenant)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Tenant
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onManageDomains(tenant)}>
              <BookOpen className="mr-2 h-4 w-4" />
              Manage Domains
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onManageAdmins(tenant)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Manage Admins
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

TenantGridRow.displayName = 'TenantGridRow';

// Skeleton loader for perceived performance
const TenantGridSkeleton: React.FC = () => (
  <div className="rounded-lg border bg-card p-4">
    <div className="space-y-3">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  </div>
);

// Error state component
const TenantGridError: React.FC<{ error: Error }> = ({ error }) => (
  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
    <div className="flex items-center gap-2 text-destructive mb-2">
      <Activity className="h-5 w-5" />
      <h3 className="font-semibold">Failed to load tenants</h3>
    </div>
    <p className="text-sm text-muted-foreground">{error.message}</p>
    <Button 
      variant="outline" 
      size="sm" 
      className="mt-4"
      onClick={() => window.location.reload()}
    >
      Retry
    </Button>
  </div>
);

// Empty state component
const EmptyState: React.FC = () => (
  <div className="rounded-lg border bg-card p-12 text-center">
    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
    <h3 className="text-lg font-semibold mb-2">No tenants found</h3>
    <p className="text-sm text-muted-foreground mb-6">
      Get started by creating your first tenant.
    </p>
    <Button>
      <UserPlus className="mr-2 h-4 w-4" />
      Create Tenant
    </Button>
  </div>
);