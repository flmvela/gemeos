/**
 * Teacher Permissions Step Component
 * Fourth step in the teacher creation wizard
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, FileText, BookOpen, Award, CheckCircle } from 'lucide-react';
import { useTeacherWizardStore } from '@/stores/teacher-wizard.store';

export const TeacherPermissionsStep: React.FC = () => {
  const { data, updateData } = useTeacherWizardStore();
  const permissions = data.permissions;

  const handlePermissionChange = (key: string, value: boolean) => {
    updateData('permissions', {
      permissions: {
        ...permissions.permissions,
        [key]: value
      }
    });
  };

  const handleRestrictionChange = (key: string, value: boolean) => {
    updateData('permissions', {
      accessRestrictions: {
        ...permissions.accessRestrictions,
        [key]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <Shield className="h-4 w-4 text-gray-500" />
          System Permissions
        </Label>
        <p className="text-sm text-muted-foreground">
          Configure what this teacher can do in the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Core Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="canCreateClasses">Create Classes</Label>
                <p className="text-sm text-muted-foreground">Allow teacher to create and manage classes</p>
              </div>
            </div>
            <Switch
              id="canCreateClasses"
              checked={permissions.permissions.canCreateClasses}
              onCheckedChange={(checked) => handlePermissionChange('canCreateClasses', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="canManageStudents">Manage Students</Label>
                <p className="text-sm text-muted-foreground">Add, remove, and manage student enrollments</p>
              </div>
            </div>
            <Switch
              id="canManageStudents"
              checked={permissions.permissions.canManageStudents}
              onCheckedChange={(checked) => handlePermissionChange('canManageStudents', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="canViewReports">View Reports</Label>
                <p className="text-sm text-muted-foreground">Access performance and analytics reports</p>
              </div>
            </div>
            <Switch
              id="canViewReports"
              checked={permissions.permissions.canViewReports}
              onCheckedChange={(checked) => handlePermissionChange('canViewReports', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="canManageDomainContent">Manage Domain Content</Label>
                <p className="text-sm text-muted-foreground">Edit curriculum and learning materials</p>
              </div>
            </div>
            <Switch
              id="canManageDomainContent"
              checked={permissions.permissions.canManageDomainContent}
              onCheckedChange={(checked) => handlePermissionChange('canManageDomainContent', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Access Restrictions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="restrictToOwnStudents">Restrict to Own Students</Label>
                <p className="text-sm text-muted-foreground">Can only view and manage their own students</p>
              </div>
            </div>
            <Switch
              id="restrictToOwnStudents"
              checked={permissions.accessRestrictions.restrictToOwnStudents}
              onCheckedChange={(checked) => handleRestrictionChange('restrictToOwnStudents', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="restrictToOwnClasses">Restrict to Own Classes</Label>
                <p className="text-sm text-muted-foreground">Can only view and manage their own classes</p>
              </div>
            </div>
            <Switch
              id="restrictToOwnClasses"
              checked={permissions.accessRestrictions.restrictToOwnClasses}
              onCheckedChange={(checked) => handleRestrictionChange('restrictToOwnClasses', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Special Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="isLeadTeacher">Lead Teacher</Label>
                <p className="text-sm text-muted-foreground">Can mentor and oversee other teachers</p>
              </div>
            </div>
            <Switch
              id="isLeadTeacher"
              checked={permissions.isLeadTeacher}
              onCheckedChange={(checked) => updateData('permissions', { isLeadTeacher: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="canApproveEnrollments">Approve Enrollments</Label>
                <p className="text-sm text-muted-foreground">Can approve or reject student enrollment requests</p>
              </div>
            </div>
            <Switch
              id="canApproveEnrollments"
              checked={permissions.canApproveEnrollments}
              onCheckedChange={(checked) => updateData('permissions', { canApproveEnrollments: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};