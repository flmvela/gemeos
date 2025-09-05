/**
 * Domain Selection Step
 * Allows teacher to select the domain for their class
 */

import React from 'react';
import { BookOpen, Users, GraduationCap } from 'lucide-react';
import { useDomainStep } from '@/stores/class-wizard.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function DomainSelectionStep() {
  const { data, update } = useDomainStep();

  const handleDomainSelect = (domainId: string) => {
    update({ selectedDomainId: domainId });
  };

  const getDomainIcon = (domainName: string) => {
    switch (domainName.toLowerCase()) {
      case 'mathematics':
        return <GraduationCap className="h-6 w-6" />;
      case 'science':
        return <BookOpen className="h-6 w-6" />;
      case 'language arts':
        return <Users className="h-6 w-6" />;
      default:
        return <BookOpen className="h-6 w-6" />;
    }
  };

  // Loading state
  if (data.availableDomains.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-medium mb-2">Select Domain</h4>
          <p className="text-muted-foreground">
            Loading your available domains...
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <div className="flex gap-1 mt-3">
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className="h-5 w-16" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium mb-2">Select Domain</h4>
        <p className="text-muted-foreground">
          Choose the learning domain for your class. This will determine the available difficulty levels and content areas.
        </p>
      </div>

      {/* Auto-selection notice */}
      {data.availableDomains.length === 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full" />
            <p className="text-sm text-blue-700">
              <strong>{data.availableDomains[0].name}</strong> has been automatically selected as it's your only available domain.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.availableDomains.map((domain) => {
          const isSelected = data.selectedDomainId === domain.id;
          
          return (
            <Card
              key={domain.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected 
                  ? 'ring-2 ring-primary border-primary bg-primary/5' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => handleDomainSelect(domain.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className={`p-2 rounded-lg ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {getDomainIcon(domain.name)}
                  </div>
                  <div>
                    <div className="font-semibold">{domain.name}</div>
                    {isSelected && (
                      <Badge variant="secondary" className="mt-1">
                        Selected
                      </Badge>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>{domain.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium mb-2">Available Difficulty Levels</h5>
                    <div className="flex flex-wrap gap-1">
                      {domain.difficultyLevels.map((level) => (
                        <Badge
                          key={level.id}
                          variant="outline"
                          className="text-xs"
                          style={{ 
                            borderColor: level.color_code,
                            color: level.color_code
                          }}
                        >
                          {level.level_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {domain.difficultyLevels.length} difficulty levels available
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selection summary */}
      {data.selectedDomainId && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full" />
            <p className="text-sm text-green-700">
              <strong>Domain selected:</strong> {
                data.availableDomains.find(d => d.id === data.selectedDomainId)?.name
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}