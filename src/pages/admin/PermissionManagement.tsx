/**
 * Permission Management UI
 * Admin interface for managing RBAC permissions
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Users, 
  Settings,
  AlertCircle
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  is_system: boolean;
}

interface Resource {
  id: string;
  key: string;
  kind: string;
  description: string;
  category: string;
  is_active: boolean;
}

interface Permission {
  id: string;
  role_id: string;
  role_name: string;
  resource_key: string;
  resource_description: string;
  actions: string[];
  expires_at: string | null;
}

export const PermissionManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedResource, setSelectedResource] = useState<string>('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const availableActions = ['read', 'write', 'create', 'update', 'delete', 'admin'];

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('name');

      if (rolesError) throw rolesError;

      // Load resources
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true });

      if (resourcesError) throw resourcesError;

      // Load permissions with details
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permission_details')
        .select('*')
        .order('role_name', { ascending: true })
        .order('resource_key', { ascending: true });

      if (permissionsError) throw permissionsError;

      setRoles(rolesData || []);
      setResources(resourcesData || []);
      setPermissions(permissionsData || []);
    } catch (err) {
      console.error('Error loading permission data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = async () => {
    if (!selectedRole || !selectedResource || selectedActions.length === 0) {
      setError('Please select role, resource, and at least one action');
      return;
    }

    try {
      const role = roles.find(r => r.id === selectedRole);
      if (!role) return;

      const { error } = await supabase
        .rpc('grant_permission', {
          p_role_name: role.name,
          p_resource_key: selectedResource,
          p_actions: selectedActions
        });

      if (error) throw error;

      // Reload permissions
      await loadData();
      
      // Reset form
      setSelectedRole('');
      setSelectedResource('');
      setSelectedActions([]);
      setShowAddDialog(false);
      
      setError(null);
    } catch (err) {
      console.error('Error adding permission:', err);
      setError(err instanceof Error ? err.message : 'Failed to add permission');
    }
  };

  const handleRemovePermission = async (roleId: string, resourceKey: string) => {
    try {
      const role = roles.find(r => r.id === roleId);
      if (!role) return;

      const { error } = await supabase
        .rpc('revoke_permission', {
          p_role_name: role.name,
          p_resource_key: resourceKey
        });

      if (error) throw error;

      await loadData();
      setError(null);
    } catch (err) {
      console.error('Error removing permission:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove permission');
    }
  };

  const handleActionToggle = (action: string) => {
    setSelectedActions(prev => 
      prev.includes(action) 
        ? prev.filter(a => a !== action)
        : [...prev, action]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PermissionGuard 
      resource="page:permission_management" 
      action="admin"
      fallback={
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need platform admin privileges to manage permissions.
          </AlertDescription>
        </Alert>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Permission Management</h1>
            <p className="text-gray-600 mt-1">
              Manage roles, resources, and permissions for your application
            </p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Permission
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Permission</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Resource</label>
                  <Select value={selectedResource} onValueChange={setSelectedResource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resource" />
                    </SelectTrigger>
                    <SelectContent>
                      {resources.map(resource => (
                        <SelectItem key={resource.id} value={resource.key}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{resource.kind}</Badge>
                            {resource.key}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Actions</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableActions.map(action => (
                      <Button
                        key={action}
                        variant={selectedActions.includes(action) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleActionToggle(action)}
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPermission}>
                    Add Permission
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roles.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resources.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{permissions.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Permissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Current Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow key={`${permission.role_id}-${permission.resource_key}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{permission.role_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{permission.resource_key}</div>
                        <div className="text-sm text-gray-500">
                          {permission.resource_description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {permission.actions.map(action => (
                          <Badge key={action} variant="secondary" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {permission.expires_at ? (
                        <Badge variant="outline">
                          {new Date(permission.expires_at).toLocaleDateString()}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Never</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemovePermission(permission.role_id, permission.resource_key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {permissions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No permissions configured yet. Add some permissions to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};