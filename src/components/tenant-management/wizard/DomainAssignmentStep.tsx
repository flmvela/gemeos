/**
 * Domain Assignment Step
 * Second step of the tenant wizard for selecting learning domains
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Globe, Check, Settings2, Users, GraduationCap } from 'lucide-react';
import { useDomainsStep } from '@/stores/tenant-wizard.store';
import { useDomains } from '@/hooks/useDomains';

export const DomainAssignmentStep: React.FC = () => {
  const { data, update, errors } = useDomainsStep();
  const { domains, isLoading } = useDomains();

  const toggleDomain = (domainId: string) => {
    const selectedIds = [...data.selectedDomainIds];
    const newSettings = new Map(data.domainSettings);
    
    const index = selectedIds.indexOf(domainId);
    if (index === -1) {
      selectedIds.push(domainId);
      newSettings.set(domainId, { max_teachers: 10, max_students: 100 });
    } else {
      selectedIds.splice(index, 1);
      newSettings.delete(domainId);
    }
    
    update({
      selectedDomainIds: selectedIds,
      domainSettings: newSettings
    });
  };

  const updateDomainSettings = (domainId: string, field: 'max_teachers' | 'max_students', value: number) => {
    const newSettings = new Map(data.domainSettings);
    const currentSettings = newSettings.get(domainId) || { max_teachers: 10, max_students: 100 };
    
    newSettings.set(domainId, {
      ...currentSettings,
      [field]: value
    });
    
    update({ domainSettings: newSettings });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium mb-2">Select Learning Domains</h4>
        <p className="text-sm text-muted-foreground">
          Choose which learning domains this tenant will have access to. You can configure individual limits for each domain, or use global limits from the next step.
        </p>
      </div>

      {/* Domain Selection Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Available Domains</h4>
          <Badge variant="outline">
            {data.selectedDomainIds.length} selected
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {domains?.map((domain) => {
            const isSelected = data.selectedDomainIds.includes(domain.id);
            const settings = data.domainSettings.get(domain.id);
            
            return (
              <Card 
                key={domain.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
                onClick={() => toggleDomain(domain.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-base">{domain.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {domain.description || 'No description available'}
                        </CardDescription>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </CardHeader>

                {isSelected && settings && (
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Settings2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Domain Limits</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Max Teachers
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            value={settings.max_teachers}
                            onChange={(e) => updateDomainSettings(
                              domain.id, 
                              'max_teachers', 
                              Math.max(1, parseInt(e.target.value) || 1)
                            )}
                            onClick={(e) => e.stopPropagation()}
                            className="h-8"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            Max Students
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            value={settings.max_students}
                            onChange={(e) => updateDomainSettings(
                              domain.id, 
                              'max_students', 
                              Math.max(1, parseInt(e.target.value) || 1)
                            )}
                            onClick={(e) => e.stopPropagation()}
                            className="h-8"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Selection Summary */}
      {data.selectedDomainIds.length > 0 && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <h4 className="font-medium mb-3">Selected Domains Summary</h4>
          
          <div className="space-y-2">
            {data.selectedDomainIds.map((domainId) => {
              const domain = domains?.find(d => d.id === domainId);
              const settings = data.domainSettings.get(domainId);
              
              if (!domain || !settings) return null;
              
              return (
                <div key={domainId} className="flex items-center justify-between py-2 px-3 bg-background rounded border">
                  <div className="font-medium">{domain.name}</div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{settings.max_teachers} teachers</span>
                    <span>{settings.max_students} students</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDomain(domainId)}
                      className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Total Domain Limits:</span>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>
                  {Array.from(data.domainSettings.values()).reduce((sum, s) => sum + s.max_teachers, 0)} teachers max
                </span>
                <span>
                  {Array.from(data.domainSettings.values()).reduce((sum, s) => sum + s.max_students, 0)} students max
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {data.selectedDomainIds.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No domains selected yet</p>
          <p className="text-sm">Click on domains above to add them to this tenant</p>
        </div>
      )}
    </div>
  );
};