import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, GitBranch } from 'lucide-react';
import { Concept } from '@/hooks/useConcepts';
import { cn } from '@/lib/utils';

interface ConceptParentSelectorProps {
  currentConcept: Concept;
  availableParents: Concept[];
  onParentChange: (conceptId: string, parentId: string) => void;
}

export const ConceptParentSelector = ({
  currentConcept,
  availableParents,
  onParentChange
}: ConceptParentSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>(currentConcept.parent_concept_id || '');

  // Filter out the current concept and its descendants to prevent circular dependencies
  const getDescendants = (conceptId: string, concepts: Concept[]): string[] => {
    const children = concepts.filter(c => c.parent_concept_id === conceptId);
    const descendants = children.map(c => c.id);
    
    children.forEach(child => {
      descendants.push(...getDescendants(child.id, concepts));
    });
    
    return descendants;
  };

  const descendants = getDescendants(currentConcept.id, [...availableParents, currentConcept]);
  const validParents = availableParents.filter(concept => 
    concept.id !== currentConcept.id && // Can't be parent of itself
    !descendants.includes(concept.id) && // Can't be descendant
    concept.status === 'approved' || concept.status === 'confirmed' // Only approved concepts as parents
  );

  // Add "No parent" option
  const options = [
    { id: '', name: 'No parent (Root level)', description: 'Move to top level' },
    ...validParents.map(concept => ({
      id: concept.id,
      name: concept.name,
      description: concept.description || 'No description'
    }))
  ];

  const currentParent = options.find(option => option.id === value);

  const handleSelect = (selectedValue: string) => {
    setValue(selectedValue);
    onParentChange(currentConcept.id, selectedValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          title="Change parent concept"
        >
          <GitBranch className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search parent concepts..." />
          <CommandList>
            <CommandEmpty>No approved concepts found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => handleSelect(option.id)}
                  className="flex items-start gap-2 p-3"
                >
                  <Check
                    className={cn(
                      "mt-0.5 h-4 w-4",
                      value === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {option.name}
                    </div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {option.description}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};