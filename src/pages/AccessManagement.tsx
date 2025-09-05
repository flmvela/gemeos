/**
 * Access Management Dashboard
 * Centralized interface for managing permissions, roles, and access control
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { accessManagementService } from '@/services/access-management.service';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ShieldCheck, 
  Users, 
  Lock, 
  Activity, 
  AlertCircle,
  Download,
  RefreshCw,
  Settings,
  CheckCircle2,
  XCircle,
  UserPlus,
  Building,
  Mail,
  Send
} from 'lucide-react';
import { CreateTenantModal } from '@/components/tenant-admin/CreateTenantModal';
import { TenantList } from '@/components/tenant-admin/TenantList';
import { DomainAssignmentModal } from '@/components/tenant-admin/DomainAssignmentModal';
import { DomainOverview } from '@/components/tenant-admin/DomainOverview';
import { TenantAdminInviteModal } from '@/components/tenant-admin/TenantAdminInviteModal';
import { InvitationList } from '@/components/tenant-admin/InvitationList';
import { InvitationOverview } from '@/components/tenant-admin/InvitationOverview';
import type { Tenant } from '@/types/auth.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const RESOURCES = ['users', 'domains', 'concepts', 'learning_goals', 'reports'];
const ACTIONS = ['create', 'read', 'update', 'delete'];
const ROLES = ['platform_admin', 'tenant_admin', 'teacher', 'student'];

export default function AccessManagement() {
  const { isPlatformAdmin, session } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({ open: false, title: '', description: '', action: () => {} });
  const [cacheCleared, setCacheCleared] = useState(false);

  // Fetch accessible routes
  const { data: accessibleRoutes } = useQuery({
    queryKey: ['accessible-routes'],
    queryFn: () => accessManagementService.getUserAccessibleRoutes(),
  });

  // Fetch permission matrix
  const { data: permissionMatrix } = useQuery({
    queryKey: ['permission-matrix'],
    queryFn: async () => {
      const permissions = [];
      for (const resource of RESOURCES) {
        for (const action of ACTIONS) {
          permissions.push({ resource, action });
        }
      }
      return accessManagementService.checkMultiplePermissions(permissions);
    },
  });

  // Fetch audit logs
  const { data: auditLogs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Get cache size
  const cacheSize = useMemo(() => {
    return accessManagementService.getCacheSize();
  }, [cacheCleared]);

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ userId, resource, action, granted }: any) => {
      await accessManagementService.updatePermission(userId, resource, action, granted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
      toast.success('Permission updated successfully');
    },
    onError: () => {
      toast.error('Failed to update permission');
    },
  });

  // Bulk update permissions mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: any[]) => {
      await accessManagementService.bulkUpdatePermissions(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
      toast.success('Permissions updated successfully');
      setSelectedPermissions(new Set());
    },
    onError: () => {
      toast.error('Failed to update permissions');
    },
  });

  const handleClearCache = () => {
    accessManagementService.clearCache();
    setCacheCleared(true);
    toast.success('Cache cleared successfully');
    setTimeout(() => setCacheCleared(false), 3000);
  };

  const handleBulkGrant = () => {
    const updates = Array.from(selectedPermissions).map(key => {
      const [resource, action, role] = key.split(':');
      return { user_id: role, resource, action, granted: true };
    });
    bulkUpdateMutation.mutate(updates);
  };

  const handleBulkRevoke = () => {
    const updates = Array.from(selectedPermissions).map(key => {
      const [resource, action, role] = key.split(':');
      return { user_id: role, resource, action, granted: false };
    });
    bulkUpdateMutation.mutate(updates);
  };

  const exportAuditLogs = () => {
    if (!auditLogs) return;
    
    const csv = [
      ['Timestamp', 'User', 'Action', 'Resource', 'Details'].join(','),
      ...auditLogs.map(log => [
        log.created_at,
        log.user_id,
        log.action,
        log.resource_type || '',
        JSON.stringify(log.changes || {}),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    a.click();
    
    toast.success('Audit logs exported');
  };

  if (!isPlatformAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Only platform administrators can access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Platform Admin Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Access Management</h1>
          <p className="text-muted-foreground mt-2">
            Centralized permission and role management system
          </p>
        </div>
        <div data-testid="platform-admin-badge" className="flex items-center gap-2">
          <Badge variant="default" className="bg-primary px-4 py-2">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Platform Admin
          </Badge>
        </div>
      </div>

      {/* Universal Access Alert */}
      <Alert className="border-primary">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">Universal Access Enabled</AlertTitle>
        <AlertDescription>
          As a platform administrator, you have complete access to all system resources and features.
          Your permissions bypass all access controls.
        </AlertDescription>
      </Alert>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            data-testid="quick-action-grant-all"
            onClick={() => setConfirmDialog({
              open: true,
              title: 'Grant All Permissions',
              description: 'Grant all permissions to selected roles?',
              action: handleBulkGrant,
            })}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Grant All
          </Button>
          <Button
            data-testid="quick-action-revoke-all"
            variant="destructive"
            onClick={() => setConfirmDialog({
              open: true,
              title: 'Revoke All Permissions',
              description: 'Are you sure you want to revoke all permissions? This action cannot be undone.',
              action: handleBulkRevoke,
            })}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Revoke All
          </Button>
          <Button
            data-testid="quick-action-reset-defaults"
            variant="outline"
            onClick={() => setConfirmDialog({
              open: true,
              title: 'Reset to Defaults',
              description: 'Reset all permissions to system defaults?',
              action: () => toast.info('Reset functionality coming soon'),
            })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Defaults
          </Button>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit-log">Audit Log</TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Access Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">All Routes Accessible</div>
                <p className="text-sm text-muted-foreground mt-1">Full System Control</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
                <p className="text-sm text-muted-foreground mt-1">{session?.email}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accessible Routes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{accessibleRoutes?.length || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">All system routes</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Platform Admin Privileges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div>
                  <p className="font-medium">Universal Access</p>
                  <p className="text-sm text-muted-foreground">
                    Cannot be modified for security reasons
                  </p>
                </div>
                <Switch 
                  checked={true} 
                  disabled={true}
                  data-testid="toggle-platform-admin"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Hierarchy</CardTitle>
              <CardDescription>
                System roles and their inheritance relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div data-testid="role-hierarchy" className="space-y-4">
                {ROLES.map((role, index) => (
                  <div key={role} className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                    <Badge variant={role === 'platform_admin' ? 'default' : 'secondary'}>
                      {role.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {index > 0 && (
                      <span className="text-sm text-muted-foreground">
                        inherits from {ROLES[index - 1].replace('_', ' ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>
                Track all permission changes and access attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Select data-testid="audit-filter-action">
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="permission_grant">Permission Grant</SelectItem>
                      <SelectItem value="permission_revoke">Permission Revoke</SelectItem>
                      <SelectItem value="permission_update">Permission Update</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    data-testid="export-audit-logs"
                    onClick={exportAuditLogs}
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div data-testid="audit-log-table" className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs?.map(log => (
                        <TableRow key={log.id}>
                          <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                          <TableCell>{log.user_id}</TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>{log.resource_type}</TableCell>
                          <TableCell>
                            <code className="text-xs">
                              {JSON.stringify(log.changes || {}, null, 2)}
                            </code>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tenant Management Tab */}
        <TabsContent value="tenants" className="space-y-4">
          <TenantManagementTab />
        </TabsContent>

        {/* User Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          <UserInvitationsTab />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Monitor system performance and cache statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Permission Cache</p>
                  <p className="text-2xl font-bold">Cache Size: {cacheSize} entries</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Cache Management</p>
                  <Button
                    data-testid="clear-cache-button"
                    onClick={handleClearCache}
                    variant="outline"
                    className="mt-2"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                  {cacheCleared && (
                    <p className="text-sm text-green-600 mt-2">Cache cleared successfully</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-action">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              data-testid="confirm-action"
              onClick={confirmDialog.action}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Tenant Management Component
function TenantManagementTab() {
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDomainAssignment, setShowDomainAssignment] = useState(false);
  const [tenantForDomainAssignment, setTenantForDomainAssignment] = useState<Tenant | null>(null);
  const [showTenantAdminInvite, setShowTenantAdminInvite] = useState(false);
  const [tenantForInvite, setTenantForInvite] = useState<Tenant | null>(null);

  const handleCreateSuccess = () => {
    // Refresh will happen automatically via React Query
  };

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    // Could open edit modal here
  };

  const handleViewTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    // Could open details modal here
  };

  const handleAssignDomains = (tenant: Tenant) => {
    setTenantForDomainAssignment(tenant);
    setShowDomainAssignment(true);
  };

  const handleDomainAssignmentSuccess = () => {
    // Refresh will happen automatically via React Query
    setTenantForDomainAssignment(null);
  };

  const handleInviteTenantAdmin = (tenant: Tenant) => {
    setTenantForInvite(tenant);
    setShowTenantAdminInvite(true);
  };

  const handleInviteSuccess = () => {
    // Refresh will happen automatically via React Query
    setTenantForInvite(null);
  };

  return (
    <div className="space-y-6">
      {/* Domain Assignment Overview */}
      <DomainOverview />
      
      {/* Tenant Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Tenant Management
              </CardTitle>
              <CardDescription>
                Create and manage company tenants and their domain assignments
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowCreateTenant(true)}
              className="flex items-center gap-2"
            >
              <Building className="h-4 w-4" />
              Create Tenant
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TenantList 
            onEditTenant={handleEditTenant}
            onViewTenant={handleViewTenant}
            onAssignDomains={handleAssignDomains}
            onInviteTenantAdmin={handleInviteTenantAdmin}
          />
        </CardContent>
      </Card>

      {/* Create Tenant Modal */}
      <CreateTenantModal
        open={showCreateTenant}
        onClose={() => setShowCreateTenant(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Domain Assignment Modal */}
      <DomainAssignmentModal
        tenant={tenantForDomainAssignment}
        open={showDomainAssignment}
        onClose={() => {
          setShowDomainAssignment(false);
          setTenantForDomainAssignment(null);
        }}
        onSuccess={handleDomainAssignmentSuccess}
      />

      {/* Tenant Admin Invite Modal */}
      <TenantAdminInviteModal
        tenant={tenantForInvite}
        open={showTenantAdminInvite}
        onClose={() => {
          setShowTenantAdminInvite(false);
          setTenantForInvite(null);
        }}
        onSuccess={handleInviteSuccess}
      />
    </div>
  );
}

// User Invitations Component
function UserInvitationsTab() {
  const [activeInvitationTab, setActiveInvitationTab] = useState('tenant-admins');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            User Invitations
          </CardTitle>
          <CardDescription>
            Send invitations to create new user accounts with appropriate roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeInvitationTab} onValueChange={setActiveInvitationTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tenant-admins">Tenant Admins</TabsTrigger>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
            </TabsList>

            <TabsContent value="tenant-admins" className="space-y-4">
              <TenantAdminInvitations />
            </TabsContent>

            <TabsContent value="teachers" className="space-y-4">
              <TeacherInvitations />
            </TabsContent>

            <TabsContent value="students" className="space-y-4">
              <StudentInvitations />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Tenant Admin Invitations Component
function TenantAdminInvitations() {
  return (
    <div className="space-y-6">
      {/* Invitation Overview */}
      <InvitationOverview />
      
      {/* Invitation List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Tenant Admin Invitations
          </CardTitle>
          <CardDescription>
            Manage tenant administrator invitations across all tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvitationList showTenantColumn={true} />
        </CardContent>
      </Card>
    </div>
  );
}

// Teacher Invitations Component  
function TeacherInvitations() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Invite Teachers</h3>
          <p className="text-sm text-muted-foreground">
            Platform admin can invite teachers to any tenant
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          Send Invitation
        </Button>
      </div>
      
      <div className="border rounded-lg p-6 bg-muted/50">
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Teacher Invitation Form</p>
          <p className="text-sm">Form fields: First Name, Last Name, Email, Tenant Selection</p>
          <p className="text-sm mt-2">✓ Can assign to any tenant</p>
          <p className="text-sm">✓ Domain assignment happens separately</p>
        </div>
      </div>
    </div>
  );
}

// Student Invitations Component
function StudentInvitations() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Invite Students</h3>
          <p className="text-sm text-muted-foreground">
            Platform admin can invite students to any tenant
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          Send Invitation
        </Button>
      </div>
      
      <div className="border rounded-lg p-6 bg-muted/50">
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Student Invitation Form</p>
          <p className="text-sm">Form fields: First Name, Last Name, Email, Tenant Selection</p>
          <p className="text-sm mt-2">✓ Can assign to any tenant</p>
          <p className="text-sm">✓ Teachers can also invite students within their tenant</p>
        </div>
      </div>
    </div>
  );
}