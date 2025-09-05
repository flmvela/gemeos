import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Domain } from '@/hooks/useDomains';

interface DomainFormModalProps {
  domain?: Domain;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { id: string; name: string; description: string; icon_name?: string }) => Promise<void>;
}

const iconOptions = [
  { value: 'Music', label: 'Music' },
  { value: 'BookOpen', label: 'Book Open' },
  { value: 'Languages', label: 'Languages' },
  { value: 'Calculator', label: 'Calculator' },
  { value: 'Mic', label: 'Microphone' },
  { value: 'Palette', label: 'Palette' },
  { value: 'Code', label: 'Code' },
  { value: 'Globe', label: 'Globe' },
];

export const DomainFormModal = ({ domain, open, onClose, onSubmit }: DomainFormModalProps) => {
  const [formData, setFormData] = useState({
    id: domain?.id || '',
    name: domain?.name || '',
    description: domain?.description || '',
    icon_name: domain?.icon_name || 'BookOpen',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Domain name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Domain name must be at least 2 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    // Only validate ID for new domains (when editing, ID is disabled and pre-filled)
    if (!domain) {
      if (!formData.id.trim()) {
        newErrors.id = 'Domain ID is required';
      } else if (!/^[a-z0-9_-]+$/.test(formData.id)) {
        newErrors.id = 'Domain ID can only contain lowercase letters, numbers, hyphens, and underscores';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: formData.id.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon_name: formData.icon_name,
      });
      onClose();
      // Reset form
      setFormData({
        id: '',
        name: '',
        description: '',
        icon_name: 'BookOpen',
      });
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {domain ? 'Edit Domain' : 'Create New Domain'}
          </DialogTitle>
          <DialogDescription>
            {domain 
              ? 'Update the domain information below.' 
              : 'Add a new learning domain to the platform.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="domain-id">Domain ID *</Label>
            <Input
              id="domain-id"
              value={formData.id}
              onChange={(e) => handleInputChange('id', e.target.value)}
              className={errors.id ? 'border-destructive' : ''}
              placeholder="e.g., music, languages, mathematics"
              disabled={!!domain} // Don't allow editing ID for existing domains
            />
            {errors.id && (
              <p className="text-sm text-destructive mt-1">{errors.id}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Used internally. Cannot be changed after creation.
            </p>
          </div>

          <div>
            <Label htmlFor="domain-name">Domain Name *</Label>
            <Input
              id="domain-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={errors.name ? 'border-destructive' : ''}
              placeholder="e.g., Music Theory, English Language"
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="domain-description">Description *</Label>
            <Textarea
              id="domain-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={errors.description ? 'border-destructive' : ''}
              placeholder="Describe what this domain covers..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <Label htmlFor="domain-icon">Icon</Label>
            <Select
              value={formData.icon_name}
              onValueChange={(value) => handleInputChange('icon_name', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : domain ? 'Update Domain' : 'Create Domain'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};