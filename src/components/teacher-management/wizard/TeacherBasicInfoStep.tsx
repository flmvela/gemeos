/**
 * Teacher Basic Info Step Component
 * First step in the teacher creation wizard
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Mail, User, Phone, Lock } from 'lucide-react';
import { useTeacherWizardStore } from '@/stores/teacher-wizard.store';

export const TeacherBasicInfoStep: React.FC = () => {
  const { data, updateData, errors } = useTeacherWizardStore();
  const basicInfo = data.basic;

  const handleChange = (field: keyof typeof basicInfo, value: any) => {
    console.log(`TeacherBasicInfoStep - Updating field '${field}' with value:`, value);
    updateData('basic', { [field]: value });
    console.log('TeacherBasicInfoStep - Updated data.basic:', { ...data.basic, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Email Address */}
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-500" />
          Email Address
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="teacher@example.com"
          value={basicInfo.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className="max-w-md"
        />
        <p className="text-sm text-muted-foreground">
          This will be used for login and communications
        </p>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            First Name
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            placeholder="John"
            value={basicInfo.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="flex items-center gap-2">
            Last Name
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            placeholder="Doe"
            value={basicInfo.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
          />
        </div>
      </div>

      {/* Phone Number */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-500" />
          Phone Number
          <span className="text-sm text-muted-foreground ml-2">(Optional)</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={basicInfo.phoneNumber || ''}
          onChange={(e) => handleChange('phoneNumber', e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Invitation Settings */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between max-w-md">
          <div className="space-y-0.5">
            <Label htmlFor="sendInvitation" className="text-base">
              Send Invitation Email
            </Label>
            <p className="text-sm text-muted-foreground">
              Send an email invitation for the teacher to set up their account
            </p>
          </div>
          <Switch
            id="sendInvitation"
            checked={basicInfo.sendInvitation}
            onCheckedChange={(checked) => handleChange('sendInvitation', checked)}
          />
        </div>

        {!basicInfo.sendInvitation && (
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-500" />
              Temporary Password
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter a temporary password"
              value={basicInfo.temporaryPassword || ''}
              onChange={(e) => handleChange('temporaryPassword', e.target.value)}
              className="max-w-md"
            />
            <p className="text-sm text-muted-foreground">
              The teacher will be required to change this on first login
            </p>
          </div>
        )}
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {basicInfo.sendInvitation
            ? "An invitation email will be sent to the teacher's email address with instructions to set up their account."
            : "The teacher will need to use the temporary password to log in for the first time and will be prompted to create a new password."}
        </AlertDescription>
      </Alert>

      {/* Validation Errors */}
      {errors.basic && errors.basic.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.basic.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};