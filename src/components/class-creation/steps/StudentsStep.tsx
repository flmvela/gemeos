/**
 * Students Step
 * Add and invite students to the class
 * Matches the design pattern of teacher creation wizard
 */

import React, { useState } from 'react';
import { UserPlus, Mail, Upload, X, Check, AlertCircle, Info, Users } from 'lucide-react';
import { useStudentsStep } from '@/stores/class-wizard.store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function StudentsStep() {
  const { data, update, errors } = useStudentsStep();
  const [emailInput, setEmailInput] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);

  const handleAddEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (email && validateEmail(email)) {
      const currentEmails = data?.studentEmails || [];
      if (!currentEmails.includes(email)) {
        update({ studentEmails: [...currentEmails, email] });
      }
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    const currentEmails = data?.studentEmails || [];
    update({ 
      studentEmails: currentEmails.filter(email => email !== emailToRemove) 
    });
  };

  const handleBulkAdd = () => {
    const emails = bulkEmails
      .split(/[\n,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e && validateEmail(e));
    
    const currentEmails = data?.studentEmails || [];
    const uniqueEmails = [...new Set([...currentEmails, ...emails])];
    update({ studentEmails: uniqueEmails });
    setBulkEmails('');
    setShowBulkInput(false);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Add Students</h3>
        <p className="text-muted-foreground">Invite students to join your class</p>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Enrollment Type */}
      <div className="space-y-3">
        <Label className="text-base">Enrollment Type</Label>
        <Tabs value={data?.enrollmentType || 'invite-only'} onValueChange={(value) => update({ enrollmentType: value as any })}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invite-only">Invite Only</TabsTrigger>
            <TabsTrigger value="open">Open Enrollment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="invite-only" className="space-y-4 mt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Only invited students can join this class. You control who has access.
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          <TabsContent value="open" className="space-y-4 mt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Anyone with the class code can join. You can set a maximum enrollment limit.
              </AlertDescription>
            </Alert>
            
            {data?.enrollmentType === 'open' && (
              <div className="space-y-2">
                <Label htmlFor="enrollmentCode">Class Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="enrollmentCode"
                    value={data?.enrollmentCode || ''}
                    onChange={(e) => update({ enrollmentCode: e.target.value.toUpperCase() })}
                    placeholder="AUTO-GENERATED"
                    maxLength={8}
                    className="font-mono text-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                      update({ enrollmentCode: code });
                    }}
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Students will use this code to join your class
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Students Section */}
      {data?.enrollmentType === 'invite-only' && (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Student Email Addresses</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBulkInput(!showBulkInput)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Bulk Add
              </Button>
            </div>

            {/* Single Email Input */}
            {!showBulkInput ? (
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="student@example.com"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddEmail}
                  disabled={!emailInput.trim() || !validateEmail(emailInput.trim())}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={bulkEmails}
                  onChange={(e) => setBulkEmails(e.target.value)}
                  placeholder="Enter multiple email addresses, one per line or separated by commas"
                  rows={5}
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleBulkAdd}
                    disabled={!bulkEmails.trim()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Add All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowBulkInput(false);
                      setBulkEmails('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Email List */}
          {(data?.studentEmails?.length || 0) > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Added Students</Label>
                <Badge variant="secondary">
                  {data?.studentEmails?.length || 0} student{(data?.studentEmails?.length || 0) !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <Card>
                <CardContent className="p-3">
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {(data?.studentEmails || []).map((email, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{email}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEmail(email)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Invitation Settings */}
      <div className="space-y-4">
        <Label className="text-base">Invitation Settings</Label>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Send Invitations Immediately</p>
                <p className="text-sm text-muted-foreground">
                  Email invitations will be sent when the class is created
                </p>
              </div>
            </div>
            <Switch
              checked={data?.sendInvitesImmediately ?? true}
              onCheckedChange={(checked) => update({ sendInvitesImmediately: checked })}
            />
          </div>

          {data?.sendInvitesImmediately && (
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Include Parent/Guardian</p>
                  <p className="text-sm text-muted-foreground">
                    Send a copy of the invitation to parents
                  </p>
                </div>
              </div>
              <Switch
                checked={data.includeParentInvite ?? false}
                onCheckedChange={(checked) => update({ includeParentInvite: checked })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Custom Welcome Message */}
      <div className="space-y-2">
        <Label htmlFor="welcomeMessage">Welcome Message (Optional)</Label>
        <Textarea
          id="welcomeMessage"
          value={data?.defaultCustomMessage || ''}
          onChange={(e) => update({ defaultCustomMessage: e.target.value })}
          placeholder="Add a personal welcome message for your students..."
          rows={3}
          className="resize-none"
        />
        <p className="text-sm text-muted-foreground">
          This message will be included in the invitation email
        </p>
      </div>

      {/* Summary */}
      {(data?.enrollmentType === 'open' || (data?.studentEmails?.length || 0) > 0) && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {data?.enrollmentType === 'open' ? (
              <>
                <strong>Open enrollment enabled:</strong> Students can join with code {data?.enrollmentCode || 'AUTO-GENERATED'}
              </>
            ) : (
              <>
                <strong>Ready to invite:</strong> {data?.studentEmails?.length || 0} student{(data?.studentEmails?.length || 0) !== 1 ? 's' : ''} will receive invitations
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      {data?.enrollmentType === 'invite-only' && (data?.studentEmails?.length || 0) === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You can add students now or invite them later after creating the class.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}