/**
 * Create Tenant Page
 * Full-page tenant creation workflow replacing the modal
 */

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  Globe, 
  Users, 
  UserPlus, 
  Settings,
  ArrowLeft
} from 'lucide-react';
import { useTenantWizardStore, type WizardStep } from '@/stores/tenant-wizard.store';
import { BasicInfoStep } from '@/components/tenant-management/wizard/BasicInfoStep';
import { DomainAssignmentStep } from '@/components/tenant-management/wizard/DomainAssignmentStep';
import { GlobalLimitsStep } from '@/components/tenant-management/wizard/GlobalLimitsStep';
import { AdminInvitationStep } from '@/components/tenant-management/wizard/AdminInvitationStep';
import { TenantSettingsStep } from '@/components/tenant-management/wizard/TenantSettingsStep';
import { cn } from '@/lib/utils';
import { getEnhancedTenantService } from '@/services/enhanced-tenant.service';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const WIZARD_STEPS: Array<{
  key: WizardStep;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    key: 'basic',
    title: 'Basic Information',
    description: 'Tenant name, slug, and general settings',
    icon: Building2
  },
  {
    key: 'domains',
    title: 'Domain Assignment',
    description: 'Select learning domains for this tenant',
    icon: Globe
  },
  {
    key: 'limits',
    title: 'User Limits',
    description: 'Set global teacher and student limits',
    icon: Users
  },
  {
    key: 'admins',
    title: 'Admin Invitations',
    description: 'Invite tenant administrators',
    icon: UserPlus
  },
  {
    key: 'settings',
    title: 'Settings',
    description: 'Features and customization options',
    icon: Settings
  }
];

