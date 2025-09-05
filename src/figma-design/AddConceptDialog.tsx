import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Concept } from '../types/concepts';

interface AddConceptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentConcept?: Concept;
  onAddConcept: (name: string, description: string, parentId?: string) => void;
}

export function AddConceptDialog({
  open,
  onOpenChange,
  parentConcept,
  onAddConcept
}: AddConceptDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ name?: string }>({});

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setErrors({});
    }
  }, [open]);

  const validateForm = () => {
    const newErrors: { name?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Concept name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Concept name must be at least 2 characters';
    } else if (name.trim().length > 100) {
      newErrors.name = 'Concept name must be less than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onAddConcept(name.trim(), description.trim(), parentConcept?.id);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const newConceptLevel = parentConcept ? parentConcept.level + 1 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {parentConcept ? 'Add Child Concept' : 'Add New Concept'}
          </DialogTitle>
          <DialogDescription>
            {parentConcept 
              ? `Create a new concept under "${parentConcept.name}". This will help organize learning content hierarchically.`
              : 'Create a new root-level concept for your learning domain.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Parent Info */}
          {parentConcept && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">Parent:</span>
                <span className="font-medium">{parentConcept.name}</span>
                <Badge variant="outline" className="text-xs">
                  L{parentConcept.level}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">New concept will be:</span>
                <Badge variant="secondary" className="text-xs">
                  L{newConceptLevel}
                </Badge>
              </div>
            </div>
          )}

          {/* Concept Name */}
          <div className="space-y-2">
            <Label htmlFor="concept-name">
              Concept Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="concept-name"
              placeholder="Enter concept name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? 'border-destructive' : ''}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="concept-description">Description (Optional)</Label>
            <Textarea
              id="concept-description"
              placeholder="Enter a brief description of the concept..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/200 characters
            </p>
          </div>

          {/* Form Info */}
          <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <p>The new concept will be created with "Suggested" status and can be approved later.</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button type="submit">
              {parentConcept ? 'Add Child Concept' : 'Add Concept'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}