/**
 * Teacher Domain Assignment Step Component
 * Second step in the teacher creation wizard
 */

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Plus, X, GraduationCap, Monitor, Users } from 'lucide-react';
import { useTeacherWizardStore, type TeacherDomain } from '@/stores/teacher-wizard.store';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useDomains } from '@/hooks/useDomains';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

const CERTIFICATION_LEVELS = [
  { value: 'basic', label: 'Basic', color: 'bg-gray-100 text-gray-700' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-blue-100 text-blue-700' },
  { value: 'advanced', label: 'Advanced', color: 'bg-purple-100 text-purple-700' },
  { value: 'expert', label: 'Expert', color: 'bg-green-100 text-green-700' },
];

export const TeacherDomainStep: React.FC = () => {
  const { data, updateData, errors } = useTeacherWizardStore();
  const { tenantData } = useAuth();
  const { domains, loading } = useDomains(tenantData?.tenant_id);
  const domainData = data.domains;
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');

  const handleSetPrimaryDomain = (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (domain) {
      updateData('domains', {
        primaryDomain: {
          id: domain.id,
          name: domain.name,
          certificationLevel: 'intermediate'
        }
      });
    }
  };

  const handleAddAdditionalDomain = () => {
    if (!selectedDomainId) return;
    
    const domain = domains.find(d => d.id === selectedDomainId);
    if (!domain) return;

    // Check if already added
    const isAlreadyAdded = 
      domainData.primaryDomain?.id === domain.id ||
      domainData.additionalDomains.some(d => d.id === domain.id);
    
    if (!isAlreadyAdded) {
      updateData('domains', {
        additionalDomains: [
          ...domainData.additionalDomains,
          {
            id: domain.id,
            name: domain.name,
            certificationLevel: 'basic'
          }
        ]
      });
      setSelectedDomainId('');
    }
  };

  const handleRemoveAdditionalDomain = (domainId: string) => {
    updateData('domains', {
      additionalDomains: domainData.additionalDomains.filter(d => d.id !== domainId)
    });
  };

  const handleCertificationChange = (domainId: string, level: string, isPrimary: boolean) => {
    if (isPrimary && domainData.primaryDomain) {
      updateData('domains', {
        primaryDomain: {
          ...domainData.primaryDomain,
          certificationLevel: level as any
        }
      });
    } else {
      updateData('domains', {
        additionalDomains: domainData.additionalDomains.map(d =>
          d.id === domainId ? { ...d, certificationLevel: level as any } : d
        )
      });
    }
  };

  const handleModalityToggle = (modality: 'in-person' | 'online' | 'hybrid') => {
    const currentModalities = domainData.teachingModalities || [];
    const updated = currentModalities.includes(modality)
      ? currentModalities.filter(m => m !== modality)
      : [...currentModalities, modality];
    
    updateData('domains', { teachingModalities: updated });
  };

  return (
    <div className="space-y-6">
      {/* Primary Domain */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <BookOpen className="h-4 w-4 text-gray-500" />
          Primary Teaching Domain
          <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-muted-foreground">
          Select the main subject this teacher will be teaching
        </p>
        
        {loading ? (
          <Skeleton className="h-10 max-w-md" />
        ) : !domainData.primaryDomain ? (
          <Select onValueChange={handleSetPrimaryDomain}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Choose primary domain" />
            </SelectTrigger>
            <SelectContent>
              {domains.map(domain => (
                <SelectItem key={domain.id} value={domain.id}>
                  <div className="flex items-center gap-2">
                    <span>{domain.name}</span>
                    {domain.description && (
                      <Badge variant="outline" className="text-xs">
                        {domain.description.slice(0, 20)}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Card className="max-w-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{domainData.primaryDomain.name}</p>
                    <Select
                      value={domainData.primaryDomain.certificationLevel}
                      onValueChange={(value) => handleCertificationChange(domainData.primaryDomain!.id, value, true)}
                    >
                      <SelectTrigger className="h-7 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CERTIFICATION_LEVELS.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateData('domains', { primaryDomain: undefined })}
                >
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Additional Domains */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <Plus className="h-4 w-4 text-gray-500" />
          Additional Domains
          <span className="text-sm text-muted-foreground ml-2">(Optional)</span>
        </Label>
        <p className="text-sm text-muted-foreground">
          Add other subjects this teacher can teach
        </p>

        <div className="flex gap-2 max-w-md">
          {loading ? (
            <Skeleton className="h-10 flex-1" />
          ) : (
            <Select value={selectedDomainId} onValueChange={setSelectedDomainId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a domain" />
              </SelectTrigger>
              <SelectContent>
                {domains.filter(domain => 
                  domainData.primaryDomain?.id !== domain.id &&
                  !domainData.additionalDomains.some(d => d.id === domain.id)
                ).map(domain => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button 
            onClick={handleAddAdditionalDomain}
            disabled={!selectedDomainId}
          >
            Add
          </Button>
        </div>

        {domainData.additionalDomains.length > 0 && (
          <div className="space-y-2 mt-3">
            {domainData.additionalDomains.map(domain => (
              <Card key={domain.id} className="max-w-md">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{domain.name}</span>
                      <Select
                        value={domain.certificationLevel}
                        onValueChange={(value) => handleCertificationChange(domain.id, value, false)}
                      >
                        <SelectTrigger className="h-7 text-xs w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CERTIFICATION_LEVELS.map(level => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAdditionalDomain(domain.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Teaching Preferences */}
      <div className="space-y-4 pt-4 border-t">
        <Label className="text-base font-semibold">Teaching Preferences</Label>
        
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="maxStudents" className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-gray-500" />
              Max Students
            </Label>
            <Input
              id="maxStudents"
              type="number"
              placeholder="e.g., 30"
              value={domainData.maxStudents || ''}
              onChange={(e) => updateData('domains', { maxStudents: parseInt(e.target.value) || undefined })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="classSize" className="flex items-center gap-2 text-sm">
              <GraduationCap className="h-4 w-4 text-gray-500" />
              Preferred Class Size
            </Label>
            <Input
              id="classSize"
              type="number"
              placeholder="e.g., 8"
              value={domainData.preferredClassSize || ''}
              onChange={(e) => updateData('domains', { preferredClassSize: parseInt(e.target.value) || undefined })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <Monitor className="h-4 w-4 text-gray-500" />
            Teaching Modalities
            <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-4">
            {(['in-person', 'online', 'hybrid'] as const).map(modality => (
              <div key={modality} className="flex items-center space-x-2">
                <Checkbox
                  id={modality}
                  checked={domainData.teachingModalities?.includes(modality) || false}
                  onCheckedChange={() => handleModalityToggle(modality)}
                />
                <Label
                  htmlFor={modality}
                  className="text-sm font-normal capitalize cursor-pointer"
                >
                  {modality}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {errors.domains && errors.domains.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.domains.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};