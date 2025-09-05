import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Plus, X, Search, Link } from 'lucide-react';
import { Concept } from '../types/concepts';

interface RelationshipsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conceptId?: string;
  concepts: Concept[];
  onUpdateRelationships: (conceptId: string, relationships: { conceptId: string; type: 'prerequisite' | 'related' }[]) => void;
}

export function RelationshipsPanel({
  open,
  onOpenChange,
  conceptId,
  concepts,
  onUpdateRelationships
}: RelationshipsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRelationType, setSelectedRelationType] = useState<'prerequisite' | 'related'>('related');

  const concept = conceptId ? concepts.find(c => c.id === conceptId) : undefined;
  const currentRelationships = concept?.relationships || [];

  const availableConcepts = concepts.filter(c => {
    if (c.id === conceptId) return false;
    if (currentRelationships.some(rel => rel.conceptId === c.id)) return false;
    
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    return matchesSearch;
  });

  const handleAddRelationship = (targetConceptId: string) => {
    if (!conceptId) return;

    const newRelationships = [
      ...currentRelationships,
      { conceptId: targetConceptId, type: selectedRelationType }
    ];

    onUpdateRelationships(conceptId, newRelationships);
    setSearchTerm('');
  };

  const handleRemoveRelationship = (targetConceptId: string) => {
    if (!conceptId) return;

    const newRelationships = currentRelationships.filter(rel => rel.conceptId !== targetConceptId);
    onUpdateRelationships(conceptId, newRelationships);
  };

  const getRelatedConcept = (relationshipConceptId: string) => {
    return concepts.find(c => c.id === relationshipConceptId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Manage Relationships
          </SheetTitle>
          <SheetDescription>
            Add or remove relationships between concepts to build connections in the knowledge graph.
          </SheetDescription>
        </SheetHeader>

        {concept && (
          <div className="space-y-6 mt-6">
            {/* Current Concept Info */}
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium">{concept.name}</h3>
              {concept.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {concept.description}
                </p>
              )}
            </div>

            {/* Current Relationships */}
            <div className="space-y-3">
              <h4 className="font-medium">Current Relationships</h4>
              
              {currentRelationships.length > 0 ? (
                <div className="space-y-2">
                  {currentRelationships.map((relationship) => {
                    const relatedConcept = getRelatedConcept(relationship.conceptId);
                    if (!relatedConcept) return null;

                    return (
                      <div
                        key={relationship.conceptId}
                        className="flex items-center justify-between p-3 bg-card border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">
                              {relatedConcept.name}
                            </span>
                            <Badge variant={relationship.type === 'prerequisite' ? 'default' : 'secondary'}>
                              {relationship.type}
                            </Badge>
                          </div>
                          {relatedConcept.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {relatedConcept.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 ml-2"
                          onClick={() => handleRemoveRelationship(relationship.conceptId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No relationships defined yet.
                </p>
              )}
            </div>

            <Separator />

            {/* Add New Relationship */}
            <div className="space-y-4">
              <h4 className="font-medium">Add New Relationship</h4>

              <div className="flex gap-2">
                <Select
                  value={selectedRelationType}
                  onValueChange={(value: 'prerequisite' | 'related') => setSelectedRelationType(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="related">Related</SelectItem>
                    <SelectItem value="prerequisite">Prerequisite</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search concepts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <ScrollArea className="h-64">
                <div className="space-y-1">
                  {availableConcepts.length > 0 ? (
                    availableConcepts.map((availableConcept) => (
                      <div
                        key={availableConcept.id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                        onClick={() => handleAddRelationship(availableConcept.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{availableConcept.name}</span>
                            <Badge variant="outline" className="text-xs">
                              L{availableConcept.level}
                            </Badge>
                          </div>
                          {availableConcept.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {availableConcept.description}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      {searchTerm ? 'No concepts found matching your search' : 'No more concepts available'}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Relationship Type Descriptions */}
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg text-xs">
              <div>
                <span className="font-medium">Prerequisite:</span> This concept must be learned before the related concept
              </div>
              <div>
                <span className="font-medium">Related:</span> This concept is related to but not required for the other concept
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}