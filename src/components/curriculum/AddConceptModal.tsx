import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Concept } from '@/hooks/useConcepts';
import { DIFFICULTY_LEVELS, getDifficultyLevel } from '@/types/class-concepts.types';

interface AddConceptModalProps {
  concepts: Concept[];
  parentConceptId?: string;
  domainId?: string;
  onClose: () => void;
  onSave: (concept: Omit<Concept, 'id' | 'created_at' | 'updated_at' | 'teacher_id'>) => void;
}

export const AddConceptModal = ({
  concepts,
  parentConceptId,
  domainId,
  onClose,
  onSave,
}: AddConceptModalProps) => {
  console.log('🔍 AddConceptModal props:', { parentConceptId, domainId, conceptsCount: concepts.length });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_concept_id: parentConceptId || '',
    difficulty_level: 4, // Default to Moderate difficulty
    metadata: {},
  });

  // Update parent concept when parentConceptId prop changes
  useEffect(() => {
    console.log('🔍 parentConceptId prop changed:', parentConceptId);
    setFormData(prev => {
      const newFormData = {
        ...prev,
        parent_concept_id: parentConceptId || ''
      };
      console.log('🔍 Updated form data:', newFormData);
      return newFormData;
    });
  }, [parentConceptId]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDifficultyChange = (levelValue: number) => {
    setFormData(prev => ({
      ...prev,
      difficulty_level: levelValue,
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Concept name is required';
    }
    
    if (formData.name.trim().length < 3) {
      newErrors.name = 'Concept name must be at least 3 characters';
    }

    // Check for duplicate names
    const duplicateName = concepts.find(c => 
      c.name.toLowerCase() === formData.name.toLowerCase().trim()
    );
    if (duplicateName) {
      newErrors.name = 'A concept with this name already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!domainId) {
      setErrors({ domain_id: 'Domain ID is required' });
      return;
    }

    const newConcept = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      domain_id: domainId || '',
      parent_concept_id: formData.parent_concept_id || null,
      status: 'approved' as const, // Manually created concepts are automatically approved
      generation_source: 'human' as const,
      source: 'human' as const,
      source_file_id: null,
      difficulty_level: formData.difficulty_level,
      metadata: formData.metadata || {},
    };

    onSave(newConcept);
  };

  // For adding new concepts, all existing concepts can be parents
  // Only exclude the concept itself if we were editing (but we're always adding new ones)
  const availableParents = concepts;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Learning Concept</DialogTitle>
          <DialogDescription>
            Add a new concept to your curriculum. You can organize it under a parent concept or create it as a root concept.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="concept-name">Concept Name *</Label>
            <Input
              id="concept-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`mt-1 ${errors.name ? 'border-destructive' : ''}`}
              placeholder="e.g., Major Scales, Chord Progressions"
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="concept-description">Description</Label>
            <Textarea
              id="concept-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="mt-1"
              placeholder="Describe what this concept covers..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="parent-concept">Parent Concept</Label>
            <Select
              value={formData.parent_concept_id}
              onValueChange={(value) => handleInputChange('parent_concept_id', value === 'none' ? '' : value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select parent concept (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Parent (Root Concept)</SelectItem>
                {availableParents.map(concept => (
                  <SelectItem key={concept.id} value={concept.id}>
                    {concept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="concept-difficulty">Difficulty Level</Label>
            <Select
              value={formData.difficulty_level.toString()}
              onValueChange={(value) => handleDifficultyChange(parseInt(value))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue>
                  {(() => {
                    const level = getDifficultyLevel(formData.difficulty_level);
                    return (
                      <div className="flex items-center gap-2">
                        <span>{level.icon}</span>
                        <span>{level.label}</span>
                        <span className="text-xs text-muted-foreground">({level.description})</span>
                      </div>
                    );
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value.toString()}>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline"
                        style={{ 
                          backgroundColor: level.color + '20',
                          borderColor: level.color,
                          color: level.color 
                        }}
                      >
                        {level.icon}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium">{level.label}</div>
                        <div className="text-xs text-muted-foreground">{level.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              This affects how the concept contributes to class difficulty calculations
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Concept
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};