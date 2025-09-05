/**
 * Create Tenant Modal Component
 * Modal for platform admins to create new tenants (companies)
 */

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { tenantService, type CreateTenantData } from '@/services/tenant.service';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { SubscriptionTier, TenantStatus } from '@/types/auth.types';

interface CreateTenantModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTenantModal({ open, onClose, onSuccess }: CreateTenantModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CreateTenantData>({
    name: '',
    slug: '',
    description: '',
    subscription_tier: 'free',
    max_users: 10,
    max_domains: 2,
    status: 'active',
    settings: {},
  });

  const [slugCheck, setSlugCheck] = useState<{
    checking: boolean;
    available: boolean | null;
  }>({
    checking: false,
    available: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && !formData.slug) {
      const generatedSlug = tenantService.generateSlug(formData.name);
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, formData.slug]);

  // Check slug availability
  useEffect(() => {
    const checkSlug = async () => {
      if (!formData.slug || formData.slug.length < 3) {
        setSlugCheck({ checking: false, available: null });
        return;
      }

      setSlugCheck({ checking: true, available: null });
      
      try {
        const available = await tenantService.isSlugAvailable(formData.slug);
        setSlugCheck({ checking: false, available });
      } catch (error) {
        setSlugCheck({ checking: false, available: null });
      }
    };

    const debounceTimer = setTimeout(checkSlug, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.slug]);

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: (data: CreateTenantData) => tenantService.createTenant(data),
    onSuccess: () => {
      toast({
        title: 'Tenant Created',
        description: 'The tenant has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create tenant.',
        variant: 'destructive',
      });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Company name is required';
    }

    if (!formData.slug?.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    } else if (slugCheck.available === false) {
      newErrors.slug = 'This slug is already taken';
    }

    if (formData.max_users && formData.max_users < 1) {
      newErrors.max_users = 'Max users must be at least 1';
    }

    if (formData.max_domains && formData.max_domains < 1) {
      newErrors.max_domains = 'Max domains must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && slugCheck.available !== false) {
      createTenantMutation.mutate(formData);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      subscription_tier: 'free',
      max_users: 10,
      max_domains: 2,
      status: 'active',
      settings: {},
    });
    setErrors({});
    setSlugCheck({ checking: false, available: null });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Tenant</DialogTitle>
          <DialogDescription>
            Create a new company tenant that can have users and learning domains assigned to it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Acme Corporation"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL identifier) *</Label>
            <div className="relative">
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                placeholder="acme-corp"
                className="pr-10"
              />
              <div className="absolute right-3 top-3">
                {slugCheck.checking && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!slugCheck.checking && slugCheck.available === true && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                {!slugCheck.checking && slugCheck.available === false && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
            {formData.slug && (
              <p className="text-xs text-muted-foreground">
                URL: https://yourdomain.com/{formData.slug}
              </p>
            )}
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug}</p>
            )}
            {slugCheck.available === false && (
              <p className="text-sm text-destructive">This slug is already taken</p>
            )}
            {slugCheck.available === true && (
              <p className="text-sm text-green-600">Slug is available</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the company or organization..."
              rows={3}
            />
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Subscription Tier */}
            <div className="space-y-2">
              <Label htmlFor="subscription_tier">Subscription Tier</Label>
              <Select 
                value={formData.subscription_tier} 
                onValueChange={(value) => setFormData({ ...formData, subscription_tier: value as SubscriptionTier })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Free</Badge>
                      <span>Basic features</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="basic">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Basic</Badge>
                      <span>Standard features</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="premium">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Premium</Badge>
                      <span>Advanced features</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="enterprise">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-600">Enterprise</Badge>
                      <span>All features</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value as TenantStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Limits Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_users">Max Users</Label>
              <Input
                id="max_users"
                type="number"
                min="1"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 10 })}
              />
              {errors.max_users && (
                <p className="text-sm text-destructive">{errors.max_users}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_domains">Max Learning Domains</Label>
              <Input
                id="max_domains"
                type="number"
                min="1"
                value={formData.max_domains}
                onChange={(e) => setFormData({ ...formData, max_domains: parseInt(e.target.value) || 2 })}
              />
              {errors.max_domains && (
                <p className="text-sm text-destructive">{errors.max_domains}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTenantMutation.isPending || slugCheck.checking || slugCheck.available === false}
            >
              {createTenantMutation.isPending ? 'Creating...' : 'Create Tenant'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}