/**
 * Teacher Wizard Store
 * Manages state for the teacher creation and editing workflow
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type TeacherWizardStep = 'basic' | 'domains' | 'schedule' | 'permissions' | 'review';

export interface TeacherBasicInfo {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  sendInvitation: boolean;
  temporaryPassword?: string;
}

export interface TeacherDomain {
  id: string;
  name: string;
  certificationLevel?: 'basic' | 'intermediate' | 'advanced' | 'expert';
}

export interface TeacherDomainAssignment {
  primaryDomain?: TeacherDomain;
  additionalDomains: TeacherDomain[];
  maxStudents?: number;
  preferredClassSize?: number;
  teachingModalities: Array<'in-person' | 'online' | 'hybrid'>;
}

export interface DaySchedule {
  start?: string;
  end?: string;
  available: boolean;
}

export interface TeacherSchedule {
  availability: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
  timezone: string;
  minClassDuration: number; // in minutes
  maxClassesPerDay: number;
  bufferBetweenClasses: number; // in minutes
}

export interface TeacherPermissions {
  permissions: {
    canCreateClasses: boolean;
    canManageStudents: boolean;
    canViewReports: boolean;
    canManageDomainContent: boolean;
  };
  accessRestrictions: {
    restrictToOwnStudents: boolean;
    restrictToOwnClasses: boolean;
  };
  isLeadTeacher: boolean;
  canApproveEnrollments: boolean;
}

export interface TeacherReview {
  notificationPreferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    inAppNotifications: boolean;
  };
  createInitialClass: boolean;
  sendWelcomeEmail: boolean;
}

export interface TeacherWizardData {
  basic: TeacherBasicInfo;
  domains: TeacherDomainAssignment;
  schedule: TeacherSchedule;
  permissions: TeacherPermissions;
  review: TeacherReview;
}

interface TeacherWizardStore {
  // State
  mode: 'create' | 'edit';
  teacherId?: string;
  currentStep: TeacherWizardStep;
  completedSteps: Set<TeacherWizardStep>;
  data: TeacherWizardData;
  errors: Partial<Record<TeacherWizardStep, string[]>>;
  isLoading: boolean;
  isDirty: boolean;

  // Actions
  setMode: (mode: 'create' | 'edit') => void;
  setTeacherId: (id: string) => void;
  setCurrentStep: (step: TeacherWizardStep) => void;
  markStepComplete: (step: TeacherWizardStep) => void;
  markStepIncomplete: (step: TeacherWizardStep) => void;
  updateData: <K extends keyof TeacherWizardData>(
    step: K,
    data: Partial<TeacherWizardData[K]>
  ) => void;
  setData: (data: Partial<TeacherWizardData>) => void;
  setErrors: (step: TeacherWizardStep, errors: string[]) => void;
  clearErrors: (step?: TeacherWizardStep) => void;
  setLoading: (loading: boolean) => void;
  validateStep: (step: TeacherWizardStep) => boolean;
  canNavigateToStep: (step: TeacherWizardStep) => boolean;
  resetWizard: () => void;
  initializeCreateMode: () => void;
  initializeEditMode: (teacherId: string, data: Partial<TeacherWizardData>) => void;
}

const DEFAULT_DATA: TeacherWizardData = {
  basic: {
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    sendInvitation: true,
    temporaryPassword: ''
  },
  domains: {
    additionalDomains: [],
    teachingModalities: ['in-person', 'online']
  },
  schedule: {
    availability: {
      monday: { available: true, start: '09:00', end: '17:00' },
      tuesday: { available: true, start: '09:00', end: '17:00' },
      wednesday: { available: true, start: '09:00', end: '17:00' },
      thursday: { available: true, start: '09:00', end: '17:00' },
      friday: { available: true, start: '09:00', end: '17:00' },
      saturday: { available: false },
      sunday: { available: false }
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    minClassDuration: 60,
    maxClassesPerDay: 6,
    bufferBetweenClasses: 15
  },
  permissions: {
    permissions: {
      canCreateClasses: true,
      canManageStudents: true,
      canViewReports: false,
      canManageDomainContent: false
    },
    accessRestrictions: {
      restrictToOwnStudents: true,
      restrictToOwnClasses: true
    },
    isLeadTeacher: false,
    canApproveEnrollments: false
  },
  review: {
    notificationPreferences: {
      emailNotifications: true,
      smsNotifications: false,
      inAppNotifications: true
    },
    createInitialClass: false,
    sendWelcomeEmail: true
  }
};

export const useTeacherWizardStore = create<TeacherWizardStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      mode: 'create',
      currentStep: 'basic',
      completedSteps: new Set(),
      data: DEFAULT_DATA,
      errors: {},
      isLoading: false,
      isDirty: false,

      // Actions
      setMode: (mode) => set({ mode }),

      setTeacherId: (id) => set({ teacherId: id }),

      setCurrentStep: (step) => set({ currentStep: step }),

      markStepComplete: (step) =>
        set((state) => ({
          completedSteps: new Set([...state.completedSteps, step])
        })),

      markStepIncomplete: (step) =>
        set((state) => {
          const newCompleted = new Set(state.completedSteps);
          newCompleted.delete(step);
          return { completedSteps: newCompleted };
        }),

      updateData: (step, stepData) =>
        set((state) => ({
          data: {
            ...state.data,
            [step]: {
              ...state.data[step],
              ...stepData
            }
          },
          isDirty: true
        })),

      setData: (data) =>
        set((state) => ({
          data: {
            ...state.data,
            ...data
          },
          isDirty: true
        })),

      setErrors: (step, errors) =>
        set((state) => ({
          errors: {
            ...state.errors,
            [step]: errors
          }
        })),

      clearErrors: (step?) =>
        set((state) => {
          if (step) {
            const newErrors = { ...state.errors };
            delete newErrors[step];
            return { errors: newErrors };
          }
          return { errors: {} };
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      validateStep: (step) => {
        const state = get();
        const stepData = state.data[step];
        const errors: string[] = [];

        switch (step) {
          case 'basic':
            const basic = stepData as TeacherBasicInfo;
            if (!basic.email) errors.push('Email is required');
            if (!basic.firstName) errors.push('First name is required');
            if (!basic.lastName) errors.push('Last name is required');
            if (!basic.sendInvitation && !basic.temporaryPassword) {
              errors.push('Password is required when not sending invitation');
            }
            break;

          case 'domains':
            const domains = stepData as TeacherDomainAssignment;
            if (!domains.primaryDomain) {
              errors.push('Primary domain is required');
            }
            if (domains.teachingModalities.length === 0) {
              errors.push('At least one teaching modality is required');
            }
            break;

          case 'schedule':
            const schedule = stepData as TeacherSchedule;
            const hasAvailableDay = Object.values(schedule.availability).some(
              day => day.available
            );
            if (!hasAvailableDay) {
              errors.push('At least one day must be available');
            }
            break;

          case 'permissions':
            // Permissions are optional with defaults
            break;

          case 'review':
            // Review step validation
            break;
        }

        if (errors.length > 0) {
          state.setErrors(step, errors);
          return false;
        }

        state.clearErrors(step);
        return true;
      },

      canNavigateToStep: (targetStep) => {
        const state = get();
        const steps: TeacherWizardStep[] = ['basic', 'domains', 'schedule', 'permissions', 'review'];
        const targetIndex = steps.indexOf(targetStep);
        const currentIndex = steps.indexOf(state.currentStep);

        // Can always go back
        if (targetIndex < currentIndex) return true;

        // Can only go forward if all previous steps are completed
        for (let i = 0; i < targetIndex; i++) {
          if (!state.completedSteps.has(steps[i])) {
            return false;
          }
        }

        return true;
      },

      resetWizard: () =>
        set({
          mode: 'create',
          teacherId: undefined,
          currentStep: 'basic',
          completedSteps: new Set(),
          data: DEFAULT_DATA,
          errors: {},
          isLoading: false,
          isDirty: false
        }),

      initializeCreateMode: () => {
        get().resetWizard();
        set({ mode: 'create' });
      },

      initializeEditMode: (teacherId, data) => {
        set({
          mode: 'edit',
          teacherId,
          currentStep: 'basic',
          completedSteps: new Set(['basic', 'domains', 'schedule', 'permissions']),
          data: {
            ...DEFAULT_DATA,
            ...data
          },
          errors: {},
          isLoading: false,
          isDirty: false
        });
      }
    }),
    {
      name: 'teacher-wizard-store'
    }
  )
);