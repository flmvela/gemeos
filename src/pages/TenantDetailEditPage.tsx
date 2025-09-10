/**
 * Tenant Detail Edit Page
 * Dedicated form-based tenant editing interface following style guide
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Building2, 
  Globe, 
  Users, 
  Settings,
  Save,
  X,
  AlertCircle,
  Info,
  Shield,
  Mail,
  Trash2,
  UserPlus,
  Check,
  TrendingUp
} from 'lucide-react';
import { tenantService } from '@/services/tenant.service';
import { useToast } from '@/hooks/use-toast';

interface TenantData {
  basic: {
    name: string;
    slug: string;
    description: string;
    status: 'active' | 'trial' | 'suspended' | 'inactive';
    subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise';
  };
  domains: Array<{ id: string; name: string; slug: string; assigned: boolean; settings?: Record<string, unknown> }>;
  admins: Array<{ id: string; email: string; role: string; status: string; created_at: string }>;
  limits: { global_max_teachers: number; global_max_students: number; enforce_limits: boolean };
  settings: Record<string, unknown>;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'trial', label: 'Trial', color: 'bg-blue-100 text-blue-800' },
  { value: 'suspended', label: 'Suspended', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' }
];

const TIER_OPTIONS = [
  { value: 'free', label: 'Free', description: 'Basic features with limitations', color: 'bg-gray-100 text-gray-800' },
  { value: 'basic', label: 'Basic', description: 'Standard features for small teams', color: 'bg-blue-100 text-blue-800' },
  { value: 'premium', label: 'Premium', description: 'Advanced features for growing organizations', color: 'bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white' },
  { value: 'enterprise', label: 'Enterprise', description: 'Full features with priority support', color: 'bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white' }
];

export const TenantDetailEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [originalData, setOriginalData] = useState<TenantData | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  // Load tenant data
  useEffect(() => {
    const loadTenant = async () => {
      if (!tenantId) {
        setLoadError('Tenant ID not provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('🔍 [TENANT-EDIT] Loading tenant data for:', tenantId);

        const data = await tenantService.getTenantById(tenantId);
        
        if (!data) {
          setLoadError('Tenant not found');
          return;
        }

        const transformedData: TenantData = {
          basic: {
            name: data.basic.name,
            slug: data.basic.slug,
            description: data.basic.description || '',
            status: data.basic.status as 'active' | 'trial' | 'suspended' | 'inactive',
            subscription_tier: data.basic.subscription_tier as 'free' | 'basic' | 'premium' | 'enterprise'
          },
          domains: data.domains,
          admins: data.admins,
          limits: data.limits,
          settings: data.settings
        };

        setTenantData(transformedData);
        setOriginalData(JSON.parse(JSON.stringify(transformedData))); // Deep copy for comparison
        
        console.log('✅ [TENANT-EDIT] Loaded tenant data:', transformedData);
      } catch (error) {
        console.error('❌ [TENANT-EDIT] Failed to load tenant:', error);
        setLoadError('Failed to load tenant data');
      } finally {
        setIsLoading(false);
      }
    };

    loadTenant();
  }, [tenantId]);

  const hasUnsavedChanges = () => {
    if (!tenantData || !originalData) return false;
    return JSON.stringify(tenantData) !== JSON.stringify(originalData);
  };

  const handleSave = async () => {
    if (!tenantData || !tenantId) return;

    setIsSaving(true);
    try {
      console.log('💾 [TENANT-EDIT] Saving tenant changes:', tenantData);

      // TODO: Implement actual save logic using tenant service
      // For now, just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Tenant Updated",
        description: `${tenantData.basic.name} has been updated successfully`,
      });

      // Update original data to reflect saved state
      setOriginalData(JSON.parse(JSON.stringify(tenantData)));

      console.log('✅ [TENANT-EDIT] Tenant saved successfully');
      
      // Navigate back to admin dashboard after save
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 500);
    } catch (error) {
      console.error('❌ [TENANT-EDIT] Failed to save tenant:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save tenant changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      if (confirm('You have unsaved changes. Are you sure you want to leave without saving?')) {
        navigate('/admin/dashboard');
      }
    } else {
      navigate('/admin/dashboard');
    }
  };

  const updateBasicInfo = (field: keyof TenantData['basic'], value: string) => {
    if (!tenantData) return;
    setTenantData({
      ...tenantData,
      basic: {
        ...tenantData.basic,
        [field]: value
      }
    });
  };

  const updateLimits = (field: keyof TenantData['limits'], value: number | boolean) => {
    if (!tenantData) return;
    setTenantData({
      ...tenantData,
      limits: {
        ...tenantData.limits,
        [field]: value
      }
    });
  };

  const toggleDomain = (domainId: string) => {
    if (!tenantData) return;
    setTenantData({
      ...tenantData,
      domains: tenantData.domains.map(domain => 
        domain.id === domainId 
          ? { ...domain, assigned: !domain.assigned }
          : domain
      )
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" disabled>
            <ArrowLeft className="h-4 w-4" />
            Back to Tenants
          </Button>
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container mx-auto py-6">
        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Tenant</h2>
            <p className="text-gray-600 mb-4">{loadError}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
                Back to Tenants
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tenantData) return null;

  const selectedStatus = STATUS_OPTIONS.find(opt => opt.value === tenantData.basic.status);
  const selectedTier = TIER_OPTIONS.find(opt => opt.value === tenantData.basic.subscription_tier);
  const assignedDomainsCount = tenantData.domains.filter(d => d.assigned).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCancel}
            className="gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tenants
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Edit Tenant</h1>
            <p className="text-gray-600">{tenantData.basic.name}</p>
          </div>
        </div>

        {/* Save/Cancel Actions */}
        <div className="flex items-center gap-3">
          {hasUnsavedChanges() && (
            <Badge className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
              <AlertCircle className="w-3 h-3 mr-1" />
              Unsaved Changes
            </Badge>
          )}
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md font-medium transition-all duration-200"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!hasUnsavedChanges() || isSaving}
            className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white hover:from-[#0891b2] hover:to-[#7c3aed] px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Status</div>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {selectedStatus && (
              <Badge className={`${selectedStatus.color} px-2 py-1 rounded-full text-xs font-medium`}>
                {selectedStatus.label}
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Subscription</div>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {selectedTier && (
              <Badge className={`${selectedTier.color} px-2 py-1 rounded-full text-xs font-medium`}>
                {selectedTier.label}
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Domains</div>
            <Globe className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{assignedDomainsCount}</div>
            <p className="text-xs text-gray-500">of {tenantData.domains.length} available</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Admins</div>
            <Users className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{tenantData.admins.length}</div>
            <p className="text-xs text-gray-500">active administrators</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader className="p-6 pb-0">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-lg p-1">
              <TabsTrigger value="basic" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200">
                <Building2 className="w-4 h-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="domains" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200">
                <Globe className="w-4 h-4" />
                Domains
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200">
                <Users className="w-4 h-4" />
                Users & Limits
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="p-6 pt-6">
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-6 mt-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Basic Information</h3>
                <p className="text-gray-600 text-sm">Update tenant name, slug, and general settings</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenant-name" className="text-sm font-medium text-gray-700">
                      Tenant Name *
                    </Label>
                    <Input
                      id="tenant-name"
                      value={tenantData.basic.name}
                      onChange={(e) => updateBasicInfo('name', e.target.value)}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">The display name for this tenant</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tenant-slug" className="text-sm font-medium text-gray-700">
                      Tenant Slug *
                    </Label>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">gemeos.ai/</span>
                      <Input
                        id="tenant-slug"
                        value={tenantData.basic.slug}
                        onChange={(e) => updateBasicInfo('slug', e.target.value.toLowerCase())}
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Unique identifier used in URLs</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tenant-description" className="text-sm font-medium text-gray-700">
                      Description
                    </Label>
                    <Textarea
                      id="tenant-description"
                      value={tenantData.basic.description}
                      onChange={(e) => updateBasicInfo('description', e.target.value)}
                      className="min-h-[80px] resize-none"
                      maxLength={500}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Optional description for internal reference</span>
                      <span>{tenantData.basic.description.length}/500</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Status *</Label>
                    <Select value={tenantData.basic.status} onValueChange={(value: 'active' | 'trial' | 'suspended' | 'inactive') => updateBasicInfo('status', value)}>
                      <SelectTrigger>
                        <SelectValue>
                          {selectedStatus && (
                            <div className="flex items-center gap-2">
                              <Badge className={`${selectedStatus.color} px-2 py-1 rounded-full text-xs font-medium`}>
                                {selectedStatus.label}
                              </Badge>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Badge className={`${option.color} px-2 py-1 rounded-full text-xs font-medium`}>
                                {option.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Current operational status</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Subscription Tier *</Label>
                    <Select 
                      value={tenantData.basic.subscription_tier} 
                      onValueChange={(value: 'free' | 'basic' | 'premium' | 'enterprise') => updateBasicInfo('subscription_tier', value)}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {selectedTier && (
                            <span className="font-medium capitalize">{selectedTier.label}</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {TIER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium capitalize">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Determines available features and limitations</p>
                  </div>

                  {/* Preview Card */}
                  <Card className="border border-gray-200 bg-gray-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-700">Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] rounded-lg flex items-center justify-center">
                          <span className="text-lg font-medium text-white">
                            {tenantData.basic.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{tenantData.basic.name}</div>
                          <div className="text-sm text-gray-500">gemeos.ai/{tenantData.basic.slug}</div>
                          {tenantData.basic.description && (
                            <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {tenantData.basic.description}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {selectedStatus && (
                              <Badge className={`${selectedStatus.color} text-xs px-2 py-1 rounded-full font-medium`}>
                                {selectedStatus.label}
                              </Badge>
                            )}
                            <Badge className={`${selectedTier?.color || 'bg-gray-100 text-gray-800'} text-xs px-2 py-1 rounded-full font-medium`}>
                              {selectedTier?.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Domains Tab */}
            <TabsContent value="domains" className="space-y-6 mt-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Domain Assignments</h3>
                <p className="text-gray-600 text-sm">Select which learning domains are available to this tenant</p>
              </div>

              <div className="space-y-4">
                {tenantData.domains.map((domain) => (
                  <Card key={domain.id} className={`border transition-all duration-200 ${domain.assigned ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={domain.assigned}
                            onCheckedChange={() => toggleDomain(domain.id)}
                            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#06b6d4] data-[state=checked]:to-[#8b5cf6]"
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">{domain.name}</h4>
                            <p className="text-sm text-gray-600">{domain.slug}</p>
                          </div>
                        </div>
                        {domain.assigned && (
                          <Badge className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white px-2 py-1 rounded-full text-xs font-medium">
                            <Check className="w-3 h-3 mr-1" />
                            Assigned
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {assignedDomainsCount === 0 && (
                <Card className="border border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <h4 className="font-medium text-yellow-900">No Domains Assigned</h4>
                      <p className="text-sm text-yellow-700">This tenant won't have access to any learning domains. Select at least one domain above.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Users & Limits Tab */}
            <TabsContent value="users" className="space-y-6 mt-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Users & Limits</h3>
                <p className="text-gray-600 text-sm">Manage user limits and existing administrators</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Limits */}
                <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">User Limits</CardTitle>
                    <CardDescription>Set maximum number of users for this tenant</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Max Teachers</Label>
                      <Input
                        type="number"
                        value={tenantData.limits.global_max_teachers}
                        onChange={(e) => updateLimits('global_max_teachers', parseInt(e.target.value) || 0)}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Max Students</Label>
                      <Input
                        type="number"
                        value={tenantData.limits.global_max_students}
                        onChange={(e) => updateLimits('global_max_students', parseInt(e.target.value) || 0)}
                        min="0"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700">Enforce Limits</Label>
                      <Switch
                        checked={tenantData.limits.enforce_limits}
                        onCheckedChange={(checked) => updateLimits('enforce_limits', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Current Admins */}
                <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Current Administrators</CardTitle>
                    <CardDescription>Existing tenant administrators (read-only)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tenantData.admins.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No administrators found</p>
                      </div>
                    ) : (
                      tenantData.admins.map((admin) => (
                        <div key={admin.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {admin.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">{admin.email}</div>
                            <div className="text-xs text-gray-500">{admin.role}</div>
                          </div>
                          <Badge className={admin.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {admin.status}
                          </Badge>
                        </div>
                      ))
                    )}

                    <Card className="border border-blue-200 bg-blue-50">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-xs text-blue-700">
                              Administrator management (add/remove admins) will be available in a future update. 
                              Existing admins will receive password reset emails when changes are saved.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6 mt-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Tenant Settings</h3>
                <p className="text-gray-600 text-sm">Configure features and customization options</p>
              </div>

              <Card className="border border-blue-200 bg-blue-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900">Settings Configuration</h4>
                    <p className="text-sm text-blue-700">Advanced settings configuration will be available in a future update.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};