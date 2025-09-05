/**
 * Tenant Creation/Edit Wizard
 * Multi-step wizard for creating and editing tenants
 */

import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  X
} from 'lucide-react';
import { useTenantWizardStore, type WizardStep } from '@/stores/tenant-wizard.store';
import { BasicInfoStep } from './wizard/BasicInfoStep';
import { DomainAssignmentStep } from './wizard/DomainAssignmentStep';
import { GlobalLimitsStep } from './wizard/GlobalLimitsStep';
import { AdminInvitationStep } from './wizard/AdminInvitationStep';
import { TenantSettingsStep } from './wizard/TenantSettingsStep';
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

export const TenantWizard: React.FC = () => {
  const {
    isOpen,
    mode,
    currentStep,
    completedSteps,
    errors,
    isLoading,
    data,
    closeWizard,
    setCurrentStep,
    markStepComplete,
    markStepIncomplete,
    validateStep,
    setLoading
  } = useTenantWizardStore();

  const queryClient = useQueryClient();
  const { toast } = useToast();

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

      console.log('🚀 [QA] Starting tenant creation process');
      console.log('🚀 [QA] Wizard data validation:', {
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
      
      console.log('🚀 [QA] Calling enhanced tenant service...');
      
      const result = await enhancedTenantService.createTenantWithWizardData(wizardData);
      
      console.log('✅ [QA] Tenant created successfully:', result);
      console.log('✅ [QA] Database operations completed:', {
        tenantId: result.tenant?.id,
        domainsAssigned: result.domainsAssigned,
        invitationsSent: result.invitationsSent,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Tenant Created",
        description: `${data.basic.name} has been created successfully with ${data.admins.invitations.length} admin invitation(s) sent`,
      });
      
      // Close wizard and refresh data
      console.log('✅ [QA] Closing wizard and refreshing data...');
      
      // Aggressive cache invalidation to ensure UI updates immediately
      console.log('🔄 [QA] Invalidating all tenant-related queries...');
      
      // Invalidate all possible tenant query variations
      await queryClient.invalidateQueries({ queryKey: ['tenants'] });
      await queryClient.invalidateQueries({ queryKey: ['tenants-grid'] });
      await queryClient.invalidateQueries({ queryKey: ['tenants-grid'], exact: false });
      
      // Force refetch of active queries
      await queryClient.refetchQueries({ queryKey: ['tenants-grid'], type: 'active' });
      
      // Clear any stale cache data
      queryClient.removeQueries({ queryKey: ['tenants-grid'], exact: false });
      
      console.log('✅ [QA] Cache invalidation completed');
      
      closeWizard();
      
      console.log('✅ [QA] Tenant creation workflow completed successfully');
      
    } catch (error) {
      console.error('❌ [QA] Tenant creation failed:', error);
      console.error('❌ [QA] Error details:', {
        code: (error as { code?: string })?.code,
        message: (error as { message?: string })?.message,  
        details: (error as { details?: string })?.details,
        timestamp: new Date().toISOString()
      });
      
      let errorMessage = "Failed to create tenant. Please try again.";
      
      // Handle specific error types
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === '23505' && 'details' in error) {
          // Duplicate key constraint violation
          const details = error.details as string;
          if (details.includes('slug')) {
            errorMessage = "This tenant slug is already taken. Please choose a different slug and try again.";
          } else {
            errorMessage = "A tenant with this information already exists. Please check your details and try again.";
          }
        } else if (error.code === '23502') {
          // Not null constraint violation
          errorMessage = "Some required information is missing. Please fill in all required fields.";
        } else if (error.code === 'PGRST204') {
          // PostgREST schema error
          const message = error.message as string;
          if (message.includes('role')) {
            errorMessage = "There was an issue with role assignment. Please try again or contact support.";
          } else {
            errorMessage = "Database schema error. Please try again or contact support.";
          }
        } else if (error.code === '23503') {
          // Foreign key constraint violation  
          errorMessage = "Some referenced data is invalid. Please check your selections and try again.";
        } else if (error.code === '42703') {
          // Undefined column error
          errorMessage = "Database structure issue. Please contact support.";
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

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1;
  const canProceed = true; // Always allow proceeding - validation happens on click

  // Remove auto-validation - only validate when user clicks Next

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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={closeWizard}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {mode === 'create' ? 'Create New Tenant' : 'Edit Tenant'}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {currentStepConfig.description}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={closeWizard}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {currentStepIndex + 1} of {WIZARD_STEPS.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="flex-1 flex min-h-0">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r bg-muted/30 p-4 space-y-2">
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
                    "hover:bg-background/50 disabled:cursor-not-allowed",
                    isActive && "bg-background shadow-sm border",
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
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Step Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-2xl">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <currentStepConfig.icon className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">{currentStepConfig.title}</h2>
                  </div>
                  <p className="text-muted-foreground">{currentStepConfig.description}</p>
                  
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
                </div>

                {renderStepContent()}
              </div>
            </div>

            {/* Footer Navigation */}
            <Separator />
            <div className="p-6 flex items-center justify-between">
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
                {isLastStep ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed || isLoading}
                    className="gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        {mode === 'create' ? 'Creating...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        {mode === 'create' ? 'Create Tenant' : 'Save Changes'}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed || isLoading}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};