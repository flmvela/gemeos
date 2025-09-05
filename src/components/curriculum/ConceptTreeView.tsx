import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, Link, Settings, ChevronDown, ChevronRight, GitBranch, Check, X } from 'lucide-react';
import { Concept } from '@/hooks/useConcepts';

interface ConceptTreeViewProps {
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

export function ConceptTreeView({
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
}: ConceptTreeViewProps) {
  // Initialize with all nodes expanded by default
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const allIds = concepts.map(c => c.id);
    return new Set(allIds);
  });

  // Build tree structure
  const conceptMap = useMemo(() => {
    return new Map(concepts.map(c => [c.id, c]));
  }, [concepts]);

  // Get root concepts (no parent or parent not in filtered set)
  const rootConcepts = useMemo(() => {
    return concepts.filter(concept => 
      !concept.parent_concept_id || !conceptMap.has(concept.parent_concept_id)
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [concepts, conceptMap]);

  // Get children for a concept
  const getChildren = (conceptId: string) => {
    return concepts
      .filter(c => c.parent_concept_id === conceptId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const handleToggleExpand = (nodeId: string) => {
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

  // Get level badge styling following design system
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

  const renderConcept = (concept: Concept, level: number = 0): React.ReactNode => {
    const children = getChildren(concept.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(concept.id);
    const conceptLevel = concept.difficulty_level ?? level;
    
    return (
      <div key={concept.id}>
        {/* Concept Row */}
        <div 
          className="flex items-center py-2 px-4 hover:bg-gray-50 group text-sm border-b border-gray-100 cursor-pointer"
          onClick={() => {
            if (hasChildren) {
              handleToggleExpand(concept.id);
            } else {
              onConceptClick?.(concept);
            }
          }}
        >
          {/* Left Column - Concept Name */}
          <div className="flex-1 flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
            {/* Expand/Collapse */}
            <div className="flex items-center justify-center w-4 h-4">
              {hasChildren ? (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleExpand(concept.id);
                  }}
                  className="hover:bg-gray-100 rounded p-0.5 flex items-center justify-center w-4 h-4 transition-colors"
                >
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
              ) : (
                <div className="w-4 h-4" />
              )}
            </div>

            {/* Checkbox placeholder (empty circle) */}
            <div className="w-4 h-4 border border-gray-300 rounded-full bg-white"></div>

            {/* Concept Info */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-gray-900">{concept.name}</span>
              {hasChildren && (
                <span className="text-xs text-muted-foreground">
                  – {children.length} child{children.length !== 1 ? 'ren' : ''}
                </span>
              )}
              <Badge 
                variant="outline" 
                className={`text-xs px-1.5 py-0.5 border ${getLevelBadgeProps(conceptLevel)}`}
              >
                L{conceptLevel}
              </Badge>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="w-32 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        </div>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <>
            {children.map(child => renderConcept(child, level + 1))}
          </>
        )}
      </div>
    );
  };

  if (rootConcepts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No concepts found matching your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b bg-gray-50 font-medium text-gray-600">
        <div className="flex-1">
          <span>Concept Name</span>
        </div>
        <div className="w-32 text-right">
          <span>Actions</span>
        </div>
      </div>
      
      {/* Content */}
      <div>
        {rootConcepts.map(concept => renderConcept(concept))}
      </div>
    </div>
  );
}