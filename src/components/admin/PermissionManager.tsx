/**
 * Permission Management UI Component
 * Allows administrators to manage roles and permissions
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Users, 
  Key, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  Copy,
  Check,
  X,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  hierarchy_level: number;
  is_system_role: boolean;
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
  conditions?: any;
}

interface User {
  id: string;
  email: string;
  role?: string;
  tenant?: string;
}

/**
 * Main Permission Manager Component
 */
export const PermissionManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('roles');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedResource, setSelectedResource] = useState<string>('all');

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('hierarchy_level');
      if (error) throw error;
      return data as Role[];
    },
  });

  // Fetch permissions
  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('resource, action');
      if (error) throw error;
      return data as Permission[];
    },
  });

  // Fetch role permissions
  const { data: rolePermissions } = useQuery({
    queryKey: ['admin-role-permissions', selectedRole?.id],
    queryFn: async () => {
      if (!selectedRole) return [];
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_id', selectedRole.id);
      if (error) throw error;
      return data as RolePermission[];
    },
    enabled: !!selectedRole,
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permission Management
              </CardTitle>
              <CardDescription>
                Manage roles, permissions, and access control
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              Platform Admin Only
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="users">User Assignments</TabsTrigger>
              <TabsTrigger value="audit">Audit Log</TabsTrigger>
            </TabsList>

            <TabsContent value="roles" className="space-y-4">
              <RoleManagement 
                roles={roles || []}
                permissions={permissions || []}
                rolePermissions={rolePermissions || []}
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
              />
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <PermissionManagement 
                permissions={permissions || []}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedResource={selectedResource}
                onResourceChange={setSelectedResource}
              />
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <UserRoleAssignment roles={roles || []} />
            </TabsContent>

            <TabsContent value="audit" className="space-y-4">
              <AuditLog />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Role Management Component
 */
const RoleManagement: React.FC<{
  roles: Role[];
  permissions: Permission[];
  rolePermissions: RolePermission[];
  selectedRole: Role | null;
  onSelectRole: (role: Role | null) => void;
}> = ({ roles, permissions, rolePermissions, selectedRole, onSelectRole }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [permissionChanges, setPermissionChanges] = useState<Map<string, boolean>>(new Map());

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Check if role has permission
  const hasPermission = (permissionId: string): boolean => {
    const hasOriginal = rolePermissions.some(rp => rp.permission_id === permissionId);
    const change = permissionChanges.get(permissionId);
    return change !== undefined ? change : hasOriginal;
  };

  // Toggle permission
  const togglePermission = (permissionId: string) => {
    const current = hasPermission(permissionId);
    setPermissionChanges(prev => new Map(prev).set(permissionId, !current));
  };

  // Save permission changes
  const savePermissions = useMutation({
    mutationFn: async () => {
      if (!selectedRole) return;

      const updates: any[] = [];
      const deletes: string[] = [];

      permissionChanges.forEach((granted, permissionId) => {
        if (granted) {
          updates.push({
            role_id: selectedRole.id,
            permission_id: permissionId,
          });
        } else {
          deletes.push(permissionId);
        }
      });

      // Delete removed permissions
      if (deletes.length > 0) {
        await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', selectedRole.id)
          .in('permission_id', deletes);
      }

      // Add new permissions
      if (updates.length > 0) {
        await supabase
          .from('role_permissions')
          .upsert(updates, { onConflict: 'role_id,permission_id' });
      }
    },
    onSuccess: () => {
      toast({
        title: 'Permissions updated',
        description: 'Role permissions have been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-role-permissions'] });
      setPermissionChanges(new Map());
    },
    onError: (error) => {
      toast({
        title: 'Error updating permissions',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Role List */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-sm">Roles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => onSelectRole(role)}
                className={cn(
                  "w-full text-left px-4 py-2 hover:bg-muted transition-colors",
                  selectedRole?.id === role.id && "bg-muted"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{role.display_name}</p>
                    <p className="text-xs text-muted-foreground">{role.name}</p>
                  </div>
                  {role.is_system_role && (
                    <Badge variant="secondary" className="text-xs">System</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      <Card className="col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
              {selectedRole ? `Permissions for ${selectedRole.display_name}` : 'Select a role'}
            </CardTitle>
            {selectedRole && permissionChanges.size > 0 && (
              <Button onClick={() => savePermissions.mutate()} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Changes ({permissionChanges.size})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedRole ? (
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([resource, perms]) => (
                <div key={resource} className="space-y-2">
                  <h4 className="font-medium text-sm capitalize flex items-center gap-2">
                    <Key className="h-3 w-3" />
                    {resource.replace('_', ' ')}
                  </h4>
                  <div className="grid grid-cols-4 gap-2 pl-5">
                    {perms.map(perm => (
                      <label
                        key={perm.id}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <Switch
                          checked={hasPermission(perm.id)}
                          onCheckedChange={() => togglePermission(perm.id)}
                          disabled={selectedRole.is_system_role && selectedRole.name === 'platform_admin'}
                        />
                        <span className="text-sm">{perm.action}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Select a role to manage its permissions
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Permission Management Component
 */
const PermissionManagement: React.FC<{
  permissions: Permission[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedResource: string;
  onResourceChange: (resource: string) => void;
}> = ({ permissions, searchTerm, onSearchChange, selectedResource, onResourceChange }) => {
  // Get unique resources
  const resources = [...new Set(permissions.map(p => p.resource))];

  // Filter permissions
  const filteredPermissions = permissions.filter(perm => {
    const matchesSearch = searchTerm === '' || 
      perm.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResource = selectedResource === 'all' || perm.resource === selectedResource;
    return matchesSearch && matchesResource;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedResource} onValueChange={onResourceChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by resource" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            {resources.map(resource => (
              <SelectItem key={resource} value={resource}>
                {resource.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Permissions Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resource</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPermissions.map(perm => (
              <TableRow key={perm.id}>
                <TableCell className="font-medium">
                  <Badge variant="outline">{perm.resource}</Badge>
                </TableCell>
                <TableCell>{perm.action}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {perm.description || 'No description'}
                </TableCell>
                <TableCell className="font-mono text-xs">{perm.id.slice(0, 8)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

/**
 * User Role Assignment Component
 */
const UserRoleAssignment: React.FC<{ roles: Role[] }> = ({ roles }) => {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<string>('');
  
  // Fetch users with their current roles
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_tenants')
        .select(`
          user_id,
          users!inner(email),
          user_roles!inner(name, display_name),
          tenants!inner(name)
        `);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">User Role Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Email</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map(user => (
                <TableRow key={user.user_id}>
                  <TableCell>{user.users.email}</TableCell>
                  <TableCell>
                    <Badge>{user.user_roles.display_name}</Badge>
                  </TableCell>
                  <TableCell>{user.tenants.name}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Audit Log Component
 */
const AuditLog: React.FC = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Recent Permission Changes</CardTitle>
      </CardHeader>
      <CardContent>
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
            {logs?.map(log => (
              <TableRow key={log.id}>
                <TableCell className="text-xs">
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="text-sm">{log.user_id?.slice(0, 8)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{log.action}</Badge>
                </TableCell>
                <TableCell>{log.resource_type}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {JSON.stringify(log.changes)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};