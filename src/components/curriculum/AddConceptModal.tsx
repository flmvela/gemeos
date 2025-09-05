import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Concept } from '@/hooks/useConcepts';
import { useDifficultyLabels } from '@/hooks/useDifficultyLabels';

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
  // Try to load difficulty labels from database
  const { data: difficultyLabels = [] } = useDifficultyLabels(domainId);
  
  // Fallback difficulty levels matching the database table
  const defaultDifficultyLevels = [
    { level_value: 1, label: 'Introductory' },
    { level_value: 2, label: 'Beginner' },
    { level_value: 3, label: 'Intermediate' },
    { level_value: 4, label: 'Advanced' },
    { level_value: 5, label: 'Expert' },
    { level_value: 6, label: 'Mastery' }
  ];
  
  // Use database labels if available, otherwise use defaults
  const availableDifficulties = difficultyLabels.length > 0 ? difficultyLabels : defaultDifficultyLevels;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_concept_id: parentConceptId || '',
    difficulty_level: 1,
    metadata: {},
  });

  // Update difficulty level when availableDifficulties changes
  useEffect(() => {
    if (availableDifficulties.length > 0) {
      setFormData(prev => ({
        ...prev,
        difficulty_level: availableDifficulties[0].level_value
      }));
    }
  }, [availableDifficulties]);

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
            <Label htmlFor="concept-difficulty">Difficulty</Label>
            <Select
              value={formData.difficulty_level.toString()}
              onValueChange={(value) => handleDifficultyChange(parseInt(value))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableDifficulties.map((label) => (
                  <SelectItem key={label.level_value} value={label.level_value.toString()}>
                    {label.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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