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
  difficultyLevelIds: string[]; // Changed to support multiple difficulty levels
  difficultyProgression: 'single' | 'sequential' | 'mixed'; // How difficulties are handled
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  allowsStudentMessages: boolean;
  maxStudents: number;
  minStudents?: number;
}

export interface ClassSession {
  id?: string; // temporary ID for UI
  sessionName?: string;
  sessionType?: 'single' | 'recurring';
  sessionDate?: string; // YYYY-MM-DD format for single sessions
  dayOfWeek?: string; // Day name for recurring sessions (e.g., 'monday')
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  duration?: number; // Duration in minutes
  timeZone?: string;
  location?: 'online' | 'in-person' | 'hybrid';
  roomUrl?: string; // For online sessions (deprecated, use meetingLink)
  meetingLink?: string; // For online sessions
  physicalLocation?: string; // For in-person sessions (deprecated, use locationAddress)
  locationAddress?: string; // For in-person sessions
  sendCalendarInvites?: boolean; // Send calendar invitations to students
}

export interface RecurrencePattern {
  pattern: 'weekly' | 'bi-weekly' | 'monthly';
  endType: 'date' | 'occurrences';
  endDate?: string; // YYYY-MM-DD
  occurrences?: number;
  exceptions?: string[]; // Dates to skip (holidays)
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
  enrollmentType?: 'invite-only' | 'open' | 'both';
  enrollmentCode?: string;
  studentEmails?: string[];
  sendInvitesImmediately?: boolean;
  defaultCustomMessage?: string;
}

