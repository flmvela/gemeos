/**
 * Tenant Settings Step
 * Final step of the tenant wizard for configuring features and customization
 */

import React, { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Palette, 
  BarChart3, 
  FileText, 
  Users2, 
  Cpu, 
  Globe,
  Image,
  Info,
  Sparkles,
  Upload,
  X
} from 'lucide-react';
import { useSettingsStep } from '@/stores/tenant-wizard.store';
import { useToast } from '@/hooks/use-toast';

const FEATURE_CATEGORIES = {
  analytics: {
    title: 'Analytics & Reporting',
    icon: BarChart3,
    features: [
      {
        key: 'analytics',
        name: 'Usage Analytics',
        description: 'Track user activity, learning progress, and engagement metrics',
        recommended: true
      },
      {
        key: 'advanced_reporting',
        name: 'Advanced Reporting',
        description: 'Generate detailed reports, export data, and create custom dashboards',
        premium: true
      },
      {
        key: 'real_time_metrics',
        name: 'Real-time Metrics',
        description: 'Live updates of user activity and system performance',
        premium: true
      }
    ]
  },
  collaboration: {
    title: 'Collaboration & Communication',
    icon: Users2,
    features: [
      {
        key: 'team_collaboration',
        name: 'Team Collaboration',
        description: 'Enable teachers to collaborate on content and share resources',
        recommended: true
      },
      {
        key: 'messaging_system',
        name: 'Internal Messaging',
        description: 'Built-in messaging system for tenant members',
        premium: true
      },
      {
        key: 'announcement_system',
        name: 'Announcements',
        description: 'Broadcast important messages to all users in the tenant',
        recommended: true
      }
    ]
  },
  customization: {
    title: 'Branding & Customization',
    icon: Palette,
    features: [
      {
        key: 'custom_branding',
        name: 'Custom Branding',
        description: 'Upload logos, customize colors, and personalize the interface',
        premium: true
      },
      {
        key: 'white_label',
        name: 'White Label',
        description: 'Remove Gemeos branding and use your own',
        enterprise: true
      },
      {
        key: 'custom_domains',
        name: 'Custom Domains',
        description: 'Use your own domain name (e.g., learning.yourcompany.com)',
        enterprise: true
      }
    ]
  },
  integrations: {
    title: 'Integrations & API',
    icon: Cpu,
    features: [
      {
        key: 'api_access',
        name: 'API Access',
        description: 'Integrate with external systems using our REST API',
        premium: true
      },
      {
        key: 'sso_integration',
        name: 'Single Sign-On (SSO)',
        description: 'Connect with SAML, OIDC, or Active Directory',
        enterprise: true
      },
      {
        key: 'webhook_notifications',
        name: 'Webhook Notifications',
        description: 'Receive real-time notifications about user events',
        premium: true
      }
    ]
  }
};

