/**
 * Tenant Admin Dashboard Component
 * Main dashboard for tenant administrators to manage their organization
 */

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Settings, 
  BookOpen, 
  Mail, 
  AlertCircle, 
  RefreshCw,
  Plus,
  Activity,
  Database,
  TrendingUp,
  UserPlus,
  Globe,
  Send
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { tenantAdminService } from '@/services/tenantAdmin.service';
import { AddTeacherModal } from './AddTeacherModal';
import { SendInvitationModal } from './SendInvitationModal';

/**
 * Main Tenant Admin Dashboard Component
 */
export function TenantAdminDashboard() {
  const { session, isTenantAdmin, hasPermission, authState } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showSendInvitation, setShowSendInvitation] = useState(false);

  // Check authorization
  const canManageUsers = hasPermission('users', 'create');
  const canManageDomains = hasPermission('domains', 'assign');
  const canViewSettings = hasPermission('tenants', 'update');

  // Fetch tenant settings
  const { data: tenantSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: () => tenantAdminService.getTenantSettings(),
    enabled: !!session,
  });

  // Fetch usage statistics
  const { 
    data: usageStats, 
    isLoading: usageLoading,
    error: usageError,
    refetch: refetchUsage
  } = useQuery({
    queryKey: ['tenant-usage'],
    queryFn: () => tenantAdminService.getTenantUsageStatistics(),
    enabled: !!session,
  });

  // Fetch teachers
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ['tenant-teachers'],
    queryFn: () => tenantAdminService.getTeachers(),
    enabled: !!session && canManageUsers,
  });

  // Fetch domains
  const { data: domains = [], isLoading: domainsLoading } = useQuery({
    queryKey: ['tenant-domains'],
    queryFn: () => tenantAdminService.getTenantDomains(),
    enabled: !!session && canManageDomains,
  });

  // Calculate statistics
  const activeTeachers = teachers.filter(t => t.status === 'active').length;
  const suspendedTeachers = teachers.filter(t => t.status === 'suspended').length;
  const activeDomains = domains.filter(d => d.is_active).length;
  const inactiveDomains = domains.filter(d => !d.is_active).length;

  // Check if approaching limits
  const userLimitWarning = usageStats && usageStats.max_users > 0 && 
    (usageStats.total_users / usageStats.max_users) > 0.9;
  const domainLimitWarning = usageStats && usageStats.max_domains > 0 &&
    (usageStats.total_domains / usageStats.max_domains) > 0.9;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['tenant-usage'] });
    queryClient.invalidateQueries({ queryKey: ['tenant-teachers'] });
    queryClient.invalidateQueries({ queryKey: ['tenant-domains'] });
  };

  // Loading state
  if (authState === 'authenticating' || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div data-testid="loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Authorization check
  if (!isTenantAdmin && !canManageUsers && !canManageDomains && !canViewSettings) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access the tenant administration dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Error state
  if (usageError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load dashboard data. Please try again.
            <Button 
              onClick={() => refetchUsage()} 
              variant="outline" 
              size="sm" 
              className="ml-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{tenantSettings?.name || 'Tenant Administration'}</h1>
          <p className="text-muted-foreground">Manage your organization's teachers, domains, and settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {tenantSettings?.subscription_tier ? 
              tenantSettings.subscription_tier.charAt(0).toUpperCase() + 
              tenantSettings.subscription_tier.slice(1) : 
              'Free'
            }
          </Badge>
          <Button onClick={handleRefresh} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Warnings */}
      {(userLimitWarning || domainLimitWarning) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Approaching Limits</AlertTitle>
          <AlertDescription>
            {userLimitWarning && <p>Approaching user limit ({usageStats?.total_users} / {usageStats?.max_users})</p>}
            {domainLimitWarning && <p>Approaching domain limit ({usageStats?.total_domains} / {usageStats?.max_domains})</p>}
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats?.total_users || 0} / {usageStats?.max_users || '∞'}
            </div>
            {usageStats?.max_users > 0 && (
              <Progress 
                value={(usageStats.total_users / usageStats.max_users) * 100} 
                className="mt-2"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domains</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats?.total_domains || 0} / {usageStats?.max_domains || '∞'}
            </div>
            {usageStats?.max_domains > 0 && (
              <Progress 
                value={(usageStats.total_domains / usageStats.max_domains) * 100} 
                className="mt-2"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats?.storage_used_gb || 0} GB / {usageStats?.storage_limit_gb || '∞'} GB
            </div>
            {usageStats?.storage_limit_gb > 0 && (
              <Progress 
                value={(usageStats.storage_used_gb / usageStats.storage_limit_gb) * 100} 
                className="mt-2"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTeachers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {suspendedTeachers > 0 && `${suspendedTeachers} Suspended`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {canManageUsers && (
            <Button onClick={() => setShowAddTeacher(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          )}
          {canManageDomains && (
            <Button variant="outline" onClick={() => navigate('/admin/domains')}>
              <Globe className="mr-2 h-4 w-4" />
              Manage Domains
            </Button>
          )}
          {canManageUsers && (
            <Button variant="outline" onClick={() => setShowSendInvitation(true)}>
              <Send className="mr-2 h-4 w-4" />
              Send Invitation
            </Button>
          )}
          {canViewSettings && (
            <Button variant="outline" onClick={() => navigate('/admin/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="teachers" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          {canViewSettings && <TabsTrigger value="settings">Settings</TabsTrigger>}
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teachers Overview</CardTitle>
              <CardDescription>
                {teachers.length} Total • {activeTeachers} Active • {suspendedTeachers} Suspended
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teachersLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : teachers.length > 0 ? (
                <div className="space-y-2">
                  {teachers.slice(0, 5).map((teacher) => (
                    <div key={teacher.user_id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{teacher.first_name} {teacher.last_name}</p>
                        <p className="text-sm text-muted-foreground">{teacher.email}</p>
                      </div>
                      <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
                        {teacher.status}
                      </Badge>
                    </div>
                  ))}
                  {teachers.length > 5 && (
                    <Button 
                      variant="link" 
                      className="w-full"
                      onClick={() => navigate('/admin/teachers')}
                    >
                      View All Teachers →
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No teachers found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domains Tab */}
        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Domain Overview</CardTitle>
              <CardDescription>
                {domains.length} Total Domains • {activeDomains} Active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div data-testid="domain-usage-chart" className="h-64 flex items-center justify-center border rounded">
                {/* Chart placeholder - would use recharts or similar */}
                <p className="text-muted-foreground">Domain Usage Chart</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        {canViewSettings && (
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Settings</CardTitle>
                <CardDescription>Configure your organization settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/admin/settings')}>
                  Open Settings →
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invitations</CardTitle>
              <CardDescription>Manage pending invitations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/admin/invitations')}>
                Manage Invitations →
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Activity feed will be displayed here</p>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showAddTeacher && (
        <AddTeacherModal 
          onClose={() => setShowAddTeacher(false)}
          onSuccess={() => {
            setShowAddTeacher(false);
            queryClient.invalidateQueries({ queryKey: ['tenant-teachers'] });
          }}
        />
      )}

      {showSendInvitation && (
        <SendInvitationModal
          onClose={() => setShowSendInvitation(false)}
          onSuccess={() => {
            setShowSendInvitation(false);
          }}
        />
      )}
    </div>
  );
}