export const CreateTenantPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
  } = useTenantWizardStore();

  // Initialize wizard and sync with URL params
  useEffect(() => {
    initializeCreateMode();
    const urlStep = searchParams.get('step') as WizardStep;
    if (urlStep && WIZARD_STEPS.find(s => s.key === urlStep)) {
      setCurrentStep(urlStep);
    }
  }, [initializeCreateMode, searchParams, setCurrentStep]);

  // Update URL when step changes
  useEffect(() => {
    if (currentStep !== searchParams.get('step')) {
      setSearchParams({ step: currentStep }, { replace: true });
    }
  }, [currentStep, searchParams, setSearchParams]);

  const currentStepIndex = WIZARD_STEPS.findIndex(step => step.key === currentStep);
  const currentStepConfig = WIZARD_STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / WIZARD_STEPS.length) * 100;

  // Handle step navigation
  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    
    if (isValid) {
      markStepComplete(currentStep);
      
      if (isLastStep) {
        // Handle final submission
        await handleSubmit();
      } else {
        const nextIndex = Math.min(currentStepIndex + 1, WIZARD_STEPS.length - 1);
        setCurrentStep(WIZARD_STEPS[nextIndex].key);
      }
    } else {
      markStepIncomplete(currentStep);
    }
  };

  // Handle submission
  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const enhancedTenantService = getEnhancedTenantService(queryClient);
      
      // Transform data for the service
      const wizardData = {
        basic: data.basic,
        domains: data.domains,
        limits: data.limits,
        admins: data.admins,
        settings: data.settings
      };

      console.log('🚀 [CREATE-TENANT-PAGE] Starting tenant creation process');
      console.log('🚀 [CREATE-TENANT-PAGE] Wizard data validation:', {
        basicInfo: {
          name: data.basic.name,
          slug: data.basic.slug,
          status: data.basic.status,
          tier: data.basic.subscription_tier
        },
        domains: {
          count: data.domains.selectedDomainIds.length,
          ids: data.domains.selectedDomainIds
        },
        limits: data.limits,
        admins: {
          invitationCount: data.admins.invitations.length,
          emails: data.admins.invitations.map(inv => inv.email)
        }
      });
      
      const result = await enhancedTenantService.createTenantWithWizardData(wizardData);
      
      console.log('✅ [CREATE-TENANT-PAGE] Tenant created successfully:', result);
      
      toast({
        title: "Tenant Created",
        description: `${data.basic.name} has been created successfully with ${data.admins.invitations.length} admin invitation(s) sent`,
      });
      
      // Aggressive cache invalidation to ensure UI updates immediately
      await queryClient.invalidateQueries({ queryKey: ['tenants'] });
      await queryClient.invalidateQueries({ queryKey: ['tenants-grid'] });
      await queryClient.refetchQueries({ queryKey: ['tenants-grid'], type: 'active' });
      
      // Reset wizard and navigate back to tenant list
      resetWizard();
      navigate('/admin/dashboard', { replace: true });
      
    } catch (error) {
      console.error('❌ [CREATE-TENANT-PAGE] Tenant creation failed:', error);
      
      let errorMessage = "Failed to create tenant. Please try again.";
      
      // Handle specific error types
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === '23505' && 'details' in error) {
          const details = error.details as string;
          if (details.includes('slug')) {
            errorMessage = "This tenant slug is already taken. Please choose a different slug and try again.";
          } else {
            errorMessage = "A tenant with this information already exists. Please check your details and try again.";
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(WIZARD_STEPS[prevIndex].key);
  };

  const handleStepClick = (stepKey: WizardStep) => {
    const stepIndex = WIZARD_STEPS.findIndex(s => s.key === stepKey);
    
    // Allow navigation to previous steps or next step if current is completed
    if (stepIndex < currentStepIndex || completedSteps.has(currentStep)) {
      setCurrentStep(stepKey);
    }
  };

  const handleCancel = () => {
    resetWizard();
    navigate('/admin/dashboard');
  };

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1;

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return <BasicInfoStep />;
      case 'domains':
        return <DomainAssignmentStep />;
      case 'limits':
        return <GlobalLimitsStep />;
      case 'admins':
        return <AdminInvitationStep />;
      case 'settings':
        return <TenantSettingsStep />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleCancel}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tenants
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Create New Tenant</h1>
          <p className="text-muted-foreground">{currentStepConfig.description}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStepIndex + 1} of {WIZARD_STEPS.length}: {currentStepConfig.title}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Step Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Steps</CardTitle>
              <CardDescription>Complete all steps to create your tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {WIZARD_STEPS.map((step, index) => {
                const isActive = step.key === currentStep;
                const isCompleted = completedSteps.has(step.key);
                const hasErrors = errors[step.key]?.length > 0;
                const canAccess = index <= currentStepIndex || isCompleted;

                return (
                  <button
                    key={step.key}
                    onClick={() => canAccess && handleStepClick(step.key)}
                    disabled={!canAccess}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                      "hover:bg-accent disabled:cursor-not-allowed",
                      isActive && "bg-accent border border-border",
                      !canAccess && "opacity-50"
                    )}
                  >
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                      isCompleted && "bg-green-100 text-green-700",
                      isActive && !isCompleted && "bg-primary text-primary-foreground",
                      !isActive && !isCompleted && "bg-muted text-muted-foreground",
                      hasErrors && "bg-destructive/10 text-destructive"
                    )}>
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <step.icon className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "font-medium text-sm",
                        isActive && "text-foreground",
                        !isActive && "text-muted-foreground"
                      )}>
                        {step.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                        {step.description}
                      </div>
                      
                      {hasErrors && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          {errors[step.key]?.length} error{errors[step.key]?.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Step Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <currentStepConfig.icon className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-xl">{currentStepConfig.title}</CardTitle>
                  <CardDescription>{currentStepConfig.description}</CardDescription>
                </div>
              </div>
              
              {/* Display validation errors */}
              {errors[currentStep]?.length > 0 && (
                <div className="mt-4 p-3 border border-destructive/20 bg-destructive/5 rounded-lg">
                  <div className="text-sm font-medium text-destructive mb-1">
                    Please fix the following issues:
                  </div>
                  <ul className="text-sm text-destructive space-y-0.5">
                    {errors[currentStep].map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Step Content */}
          <Card>
            <CardContent className="p-6">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation Footer */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isFirstStep || isLoading}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  
                  {isLastStep ? (
                    <Button
                      onClick={handleNext}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Create Tenant
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};