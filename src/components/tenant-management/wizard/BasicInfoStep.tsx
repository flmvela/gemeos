/**
 * Basic Information Step
 * First step of the tenant wizard for basic tenant info
 */

import React, { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useBasicInfoStep } from '@/stores/tenant-wizard.store';
import { tenantService } from '@/services/tenant.service';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'trial', label: 'Trial', color: 'bg-blue-100 text-blue-800' },
  { value: 'suspended', label: 'Suspended', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' }
];

const TIER_OPTIONS = [
  { value: 'free', label: 'Free', description: 'Basic features with limitations' },
  { value: 'basic', label: 'Basic', description: 'Standard features for small teams' },
  { value: 'premium', label: 'Premium', description: 'Advanced features for growing organizations' },
  { value: 'enterprise', label: 'Enterprise', description: 'Full features with priority support' }
];

export const BasicInfoStep: React.FC = () => {
  const { data, update, errors } = useBasicInfoStep();
  const [suggestedSlugs, setSuggestedSlugs] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  
  // Generate alternative slug suggestions
  const generateSlugSuggestions = async (baseName: string) => {
    if (!baseName) return;
    
    setIsGeneratingSuggestions(true);
    const suggestions: string[] = [];
    const baseSlug = tenantService.generateSlug(baseName);
    
    try {
      // Try the base slug first
      const isBaseAvailable = await tenantService.isSlugAvailable(baseSlug);
      if (isBaseAvailable) {
        suggestions.push(baseSlug);
      }
      
      // Generate numbered variations
      for (let i = 2; i <= 5; i++) {
        const numberedSlug = `${baseSlug}-${i}`;
        const isAvailable = await tenantService.isSlugAvailable(numberedSlug);
        if (isAvailable) {
          suggestions.push(numberedSlug);
        }
        if (suggestions.length >= 3) break;
      }
      
      // Generate year-based variation if we need more
      if (suggestions.length < 3) {
        const year = new Date().getFullYear();
        const yearSlug = `${baseSlug}-${year}`;
        const isAvailable = await tenantService.isSlugAvailable(yearSlug);
        if (isAvailable) {
          suggestions.push(yearSlug);
        }
      }
      
      setSuggestedSlugs(suggestions);
    } catch (error) {
      console.error('Error generating slug suggestions:', error);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };
  
  // Show suggestions when there's a slug error
  useEffect(() => {
    const hasSlugError = errors.some(e => e.includes('slug') && e.includes('taken'));
    if (hasSlugError && data.name) {
      generateSlugSuggestions(data.name);
    } else {
      setSuggestedSlugs([]);
    }
  }, [errors, data.name]);

  const selectedStatus = STATUS_OPTIONS.find(opt => opt.value === data.status);
  const selectedTier = TIER_OPTIONS.find(opt => opt.value === data.subscription_tier);

  return (
    <div className="space-y-6">
      {/* Tenant Name */}
      <div className="space-y-2">
        <Label htmlFor="tenant-name" className="text-sm font-medium">
          Tenant Name *
        </Label>
        <Input
          id="tenant-name"
          placeholder="Enter tenant name (e.g., Acme University)"
          value={data.name}
          onChange={(e) => update({ name: e.target.value })}
          className={errors.some(e => e.includes('name')) ? 'border-destructive' : ''}
        />
        <p className="text-xs text-muted-foreground">
          The display name for this tenant that users will see
        </p>
      </div>

      {/* Tenant Slug */}
      <div className="space-y-2">
        <Label htmlFor="tenant-slug" className="text-sm font-medium">
          Tenant Slug *
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            gemeos.ai/
          </span>
          <Input
            id="tenant-slug"
            placeholder="tenant-slug"
            value={data.slug}
            onChange={(e) => update({ slug: e.target.value.toLowerCase() })}
            className={errors.some(e => e.includes('slug')) ? 'border-destructive' : ''}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Unique identifier used in URLs. Only lowercase letters, numbers, and hyphens allowed.
        </p>
        
        {/* Slug Suggestions */}
        {suggestedSlugs.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm font-medium text-blue-900 mb-2">
              Suggested alternatives:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedSlugs.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => update({ slug: suggestion })}
                  className="h-7 text-xs bg-white hover:bg-blue-50 border-blue-300"
                >
                  {suggestion}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => generateSlugSuggestions(data.name)}
                disabled={isGeneratingSuggestions}
                className="h-7 text-xs bg-white hover:bg-blue-50 border-blue-300"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isGeneratingSuggestions ? 'animate-spin' : ''}`} />
                More
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="tenant-description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="tenant-description"
          placeholder="Brief description of the tenant organization..."
          value={data.description || ''}
          onChange={(e) => update({ description: e.target.value })}
          className="min-h-[80px] resize-none"
          maxLength={500}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Optional description for internal reference</span>
          <span>{(data.description || '').length}/500</span>
        </div>
      </div>

      {/* Status & Subscription Tier Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Status *</Label>
          <Select value={data.status} onValueChange={(value: 'active' | 'trial' | 'suspended' | 'inactive') => update({ status: value })}>
            <SelectTrigger>
              <SelectValue>
                {selectedStatus && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={selectedStatus.color}>
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
                    <Badge variant="outline" className={option.color}>
                      {option.label}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Current operational status of the tenant
          </p>
        </div>

        {/* Subscription Tier */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Subscription Tier *</Label>
          <Select 
            value={data.subscription_tier} 
            onValueChange={(value: 'free' | 'basic' | 'premium' | 'enterprise') => update({ subscription_tier: value })}
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
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Determines available features and limitations
          </p>
        </div>
      </div>

      {/* Preview Card */}
      {data.name && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <h4 className="text-sm font-medium mb-2">Preview</h4>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {data.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="font-medium">{data.name}</div>
              {data.slug && (
                <div className="text-sm text-muted-foreground">
                  gemeos.ai/{data.slug}
                </div>
              )}
              {data.description && (
                <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {data.description}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                {selectedStatus && (
                  <Badge variant="outline" className={selectedStatus.color + ' text-xs'}>
                    {selectedStatus.label}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs capitalize">
                  {data.subscription_tier}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};