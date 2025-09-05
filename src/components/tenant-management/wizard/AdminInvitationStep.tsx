/**
 * Admin Invitation Step
 * Fourth step of the tenant wizard for inviting tenant administrators
 */

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  UserPlus, 
  Mail, 
  Trash2, 
  Send, 
  Clock, 
  Shield, 
  AlertCircle,
  Info
} from 'lucide-react';
import { useAdminsStep } from '@/stores/tenant-wizard.store';

export const AdminInvitationStep: React.FC = () => {
  const { data, update, errors } = useAdminsStep();
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addInvitation = () => {
    setEmailError('');

    if (!newEmail.trim()) {
      setEmailError('Email address is required');
      return;
    }

    if (!validateEmail(newEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Check for duplicates
    const isDuplicate = data.invitations.some(inv => 
      inv.email.toLowerCase() === newEmail.toLowerCase()
    );

    if (isDuplicate) {
      setEmailError('This email address is already invited');
      return;
    }

    const newInvitations = [
      ...data.invitations,
      {
        email: newEmail,
        role: 'tenant_admin',
        sendImmediately: true
      }
    ];

    update({ invitations: newInvitations });
    setNewEmail('');
  };

  const removeInvitation = (email: string) => {
    const newInvitations = data.invitations.filter(inv => inv.email !== email);
    update({ invitations: newInvitations });
  };

  const updateInvitation = (email: string, field: 'sendImmediately', value: boolean) => {
    const newInvitations = data.invitations.map(inv =>
      inv.email === email ? { ...inv, [field]: value } : inv
    );
    update({ invitations: newInvitations });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addInvitation();
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium mb-1">Tenant Administrator Invitations</h4>
            <p className="text-sm text-muted-foreground">
              Invite people to manage this tenant. Tenant administrators can manage domains, 
              invite teachers and students, and configure tenant settings.
            </p>
          </div>
        </div>
      </div>

      {/* Add New Invitation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Administrator
          </CardTitle>
          <CardDescription>
            Send an invitation to a new tenant administrator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="admin-email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setEmailError('');
                }}
                onKeyPress={handleKeyPress}
                className={emailError ? 'border-destructive' : ''}
              />
              {emailError && (
                <p className="text-xs text-destructive">{emailError}</p>
              )}
            </div>
            <div className="pt-7">
              <Button onClick={addInvitation} disabled={!newEmail.trim()}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Pending Invitations
            </div>
            <Badge variant="outline">
              {data.invitations.length} invitation{data.invitations.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <CardDescription>
            Manage administrator invitations for this tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium mb-1">No administrators invited yet</p>
              <p className="text-sm">Add email addresses above to invite tenant administrators</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.invitations.map((invitation, index) => (
                <div key={invitation.email} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{invitation.email}</span>
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Tenant Admin
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {invitation.sendImmediately ? (
                            <>
                              <Send className="h-3 w-3 text-green-600" />
                              <span className="text-green-600">Send immediately</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 text-amber-600" />
                              <span className="text-amber-600">Send later</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInvitation(invitation.email)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <Separator className="my-3" />
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`send-${index}`} className="text-sm">
                      Send invitation email immediately after tenant creation
                    </Label>
                    <Switch
                      id={`send-${index}`}
                      checked={invitation.sendImmediately}
                      onCheckedChange={(checked) => 
                        updateInvitation(invitation.email, 'sendImmediately', checked)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Permissions Overview */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Shield className="h-5 w-5" />
            Tenant Administrator Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="space-y-2">
              <div className="font-medium">User Management</div>
              <ul className="space-y-1 text-xs">
                <li>• Invite and manage teachers</li>
                <li>• Invite and manage students</li>
                <li>• Assign users to domains</li>
                <li>• View user activity and progress</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium">Tenant Configuration</div>
              <ul className="space-y-1 text-xs">
                <li>• Manage domain assignments</li>
                <li>• Configure user limits</li>
                <li>• Customize tenant settings</li>
                <li>• Generate usage reports</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 rounded border">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700">
                <div className="font-medium">Important:</div>
                <div>
                  Tenant administrators have full control over this tenant but cannot 
                  access other tenants or platform administration features.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invitation Summary */}
      {data.invitations.length > 0 && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <h4 className="font-medium mb-3">Invitation Summary</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total invitations:</span>
              <span className="font-medium">{data.invitations.length}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Send immediately:</span>
              <span className="font-medium">
                {data.invitations.filter(inv => inv.sendImmediately).length}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Send later:</span>
              <span className="font-medium">
                {data.invitations.filter(inv => !inv.sendImmediately).length}
              </span>
            </div>
          </div>

          {data.invitations.some(inv => !inv.sendImmediately) && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>
                  Invitations marked "Send later" will be created but not sent. 
                  You can send them manually from the tenant management page.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};