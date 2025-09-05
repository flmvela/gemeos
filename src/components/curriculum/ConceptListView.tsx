import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Plus, Link, Settings, GitBranch, Check, X } from 'lucide-react';
import { Concept } from '@/hooks/useConcepts';

interface ConceptListViewProps {
  concepts: Concept[];
  onConceptClick?: (concept: Concept) => void;
  onConceptDelete?: (conceptId: string) => void;
  onConceptUpdate?: (conceptId: string, updates: Partial<Pick<Concept, 'name' | 'description'>>) => void;
  onAddChild?: (parentId: string) => void;
  onStartLinking?: (concept: Concept) => void;
  onStartHierarchyChange?: (concept: Concept) => void;
  onManageRelationships?: (concept: Concept) => void;
  showApprovalActions?: boolean;
  onApproveConcept?: (conceptId: string) => void;
  onRejectConcept?: (conceptId: string) => void;
}

export function ConceptListView({
  concepts,
  onConceptClick,
  onConceptDelete,
  onConceptUpdate,
  onAddChild,
  onStartLinking,
  onStartHierarchyChange,
  onManageRelationships,
  showApprovalActions = false,
  onApproveConcept,
  onRejectConcept
}: ConceptListViewProps) {
  // Build concept map for parent lookup
  const conceptMap = new Map(concepts.map(c => [c.id, c]));
  
  // Get parent name for display
  const getParentName = (parentId?: string) => {
    if (!parentId) return '–';
    const parent = conceptMap.get(parentId);
    return parent ? parent.name : '–';
  };

  // Get level badge styling
  const getLevelBadgeProps = (level: number) => {
    const colors = [
      'bg-green-100 text-green-800 border-green-300', // L0
      'bg-green-100 text-green-800 border-green-300', // L1
      'bg-yellow-100 text-yellow-800 border-yellow-300', // L2
      'bg-orange-100 text-orange-800 border-orange-300', // L3
      'bg-red-100 text-red-800 border-red-300', // L4+
    ];
    return colors[Math.min(level, colors.length - 1)];
  };

  // Sort concepts alphabetically
  const sortedConcepts = [...concepts].sort((a, b) => a.name.localeCompare(b.name));

  if (concepts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No concepts found matching your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="border-b bg-gray-50">
            <TableHead className="font-medium text-gray-600 w-12"></TableHead>
            <TableHead className="font-medium text-gray-600">Concept Name</TableHead>
            <TableHead className="font-medium text-gray-600">Status</TableHead>
            <TableHead className="font-medium text-gray-600">Level</TableHead>
            <TableHead className="font-medium text-gray-600">Parent</TableHead>
            <TableHead className="font-medium text-gray-600 w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedConcepts.map((concept) => (
            <TableRow 
              key={concept.id} 
              className="hover:bg-gray-50 cursor-pointer border-b border-gray-100"
              onClick={() => onConceptClick?.(concept)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="w-4 h-4 border border-gray-300 rounded-full bg-white"></div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium text-gray-900">{concept.name}</div>
                  {concept.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {concept.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={concept.status === 'approved' || concept.status === 'confirmed' ? 'default' : 'secondary'}
                  className={
                    concept.status === 'approved' || concept.status === 'confirmed'
                      ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-300'
                      : concept.status === 'suggested'
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-300'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-300'
                  }
                >
                  {concept.status === 'approved' || concept.status === 'confirmed' ? 'Approved' : 
                   concept.status === 'suggested' ? 'Suggested' : 
                   concept.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${getLevelBadgeProps(concept.difficulty_level ?? 0)} border`}
                >
                  L{concept.difficulty_level ?? 0}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {getParentName(concept.parent_concept_id)}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  {showApprovalActions && concept.status === 'suggested' ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onApproveConcept?.(concept.id);
                        }}
                        className="h-7 w-7 p-0 hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors"
                        title="Approve concept"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRejectConcept?.(concept.id);
                        }}
                        className="h-7 w-7 p-0 hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                        title="Reject concept"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConceptClick?.(concept);
                        }}
                        className="h-7 w-7 p-0 hover:bg-gray-100 transition-colors"
                        title="Edit concept"
                      >
                        <Edit className="h-3.5 w-3.5 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddChild?.(concept.id);
                        }}
                        className="h-7 w-7 p-0 hover:bg-gray-100 transition-colors"
                        title="Add child concept"
                      >
                        <Plus className="h-3.5 w-3.5 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartHierarchyChange?.(concept);
                        }}
                        className="h-7 w-7 p-0 hover:bg-gray-100 transition-colors"
                        title="Hierarchy management"
                      >
                        <GitBranch className="h-3.5 w-3.5 text-purple-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onManageRelationships?.(concept);
                        }}
                        className="h-7 w-7 p-0 hover:bg-gray-100 transition-colors"
                        title="Manage relationships"
                      >
                        <Link className="h-3.5 w-3.5 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConceptDelete?.(concept.id);
                        }}
                        className="h-7 w-7 p-0 hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                        title="Delete concept"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}