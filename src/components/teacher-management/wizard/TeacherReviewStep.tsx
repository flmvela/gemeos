/**
 * Teacher Review Step Component
 * Final step in the teacher creation wizard
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Mail, 
  BookOpen, 
  Calendar, 
  Shield, 
  Bell,
  CheckCircle,
  Info
} from 'lucide-react';
import { useTeacherWizardStore } from '@/stores/teacher-wizard.store';

export const TeacherReviewStep: React.FC = () => {
  const { data, updateData } = useTeacherWizardStore();
  const review = data.review;

  const handleNotificationChange = (key: string, value: boolean) => {
    updateData('review', {
      notificationPreferences: {
        ...review.notificationPreferences,
        [key]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Please review the teacher information below. You can go back to any step to make changes.
        </AlertDescription>
      </Alert>

      {/* Basic Information Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium">{data.basic.firstName} {data.basic.lastName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{data.basic.email}</span>
          </div>
          {data.basic.phoneNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium">{data.basic.phoneNumber}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Setup:</span>
            <Badge variant={data.basic.sendInvitation ? 'default' : 'secondary'}>
              {data.basic.sendInvitation ? 'Email Invitation' : 'Temporary Password'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Domain Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4" />
            Teaching Domains
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {data.domains.primaryDomain && (
            <div>
              <p className="text-muted-foreground mb-1">Primary Domain:</p>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary">
                  {data.domains.primaryDomain.name}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {data.domains.primaryDomain.certificationLevel}
                </Badge>
              </div>
            </div>
          )}
          
          {data.domains.additionalDomains.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-1">Additional Domains:</p>
              <div className="flex flex-wrap gap-2">
                {data.domains.additionalDomains.map(domain => (
                  <Badge key={domain.id} variant="secondary">
                    {domain.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-between pt-2 border-t">
            <span className="text-muted-foreground">Teaching Modalities:</span>
            <div className="flex gap-1">
              {data.domains.teachingModalities.map(modality => (
                <Badge key={modality} variant="outline" className="text-xs capitalize">
                  {modality}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="space-y-1">
            {Object.entries(data.schedule.availability)
              .filter(([_, day]) => day.available)
              .map(([dayName, day]) => (
                <div key={dayName} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">{dayName}:</span>
                  <span className="font-medium">{day.start} - {day.end}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Permissions Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.permissions.permissions)
              .filter(([_, enabled]) => enabled)
              .map(([permission]) => (
                <Badge key={permission} variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {permission.replace(/([A-Z])/g, ' $1').replace('can ', '')}
                </Badge>
              ))}
            {data.permissions.isLeadTeacher && (
              <Badge className="bg-amber-100 text-amber-800 text-xs">
                Lead Teacher
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bell className="h-4 w-4" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailNotifications" className="text-sm">Email Notifications</Label>
            <Switch
              id="emailNotifications"
              checked={review.notificationPreferences.emailNotifications}
              onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="smsNotifications" className="text-sm">SMS Notifications</Label>
            <Switch
              id="smsNotifications"
              checked={review.notificationPreferences.smsNotifications}
              onCheckedChange={(checked) => handleNotificationChange('smsNotifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="inAppNotifications" className="text-sm">In-App Notifications</Label>
            <Switch
              id="inAppNotifications"
              checked={review.notificationPreferences.inAppNotifications}
              onCheckedChange={(checked) => handleNotificationChange('inAppNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Final Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">After Creation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sendWelcomeEmail" className="text-sm">Send Welcome Email</Label>
              <p className="text-xs text-muted-foreground">Send a welcome message to the teacher</p>
            </div>
            <Switch
              id="sendWelcomeEmail"
              checked={review.sendWelcomeEmail}
              onCheckedChange={(checked) => updateData('review', { sendWelcomeEmail: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="createInitialClass" className="text-sm">Create Initial Class</Label>
              <p className="text-xs text-muted-foreground">Set up a first class for this teacher</p>
            </div>
            <Switch
              id="createInitialClass"
              checked={review.createInitialClass}
              onCheckedChange={(checked) => updateData('review', { createInitialClass: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};