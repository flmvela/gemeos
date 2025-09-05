import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Search, ChevronRight, ChevronDown } from 'lucide-react';
import { Concept } from '../types/concepts';
import { cn } from './ui/utils';

interface ChangeParentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conceptId?: string;
  concepts: Concept[];
  onChangeParent: (conceptId: string, newParentId?: string) => void;
}

export function ChangeParentDialog({
  open,
  onOpenChange,
  conceptId,
  concepts,
  onChangeParent
}: ChangeParentDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const concept = conceptId ? concepts.find(c => c.id === conceptId) : undefined;

  // Filter out the concept itself and its descendants to prevent circular references
  const getDescendantIds = (id: string): Set<string> => {
    const descendants = new Set<string>();
    const addDescendants = (conceptId: string) => {
      descendants.add(conceptId);
      const concept = concepts.find(c => c.id === conceptId);
      if (concept) {
        concept.children.forEach(childId => addDescendants(childId));
      }
    };
    addDescendants(id);
    return descendants;
  };

  const invalidIds = conceptId ? getDescendantIds(conceptId) : new Set<string>();

  const filteredConcepts = useMemo(() => {
    return concepts.filter(c => {
      if (invalidIds.has(c.id)) return false;
      return c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    });
  }, [concepts, searchTerm, invalidIds]);

  const handleSelectParent = (parentId?: string) => {
    if (conceptId) {
      onChangeParent(conceptId, parentId);
      onOpenChange(false);
      setSearchTerm('');
      setExpandedNodes(new Set());
    }
  };

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const conceptMap = new Map(filteredConcepts.map(c => [c.id, c]));
  const rootConcepts = filteredConcepts.filter(c => !c.parentId || !conceptMap.has(c.parentId));

  const renderConceptOption = (concept: Concept, level: number = 0): React.ReactNode => {
    const hasChildren = concept.children.some(childId => conceptMap.has(childId));
    const isExpanded = expandedNodes.has(concept.id);
    const isCurrentParent = concept.id === concept?.parentId;

    return (
      <div key={concept.id}>
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer",
            isCurrentParent && "bg-muted ring-2 ring-primary"
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleSelectParent(concept.id)}
        >
          <div className="flex items-center justify-center w-4 h-4">
            {hasChildren ? (
              <button
                className="p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(concept.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            ) : (
              <div className="w-3 h-3" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate">{concept.name}</span>
              <Badge variant="outline" className="text-xs">
                L{concept.level}
              </Badge>
              {isCurrentParent && (
                <Badge variant="default" className="text-xs">
                  Current Parent
                </Badge>
              )}
            </div>
            {concept.description && (
              <p className="text-xs text-muted-foreground truncate">
                {concept.description}
              </p>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {concept.children
              .map(childId => conceptMap.get(childId))
              .filter((child): child is Concept => child !== undefined)
              .map(child => renderConceptOption(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Parent Concept</DialogTitle>
          <DialogDescription>
            Select a new parent concept or choose no parent to make it a root level concept.
          </DialogDescription>
        </DialogHeader>

        {concept && (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                Moving: <span className="font-medium">{concept.name}</span>
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search concepts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2">
              {/* No parent option */}
              <div
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer",
                  !concept.parentId && "bg-muted ring-2 ring-primary"
                )}
                onClick={() => handleSelectParent(undefined)}
              >
                <div className="w-4 h-4" />
                <span>No parent (Root level)</span>
                {!concept.parentId && (
                  <Badge variant="default" className="text-xs ml-auto">
                    Current
                  </Badge>
                )}
              </div>

              <ScrollArea className="h-64">
                <div className="space-y-1">
                  {rootConcepts.length > 0 ? (
                    rootConcepts.map(concept => renderConceptOption(concept))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No concepts found
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setSearchTerm('');
                  setExpandedNodes(new Set());
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}