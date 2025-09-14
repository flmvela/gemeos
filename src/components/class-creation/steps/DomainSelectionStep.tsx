/**
 * Domain Selection Step
 * Allows teacher to select the domain for their class
 * Matches the design pattern of teacher creation wizard
 */

import React, { useEffect, useState } from 'react';
import { BookOpen, Users, GraduationCap, Brain, Music, Palette, Languages, Info } from 'lucide-react';
import { useDomainStep } from '@/stores/class-wizard.store';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { getDifficultyLevel } from '@/types/class-concepts.types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function DomainSelectionStep() {
  const { data, update, errors } = useDomainStep();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Use domains from the store (loaded by ClassCreation page)
  const domains = data.availableDomains || [];

  // Log for debugging
  useEffect(() => {
    console.log('DomainSelectionStep - Available domains from store:', domains);
    console.log('DomainSelectionStep - Selected domain ID:', data.selectedDomainId);
  }, [domains, data.selectedDomainId]);

  // No need to fetch domains here - they're already loaded by the parent
  useEffect(() => {
    if (!session?.user?.id) return;

    // Check if domains are available from the store
    if (domains.length === 0) {
      setFetchError('No domains have been assigned to you. Please contact your administrator.');
    } else {
      setFetchError(null);
      // Auto-select if only one domain
      if (domains.length === 1 && !data.selectedDomainId) {
        update({ selectedDomainId: domains[0].id });
      }
    }
  }, [domains, data.selectedDomainId, update]);

  const getIconForDomain = (domainName: string) => {
    const name = domainName.toLowerCase();
    if (name.includes('math')) return <Brain className="w-5 h-5" />;
    if (name.includes('music') || name.includes('piano')) return <Music className="w-5 h-5" />;
    if (name.includes('art')) return <Palette className="w-5 h-5" />;
    if (name.includes('language')) return <Languages className="w-5 h-5" />;
    if (name.includes('science')) return <BookOpen className="w-5 h-5" />;
    return <GraduationCap className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Select Learning Domain</h3>
          <p className="text-muted-foreground">Choose the subject area for your class</p>
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Select Learning Domain</h3>
          <p className="text-muted-foreground">Choose the subject area for your class</p>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Select Learning Domain</h3>
          <p className="text-muted-foreground">Choose the subject area for your class</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No domains have been assigned to you. Please contact your administrator to assign teaching domains.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Select Learning Domain</h3>
        <p className="text-muted-foreground">Choose the subject area for your class</p>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <RadioGroup
        value={data.selectedDomainId || ''}
        onValueChange={(value) => update({ selectedDomainId: value })}
        className="space-y-3"
      >
        {domains.map((domain) => {
          const isSelected = data.selectedDomainId === domain.id;
          return (
            <Card
              key={domain.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:border-muted-foreground/50'
              }`}
            >
              <CardContent className="p-4">
                <label
                  htmlFor={`domain-${domain.id}`}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  <RadioGroupItem 
                    value={domain.id} 
                    id={`domain-${domain.id}`}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${
                            isSelected 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {getIconForDomain(domain.name)}
                          </div>
                          <p className="font-medium text-base">{domain.name}</p>
                          {domain.isPrimary && (
                            <Badge variant="secondary" className="text-xs">
                              Primary
                            </Badge>
                          )}
                          {domain.certificationLevel && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {domain.certificationLevel}
                            </Badge>
                          )}
                        </div>
                        {domain.description && (
                          <p className="text-sm text-muted-foreground ml-9">
                            {domain.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-3 ml-9">
                      {domain.difficultyLevels && domain.difficultyLevels.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-muted-foreground">Levels:</span>
                          <div className="flex gap-1">
                            {domain.difficultyLevels && domain.difficultyLevels.slice(0, 4).map((level, index) => {
                              return (
                                <Badge
                                  key={level.id || `level-${index}`}
                                  variant="outline"
                                  className="text-xs px-1.5 py-0 h-5"
                                  style={{
                                    borderColor: level.color_code || '#666',
                                    color: level.color_code || '#666'
                                  }}
                                >
                                  {level.level_name}
                                </Badge>
                              );
                            })}
                            {domain.difficultyLevels && domain.difficultyLevels.length > 4 && (
                              <Badge 
                                variant="outline" 
                                className="text-xs px-1.5 py-0 h-5"
                              >
                                +{domain.difficultyLevels.length - 4}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </label>
              </CardContent>
            </Card>
          );
        })}
      </RadioGroup>

      {data.selectedDomainId && (
        <Alert className="border-primary/50 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            Domain selected. You'll configure difficulty levels in the next step.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}