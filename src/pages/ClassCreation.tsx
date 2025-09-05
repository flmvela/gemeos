/**
 * Class Creation Page
 * Entry point for teachers to create new classes
 */

import React, { useEffect } from 'react';
import { Plus, BookOpen, Users, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClassWizardStore } from '@/stores/class-wizard.store';
import { ClassWizard } from '@/components/class-creation/ClassWizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ClassCreation() {
  const { session, isTeacher, isPlatformAdmin, isTenantAdmin } = useAuth();
  const { openWizard, loadAvailableDomains } = useClassWizardStore();

  // Load available domains when component mounts
  useEffect(() => {
    if (session && (isTeacher || isPlatformAdmin || isTenantAdmin)) {
      loadAvailableDomains();
    }
  }, [session, isTeacher, isPlatformAdmin, isTenantAdmin, loadAvailableDomains]);

  // Check if user has permission to create classes
  const canCreateClasses = isTeacher || isPlatformAdmin || isTenantAdmin;

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground">Please sign in to create classes.</p>
        </div>
      </div>
    );
  }

  if (!canCreateClasses) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            Only teachers and administrators can create classes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Create New Class</h1>
              <p className="text-muted-foreground mt-2">
                Set up a new class and invite students to join your learning community.
              </p>
            </div>
            <Badge variant="outline" className="h-6">
              Teacher Dashboard
            </Badge>
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5 text-primary" />
                Select Domain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Choose the learning domain and difficulty level for your class.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-primary" />
                Schedule Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Set up your class schedule and meeting times.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-primary" />
                Invite Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add students and send them invitation emails.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Action */}
        <div className="text-center">
          <Card className="border-dashed border-2 p-8">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Ready to Create Your First Class?</CardTitle>
              <CardDescription className="text-base">
                Our step-by-step wizard will guide you through setting up your class,
                scheduling sessions, and inviting students.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={openWizard}
                size="lg"
                className="text-base px-8 py-3"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create New Class
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Takes about 5-10 minutes to complete
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-muted/50 rounded-lg p-6">
          <h3 className="font-semibold mb-3">Need Help Getting Started?</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Class Creation Tips:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Choose a clear, descriptive class name</li>
                <li>• Set appropriate difficulty level for your students</li>
                <li>• Schedule regular sessions for better engagement</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Student Invitations:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Students will receive email invitations automatically</li>
                <li>• Customize invitation messages for each student</li>
                <li>• Students can join with a simple click</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Class Creation Wizard */}
      <ClassWizard />
    </div>
  );
}