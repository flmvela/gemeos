/**
 * Create Teacher Page
 * Full-page teacher creation workflow with wizard steps
 */

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  UserPlus, 
  Globe, 
  Calendar, 
  Shield, 
  FileText,
  ArrowLeft
} from 'lucide-react';
import { useTeacherWizardStore, type TeacherWizardStep } from '@/stores/teacher-wizard.store';
import { TeacherBasicInfoStep } from '@/components/teacher-management/wizard/TeacherBasicInfoStep';
import { TeacherDomainStep } from '@/components/teacher-management/wizard/TeacherDomainStep';
import { TeacherScheduleStep } from '@/components/teacher-management/wizard/TeacherScheduleStep';
import { TeacherPermissionsStep } from '@/components/teacher-management/wizard/TeacherPermissionsStep';
import { TeacherReviewStep } from '@/components/teacher-management/wizard/TeacherReviewStep';
import { cn } from '@/lib/utils';
import { teacherService } from '@/services/teacher.service';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const WIZARD_STEPS: Array<{
  key: TeacherWizardStep;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    key: 'basic',
    title: 'Basic Information',
    description: 'Teacher name, email, and contact details',
    icon: UserPlus
  },
  {
    key: 'domains',
    title: 'Domain Assignment',
    description: 'Teaching subjects and expertise',
    icon: Globe
  },
  {
    key: 'schedule',
    title: 'Schedule & Availability',
    description: 'Working hours and preferences',
    icon: Calendar
  },
  {
    key: 'permissions',
    title: 'Permissions & Access',
    description: 'System access and capabilities',
    icon: Shield
  },
  {
    key: 'review',
    title: 'Review & Confirm',
    description: 'Summary and final settings',
    icon: FileText
  }
];