export interface WizardData {
  domain: DomainSelection;
  configuration: ClassConfiguration;
  sessions: ClassSession[];
  recurrence?: RecurrencePattern; // Optional recurrence pattern for sessions
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
  updateRecurrence: (recurrence: RecurrencePattern | undefined) => void;
  generateRecurringSessions: (baseSession: ClassSession, pattern: RecurrencePattern) => void;
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
    difficultyLevelIds: [], // Changed to array
    difficultyProgression: 'single',
    frequency: 'weekly',
    allowsStudentMessages: false,
    maxStudents: 30,
    minStudents: 1
  },
  sessions: [],
  recurrence: undefined,
  students: {
    students: [],
    enrollmentType: 'invite-only',
    enrollmentCode: '',
    studentEmails: [],
    sendInvitesImmediately: true,
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
          if (config.className === undefined && config.difficultyLevelIds && config.difficultyLevelIds.length > 0) {
            const { data } = get();
            const selectedDomain = data.domain.availableDomains.find(
              d => d.id === data.domain.selectedDomainId
            );
            const firstLevelId = config.difficultyLevelIds[0];
            const selectedLevel = selectedDomain?.difficultyLevels.find(
              l => l.id === firstLevelId
            );
            
            if (selectedDomain && selectedLevel && !data.configuration.className) {
              const levelText = config.difficultyLevelIds.length > 1 
                ? `${selectedLevel.level_name}+` 
                : selectedLevel.level_name;
              const autoName = `${levelText} ${selectedDomain.name}`;
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

        updateRecurrence: (recurrence) => {
          set(
            (state) => ({
              data: {
                ...state.data,
                recurrence
              }
            }),
            false,
            'updateRecurrence'
          );
        },

        generateRecurringSessions: (baseSession, pattern) => {
          const sessions: ClassSession[] = [];
          const { pattern: recPattern, endType, endDate, occurrences } = pattern;
          
          // Calculate how many sessions to generate
          let sessionCount = 0;
          let currentDate = new Date(baseSession.sessionDate || new Date().toISOString().split('T')[0]);
          
          if (endType === 'occurrences' && occurrences) {
            sessionCount = occurrences;
          } else if (endType === 'date' && endDate) {
            const end = new Date(endDate);
            const weeks = Math.ceil((end.getTime() - currentDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
            sessionCount = recPattern === 'weekly' ? weeks : recPattern === 'bi-weekly' ? Math.ceil(weeks / 2) : Math.ceil(weeks / 4);
          }
          
          // Generate sessions
          for (let i = 0; i < Math.min(sessionCount, 52); i++) { // Max 52 sessions (1 year)
            const sessionDate = new Date(currentDate);
            
            // Add interval based on pattern
            if (recPattern === 'weekly') {
              sessionDate.setDate(sessionDate.getDate() + (i * 7));
            } else if (recPattern === 'bi-weekly') {
              sessionDate.setDate(sessionDate.getDate() + (i * 14));
            } else if (recPattern === 'monthly') {
              sessionDate.setMonth(sessionDate.getMonth() + i);
            }
            
            // Skip if in exceptions
            const dateStr = sessionDate.toISOString().split('T')[0];
            if (pattern.exceptions?.includes(dateStr)) continue;
            
            sessions.push({
              ...baseSession,
              id: `session-${i}-${Date.now()}`,
              sessionDate: dateStr,
              sessionType: 'recurring'
            });
          }
          
          set(
            (state) => ({
              data: {
                ...state.data,
                sessions,
                recurrence: pattern
              }
            }),
            false,
            'generateRecurringSessions'
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
          // Reset data to initial state while preserving loaded domains
          set({
            data: {
              ...initialData,
              domain: {
                ...initialData.domain,
                availableDomains: get().data.domain.availableDomains // Preserve loaded domains
              }
            },
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
              if (data.configuration.difficultyLevelIds.length === 0) {
                errors.push('Please select at least one difficulty level');
              }
              if (data.configuration.maxStudents < 1) {
                errors.push('Maximum students must be at least 1');
              }
              if (data.configuration.maxStudents > 100) {
                errors.push('Maximum students cannot exceed 100');
              }
              if (data.configuration.minStudents && data.configuration.minStudents > data.configuration.maxStudents) {
                errors.push('Minimum students cannot exceed maximum students');
              }
              break;

            case 'sessions':
              if (data.sessions.length === 0) {
                errors.push('At least one class session is required');
              }
              
              for (const [index, session] of data.sessions.entries()) {
                if (session.sessionType === 'single' && !session.sessionDate) {
                  errors.push(`Session ${index + 1}: Date is required for single sessions`);
                }
                if (session.sessionType === 'recurring' && session.dayOfWeek === undefined) {
                  errors.push(`Session ${index + 1}: Day of week is required for recurring sessions`);
                }
                if (!session.startTime) {
                  errors.push(`Session ${index + 1}: Start time is required`);
                }
                // Check for either duration or endTime
                if (!session.duration && !session.endTime) {
                  errors.push(`Session ${index + 1}: Duration is required`);
                }
                if (session.startTime && session.endTime && session.startTime >= session.endTime) {
                  errors.push(`Session ${index + 1}: End time must be after start time`);
                }
              }
              
              // Validate recurrence if present
              if (data.recurrence) {
                if (data.recurrence.endType === 'date' && !data.recurrence.endDate) {
                  errors.push('End date is required for date-based recurrence');
                }
                if (data.recurrence.endType === 'occurrences' && !data.recurrence.occurrences) {
                  errors.push('Number of occurrences is required');
                }
              }
              break;

            case 'students':
              // Check if we have either students or student emails
              const hasStudents = data.students.students.length > 0;
              const hasStudentEmails = (data.students.studentEmails?.length || 0) > 0;
              const isOpenEnrollment = data.students.enrollmentType === 'open';
              
              // For open enrollment, students are optional
              // For invite-only, we need at least one student or email
              if (!isOpenEnrollment && !hasStudents && !hasStudentEmails) {
                errors.push('At least one student email is required for invite-only enrollment');
              }
              
              // Validate full student objects if present
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
              
              // Validate student emails if present
              if (data.students.studentEmails) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                for (const email of data.students.studentEmails) {
                  if (!emailRegex.test(email)) {
                    errors.push(`Invalid email address: ${email}`);
                  }
                  // Check for duplicates
                  if (emails.has(email.toLowerCase())) {
                    errors.push(`Duplicate email address: ${email}`);
                  } else {
                    emails.add(email.toLowerCase());
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
  const state = useClassWizardStore((state) => state);
  const errors = state.errors.sessions || [];
  
  // Create a comprehensive data object for sessions
  const data = {
    sessions: state.data.sessions || [],
    recurrence: state.data.recurrence,
    sessionType: (state.data.sessions?.length > 0 && state.data.recurrence) ? 'recurring' : 'single',
    location: state.data.sessions?.[0]?.location || 'online',
    locationAddress: state.data.sessions?.[0]?.locationAddress,
    meetingLink: state.data.sessions?.[0]?.meetingLink,
    sendCalendarInvites: state.data.sessions?.[0]?.sendCalendarInvites ?? true
  };
  
  // Update function that handles all session-related data
  const update = (updates: Partial<typeof data>) => {
    if (updates.sessions !== undefined) {
      state.updateSessions(updates.sessions);
    }
    if (updates.recurrence !== undefined) {
      state.updateRecurrence(updates.recurrence);
    }
    // Handle other properties by updating the first session
    if (updates.location !== undefined || updates.locationAddress !== undefined || 
        updates.meetingLink !== undefined || updates.sendCalendarInvites !== undefined) {
      const currentSessions = state.data.sessions || [];
      if (currentSessions.length > 0) {
        const updatedSession = {
          ...currentSessions[0],
          ...(updates.location !== undefined && { location: updates.location }),
          ...(updates.locationAddress !== undefined && { locationAddress: updates.locationAddress }),
          ...(updates.meetingLink !== undefined && { meetingLink: updates.meetingLink }),
          ...(updates.sendCalendarInvites !== undefined && { sendCalendarInvites: updates.sendCalendarInvites })
        };
        state.updateSession(0, updatedSession);
      } else {
        // Initialize with a new session if none exists
        state.updateSessions([{
          dayOfWeek: 'monday',
          startTime: '15:00',
          duration: 60,
          location: updates.location || 'online',
          locationAddress: updates.locationAddress,
          meetingLink: updates.meetingLink,
          sendCalendarInvites: updates.sendCalendarInvites ?? true
        }]);
      }
    }
    // Handle sessionType changes
    if (updates.sessionType !== undefined) {
      // This is handled in the component
    }
  };
  
  return { 
    data,
    update,
    addSession: state.addSession,
    updateSession: state.updateSession,
    removeSession: state.removeSession,
    errors, 
    validate: () => state.validateStep('sessions') 
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