/**
 * Tenant Admin Invite Modal Component
 * Allows platform admins to invite tenant administrators
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { invitationService, type CreateInvitationData } from '@/services/invitation.service';
import { useToast } from '@/hooks/use-toast';
import { 
  UserPlus, 
  Mail, 
  Building2, 
  Shield, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { SystemRole } from '@/types/auth.types';
import type { Tenant } from '@/types/auth.types';

interface TenantAdminInviteModalProps {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TenantAdminInviteModal({ 
  tenant, 
  open, 
  onClose, 
  onSuccess 
}: TenantAdminInviteModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [inviteData, setInviteData] = useState({
    email: '',
    message: '',
    expires_in_days: 7,
  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: (data: CreateInvitationData) => invitationService.createInvitation(data),
    onSuccess: (invitation) => {
      toast({
        title: 'Invitation Sent',
        description: `Tenant admin invitation has been sent to ${invitation.email}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-invitations'] });
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Invitation Failed',
        description: error.message || 'Failed to send invitation.',
        variant: 'destructive',
      });
    },
  });

  const handleSendInvitation = () => {
    if (!tenant || !inviteData.email.trim()) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteData.email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    sendInvitationMutation.mutate({
      email: inviteData.email.trim(),
      tenant_id: tenant.id,
      role: SystemRole.TENANT_ADMIN,
      expires_in_days: inviteData.expires_in_days,
    });
  };

  const handleClose = () => {
    setInviteData({
      email: '',
      message: '',
      expires_in_days: 7,
    });
    onClose();
  };

  const isFormValid = inviteData.email.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Tenant Administrator
          </DialogTitle>
          <DialogDescription>
            Send an invitation to a user to become an administrator for <strong>{tenant?.name}</strong>. 
            They will be able to manage users and content within this tenant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tenant Information */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium">{tenant?.name}</div>
              <div className="text-sm text-muted-foreground">{tenant?.slug}</div>
            </div>
          </div>

          <Separator />

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={inviteData.email}
              onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full"
            />
          </div>

          {/* Role Information */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role
            </Label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Tenant Administrator
              </Badge>
              <span className="text-sm text-muted-foreground">
                Full tenant management permissions
              </span>
            </div>
          </div>

          {/* Expiration Settings */}
          <div className="space-y-2">
            <Label htmlFor="expiry" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Invitation Expires In
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="expiry"
                type="number"
                min="1"
                max="30"
                value={inviteData.expires_in_days}
                onChange={(e) => setInviteData(prev => ({ 
                  ...prev, 
                  expires_in_days: parseInt(e.target.value) || 7 
                }))}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </div>

          {/* Optional Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Welcome to the team! This invitation will give you admin access to manage..."
              value={inviteData.message}
              onChange={(e) => setInviteData(prev => ({ ...prev, message: e.target.value }))}
              className="min-h-[80px]"
            />
          </div>

          {/* Information Notice */}
          <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">What happens next:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>The user will receive an invitation email</li>
                <li>They can accept the invitation to join as tenant admin</li>
                <li>They will have full access to manage this tenant</li>
                <li>You can track invitation status in the invitations list</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-muted-foreground">
            {isFormValid && (
              <span className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Ready to send
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendInvitation}
              disabled={!isFormValid || sendInvitationMutation.isPending}
              className="min-w-[120px]"
            >
              {sendInvitationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}