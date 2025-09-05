import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Check, X, Edit, Plus } from 'lucide-react';

interface InlineConceptEditorProps {
  parentLevel: number;
  onSave: (name: string) => void;
  onCancel: () => void;
  initialValue?: string;
}

export function InlineConceptEditor({
  parentLevel,
  onSave,
  onCancel,
  initialValue = "New Concept"
}: InlineConceptEditorProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleSave = () => {
    if (value.trim()) {
      onSave(value.trim());
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <TooltipProvider>
      <div className="group flex items-center gap-3 py-3 px-2 bg-muted/20 border border-orange-400 rounded-md">
        {/* Spacer for expand/collapse toggle */}
        <div className="w-6 h-6" />

        {/* Folder Icon */}
        <div className="flex items-center justify-center w-4 h-4">
          <div className="w-3 h-3 border border-muted-foreground/40 rounded-sm"></div>
        </div>

        {/* Input Field */}
        <div className="flex-1 min-w-0">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 font-medium"
            placeholder="Enter concept name..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-green-100 text-green-600 hover:text-green-700"
                onClick={handleSave}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save concept</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-red-100 text-red-600 hover:text-red-700"
                onClick={onCancel}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cancel</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit options</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add child</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}