/**
 * RBAC Management UI - Complete Admin Interface
 * Includes permission matrix, resource management, and debug tools
 */

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard, PermissionDebug } from '@/components/PermissionGuard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertCircle,
  Grid,
  Eye,
  Bug,
  FileText,
  Layers,
  Monitor,
  Building2,
  BookOpen,
  ChevronDown,
  Home
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
  role_id: string;
  resource_id: string;
  actions: string[];
}

interface PermissionMatrix {
  [roleId: string]: {
    [resourceId: string]: string[];
  };
}

export const RBACManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pages');
  
  // Filter states
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // New resource form states
  const [showAddResourceDialog, setShowAddResourceDialog] = useState(false);
  const [newResourceKey, setNewResourceKey] = useState('');
  const [newResourceKind, setNewResourceKind] = useState('page');
  const [newResourceDescription, setNewResourceDescription] = useState('');
  const [newResourceCategory, setNewResourceCategory] = useState('content');

  const availableActions = ['read', 'write', 'create', 'update', 'delete', 'admin'];
  const availableKinds = ['page', 'api', 'feature', 'entity'];
  const availableCategories = ['dashboard', 'content', 'users', 'system', 'api', 'feature'];

  // Filter resources based on selected filters
  const filteredResources = resources.filter(resource => {
    const matchesKind = resourceFilter === 'all' || resource.kind === resourceFilter;
    const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;
    return matchesKind && matchesCategory;
  });

  // Get unique categories from current resources
  const uniqueCategories = [...new Set(resources.map(r => r.category))].sort();

  // Define page hierarchy structure matching sidebar navigation
  const pageHierarchy = [
    {
      section: "Dashboard",
      icon: Monitor,
      pages: resources.filter(r => r.kind === 'page' && r.key.includes('dashboard')),
    },
    {
      section: "Admin & Management", 
      icon: Shield,
      pages: resources.filter(r => r.kind === 'page' && (
        r.key.includes('tenant') || r.key.includes('teacher') || r.key.includes('student') || 
        r.key.includes('class') || r.key.includes('access')
      )),
    },
    {
      section: "Domain Management",
      icon: BookOpen, 
      pages: resources.filter(r => r.kind === 'page' && (
        r.key.includes('domain') || r.key.includes('concept') || r.key.includes('goal') || 
        r.key.includes('ai-guidance') || r.key.includes('example')
      )),
    },
    {
      section: "System",
      icon: Settings,
      pages: resources.filter(r => r.kind === 'page' && (
        r.key.includes('rbac') || r.key.includes('upload') || r.key.includes('setting') ||
        r.key.includes('feedback')
      )),
    },
    {
      section: "Authentication",
      icon: Users,
      pages: resources.filter(r => r.kind === 'page' && (
        r.key.includes('login') || r.key.includes('register') || r.key.includes('forgot') ||
        r.key.includes('auth') || r.key.includes('invitation')
      )),
    },
    {
      section: "Other Pages",
      icon: Home,
      pages: resources.filter(r => r.kind === 'page' && 
        !r.key.includes('dashboard') && !r.key.includes('tenant') && !r.key.includes('teacher') &&
        !r.key.includes('student') && !r.key.includes('class') && !r.key.includes('access') &&
        !r.key.includes('domain') && !r.key.includes('concept') && !r.key.includes('goal') &&
        !r.key.includes('ai-guidance') && !r.key.includes('example') && !r.key.includes('rbac') &&
        !r.key.includes('upload') && !r.key.includes('setting') && !r.key.includes('feedback') &&
        !r.key.includes('login') && !r.key.includes('register') && !r.key.includes('forgot') &&
        !r.key.includes('auth') && !r.key.includes('invitation')
      ),
    }
  ].filter(section => section.pages.length > 0); // Only show sections with pages

  // Reorder roles: Platform Admin, Tenant Admin, Teacher, Student
  const orderedRoles = useMemo(() => {
    const roleOrder = ['platform_admin', 'tenant_admin', 'teacher', 'student'];
    return roles.sort((a, b) => {
      const aIndex = roleOrder.indexOf(a.name);
      const bIndex = roleOrder.indexOf(b.name);
      return (aIndex === -1 ? roleOrder.length : aIndex) - (bIndex === -1 ? roleOrder.length : bIndex);
    });
  }, [roles]);

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
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('key', { ascending: true });

      if (resourcesError) throw resourcesError;

      // Load permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('role_permissions')
        .select('role_id, resource_id, actions');

      if (permissionsError) throw permissionsError;

      // Build permission matrix
      const matrix: PermissionMatrix = {};
      rolesData?.forEach(role => {
        matrix[role.id] = {};
        resourcesData?.forEach(resource => {
          matrix[role.id][resource.id] = [];
        });
      });

      permissionsData?.forEach(perm => {
        if (matrix[perm.role_id] && matrix[perm.role_id][perm.resource_id]) {
          matrix[perm.role_id][perm.resource_id] = perm.actions || [];
        }
      });

      setRoles(rolesData || []);
      setResources(resourcesData || []);
      setPermissionMatrix(matrix);
    } catch (err) {
      console.error('Error loading RBAC data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (roleId: string, resourceId: string, action: string) => {
    try {
      const currentActions = permissionMatrix[roleId]?.[resourceId] || [];
      const hasAction = currentActions.includes(action);
      
      const role = roles.find(r => r.id === roleId);
      const resource = resources.find(r => r.id === resourceId);
      
      if (!role || !resource) return;

      if (hasAction) {
        // Remove action
        const newActions = currentActions.filter(a => a !== action);
        
        if (newActions.length === 0) {
          // Remove permission entirely
          await supabase.rpc('revoke_permission', {
            p_role_name: role.name,
            p_resource_key: resource.key
          });
        } else {
          // Update with remaining actions
          await supabase.rpc('grant_permission', {
            p_role_name: role.name,
            p_resource_key: resource.key,
            p_actions: newActions
          });
        }
      } else {
        // Add action
        const newActions = [...currentActions, action];
        await supabase.rpc('grant_permission', {
          p_role_name: role.name,
          p_resource_key: resource.key,
          p_actions: newActions
        });
      }

      // Update local state
      setPermissionMatrix(prev => ({
        ...prev,
        [roleId]: {
          ...prev[roleId],
          [resourceId]: hasAction 
            ? currentActions.filter(a => a !== action)
            : [...currentActions, action]
        }
      }));

    } catch (err) {
      console.error('Error toggling permission:', err);
      setError(err instanceof Error ? err.message : 'Failed to update permission');
    }
  };

  const handleAddResource = async () => {
    if (!newResourceKey || !newResourceDescription) {
      setError('Resource key and description are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('resources')
        .insert({
          key: newResourceKey,
          kind: newResourceKind,
          description: newResourceDescription,
          category: newResourceCategory,
          is_active: true
        });

      if (error) throw error;

      // Reset form
      setNewResourceKey('');
      setNewResourceDescription('');
      setNewResourceKind('page');
      setNewResourceCategory('content');
      setShowAddResourceDialog(false);
      
      // Reload data
      await loadData();
      setError(null);
    } catch (err) {
      console.error('Error adding resource:', err);
      setError(err instanceof Error ? err.message : 'Failed to add resource');
    }
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
            You need platform admin privileges to manage RBAC permissions.
          </AlertDescription>
        </Alert>
      }
    >
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">RBAC Management</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive role-based access control administration
          </p>
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
              <CardTitle className="text-sm font-medium">System Roles</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roles.length}</div>
              <p className="text-xs text-muted-foreground">
                {roles.filter(r => r.is_system).length} system roles
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Protected Resources</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resources.length}</div>
              <p className="text-xs text-muted-foreground">
                {new Set(resources.map(r => r.category)).size} categories
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(permissionMatrix).reduce((total, rolePerms) => 
                  total + Object.values(rolePerms).reduce((roleTotal, actions) => 
                    roleTotal + actions.length, 0), 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all roles and resources
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pages">
              <FileText className="h-4 w-4 mr-2" />
              Pages
            </TabsTrigger>
            <TabsTrigger value="features">
              <Layers className="h-4 w-4 mr-2" />
              Features
            </TabsTrigger>
            <TabsTrigger value="matrix">
              <Grid className="h-4 w-4 mr-2" />
              Permission Matrix
            </TabsTrigger>
            <TabsTrigger value="resources">
              <Settings className="h-4 w-4 mr-2" />
              Manage Resources
            </TabsTrigger>
            <TabsTrigger value="debug">
              <Bug className="h-4 w-4 mr-2" />
              Debug Tools
            </TabsTrigger>
          </TabsList>

          {/* Pages Tab */}
          <TabsContent value="pages" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      <FileText className="h-4 w-4 inline mr-2" />
                      Page Permissions
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Manage CRUD permissions for all pages with canonical names and URLs
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {resources.filter(r => r.kind === 'page').length} pages total
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Page Name</TableHead>
                        <TableHead className="font-semibold">URL</TableHead>
                        <TableHead className="font-semibold">Description</TableHead>
                        <TableHead className="font-semibold">Category</TableHead>
                        {/* Role Permission Columns */}
                        {orderedRoles.map(role => (
                          <TableHead key={role.id} className="text-center font-semibold">
                            <div className="space-y-1">
                              <div className="text-sm">{role.display_name}</div>
                              <div className="text-xs text-muted-foreground">{role.name}</div>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resources
                        .filter(r => r.kind === 'page')
                        .map((resource) => {
                          // Helper function to generate canonical page name and URL
                          const getPageInfo = (key: string) => {
                            const cleanKey = key.replace('page:', '');
                            
                            // Map specific pages to canonical names and URLs
                            const pageMap: Record<string, { name: string; url: string }> = {
                              'admin_dashboard': { name: 'Platform Admin Dashboard', url: '/admin/dashboard' },
                              'tenant_dashboard': { name: 'Tenant Dashboard', url: '/tenant/dashboard' },
                              'teacher_dashboard': { name: 'Teacher Dashboard', url: '/teacher/dashboard' },
                              'domain_selection': { name: 'Domain Selection', url: '/teacher/domain-selection' },
                              'curriculum_setup': { name: 'Curriculum Setup', url: '/teacher/settings/curriculum-setup' },
                              'class_creation': { name: 'Class Creation', url: '/teacher/classes/create' },
                              'administration': { name: 'Administration', url: '/teacher/administration' },
                              'domain_management': { name: 'Domain Management', url: '/teacher/administration/domains' },
                              'learning_goals': { name: 'Learning Goals', url: '/teacher/administration/learning-goals' },
                              'domains_dashboard': { name: 'Domains Dashboard', url: '/admin/domains/dashboard' },
                              'domain_admin': { name: 'Domain Admin', url: '/admin/domains/:slug' },
                              'domain_concepts': { name: 'Domain Concepts', url: '/admin/domains/:slug/concepts' },
                              'concept_detail': { name: 'Concept Detail', url: '/admin/domains/:slug/concepts/:id' },
                              'domain_goals': { name: 'Domain Goals', url: '/admin/domains/:slug/goals' },
                              'ai_guidance': { name: 'AI Guidance', url: '/admin/domains/:slug/ai-guidance' },
                              'guidance_editor': { name: 'Guidance Editor', url: '/admin/domains/:slug/ai-guidance/:area' },
                              'add_examples': { name: 'Add Examples', url: '/admin/domains/:slug/ai-guidance/:area/examples/new' },
                              'clients': { name: 'Clients', url: '/admin/clients' },
                              'permissions': { name: 'Permissions', url: '/admin/permissions' },
                              'upload': { name: 'Upload', url: '/admin/upload' },
                              'page_permissions': { name: 'Page Permissions', url: '/admin/page-permissions' },
                              'ai_training': { name: 'AI Training', url: '/admin/ai-training' },
                              'feedback_settings': { name: 'Feedback Settings', url: '/admin/settings/feedback' },
                              'rbac_permissions': { name: 'RBAC Permissions', url: '/admin/rbac-permissions' },
                              'rbac_management': { name: 'RBAC Management', url: '/admin/rbac-management' },
                              'access_management': { name: 'Access Management', url: '/admin/access-management' },
                              'tenant_management': { name: 'Tenant Management', url: '/admin/tenants' },
                              'create_tenant': { name: 'Create Tenant', url: '/admin/tenants/create' },
                              'edit_tenant': { name: 'Edit Tenant', url: '/admin/tenants/:id/edit' },
                              'tenant_detail': { name: 'Tenant Detail', url: '/admin/tenants/:id' }
                            };

                            // Return mapped value or generate from key
                            if (pageMap[cleanKey]) {
                              return pageMap[cleanKey];
                            }

                            // Fallback: generate name and URL from key
                            const name = cleanKey
                              .replace(/_/g, ' ')
                              .replace(/\b\w/g, l => l.toUpperCase());
                            
                            const url = `/${cleanKey.replace(/_/g, '/')}`;
                            
                            return { name, url };
                          };

                          const pageInfo = getPageInfo(resource.key);

                          return (
                            <TableRow key={resource.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">
                                {pageInfo.name}
                              </TableCell>
                              <TableCell className="font-mono text-sm text-blue-600">
                                {pageInfo.url}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {resource.description || 'No description available'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {resource.category}
                                </Badge>
                              </TableCell>
                              {/* Role Permission Cells */}
                              {orderedRoles.map(role => (
                                <TableCell key={`${role.id}-${resource.id}`} className="text-center px-2">
                                  <div className="inline-grid grid-cols-2 gap-0.5 mx-auto">
                                    {['create', 'read', 'update', 'delete'].map(action => {
                                      const hasPermission = permissionMatrix[role.id]?.[resource.id]?.includes(action);
                                      return (
                                        <Badge
                                          key={action}
                                          variant={hasPermission ? "default" : "outline"}
                                          className={`cursor-pointer text-xs transition-colors w-6 h-6 flex items-center justify-center rounded-full ${
                                            hasPermission 
                                              ? "bg-green-500 hover:bg-green-600 text-white" 
                                              : "hover:bg-gray-200"
                                          }`}
                                          onClick={() => togglePermission(role.id, resource.id, action)}
                                        >
                                          {action.charAt(0).toUpperCase()}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </TableCell>
                              ))}
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      <Layers className="h-4 w-4 inline mr-2" />
                      Feature Permissions
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Control access to specific features and functionality
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Feature</TableHead>
                        {orderedRoles.map(role => (
                          <TableHead key={role.id} className="text-center min-w-[150px]">
                            <div>
                              <div className="font-semibold">{role.display_name}</div>
                              <div className="text-xs text-muted-foreground">{role.name}</div>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resources.filter(resource => resource.kind === 'feature').map(resource => (
                        <TableRow key={resource.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{resource.key.replace('feature:', '')}</div>
                              <div className="text-sm text-muted-foreground">{resource.description}</div>
                              <div className="flex gap-1 mt-1">
                                <Badge variant="secondary" className="text-xs">{resource.category}</Badge>
                              </div>
                            </div>
                          </TableCell>
                          {orderedRoles.map(role => (
                            <TableCell key={`${role.id}-${resource.id}`} className="text-center">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {['read', 'write', 'create', 'update', 'delete'].map(action => {
                                  const hasPermission = permissionMatrix[role.id]?.[resource.id]?.includes(action);
                                  return (
                                    <Badge
                                      key={action}
                                      variant={hasPermission ? "default" : "outline"}
                                      className={`cursor-pointer text-xs ${
                                        hasPermission 
                                          ? "bg-green-500 hover:bg-green-600" 
                                          : "hover:bg-gray-200"
                                      }`}
                                      onClick={() => togglePermission(role.id, resource.id, action)}
                                    >
                                      {action}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permission Matrix Tab */}
          <TabsContent value="matrix" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Permission Matrix</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Toggle permissions for each role and resource combination. Click action badges to grant/revoke permissions.
                    </p>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="resource-filter" className="text-sm font-medium">Kind:</Label>
                      <Select value={resourceFilter} onValueChange={setResourceFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {availableKinds.map(kind => (
                            <SelectItem key={kind} value={kind}>{kind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label htmlFor="category-filter" className="text-sm font-medium">Category:</Label>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {uniqueCategories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Showing {filteredResources.length} of {resources.length} resources
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Resource</TableHead>
                        {orderedRoles.map(role => (
                          <TableHead key={role.id} className="text-center min-w-[150px]">
                            <div>
                              <div className="font-semibold">{role.display_name}</div>
                              <div className="text-xs text-muted-foreground">{role.name}</div>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResources.map(resource => (
                        <TableRow key={resource.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{resource.key}</div>
                              <div className="text-sm text-muted-foreground">{resource.description}</div>
                              <div className="flex gap-1 mt-1">
                                <Badge variant="outline" className="text-xs">{resource.kind}</Badge>
                                <Badge variant="secondary" className="text-xs">{resource.category}</Badge>
                              </div>
                            </div>
                          </TableCell>
                          {orderedRoles.map(role => (
                            <TableCell key={`${role.id}-${resource.id}`} className="text-center">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {availableActions.map(action => {
                                  const hasPermission = permissionMatrix[role.id]?.[resource.id]?.includes(action);
                                  return (
                                    <Badge
                                      key={action}
                                      variant={hasPermission ? "default" : "outline"}
                                      className={`cursor-pointer text-xs ${
                                        hasPermission 
                                          ? "bg-green-500 hover:bg-green-600" 
                                          : "hover:bg-gray-200"
                                      }`}
                                      onClick={() => togglePermission(role.id, resource.id, action)}
                                    >
                                      {action}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Management Tab */}
          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Resource Management</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Add new resources to the permission system
                    </p>
                  </div>
                  <Dialog open={showAddResourceDialog} onOpenChange={setShowAddResourceDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Resource
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Add New Resource</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="resource-key">Resource Key</Label>
                          <Input
                            id="resource-key"
                            placeholder="e.g., page:new_feature, api:new_endpoint"
                            value={newResourceKey}
                            onChange={(e) => setNewResourceKey(e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="resource-kind">Kind</Label>
                          <Select value={newResourceKind} onValueChange={setNewResourceKind}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableKinds.map(kind => (
                                <SelectItem key={kind} value={kind}>{kind}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="resource-category">Category</Label>
                          <Select value={newResourceCategory} onValueChange={setNewResourceCategory}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCategories.map(category => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="resource-description">Description</Label>
                          <Input
                            id="resource-description"
                            placeholder="Describe what this resource protects"
                            value={newResourceDescription}
                            onChange={(e) => setNewResourceDescription(e.target.value)}
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowAddResourceDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddResource}>
                            Add Resource
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add filters here too */}
                  <div className="flex items-center gap-4 pb-4 border-b">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Kind:</Label>
                      <Select value={resourceFilter} onValueChange={setResourceFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {availableKinds.map(kind => (
                            <SelectItem key={kind} value={kind}>{kind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Category:</Label>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {uniqueCategories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {filteredResources.length} resources
                    </div>
                  </div>
                  
                  {uniqueCategories.map(category => {
                    const categoryResources = filteredResources.filter(r => r.category === category);
                    if (categoryResources.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <h3 className="text-lg font-semibold capitalize mb-2">{category}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {categoryResources.map(resource => (
                            <Card key={resource.id} className="p-3">
                              <div className="space-y-1">
                                <div className="font-medium text-sm">{resource.key}</div>
                                <div className="text-xs text-muted-foreground">{resource.description}</div>
                                <Badge variant="outline" className="text-xs">{resource.kind}</Badge>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Debug Tools Tab */}
          <TabsContent value="debug" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Bug className="h-4 w-4 inline mr-2" />
                  Permission Debug Tools
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  View current user permissions and debug RBAC issues
                </p>
              </CardHeader>
              <CardContent>
                <PermissionDebug />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  );
};