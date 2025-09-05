import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bug, Eye, EyeOff } from 'lucide-react';
import { Concept } from '@/hooks/useConcepts';

interface ConceptTreeDebugPanelProps {
  concepts: Concept[];
  filteredConcepts: Concept[];
  statusFilter: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export const ConceptTreeDebugPanel = ({
  concepts,
  filteredConcepts,
  statusFilter,
  isVisible,
  onToggleVisibility
}: ConceptTreeDebugPanelProps) => {
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleVisibility}
          className="shadow-lg"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug
        </Button>
      </div>
    );
  }

  const statusCounts = concepts.reduce((acc, concept) => {
    acc[concept.status] = (acc[concept.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const parentStructure = concepts.reduce((acc, concept) => {
    const parentKey = concept.parent_concept_id || 'root';
    if (!acc[parentKey]) acc[parentKey] = [];
    acc[parentKey].push(concept);
    return acc;
  }, {} as Record<string, Concept[]>);

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-auto shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Debug Panel
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleVisibility}
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div>
          <div className="font-medium mb-1">Concept Counts:</div>
          <div className="space-y-1">
            <div>Total: {concepts.length}</div>
            <div>Filtered: {filteredConcepts.length}</div>
            <div>Current filter: <Badge variant="outline">{statusFilter}</Badge></div>
          </div>
        </div>

        <div>
          <div className="font-medium mb-1">Status Distribution:</div>
          <div className="space-y-1">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span>{status}:</span>
                <Badge variant={status === 'suggested' ? 'default' : 'outline'}>
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="font-medium mb-1">Tree Structure:</div>
          <div className="space-y-1">
            <div>Root concepts: {parentStructure.root?.length || 0}</div>
            <div>With parents: {concepts.filter(c => c.parent_concept_id).length}</div>
            <div>Unique parents: {Object.keys(parentStructure).length - 1}</div>
          </div>
        </div>

        {statusCounts.suggested > 0 && (
          <div>
            <div className="font-medium mb-1 text-yellow-600">AI Suggested Details:</div>
            <div className="space-y-1 max-h-20 overflow-auto">
              {concepts
                .filter(c => c.status === 'suggested')
                .map(concept => (
                  <div key={concept.id} className="text-xs">
                    • {concept.name} {concept.parent_concept_id ? `(child of ${concept.parent_concept_id.slice(0, 8)}...)` : '(root)'}
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};