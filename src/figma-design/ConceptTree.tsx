import React from 'react';
import { Button } from './ui/button';
import { Edit, Trash2, Plus, Link, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { InlineConceptEditor } from './InlineConceptEditor';
import { Concept } from '../types/concepts';

interface ConceptTreeProps {
  concepts: Concept[];
  allConcepts: Concept[];
  expandedNodes: Set<string>;
  inlineEditingParent: string | null;
  onToggleExpand: (nodeId: string) => void;
  onChangeParent: (conceptId: string) => void;
  onManageRelationships: (conceptId: string) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (conceptId: string) => void;
  onSaveInlineEdit: (parentId: string | null, name: string) => void;
  onCancelInlineEdit: () => void;
  onViewDetails?: (conceptId: string, tab?: string) => void;
}

export function ConceptTree({
  concepts,
  allConcepts,
  expandedNodes,
  inlineEditingParent,
  onToggleExpand,
  onChangeParent,
  onManageRelationships,
  onAddChild,
  onDelete,
  onSaveInlineEdit,
  onCancelInlineEdit,
  onViewDetails
}: ConceptTreeProps) {
  // Build tree structure
  const conceptMap = new Map(allConcepts.map(c => [c.id, c]));
  const filteredConceptMap = new Map(concepts.map(c => [c.id, c]));
  
  // Get root concepts (no parent or parent not in filtered set)
  const rootConcepts = concepts.filter(concept => 
    !concept.parentId || !filteredConceptMap.has(concept.parentId)
  );

  const renderConcept = (concept: Concept, level: number = 0): React.ReactNode => {
    const hasChildren = concept.children.some(childId => filteredConceptMap.has(childId));
    const isExpanded = expandedNodes.has(concept.id);
    const isAddingChild = inlineEditingParent === concept.id;
    
    // Get level badge styling
    const getLevelBadgeProps = (level: number) => {
      const colors = [
        'bg-green-100 text-green-700', // L0
        'bg-green-100 text-green-700', // L1
        'bg-green-100 text-green-700', // L2
        'bg-orange-100 text-orange-700', // L3
        'bg-red-100 text-red-700', // L4+
      ];
      return colors[Math.min(level, colors.length - 1)];
    };
    
    return (
      <div key={concept.id}>
        {/* Concept Row */}
        <div 
          className={`flex items-center gap-2 py-2 px-4 hover:bg-gray-50 group text-sm ${hasChildren ? 'cursor-pointer' : ''}`} 
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={hasChildren ? () => onToggleExpand(concept.id) : undefined}
        >
          {/* Expand/Collapse */}
          <div className="flex items-center justify-center w-4 h-4">
            {hasChildren ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(concept.id);
                }}
                className="hover:bg-gray-200 rounded p-0.5 flex items-center justify-center w-4 h-4"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>

          {/* Checkbox placeholder (empty circle) */}
          <div className="w-4 h-4 border border-gray-300 rounded-full"></div>

          {/* Concept Info */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="font-medium text-foreground text-base">{concept.name}</span>
            {hasChildren && (
              <span className="text-xs text-gray-500">
                – {concept.children.length} children
              </span>
            )}
            <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getLevelBadgeProps(concept.level)}`}>
              L{concept.level}
            </div>
          </div>

          {/* Hover Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(concept.id, 'overview');
              }}
              className="h-7 w-7 p-0 hover:bg-gray-200"
              title="View concept details"
            >
              <Edit className="h-3.5 w-3.5 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(concept.id);
              }}
              className="h-7 w-7 p-0 hover:bg-gray-200"
              title="Add child concept"
            >
              <Plus className="h-3.5 w-3.5 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(concept.id, 'relationships');
              }}
              className="h-7 w-7 p-0 hover:bg-gray-200"
              title="Manage relationships"
            >
              <Link className="h-3.5 w-3.5 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(concept.id, 'settings');
              }}
              className="h-7 w-7 p-0 hover:bg-gray-200"
              title="Settings"
            >
              <Settings className="h-3.5 w-3.5 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(concept.id);
              }}
              className="h-7 w-7 p-0 hover:bg-gray-200 text-red-600 hover:text-red-700"
              title="Delete concept"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <>
            {concept.children
              .map(childId => conceptMap.get(childId))
              .filter((child): child is Concept => child !== undefined && filteredConceptMap.has(child.id))
              .map(child => renderConcept(child, level + 1))}
          </>
        )}
        
        {/* Inline editor for new child */}
        {isAddingChild && (
          <div style={{ paddingLeft: `${(level + 1) * 24 + 16}px` }}>
            <InlineConceptEditor
              parentLevel={level}
              onSave={(name) => onSaveInlineEdit(concept.id, name)}
              onCancel={onCancelInlineEdit}
            />
          </div>
        )}
      </div>
    );
  };

  if (rootConcepts.length === 0 && inlineEditingParent !== 'root') {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No concepts found matching your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white">
      {/* Root concepts */}
      {rootConcepts.map(concept => renderConcept(concept))}
      
      {/* Inline editor for new root concept */}
      {inlineEditingParent === 'root' && (
        <div className="px-4">
          <InlineConceptEditor
            parentLevel={-1}
            onSave={(name) => onSaveInlineEdit(null, name)}
            onCancel={onCancelInlineEdit}
          />
        </div>
      )}
    </div>
  );
}