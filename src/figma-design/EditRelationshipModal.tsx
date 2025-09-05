import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { X } from 'lucide-react';
import type { Concept } from '../types/concepts';

interface EditRelationshipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  concepts: Concept[];
  currentConceptId: string;
  relationship?: {
    conceptId: string;
    type: string;
    description?: string;
  };
  onSave: (relationship: {
    conceptId: string;
    type: string;
    description?: string;
  }) => void;
}

const relationshipTypes = [
  { value: 'prerequisite', label: 'Prerequisite: Must be learned before' },
  { value: 'builds-upon', label: 'Is built upon by: Builds upon this concept' },
  { value: 'related', label: 'Related To: Generally related concept' },
  { value: 'contains', label: 'Contains: This concept contains the target' },
  { value: 'part-of', label: 'Part Of: This concept is part of the target' }
];

export function EditRelationshipModal({
  open,
  onOpenChange,
  concepts,
  currentConceptId,
  relationship,
  onSave
}: EditRelationshipModalProps) {
  const [relationshipType, setRelationshipType] = useState('prerequisite');
  const [targetConceptId, setTargetConceptId] = useState('');
  const [description, setDescription] = useState('');

  // Filter out current concept from available concepts
  const availableConcepts = concepts.filter(c => c.id !== currentConceptId);

  useEffect(() => {
    if (relationship) {
      setRelationshipType(relationship.type);
      setTargetConceptId(relationship.conceptId);
      setDescription(relationship.description || '');
    } else {
      setRelationshipType('prerequisite');
      setTargetConceptId('');
      setDescription('');
    }
  }, [relationship, open]);

  const handleSave = () => {
    if (!targetConceptId) return;

    onSave({
      conceptId: targetConceptId,
      type: relationshipType,
      description: description.trim() || undefined
    });

    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const selectedConcept = concepts.find(c => c.id === targetConceptId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                {relationship ? 'Edit Relationship' : 'Add Relationship'}
              </DialogTitle>
              <DialogDescription>
                {relationship ? 'Update the relationship details.' : 'Create a new relationship between concepts.'}
              </DialogDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Relationship Type */}
          <div className="space-y-2">
            <Label>Relationship Type</Label>
            <Select value={relationshipType} onValueChange={setRelationshipType}>
              <SelectTrigger className="bg-gray-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Concept */}
          <div className="space-y-2">
            <Label>Target Concept</Label>
            <Select value={targetConceptId} onValueChange={setTargetConceptId}>
              <SelectTrigger className="bg-gray-50">
                <SelectValue placeholder="Select a concept" />
              </SelectTrigger>
              <SelectContent>
                {availableConcepts.map((concept) => (
                  <SelectItem key={concept.id} value={concept.id}>
                    {concept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the relationship between these concepts..."
              rows={3}
              className="bg-gray-50 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={!targetConceptId}
              className="bg-black text-white hover:bg-black/90 flex-1"
            >
              {relationship ? 'Update Relationship' : 'Add Relationship'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}