import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDifficultyLevel } from '@/types/class-concepts.types';
import type { AssignConceptsRequest } from '@/types/class-concepts.types';

interface Concept {
  id: string;
  name: string;
  description?: string;
  difficulty_level: number;
  domain_id: string;
  created_at?: string;
}

interface AssignConceptsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  domainId: string;
  availableConcepts: Concept[];
  assignedConceptIds: string[];
  onAssign: (request: Omit<AssignConceptsRequest, 'classId'>) => Promise<void>;
}

export function AssignConceptsDialog({
  open,
  onOpenChange,
  classId,
  domainId,
  availableConcepts,
  assignedConceptIds,
  onAssign,
}: AssignConceptsDialogProps) {
  const [selectedConceptIds, setSelectedConceptIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);
  const [conceptGroup, setConceptGroup] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('1.0');
  const [allMandatory, setAllMandatory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter concepts that are not already assigned
  const unassignedConcepts = useMemo(() => {
    return availableConcepts.filter(c => !assignedConceptIds.includes(c.id));
  }, [availableConcepts, assignedConceptIds]);

  // Apply search and filters
  const filteredConcepts = useMemo(() => {
    return unassignedConcepts.filter(concept => {
      const matchesSearch = !searchTerm || 
        concept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        concept.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDifficulty = !difficultyFilter || 
        concept.difficulty_level === difficultyFilter;
      
      return matchesSearch && matchesDifficulty;
    });
  }, [unassignedConcepts, searchTerm, difficultyFilter]);

  // Group concepts by difficulty
  const conceptsByDifficulty = useMemo(() => {
    const groups: Record<number, Concept[]> = {};
    filteredConcepts.forEach(concept => {
      const difficulty = concept.difficulty_level;
      if (!groups[difficulty]) {
        groups[difficulty] = [];
      }
      groups[difficulty].push(concept);
    });
    return groups;
  }, [filteredConcepts]);

  const handleSelectAll = () => {
    if (selectedConceptIds.size === filteredConcepts.length) {
      setSelectedConceptIds(new Set());
    } else {
      setSelectedConceptIds(new Set(filteredConcepts.map(c => c.id)));
    }
  };

  const handleToggleConcept = (conceptId: string) => {
    const newSelection = new Set(selectedConceptIds);
    if (newSelection.has(conceptId)) {
      newSelection.delete(conceptId);
    } else {
      newSelection.add(conceptId);
    }
    setSelectedConceptIds(newSelection);
  };

  const handleAssign = async () => {
    if (selectedConceptIds.size === 0) return;

    setIsSubmitting(true);
    try {
      const selectedConcepts = Array.from(selectedConceptIds);
      const concepts = selectedConcepts.map((conceptId, index) => ({
        conceptId,
        sequenceOrder: assignedConceptIds.length + index,
        conceptGroup: conceptGroup || undefined,
        estimatedHours: parseFloat(estimatedHours) || 1.0,
        isMandatory: allMandatory,
      }));

      await onAssign({ concepts });
      setSelectedConceptIds(new Set());
      setSearchTerm('');
      setDifficultyFilter(null);
      setConceptGroup('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to assign concepts:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Assign Concepts to Class</DialogTitle>
          <DialogDescription>
            Select concepts to add to this class. You can filter by difficulty and search by name.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="select" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">Select Concepts</TabsTrigger>
            <TabsTrigger value="options">Assignment Options</TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="space-y-4">
            {/* Search and Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search concepts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                variant={difficultyFilter ? "default" : "outline"}
                size="sm"
                onClick={() => setDifficultyFilter(null)}
              >
                <Filter className="h-4 w-4 mr-1" />
                {difficultyFilter ? `Level ${difficultyFilter}` : 'All Levels'}
                {difficultyFilter && (
                  <X 
                    className="h-3 w-3 ml-1" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDifficultyFilter(null);
                    }}
                  />
                )}
              </Button>
            </div>

            {/* Quick Difficulty Filters */}
            <div className="flex gap-1 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => {
                const diffLevel = getDifficultyLevel(level);
                const count = conceptsByDifficulty[level]?.length || 0;
                if (count === 0 && !difficultyFilter) return null;
                
                return (
                  <Button
                    key={level}
                    variant={difficultyFilter === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDifficultyFilter(difficultyFilter === level ? null : level)}
                    className="h-7 px-2"
                    style={{
                      backgroundColor: difficultyFilter === level ? diffLevel.color : undefined,
                      borderColor: diffLevel.color,
                      color: difficultyFilter === level ? 'white' : diffLevel.color,
                    }}
                  >
                    {diffLevel.icon} {count}
                  </Button>
                );
              })}
            </div>

            {/* Select All */}
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedConceptIds.size === filteredConcepts.length && filteredConcepts.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label>
                  Select All ({selectedConceptIds.size} of {filteredConcepts.length})
                </Label>
              </div>
              {unassignedConcepts.length === 0 && (
                <span className="text-sm text-muted-foreground">
                  All concepts are already assigned
                </span>
              )}
            </div>

            {/* Concepts List */}
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {Object.entries(conceptsByDifficulty)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([difficulty, concepts]) => {
                    const level = getDifficultyLevel(Number(difficulty));
                    return (
                      <div key={difficulty} className="space-y-2">
                        <div className="flex items-center gap-2 sticky top-0 bg-background py-1">
                          <Badge 
                            style={{ backgroundColor: level.color }}
                            className="text-white"
                          >
                            {level.icon} {level.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {concepts.length} concept{concepts.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="space-y-1 pl-2">
                          {concepts.map(concept => (
                            <div
                              key={concept.id}
                              className={cn(
                                "flex items-start space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer",
                                selectedConceptIds.has(concept.id) && "bg-accent"
                              )}
                              onClick={() => handleToggleConcept(concept.id)}
                            >
                              <Checkbox
                                checked={selectedConceptIds.has(concept.id)}
                                onCheckedChange={() => handleToggleConcept(concept.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-1">
                                <Label className="font-normal cursor-pointer">
                                  {concept.name}
                                </Label>
                                {concept.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {concept.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="conceptGroup">Concept Group (Optional)</Label>
                <Input
                  id="conceptGroup"
                  placeholder="e.g., Week 1, Module A, Prerequisites"
                  value={conceptGroup}
                  onChange={(e) => setConceptGroup(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Group related concepts together for better organization
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Estimated Hours per Concept</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Default time allocation for each concept
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allMandatory"
                  checked={allMandatory}
                  onCheckedChange={(checked) => setAllMandatory(checked as boolean)}
                />
                <Label htmlFor="allMandatory">
                  Mark all concepts as mandatory
                </Label>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You can adjust individual concept settings after adding them to the class.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={selectedConceptIds.size === 0 || isSubmitting}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add {selectedConceptIds.size} Concept{selectedConceptIds.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Add missing import at the top
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';