export const TenantSettingsStep: React.FC = () => {
  const { data, update, errors } = useSettingsStep();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    data.customization.logo_url || null
  );

  const toggleFeature = (featureKey: string) => {
    const newFeatures = {
      ...data.features,
      [featureKey]: !data.features[featureKey]
    };
    update({ features: newFeatures });
  };

  const updateCustomization = (field: string, value: string) => {
    const newCustomization = {
      ...data.customization,
      [field]: value
    };
    update({ customization: newCustomization });
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PNG, JPG, or SVG file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 2MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingLogo(true);

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);

      // For now, just store the file as base64 for preview
      // In a real implementation, you would upload to cloud storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        updateCustomization('logo_url', result);
        
        toast({
          title: "Logo uploaded",
          description: "Logo has been uploaded successfully",
        });
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    updateCustomization('logo_url', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFeatureBadge = (feature: { enterprise?: boolean; premium?: boolean; recommended?: boolean }) => {
    if (feature.enterprise) {
      return <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200">Enterprise</Badge>;
    }
    if (feature.premium) {
      return <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">Premium</Badge>;
    }
    if (feature.recommended) {
      return <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">Recommended</Badge>;
    }
    return null;
  };

  const enabledFeaturesCount = Object.values(data.features).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium mb-1">Tenant Configuration</h4>
            <p className="text-sm text-muted-foreground">
              Configure features, branding, and customization options for this tenant. 
              You can modify these settings later from the tenant management dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Configuration */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Feature Configuration</h3>
          <Badge variant="outline">
            {enabledFeaturesCount} feature{enabledFeaturesCount !== 1 ? 's' : ''} enabled
          </Badge>
        </div>

        {Object.entries(FEATURE_CATEGORIES).map(([categoryKey, category]) => (
          <Card key={categoryKey}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <category.icon className="h-5 w-5 text-primary" />
                {category.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {category.features.map((feature) => (
                  <div key={feature.key} className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium">{feature.name}</Label>
                        {getFeatureBadge(feature)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                    <Switch
                      checked={data.features[feature.key] || false}
                      onCheckedChange={() => toggleFeature(feature.key)}
                      className="ml-4"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Customization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Branding & Customization
          </CardTitle>
          <CardDescription>
            Customize the look and feel of this tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Theme Selection */}
            <div className="space-y-3">
              <Label className="font-medium">Color Theme</Label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: 'default', name: 'Default', color: '#2563eb' },
                  { value: 'green', name: 'Green', color: '#059669' },
                  { value: 'purple', name: 'Purple', color: '#7c3aed' },
                  { value: 'orange', name: 'Orange', color: '#ea580c' }
                ].map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => updateCustomization('theme', theme.value)}
                    className={`p-3 border rounded-lg text-center transition-all ${
                      data.customization.theme === theme.value
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <div 
                      className="w-6 h-6 rounded-full mx-auto mb-2" 
                      style={{ backgroundColor: theme.color }}
                    />
                    <div className="text-xs font-medium">{theme.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Primary Color */}
            <div className="space-y-2">
              <Label htmlFor="primary-color" className="font-medium">
                Custom Primary Color
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="primary-color"
                  type="color"
                  value={data.customization.primary_color || '#2563eb'}
                  onChange={(e) => updateCustomization('primary_color', e.target.value)}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  placeholder="#2563eb"
                  value={data.customization.primary_color || ''}
                  onChange={(e) => updateCustomization('primary_color', e.target.value)}
                  className="flex-1 font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This color will be used for buttons, links, and accents throughout the interface
              </p>
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label className="font-medium">Logo</Label>
              <div className="space-y-3">
                {logoPreview ? (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Current Logo</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeLogo}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="flex items-center justify-center bg-muted/30 rounded border p-4">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="max-h-16 max-w-32 object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div 
                    className="border border-dashed border-muted rounded-lg p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground mb-2">
                      Click to upload logo
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Recommended: 200x60px PNG, JPG, or SVG (max 2MB)
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {logoPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                  >
                    {isUploadingLogo ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Change Logo
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Configuration Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium mb-2">Enabled Features</div>
              <div className="space-y-1">
                {Object.entries(data.features)
                  .filter(([, enabled]) => enabled)
                  .map(([key, ]) => {
                    // Find the feature definition
                    const feature = Object.values(FEATURE_CATEGORIES)
                      .flatMap(cat => cat.features)
                      .find(f => f.key === key);
                    
                    return feature ? (
                      <div key={key} className="text-xs text-muted-foreground">
                        • {feature.name}
                      </div>
                    ) : null;
                  })
                }
                {enabledFeaturesCount === 0 && (
                  <div className="text-xs text-muted-foreground italic">
                    No features enabled
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2">Customization</div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>• Theme: {data.customization.theme || 'Default'}</div>
                <div>• Primary Color: {data.customization.primary_color || '#2563eb'}</div>
                <div>• Logo: {data.customization.logo_url ? 'Custom' : 'Default'}</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>
                These settings can be modified later from the tenant settings page
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};