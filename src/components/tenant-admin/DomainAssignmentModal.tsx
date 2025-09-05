/**
 * Domain Assignment Modal Component
 * Allows platform admins to assign learning domains to tenants
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  domainAssignmentService, 
  type Domain, 
  type TenantDomainAssignment 
} from '@/services/domain-assignment.service';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Music, 
  Calculator, 
  Globe, 
  Palette, 
  Search,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import type { Tenant } from '@/types/auth.types';

interface DomainAssignmentModalProps {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const getDomainIcon = (iconName?: string) => {
  const icons = {
    'music': Music,
    'calculator': Calculator,
    'globe': Globe,
    'palette': Palette,
    'book-open': BookOpen,
  };
  
  const IconComponent = iconName ? icons[iconName as keyof typeof icons] || BookOpen : BookOpen;
  return <IconComponent className="h-5 w-5" />;
};

export function DomainAssignmentModal({ tenant, open, onClose, onSuccess }: DomainAssignmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedDomainIds, setSelectedDomainIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignmentSettings, setAssignmentSettings] = useState({
    max_teachers: 5,
    max_students: 100,
  });

  // Fetch all domains
  const { 
    data: allDomains = [], 
    isLoading: domainsLoading 
  } = useQuery({
    queryKey: ['domains'],
    queryFn: () => domainAssignmentService.getAllDomains(),
  });

  // Fetch tenant's current domain assignments
  const { 
    data: tenantDomains = [], 
    isLoading: assignmentsLoading 
  } = useQuery({
    queryKey: ['tenant-domains', tenant?.id],
    queryFn: () => tenant?.id ? domainAssignmentService.getTenantDomains(tenant.id) : Promise.resolve([]),
    enabled: !!tenant?.id,
  });

  // Get unassigned domains
  const assignedDomainIds = tenantDomains.map(assignment => assignment.domain_id);
  const availableDomains = allDomains.filter(domain => 
    !assignedDomainIds.includes(domain.id) &&
    (domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     domain.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Assign domains mutation
  const assignDomainsMutation = useMutation({
    mutationFn: (data: { tenantId: string; domainIds: string[]; settings: typeof assignmentSettings }) => 
      domainAssignmentService.bulkAssignDomainsToTenant(
        data.tenantId, 
        data.domainIds, 
        data.settings
      ),
    onSuccess: (newAssignments) => {
      toast({
        title: 'Domains Assigned',
        description: `Successfully assigned ${newAssignments.length} domain(s) to ${tenant?.name}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['tenant-domains'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Assignment Failed',
        description: error.message || 'Failed to assign domains.',
        variant: 'destructive',
      });
    },
  });

  const handleDomainToggle = (domainId: string) => {
    setSelectedDomainIds(prev => 
      prev.includes(domainId) 
        ? prev.filter(id => id !== domainId)
        : [...prev, domainId]
    );
  };

  const handleAssignDomains = () => {
    if (!tenant || selectedDomainIds.length === 0) return;

    assignDomainsMutation.mutate({
      tenantId: tenant.id,
      domainIds: selectedDomainIds,
      settings: assignmentSettings,
    });
  };

  const handleClose = () => {
    setSelectedDomainIds([]);
    setSearchTerm('');
    setAssignmentSettings({ max_teachers: 5, max_students: 100 });
    onClose();
  };

  const isLoading = domainsLoading || assignmentsLoading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Assign Learning Domains</DialogTitle>
          <DialogDescription>
            Assign learning domains to <strong>{tenant?.name}</strong>. 
            Tenant admins will only be able to access and manage users within these assigned domains.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Assignments Summary */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Assignments</Label>
            <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg min-h-[60px]">
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading current assignments...</span>
                </div>
              ) : tenantDomains.length === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">No domains currently assigned</span>
                </div>
              ) : (
                tenantDomains.map((assignment) => (
                  <Badge 
                    key={assignment.id} 
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    {assignment.domain && getDomainIcon(assignment.domain.icon_name)}
                    {assignment.domain?.name || 'Unknown Domain'}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <Separator />

          {/* Domain Search */}
          <div className="space-y-2">
            <Label htmlFor="domain-search">Search Available Domains</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="domain-search"
                placeholder="Search domains..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Available Domains */}
          <div className="space-y-2">
            <Label>Available Domains ({availableDomains.length})</Label>
            <ScrollArea className="h-[300px] border rounded-lg p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading domains...
                </div>
              ) : availableDomains.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mb-4 opacity-50" />
                  <p className="font-medium">No available domains found</p>
                  <p className="text-sm">
                    {searchTerm ? 'Try adjusting your search terms' : 'All domains are already assigned'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableDomains.map((domain) => (
                    <div 
                      key={domain.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedDomainIds.includes(domain.id)}
                        onCheckedChange={() => handleDomainToggle(domain.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          {getDomainIcon(domain.icon_name)}
                          <h4 className="font-medium">{domain.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {domain.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Assignment Settings */}
          {selectedDomainIds.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label className="text-sm font-medium">Assignment Settings</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-teachers" className="text-sm">
                      Max Teachers per Domain
                    </Label>
                    <Input
                      id="max-teachers"
                      type="number"
                      min="1"
                      value={assignmentSettings.max_teachers}
                      onChange={(e) => setAssignmentSettings(prev => ({
                        ...prev,
                        max_teachers: parseInt(e.target.value) || 5
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-students" className="text-sm">
                      Max Students per Domain
                    </Label>
                    <Input
                      id="max-students"
                      type="number"
                      min="1"
                      value={assignmentSettings.max_students}
                      onChange={(e) => setAssignmentSettings(prev => ({
                        ...prev,
                        max_students: parseInt(e.target.value) || 100
                      }))}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-muted-foreground">
            {selectedDomainIds.length > 0 && (
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                {selectedDomainIds.length} domain(s) selected
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignDomains}
              disabled={selectedDomainIds.length === 0 || assignDomainsMutation.isPending}
            >
              {assignDomainsMutation.isPending ? 'Assigning...' : `Assign ${selectedDomainIds.length} Domain(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}