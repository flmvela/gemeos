/**
 * Assign Domains Modal Component
 * Modal for assigning domains to teachers
 */

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { tenantAdminService, type Teacher } from '@/services/tenantAdmin.service';
import { useToast } from '@/hooks/use-toast';

interface AssignDomainsModalProps {
  teacher: Teacher;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignDomainsModal({ teacher, onClose, onSuccess }: AssignDomainsModalProps) {
  const { toast } = useToast();
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  // Initialize with teacher's current domains
  useEffect(() => {
    setSelectedDomains(teacher.domains || []);
  }, [teacher]);

  // Fetch available domains
  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['tenant-domains-active'],
    queryFn: () => tenantAdminService.getTenantDomains({ activeOnly: true }),
  });

  // Assign domains mutation
  const assignDomainsMutation = useMutation({
    mutationFn: () => tenantAdminService.assignTeacherToDomains(teacher.user_id, selectedDomains),
    onSuccess: () => {
      toast({
        title: 'Domains Updated',
        description: 'Teacher domain assignments have been updated.',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update domain assignments.',
        variant: 'destructive',
      });
    },
  });

  const handleDomainToggle = (domainId: string) => {
    setSelectedDomains(prev =>
      prev.includes(domainId)
        ? prev.filter(id => id !== domainId)
        : [...prev, domainId]
    );
  };

  const handleSubmit = () => {
    assignDomainsMutation.mutate();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Domain Assignments</DialogTitle>
          <DialogDescription>
            Assign domains to {teacher.first_name} {teacher.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{teacher.email}</Badge>
            <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
              {teacher.status}
            </Badge>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : domains.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No active domains available for assignment.
            </p>
          ) : (
            <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
              {domains.map((domain) => (
                <div key={domain.domain_id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`assign-${domain.domain_id}`}
                      checked={selectedDomains.includes(domain.domain_id)}
                      onCheckedChange={() => handleDomainToggle(domain.domain_id)}
                    />
                    <Label
                      htmlFor={`assign-${domain.domain_id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {domain.domain_name}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{domain.teacher_count} teachers</span>
                    <span>•</span>
                    <span>{domain.student_count} students</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {selectedDomains.length} domain(s) selected
            </p>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={assignDomainsMutation.isPending || isLoading}
              >
                {assignDomainsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Assignments'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}