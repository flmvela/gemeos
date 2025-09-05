/**
 * Class Creation Wizard Store
 * Manages state for the teacher class creation wizard
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================================
// INTERFACES
// ============================================================

export interface DomainSelection {
  selectedDomainId: string | null;
  availableDomains: Array<{
    id: string;
    name: string;
    description?: string;
    difficultyLevels: DifficultyLevel[];
  }>;
}

export interface DifficultyLevel {
  id: string;
  level_name: string;
  level_order: number;
  description?: string;
  color_code?: string;
}

export interface ClassConfiguration {
  className: string;
  description: string;
  difficultyLevelId: string | null;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  allowsStudentMessages: boolean;
  maxStudents: number;
}

export interface ClassSession {
  id?: string; // temporary ID for UI
  sessionName?: string;
  sessionDate: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  timeZone: string;
}

export interface StudentInformation {
  id?: string; // temporary ID for UI
  firstName: string;
  lastName: string;
  email: string;
  customMessage?: string;
}

export interface StudentManagement {
  students: StudentInformation[];
  defaultCustomMessage: string;
}

export interface WizardData {
  domain: DomainSelection;
  configuration: ClassConfiguration;
  sessions: ClassSession[];
  students: StudentManagement;
}

export type ClassWizardStep = 'domain' | 'configuration' | 'sessions' | 'students' | 'review';

// ============================================================
// STORE INTERFACE
// ============================================================

interface ClassWizardState {
  // Current wizard data
  data: WizardData;
  
  // Wizard navigation
  currentStep: ClassWizardStep;
  completedSteps: Set<ClassWizardStep>;
  
  // UI state
  isOpen: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  
  // Validation
  errors: Record<string, string[]>;
  
  // Navigation actions
  setCurrentStep: (step: ClassWizardStep) => void;
  markStepComplete: (step: ClassWizardStep) => void;
  markStepIncomplete: (step: ClassWizardStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  
  // Data updates
  updateDomainSelection: (domain: Partial<DomainSelection>) => void;
  updateClassConfiguration: (config: Partial<ClassConfiguration>) => void;
  updateSessions: (sessions: ClassSession[]) => void;
  addSession: (session: ClassSession) => void;
  updateSession: (index: number, session: Partial<ClassSession>) => void;
  removeSession: (index: number) => void;
  updateStudentManagement: (students: Partial<StudentManagement>) => void;
  addStudent: (student: StudentInformation) => void;
  updateStudent: (index: number, student: Partial<StudentInformation>) => void;
  removeStudent: (index: number) => void;
  
  // Wizard control
  openWizard: () => void;
  closeWizard: () => void;
  resetWizard: () => void;
  
  // Validation
  validateStep: (step: ClassWizardStep) => Promise<boolean>;
  setErrors: (errors: Record<string, string[]>) => void;
  clearErrors: () => void;
  
  // Loading state
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  
  // Data loading
  loadAvailableDomains: () => Promise<void>;
}

// ============================================================
// INITIAL DATA
// ============================================================

const initialData: WizardData = {
  domain: {
    selectedDomainId: null,
    availableDomains: []
  },
  configuration: {
    className: '',
    description: '',
    difficultyLevelId: null,
    frequency: 'weekly',
    allowsStudentMessages: false,
    maxStudents: 30
  },
  sessions: [],
  students: {
    students: [],
    defaultCustomMessage: ''
  }
};

// ============================================================
// STEP SEQUENCE
// ============================================================

const stepSequence: ClassWizardStep[] = ['domain', 'configuration', 'sessions', 'students', 'review'];

const getStepIndex = (step: ClassWizardStep): number => {
  return stepSequence.indexOf(step);
};

const getNextStep = (currentStep: ClassWizardStep): ClassWizardStep | null => {
  const currentIndex = getStepIndex(currentStep);
  return currentIndex >= 0 && currentIndex < stepSequence.length - 1 
    ? stepSequence[currentIndex + 1] 
    : null;
};

const getPreviousStep = (currentStep: ClassWizardStep): ClassWizardStep | null => {
  const currentIndex = getStepIndex(currentStep);
  return currentIndex > 0 
    ? stepSequence[currentIndex - 1] 
    : null;
};

// ============================================================
// STORE IMPLEMENTATION
// ============================================================

export const useClassWizardStore = create<ClassWizardState>()( 
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        data: initialData,
        currentStep: 'domain',
        completedSteps: new Set(),
        isOpen: false,
        isLoading: false,
        isSubmitting: false,
        errors: {},

        // Navigation actions
        setCurrentStep: (step) => {
          set({ currentStep: step }, false, 'setCurrentStep');
        },

        markStepComplete: (step) => {
          set(
            (state) => ({
              completedSteps: new Set([...state.completedSteps, step])
            }),
            false,
            'markStepComplete'
          );
        },

        markStepIncomplete: (step) => {
          set(
            (state) => {
              const newCompleted = new Set(state.completedSteps);
              newCompleted.delete(step);
              return { completedSteps: newCompleted };
            },
            false,
            'markStepIncomplete'
          );
        },

        goToNextStep: () => {
          const { currentStep } = get();
          const nextStep = getNextStep(currentStep);
          if (nextStep) {
            set({ currentStep: nextStep }, false, 'goToNextStep');
          }
        },

        goToPreviousStep: () => {
          const { currentStep } = get();
          const previousStep = getPreviousStep(currentStep);
          if (previousStep) {
            set({ currentStep: previousStep }, false, 'goToPreviousStep');
          }
        },

        // Data update actions
        updateDomainSelection: (domain) => {
          set(
            (state) => ({
              data: {
                ...state.data,
                domain: { ...state.data.domain, ...domain }
              }
            }),
            false,
            'updateDomainSelection'
          );
        },

        updateClassConfiguration: (config) => {
          set(
            (state) => ({
              data: {
                ...state.data,
                configuration: { ...state.data.configuration, ...config }
              }
            }),
            false,
            'updateClassConfiguration'
          );

          // Auto-generate class name if not provided
          if (config.className === undefined && config.difficultyLevelId) {
            const { data } = get();
            const selectedDomain = data.domain.availableDomains.find(
              d => d.id === data.domain.selectedDomainId
            );
            const selectedLevel = selectedDomain?.difficultyLevels.find(
              l => l.id === config.difficultyLevelId
            );
            
            if (selectedDomain && selectedLevel && !data.configuration.className) {
              const autoName = `${selectedLevel.level_name} ${selectedDomain.name}`;
              set(
                (state) => ({
                  data: {
                    ...state.data,
                    configuration: { 
                      ...state.data.configuration, 
                      className: autoName 
                    }
                  }
                }),
                false,
                'autoGenerateClassName'
              );
            }
          }
        },

        updateSessions: (sessions) => {
          set(
            (state) => ({
              data: {
                ...state.data,
                sessions: sessions
              }
            }),
            false,
            'updateSessions'
          );
        },

        addSession: (session) => {
          set(
            (state) => ({
              data: {
                ...state.data,
                sessions: [
                  ...state.data.sessions,
                  { ...session, id: `temp-${Date.now()}-${Math.random()}` }
                ]
              }
            }),
            false,
            'addSession'
          );
        },

        updateSession: (index, session) => {
          set(
            (state) => ({
              data: {
                ...state.data,
                sessions: state.data.sessions.map((s, i) =>
                  i === index ? { ...s, ...session } : s
                )
              }
            }),
            false,
            'updateSession'
          );
        },

        removeSession: (index) => {
          set(
            (state) => ({
              data: {
                ...state.data,
                sessions: state.data.sessions.filter((_, i) => i !== index)
              }
            }),
            false,
            'removeSession'
          );
        },

        updateStudentManagement: (students) => {
          set(
            (state) => ({
              data: {
                ...state.data,
                students: { ...state.data.students, ...students }
              }
            }),
            false,
            'updateStudentManagement'
          );
        },

        addStudent: (student) => {
          set(
            (state) => ({
              data: {
                ...state.data,
                students: {
                  ...state.data.students,
                  students: [
                    ...state.data.students.students,
                    { ...student, id: `temp-${Date.now()}-${Math.random()}` }
                  ]
                }
              }
            }),
            false,
            'addStudent'
          );
        },

        updateStudent: (index, student) => {
          set(
            (state) => ({
              data: {
                ...state.data,
                students: {
                  ...state.data.students,
                  students: state.data.students.students.map((s, i) =>
                    i === index ? { ...s, ...student } : s
                  )
                }
              }
            }),
            false,
            'updateStudent'
          );
        },

        removeStudent: (index) => {
          set(
            (state) => ({
              data: {
                ...state.data,
                students: {
                  ...state.data.students,
                  students: state.data.students.students.filter((_, i) => i !== index)
                }
              }
            }),
            false,
            'removeStudent'
          );
        },

        // Wizard control
        openWizard: () => {
          set({
            isOpen: true,
            currentStep: 'domain',
            completedSteps: new Set(),
            errors: {}
          }, false, 'openWizard');
        },

        closeWizard: () => {
          set({
            isOpen: false,
            currentStep: 'domain',
            completedSteps: new Set(),
            errors: {}
          }, false, 'closeWizard');
        },

        resetWizard: () => {
          set({
            data: {
              ...initialData,
              domain: {
                ...initialData.domain,
                availableDomains: get().data.domain.availableDomains // Preserve loaded domains
              }
            },
            currentStep: 'domain',
            completedSteps: new Set(),
            errors: {}
          }, false, 'resetWizard');
        },

        // Validation
        validateStep: async (step) => {
          const { data } = get();
          const errors: string[] = [];

          switch (step) {
            case 'domain':
              if (!data.domain.selectedDomainId) {
                errors.push('Please select a domain for your class');
              }
              break;

            case 'configuration':
              if (!data.configuration.className.trim()) {
                errors.push('Class name is required');
              }
              if (data.configuration.className.length < 3) {
                errors.push('Class name must be at least 3 characters');
              }
              if (!data.configuration.difficultyLevelId) {
                errors.push('Please select a difficulty level');
              }
              if (data.configuration.maxStudents < 1) {
                errors.push('Maximum students must be at least 1');
              }
              if (data.configuration.maxStudents > 100) {
                errors.push('Maximum students cannot exceed 100');
              }
              break;

            case 'sessions':
              if (data.sessions.length === 0) {
                errors.push('At least one class session is required');
              }
              
              for (const [index, session] of data.sessions.entries()) {
                if (!session.sessionDate) {
                  errors.push(`Session ${index + 1}: Date is required`);
                }
                if (!session.startTime) {
                  errors.push(`Session ${index + 1}: Start time is required`);
                }
                if (!session.endTime) {
                  errors.push(`Session ${index + 1}: End time is required`);
                }
                if (session.startTime && session.endTime && session.startTime >= session.endTime) {
                  errors.push(`Session ${index + 1}: End time must be after start time`);
                }
              }
              break;

            case 'students':
              if (data.students.students.length === 0) {
                errors.push('At least one student is required');
              }
              
              const emails = new Set<string>();
              for (const [index, student] of data.students.students.entries()) {
                if (!student.firstName.trim()) {
                  errors.push(`Student ${index + 1}: First name is required`);
                }
                if (!student.lastName.trim()) {
                  errors.push(`Student ${index + 1}: Last name is required`);
                }
                if (!student.email.trim()) {
                  errors.push(`Student ${index + 1}: Email is required`);
                }
                
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (student.email && !emailRegex.test(student.email)) {
                  errors.push(`Student ${index + 1}: Invalid email address`);
                }
                
                // Check for duplicate emails
                if (student.email) {
                  if (emails.has(student.email.toLowerCase())) {
                    errors.push(`Duplicate email address: ${student.email}`);
                  } else {
                    emails.add(student.email.toLowerCase());
                  }
                }
              }
              break;

            case 'review':
              // Review step is always valid if we got this far
              break;
          }

          if (errors.length > 0) {
            set(
              (state) => ({
                errors: { ...state.errors, [step]: errors }
              }),
              false,
              'setValidationErrors'
            );
            return false;
          } else {
            set(
              (state) => {
                const newErrors = { ...state.errors };
                delete newErrors[step];
                return { errors: newErrors };
              },
              false,
              'clearValidationErrors'
            );
            return true;
          }
        },

        setErrors: (errors) => {
          set({ errors }, false, 'setErrors');
        },

        clearErrors: () => {
          set({ errors: {} }, false, 'clearErrors');
        },

        // Loading state
        setLoading: (isLoading) => {
          set({ isLoading }, false, 'setLoading');
        },

        setSubmitting: (isSubmitting) => {
          set({ isSubmitting }, false, 'setSubmitting');
        },

        // Data loading
        loadAvailableDomains: async () => {
          set({ isLoading: true }, false, 'loadAvailableDomains');
          
          try {
            const { classService } = await import('@/services/class.service');
            const domains = await classService.getAvailableDomainsForTeacher();
            
            set(
              (state) => ({
                data: {
                  ...state.data,
                  domain: {
                    ...state.data.domain,
                    availableDomains: domains.map(domain => ({
                      id: domain.id,
                      name: domain.name,
                      description: domain.description,
                      difficultyLevels: domain.difficulty_levels
                    }))
                  }
                },
                isLoading: false
              }),
              false,
              'setAvailableDomains'
            );

            // Auto-select if only one domain is available
            if (domains.length === 1) {
              set(
                (state) => ({
                  data: {
                    ...state.data,
                    domain: {
                      ...state.data.domain,
                      selectedDomainId: domains[0].id
                    }
                  }
                }),
                false,
                'autoSelectSingleDomain'
              );
            }
          } catch (error) {
            console.error('Failed to load available domains:', error);
            set({ isLoading: false }, false, 'loadAvailableDomainsError');
          }
        }
      }),
      {
        name: 'class-wizard-store',
        // Don't persist sensitive student email data
        partialize: (state) => ({
          currentStep: state.currentStep,
          completedSteps: Array.from(state.completedSteps),
          data: {
            ...state.data,
            students: {
              ...state.data.students,
              students: [] // Reset students on page reload for privacy
            }
          }
        }),
        onRehydrateStorage: () => (state) => {
          if (state && Array.isArray(state.completedSteps)) {
            state.completedSteps = new Set(state.completedSteps);
          }
        }
      }
    ),
    { name: 'class-wizard' }
  )
);

// ============================================================
// HELPER HOOKS
// ============================================================

export const useDomainStep = () => {
  const data = useClassWizardStore((state) => state.data.domain);
  const update = useClassWizardStore((state) => state.updateDomainSelection);
  const errors = useClassWizardStore((state) => state.errors.domain || []);
  const validate = useClassWizardStore((state) => state.validateStep);
  
  return { data, update, errors, validate: () => validate('domain') };
};

export const useConfigurationStep = () => {
  const data = useClassWizardStore((state) => state.data.configuration);
  const update = useClassWizardStore((state) => state.updateClassConfiguration);
  const errors = useClassWizardStore((state) => state.errors.configuration || []);
  const validate = useClassWizardStore((state) => state.validateStep);
  
  return { data, update, errors, validate: () => validate('configuration') };
};

export const useSessionsStep = () => {
  const sessions = useClassWizardStore((state) => state.data.sessions);
  const updateSessions = useClassWizardStore((state) => state.updateSessions);
  const addSession = useClassWizardStore((state) => state.addSession);
  const updateSession = useClassWizardStore((state) => state.updateSession);
  const removeSession = useClassWizardStore((state) => state.removeSession);
  const errors = useClassWizardStore((state) => state.errors.sessions || []);
  const validate = useClassWizardStore((state) => state.validateStep);
  
  return { 
    sessions, 
    updateSessions, 
    addSession, 
    updateSession, 
    removeSession, 
    errors, 
    validate: () => validate('sessions') 
  };
};

export const useStudentsStep = () => {
  const data = useClassWizardStore((state) => state.data.students);
  const update = useClassWizardStore((state) => state.updateStudentManagement);
  const addStudent = useClassWizardStore((state) => state.addStudent);
  const updateStudent = useClassWizardStore((state) => state.updateStudent);
  const removeStudent = useClassWizardStore((state) => state.removeStudent);
  const errors = useClassWizardStore((state) => state.errors.students || []);
  const validate = useClassWizardStore((state) => state.validateStep);
  
  return { 
    data, 
    update, 
    addStudent, 
    updateStudent, 
    removeStudent, 
    errors, 
    validate: () => validate('students') 
  };
};