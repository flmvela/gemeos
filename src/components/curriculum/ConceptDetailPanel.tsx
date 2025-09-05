import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Save, Trash2, Check, Plus, MoreHorizontal } from 'lucide-react';
import { Concept, ConceptPrerequisite } from '@/pages/CurriculumSetup';

interface ConceptDetailPanelProps {
  concept: Concept;
  concepts: Concept[];
  prerequisites: ConceptPrerequisite[];
  onClose: () => void;
  onSave: (concept: Concept) => void;
  onDelete: (conceptId: string) => void;
}

export const ConceptDetailPanel = ({
  concept,
  concepts,
  prerequisites,
  onClose,
  onSave,
  onDelete,
}: ConceptDetailPanelProps) => {
  const [editedConcept, setEditedConcept] = useState<Concept>(concept);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedConcept(concept);
    setHasChanges(false);
  }, [concept]);

  const handleInputChange = (field: keyof Concept, value: any) => {
    setEditedConcept(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleMetadataChange = (field: string, value: any) => {
    setEditedConcept(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(editedConcept);
  };

  const handleApprove = () => {
    const approvedConcept = { ...editedConcept, status: 'confirmed' as const };
    setEditedConcept(approvedConcept);
    onSave(approvedConcept);
  };

  const handleReject = () => {
    onDelete(editedConcept.id);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'ai_suggested': return 'secondary';
      case 'pending_review': return 'outline';
      default: return 'outline';
    }
  };

  const availableParents = concepts.filter(c => 
    c.id !== concept.id && 
    c.parent_concept_id !== concept.id
  );

  const conceptPrerequisites = prerequisites.filter(p => p.concept_id === concept.id);
  const prerequisiteConcepts = conceptPrerequisites.map(p => 
    concepts.find(c => c.id === p.prerequisite_concept_id)
  ).filter(Boolean) as Concept[];

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg z-50 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Concept</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusBadgeVariant(editedConcept.status)}>
            {editedConcept.status.replace('_', ' ')}
          </Badge>
          {editedConcept.status === 'ai_suggested' && (
            <span className="text-sm text-muted-foreground">AI Suggested</span>
          )}
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Concept Name</Label>
            <Input
              id="name"
              value={editedConcept.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editedConcept.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="parent">Parent Concept</Label>
            <Select
              value={editedConcept.parent_concept_id || 'none'}
              onValueChange={(value) => 
                handleInputChange('parent_concept_id', value === 'none' ? undefined : value)
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Parent (Root Concept)</SelectItem>
                {availableParents.map(parent => (
                  <SelectItem key={parent.id} value={parent.id}>
                    {parent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Metadata */}
        <div className="space-y-4">
          <h3 className="font-medium">Metadata</h3>
          
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={editedConcept.metadata.type || 'theoretical'}
              onValueChange={(value) => handleMetadataChange('type', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="theoretical">Theoretical</SelectItem>
                <SelectItem value="practical">Practical</SelectItem>
                <SelectItem value="stylistic">Stylistic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              value={editedConcept.metadata.difficulty || 'beginner'}
              onValueChange={(value) => handleMetadataChange('difficulty', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Prerequisites */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Prerequisites</h3>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          
          {prerequisiteConcepts.length > 0 ? (
            <div className="space-y-2">
              {prerequisiteConcepts.map(prereq => (
                <div key={prereq.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">{prereq.name}</span>
                  <Button variant="ghost" size="sm">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No prerequisites set</p>
          )}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-3">
          {editedConcept.status === 'ai_suggested' && (
            <div className="flex space-x-2">
              <Button 
                onClick={handleApprove} 
                className="flex-1"
                variant="default"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button 
                onClick={handleReject} 
                variant="destructive"
                className="flex-1"
              >
                Reject
              </Button>
            </div>
          )}

          <Button 
            onClick={handleSave} 
            disabled={!hasChanges}
            className="w-full"
            variant={hasChanges ? "default" : "secondary"}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>

          <div className="flex space-x-2">
            <Button 
              onClick={() => {
                const newSubConcept = {
                  ...editedConcept,
                  id: '',
                  name: '',
                  description: '',
                  parent_concept_id: editedConcept.id,
                  status: 'confirmed' as const,
                };
                // This would open the add concept modal with pre-filled parent
                console.log('Add sub-concept:', newSubConcept);
              }}
              variant="outline"
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Sub-Concept
            </Button>

            <Button 
              onClick={() => onDelete(editedConcept.id)}
              variant="outline"
              size="default"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};