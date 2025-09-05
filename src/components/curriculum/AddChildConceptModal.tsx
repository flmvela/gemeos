import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, X } from 'lucide-react';
import { Concept } from '@/hooks/useConcepts';

interface AddChildConceptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConcept: Concept;
  concepts: Concept[];
  onAddChild: (childId: string) => void;
}

export function AddChildConceptModal({
  open,
  onOpenChange,
  currentConcept,
  concepts,
  onAddChild
}: AddChildConceptModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Get all ancestor IDs to prevent circular dependencies
  const getAncestorIds = (conceptId: string, visited = new Set<string>()): Set<string> => {
    if (visited.has(conceptId)) return visited;
    visited.add(conceptId);
    
    const concept = concepts.find(c => c.id === conceptId);
    if (concept?.parent_concept_id) {
      getAncestorIds(concept.parent_concept_id, visited);
    }
    return visited;
  };

  // Filter available concepts
  const availableConcepts = useMemo(() => {
    const ancestorIds = getAncestorIds(currentConcept.id);
    
    return concepts.filter(concept => {
      // Exclude the current concept itself
      if (concept.id === currentConcept.id) return false;
      
      // Exclude concepts that are already children of current concept
      if (concept.parent_concept_id === currentConcept.id) return false;
      
      // Exclude ancestors to prevent circular dependencies
      if (ancestorIds.has(concept.id)) return false;
      
      // Allow any concept to be selected (removed parent restriction)
      // This allows moving concepts between parents or making concepts that already have parents into children
      
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

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'approved':
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'suggested':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
      case 'confirmed':
        return 'Approved';
      case 'suggested':
        return 'AI Suggested';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <DialogTitle className="text-2xl font-semibold">Add Child Concept</DialogTitle>
            <p className="text-muted-foreground mt-1">
              Select a concept to add as a child of "{currentConcept.name}"
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50"
            />
          </div>

          {/* Results */}
          <ScrollArea className="h-[500px] pr-4">
            {availableConcepts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? (
                  <div>
                    <p>No concepts found matching "{searchQuery}"</p>
                    <p className="text-sm mt-1">Try adjusting your search terms</p>
                  </div>
                ) : (
                  <div>
                    <p>No available concepts to add as children</p>
                    <p className="text-sm mt-1">
                      All suitable concepts are either already children or ancestors of this concept
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {availableConcepts.map((concept) => (
                  <div
                    key={concept.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900 text-lg">{concept.name}</h3>
                        <Badge variant="outline" className="text-xs bg-gray-50">
                          L{concept.difficulty_level ?? 0}
                        </Badge>
                        <Badge className={`text-xs ${getStatusBadgeClasses(concept.status)}`}>
                          {getStatusText(concept.status)}
                        </Badge>
                      </div>
                      {concept.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {concept.description}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleAddChild(concept.id)}
                      className="ml-4 bg-black text-white hover:bg-black/90 flex-shrink-0"
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