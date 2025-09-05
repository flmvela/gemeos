/**
 * Class Creation Wizard - Main Component
 * Vertical wizard for teachers to create classes
 */

import React from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useClassWizardStore } from '@/stores/class-wizard.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// Step Components
import { DomainSelectionStep } from './steps/DomainSelectionStep';
import { ClassConfigurationStep } from './steps/ClassConfigurationStep';
import { SessionsStep } from './steps/SessionsStep';
import { StudentsStep } from './steps/StudentsStep';
import { ReviewStep } from './steps/ReviewStep';

// ============================================================
// TYPES AND CONSTANTS
// ============================================================

const stepConfig = {
  domain: {
    title: 'Select Domain',
    description: 'Choose the learning domain for your class',
    component: DomainSelectionStep
  },
  configuration: {
    title: 'Class Configuration',
    description: 'Set up your class details and difficulty level',
    component: ClassConfigurationStep
  },
  sessions: {
    title: 'Schedule Sessions',
    description: 'Add your class sessions and schedules',
    component: SessionsStep
  },
  students: {
    title: 'Add Students',
    description: 'Invite students to your class',
    component: StudentsStep
  },
  review: {
    title: 'Review & Create',
    description: 'Review your class details and create the class',
    component: ReviewStep
  }
};

const stepOrder = ['domain', 'configuration', 'sessions', 'students', 'review'] as const;

// ============================================================
// MAIN COMPONENT
// ============================================================

export function ClassWizard() {
  const {
    isOpen,
    currentStep,
    completedSteps,
    isLoading,
    isSubmitting,
    errors,
    closeWizard,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    validateStep,
    markStepComplete
  } = useClassWizardStore();

  // Don't render if not open
  if (!isOpen) return null;

  // Get current step info
  const currentStepIndex = stepOrder.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === stepOrder.length - 1;
  const CurrentStepComponent = stepConfig[currentStep].component;

  // Handle next button click
  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      markStepComplete(currentStep);
      if (!isLastStep) {
        goToNextStep();
      } else {
        // Handle final submission
        handleSubmit();
      }
    }
  };

  // Handle submission
  const handleSubmit = async () => {
    const { setSubmitting, data } = useClassWizardStore.getState();
    
    try {
      setSubmitting(true);
      
      // Import and use the class service
      const { classService } = await import('@/services/class.service');
      const result = await classService.createClass(data);
      
      if (result.success) {
        console.log('Class created successfully:', {
          classId: result.class_id,
          sessionsCreated: result.sessions_created,
          invitationsSent: result.invitations_sent
        });
        
        // TODO: Show success message/toast
        // TODO: Redirect to class management page
        closeWizard();
      } else {
        throw new Error('Failed to create class');
      }
    } catch (error) {
      console.error('Failed to create class:', error);
      // TODO: Show error message/toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-2 sm:p-4">
      <div className="relative w-full max-w-5xl h-full max-h-[95vh] bg-background border rounded-lg shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-2xl font-semibold truncate">Create New Class</h2>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {stepConfig[currentStep].description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeWizard}
            className="h-8 w-8 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 min-h-0 flex-col sm:flex-row">
          {/* Sidebar - Step Navigation */}
          <div className="w-full sm:w-64 border-b sm:border-b-0 sm:border-r bg-muted/50">
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6">
                <nav className="space-y-2">
                  {stepOrder.map((step, index) => {
                    const isActive = step === currentStep;
                    const isCompleted = completedSteps.has(step);
                    const isAccessible = index === 0 || completedSteps.has(stepOrder[index - 1]);
                    
                    return (
                      <button
                        key={step}
                        onClick={() => isAccessible && setCurrentStep(step)}
                        disabled={!isAccessible}
                        className={`
                          w-full text-left p-3 rounded-lg border transition-all
                          ${isActive 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : isAccessible
                            ? 'bg-background border-border hover:bg-accent hover:text-accent-foreground'
                            : 'bg-muted border-muted-foreground/20 text-muted-foreground cursor-not-allowed'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
                            ${isCompleted
                              ? 'bg-green-500 text-white'
                              : isActive
                              ? 'bg-primary-foreground text-primary'
                              : 'bg-muted-foreground/20 text-muted-foreground'
                            }
                          `}>
                            {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {stepConfig[step].title}
                            </div>
                            {isActive && (
                              <div className="text-xs opacity-80 mt-1">
                                Step {index + 1} of {stepOrder.length}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Error indicator */}
                        {errors[step] && errors[step].length > 0 && (
                          <Badge variant="destructive" className="mt-2 text-xs">
                            {errors[step].length} error{errors[step].length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <ScrollArea className="flex-1">
              <div className="p-4 sm:p-6">
                {/* Step Title */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="text-xs">
                      Step {currentStepIndex + 1} of {stepOrder.length}
                    </Badge>
                    <h3 className="text-xl font-semibold">
                      {stepConfig[currentStep].title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground">
                    {stepConfig[currentStep].description}
                  </p>
                </div>

                <Separator className="mb-6" />

                {/* Error Summary */}
                {errors[currentStep] && errors[currentStep].length > 0 && (
                  <div className="mb-6 p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
                    <h4 className="font-medium text-destructive mb-2">
                      Please fix the following issues:
                    </h4>
                    <ul className="space-y-1">
                      {errors[currentStep].map((error, index) => (
                        <li key={index} className="text-sm text-destructive flex items-center gap-2">
                          <div className="w-1 h-1 bg-destructive rounded-full" />
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Step Content */}
                <div className="space-y-6">
                  <CurrentStepComponent />
                </div>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t p-4 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={isFirstStep || isSubmitting}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={closeWizard}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    onClick={handleNext}
                    disabled={isLoading || isSubmitting}
                    className="flex items-center gap-2 min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent" />
                        Creating...
                      </>
                    ) : isLastStep ? (
                      <>
                        <Check className="h-4 w-4" />
                        Create Class
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <span>Progress: {currentStepIndex + 1} of {stepOrder.length}</span>
                  <span>({Math.round(((currentStepIndex + 1) / stepOrder.length) * 100)}%)</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full">
                  <div
                    className="h-2 bg-primary rounded-full transition-all duration-300"
                    style={{
                      width: `${((currentStepIndex + 1) / stepOrder.length) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}