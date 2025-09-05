import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Save, Trash2, Check, ArrowUpDown } from 'lucide-react';
import { Concept } from '@/hooks/useConcepts';

interface ConceptDetailsPanelProps {
  concept: Concept;
  concepts: Concept[];
  onClose: () => void;
  onSave: (concept: Concept) => void;
  onDelete: (conceptId: string) => void;
  onUpdateParent: (conceptId: string, parentId: string) => void;
}

export const ConceptDetailsPanel = ({
  concept,
  concepts,
  onClose,
  onSave,
  onDelete,
  onUpdateParent,
}: ConceptDetailsPanelProps) => {
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
    setHasChanges(false);
  };

  const handleApprove = () => {
    const approvedConcept = { ...editedConcept, status: 'approved' as const };
    setEditedConcept(approvedConcept);
    onSave(approvedConcept);
  };

  const handleReject = () => {
    onDelete(editedConcept.id);
  };

  const handleParentChange = (parentId: string) => {
    const newParentId = parentId === 'none' ? '' : parentId;
    setEditedConcept(prev => ({ ...prev, parent_concept_id: newParentId || undefined }));
    onUpdateParent(editedConcept.id, newParentId);
    setHasChanges(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'suggested': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const availableParents = concepts.filter(c => 
    c.id !== concept.id && 
    c.parent_concept_id !== concept.id &&
    c.status !== 'rejected'
  );

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          Concept Details
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="overflow-y-auto space-y-6">
        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusBadgeVariant(editedConcept.status)}>
            {editedConcept.status.charAt(0).toUpperCase() + editedConcept.status.slice(1)}
          </Badge>
          {editedConcept.status === 'suggested' && (
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
            <Label htmlFor="parent" className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Parent Concept
            </Label>
            <Select
              value={editedConcept.parent_concept_id || 'none'}
              onValueChange={handleParentChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50 bg-background">
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
              value={editedConcept.metadata?.type || 'theoretical'}
              onValueChange={(value) => handleMetadataChange('type', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50 bg-background">
                <SelectItem value="theoretical">Theoretical</SelectItem>
                <SelectItem value="practical">Practical</SelectItem>
                <SelectItem value="stylistic">Stylistic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              value={editedConcept.metadata?.difficulty || 'beginner'}
              onValueChange={(value) => handleMetadataChange('difficulty', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50 bg-background">
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-3">
          {editedConcept.status === 'suggested' && (
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

          <Button 
            onClick={() => onDelete(editedConcept.id)}
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Concept
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};