export const CreateTeacherPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { session, tenantContext, isPlatformAdmin, isTenantAdmin } = useAuth();

  const {
    currentStep,
    completedSteps,
    errors,
    isLoading,
    data,
    setCurrentStep,
    markStepComplete,
    markStepIncomplete,
    validateStep,
    setLoading,
    initializeCreateMode,
    resetWizard
  } = useTeacherWizardStore();

  // Initialize wizard and sync with URL params
  useEffect(() => {
    initializeCreateMode();
    const urlStep = searchParams.get('step') as TeacherWizardStep;
    if (urlStep && WIZARD_STEPS.find(s => s.key === urlStep)) {
      setCurrentStep(urlStep);
    }
  }, []);

  // Debug tenant data
  useEffect(() => {
    console.log('CreateTeacherPage - Current session:', session);
    console.log('CreateTeacherPage - Current tenantContext:', tenantContext);
    console.log('CreateTeacherPage - session.current_tenant:', session?.current_tenant);
    console.log('CreateTeacherPage - Tenant ID from session:', session?.current_tenant?.tenant_id);
    console.log('CreateTeacherPage - Tenant ID from context:', tenantContext?.tenant?.id);
  }, [session, tenantContext]);

  // Update URL when step changes
  useEffect(() => {
    setSearchParams({ step: currentStep });
  }, [currentStep, setSearchParams]);

  // Permission guard - only platform admin or tenant admin can create teachers
  if (!isPlatformAdmin && !isTenantAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
                <p className="text-gray-600 mb-4">You do not have permission to create teachers.</p>
                <Button onClick={() => navigate(-1)} variant="outline">
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.key === currentStep);
  const progressPercentage = ((currentStepIndex + 1) / WIZARD_STEPS.length) * 100;

  const handleStepClick = (step: TeacherWizardStep) => {
    const stepIndex = WIZARD_STEPS.findIndex(s => s.key === step);
    const canNavigate = stepIndex <= currentStepIndex || 
      WIZARD_STEPS.slice(0, stepIndex).every(s => completedSteps.has(s.key));
    
    if (canNavigate) {
      setCurrentStep(step);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      markStepComplete(currentStep);
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < WIZARD_STEPS.length) {
        setCurrentStep(WIZARD_STEPS[nextIndex].key);
      }
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(WIZARD_STEPS[prevIndex].key);
    }
  };

  const handleCreate = async () => {
    console.log('Creating teacher - Session:', session);
    console.log('Creating teacher - TenantContext:', tenantContext);
    console.log('Creating teacher - current_tenant:', session?.current_tenant);
    
    // Get the current store state directly
    const currentStoreState = useTeacherWizardStore.getState();
    console.log('CreateTeacherPage - Current store state:', currentStoreState);
    console.log('CreateTeacherPage - Store data:', currentStoreState.data);
    console.log('CreateTeacherPage - Store data.basic:', currentStoreState.data.basic);
    
    // The tenant ID can come from either current_tenant.tenant_id or tenantContext.tenant.id
    const tenantId = session?.current_tenant?.tenant_id || tenantContext?.tenant?.id;
    
    if (!tenantId) {
      console.error('No tenant context found. Session:', session, 'TenantContext:', tenantContext);
      toast({
        title: 'Error',
        description: 'No tenant context found. Please refresh and try again.',
        variant: 'destructive'
      });
      return;
    }
    
    console.log('Using tenant ID:', tenantId);

    console.log('CreateTeacherPage - Submitting teacher data:', {
      data,
      tenantId,
      basicInfo: data.basic,
      hasEmail: !!data.basic.email,
      hasFirstName: !!data.basic.firstName,
      hasLastName: !!data.basic.lastName
    });
    
    // Use fresh data from the store
    const freshData = currentStoreState.data;
    
    // Validate that required fields are filled
    if (!freshData.basic.email || !freshData.basic.firstName || !freshData.basic.lastName) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (email, first name, last name)',
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Create teacher invitation using the service with fresh data
      const result = await teacherService.createTeacher(freshData, tenantId);
      
      toast({
        title: 'Teacher Invitation Created',
        description: freshData.basic.sendInvitation 
          ? `An invitation has been sent to ${result.email}. They will receive an email to set up their password.`
          : `Teacher invitation created for ${freshData.basic.firstName} ${freshData.basic.lastName}.`,
      });
      
      // Reset wizard and navigate back to tenant dashboard
      resetWizard();
      navigate('/tenant/dashboard');
    } catch (error) {
      console.error('Error creating teacher invitation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create teacher invitation. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return <TeacherBasicInfoStep />;
      case 'domains':
        return <TeacherDomainStep />;
      case 'schedule':
        return <TeacherScheduleStep />;
      case 'permissions':
        return <TeacherPermissionsStep />;
      case 'review':
        return <TeacherReviewStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/tenant/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-semibold">Create New Teacher</h1>
                <p className="text-sm text-muted-foreground">
                  Add a new teacher to your academy
                </p>
              </div>
            </div>
            <Badge variant="secondary">
              Step {currentStepIndex + 1} of {WIZARD_STEPS.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <Progress value={progressPercentage} className="h-1" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar Steps */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Setup Progress</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1 p-4">
                  {WIZARD_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = step.key === currentStep;
                    const isCompleted = completedSteps.has(step.key);
                    const isAccessible = index <= currentStepIndex || 
                      WIZARD_STEPS.slice(0, index).every(s => completedSteps.has(s.key));

                    return (
                      <button
                        key={step.key}
                        onClick={() => handleStepClick(step.key)}
                        disabled={!isAccessible}
                        className={cn(
                          'w-full flex items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                          isActive && 'bg-primary/10 text-primary',
                          !isActive && isAccessible && 'hover:bg-gray-100',
                          !isAccessible && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div className={cn(
                          'mt-0.5 rounded-full p-1',
                          isActive && 'bg-primary text-white',
                          isCompleted && !isActive && 'bg-green-100 text-green-600',
                          !isActive && !isCompleted && 'bg-gray-100 text-gray-400'
                        )}>
                          {isCompleted && !isActive ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Icon className="h-3 w-3" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className={cn(
                            'font-medium text-sm',
                            !isActive && !isAccessible && 'text-gray-400'
                          )}>
                            {step.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {step.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = WIZARD_STEPS[currentStepIndex].icon;
                    return (
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    );
                  })()}
                  <div>
                    <CardTitle>{WIZARD_STEPS[currentStepIndex].title}</CardTitle>
                    <CardDescription>
                      {WIZARD_STEPS[currentStepIndex].description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Step Content */}
                <div className="min-h-[400px]">
                  {renderStepContent()}
                </div>

                {/* Error Display */}
                {errors[currentStep] && errors[currentStep].length > 0 && (
                  <div className="mt-4 rounded-lg bg-red-50 p-4">
                    <ul className="list-disc list-inside space-y-1">
                      {errors[currentStep].map((error, index) => (
                        <li key={index} className="text-sm text-red-600">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-6 flex items-center justify-between pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStepIndex === 0}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  {currentStep === 'review' ? (
                    <Button
                      onClick={handleCreate}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white hover:from-[#0891b2] hover:to-[#7c3aed]"
                    >
                      {isLoading ? 'Creating...' : 'Create Teacher'}
                    </Button>
                  ) : (
                    <Button onClick={handleNext}>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};