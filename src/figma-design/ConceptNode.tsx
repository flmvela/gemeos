import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  ChevronRight, 
  ChevronDown, 
  Edit, 
  Plus, 
  Link, 
  RefreshCw, 
  Trash2,
  Target 
} from 'lucide-react';
import { Concept } from './ConceptManagement';
import { cn } from './ui/utils';

interface ConceptNodeProps {
  concept: Concept;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onChangeParent: () => void;
  onManageRelationships: () => void;
  onAddChild: () => void;
  onDelete: () => void;
  onViewDetails?: () => void;
}

export function ConceptNode({
  concept,
  level,
  hasChildren,
  isExpanded,
  onToggleExpand,
  onChangeParent,
  onManageRelationships,
  onAddChild,
  onDelete,
  onViewDetails
}: ConceptNodeProps) {
  const handleConceptClick = () => {
    if (hasChildren) {
      onToggleExpand();
    }
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <TooltipProvider>
      <div className="group flex items-center gap-3 py-3 px-2 hover:bg-muted/30 transition-colors">
        {/* Expand/Collapse Toggle */}
        <div className="flex items-center justify-center w-6 h-6">
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={onToggleExpand}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>

        {/* Clickable Concept Content Area */}
        <div 
          className={cn(
            "flex items-center gap-3 flex-1 min-w-0",
            hasChildren && "cursor-pointer"
          )}
          onClick={handleConceptClick}
        >
          {/* Folder Icon */}
          <div className="flex items-center justify-center w-4 h-4">
            <div className="w-3 h-3 border border-muted-foreground/40 rounded-sm"></div>
          </div>

          {/* Concept Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="font-medium text-foreground">
                {concept.name}
              </span>
              {concept.children.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  - {concept.children.length} children
                </span>
              )}
              <Badge 
                variant="secondary" 
                className="bg-green-100 text-green-800 hover:bg-green-100 text-xs px-2 py-0.5 h-5"
              >
                L{concept.level}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                onClick={(e) => handleActionClick(e, onViewDetails || (() => console.log('Edit concept:', concept.id)))}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{onViewDetails ? 'View details' : 'Edit concept'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                onClick={(e) => handleActionClick(e, onAddChild)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add child concept</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                onClick={(e) => handleActionClick(e, onManageRelationships)}
              >
                <Link className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Manage relationships</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                onClick={(e) => handleActionClick(e, onChangeParent)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Change parent</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                onClick={(e) => handleActionClick(e, () => console.log('Learning goals for:', concept.id))}
              >
                <Target className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Learning goals</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-muted text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => handleActionClick(e, onDelete)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete concept</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}