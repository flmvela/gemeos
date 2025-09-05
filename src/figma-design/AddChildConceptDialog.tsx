import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Search, Plus } from 'lucide-react';
import type { Concept } from '../types/concepts';
import { getStatusDisplayText, getStatusBadgeVariant } from '../utils/conceptsUtils';

interface AddChildConceptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConcept: Concept;
  concepts: Concept[];
  onAddChild: (childId: string) => void;
}

export function AddChildConceptDialog({
  open,
  onOpenChange,
  currentConcept,
  concepts,
  onAddChild
}: AddChildConceptDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Get all ancestor IDs to prevent circular dependencies
  const getAncestorIds = (conceptId: string, visited = new Set<string>()): Set<string> => {
    if (visited.has(conceptId)) return visited;
    visited.add(conceptId);
    
    const concept = concepts.find(c => c.id === conceptId);
    if (concept?.parentId) {
      getAncestorIds(concept.parentId, visited);
    }
    return visited;
  };

  // Filter available concepts
  const availableConcepts = useMemo(() => {
    const ancestorIds = getAncestorIds(currentConcept.id);
    
    return concepts.filter(concept => {
      // Exclude the current concept itself
      if (concept.id === currentConcept.id) return false;
      
      // Exclude concepts that are already children
      if (currentConcept.children.includes(concept.id)) return false;
      
      // Exclude ancestors to prevent circular dependencies
      if (ancestorIds.has(concept.id)) return false;
      
      // Exclude concepts that already have a parent (they can only have one parent)
      if (concept.parentId) return false;
      
      // Apply search filter
      if (searchQuery && !concept.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [concepts, currentConcept, searchQuery]);

  const handleAddChild = (childId: string) => {
    onAddChild(childId);
    onOpenChange(false);
    setSearchQuery(''); // Reset search when closing
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery(''); // Reset search when closing
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Child Concept</DialogTitle>
          <DialogDescription>
            Select a concept to add as a child of "{currentConcept.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results */}
          <ScrollArea className="h-[400px] pr-4">
            {availableConcepts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? (
                  <div>
                    <p>No concepts found matching "{searchQuery}"</p>
                    <p className="text-sm mt-1">Try adjusting your search terms</p>
                  </div>
                ) : (
                  <div>
                    <p>No available concepts to add as children</p>
                    <p className="text-sm mt-1">
                      All suitable concepts are either already children, ancestors, or have existing parents
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {availableConcepts.map((concept) => (
                  <div
                    key={concept.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium text-foreground">{concept.name}</h4>
                        <Badge variant="outline" className="flex-shrink-0">
                          L{concept.level}
                        </Badge>
                        <Badge 
                          variant={getStatusBadgeVariant(concept.status)}
                          className={
                            concept.status === 'approved'
                              ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200'
                              : concept.status === 'suggested'
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200'
                              : concept.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200'
                          }
                        >
                          {getStatusDisplayText(concept.status)}
                        </Badge>
                      </div>
                      {concept.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {concept.description}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleAddChild(concept.id)}
                      className="ml-3 bg-black text-white hover:bg-black/90"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}