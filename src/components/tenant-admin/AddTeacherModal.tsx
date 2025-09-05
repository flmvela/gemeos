/**
 * Add Teacher Modal Component
 * Modal for creating new teacher accounts within a tenant
 */

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { tenantAdminService } from '@/services/tenantAdmin.service';
import { useToast } from '@/hooks/use-toast';

interface AddTeacherModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTeacherModal({ onClose, onSuccess }: AddTeacherModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    domains: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch available domains
  const { data: domains = [] } = useQuery({
    queryKey: ['tenant-domains-active'],
    queryFn: () => tenantAdminService.getTenantDomains({ activeOnly: true }),
  });

  // Create teacher mutation
  const createTeacherMutation = useMutation({
    mutationFn: (data: typeof formData) => tenantAdminService.createTeacher(data),
    onSuccess: () => {
      toast({
        title: 'Teacher Created',
        description: 'The teacher account has been created successfully.',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create teacher account.',
        variant: 'destructive',
      });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createTeacherMutation.mutate(formData);
    }
  };

  const handleDomainToggle = (domainId: string) => {
    setFormData(prev => ({
      ...prev,
      domains: prev.domains.includes(domainId)
        ? prev.domains.filter(id => id !== domainId)
        : [...prev.domains, domainId],
    }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Teacher</DialogTitle>
          <DialogDescription>
            Add a new teacher to your organization. They will receive an invitation email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="teacher@example.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName}</p>
              )}
            </div>
          </div>

          {domains.length > 0 && (
            <div className="space-y-2">
              <Label>Assign to Domains</Label>
              <div className="border rounded-md p-4 space-y-2 max-h-40 overflow-y-auto">
                {domains.map((domain) => (
                  <div key={domain.domain_id} className="flex items-center space-x-2">
                    <Checkbox
                      id={domain.domain_id}
                      checked={formData.domains.includes(domain.domain_id)}
                      onCheckedChange={() => handleDomainToggle(domain.domain_id)}
                    />
                    <Label
                      htmlFor={domain.domain_id}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {domain.domain_name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTeacherMutation.isPending}
            >
              {createTeacherMutation.isPending ? 'Creating...' : 'Create Teacher'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}