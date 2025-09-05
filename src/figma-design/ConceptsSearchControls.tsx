import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, List as ListIcon, GitBranch } from 'lucide-react';

interface ConceptsSearchControlsProps {
  searchTerm: string;
  viewMode: 'tree' | 'list';
  onSearchChange: (term: string) => void;
  onViewModeChange: (mode: 'tree' | 'list') => void;
}

export function ConceptsSearchControls({
  searchTerm,
  viewMode,
  onSearchChange,
  onViewModeChange
}: ConceptsSearchControlsProps) {
  return (
    <div className="bg-white border-b -mx-6 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search concepts..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange('tree')}
            className={`flex items-center gap-2 rounded-none border-0 px-3 ${
              viewMode === 'tree' 
                ? 'bg-black text-white hover:bg-black/90' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <GitBranch className="h-4 w-4" />
            Tree
          </Button>
          <div className="w-px bg-gray-300 h-6"></div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange('list')}
            className={`flex items-center gap-2 rounded-none border-0 px-3 ${
              viewMode === 'list' 
                ? 'bg-black text-white hover:bg-black/90' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ListIcon className="h-4 w-4" />
            List
          </Button>
        </div>
      </div>
    </div>
  );
}