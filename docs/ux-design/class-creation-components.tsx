/**
 * Class Creation Wizard Component Specifications
 * 
 * This file contains detailed TypeScript interfaces and component structures
 * for implementing the teacher class creation wizard.
 * 
 * Design System: shadcn/ui
 * State Management: Zustand
 * Form Handling: react-hook-form + zod
 * Accessibility: WCAG 2.1 AA compliant
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Domain {
  id: string;
  name: string;
  description: string;
  icon?: string;
  conceptCount?: number;
}

export interface DifficultyLevel {
  id: string;
  level_value: number;
  label: string;
  description: string | null;
  color: string | null;
}

export interface ClassSchedule {
  id: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  startDate?: string; // ISO date
  endDate?: string;   // ISO date
}

export interface Student {
  id: string;
  name: string;
  email: string;
  personalMessage?: string;
  invitationStatus?: 'pending' | 'sent' | 'accepted' | 'declined';
}

export interface ClassConfiguration {
  name: string;
  domainId: string;
  difficultyLevelId: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  schedules: ClassSchedule[];
  enableStudentMessaging: boolean;
  maxStudents?: number;
  description?: string;
}

export interface WizardStep {
  id: number;
  name: string;
  component: React.ComponentType<WizardStepProps>;
  validation?: () => boolean;
  canSkip?: boolean;
}

// ============================================================================
// STORE INTERFACE
// ============================================================================

export interface ClassCreationStore {
  // Wizard Navigation State
  currentStep: number;
  completedSteps: Set<number>;
  isLoading: boolean;
  
  // Form Data
  selectedDomain: Domain | null;
  classConfig: Partial<ClassConfiguration>;
  students: Student[];
  
  // Draft Management
  draftId: string | null;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  
  // Actions - Navigation
  goToStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  markStepCompleted: (step: number) => void;
  
  // Actions - Data Management
  setDomain: (domain: Domain) => void;
  updateClassConfig: (config: Partial<ClassConfiguration>) => void;
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  removeStudent: (id: string) => void;
  
  // Actions - Schedule Management
  addSchedule: (schedule: Omit<ClassSchedule, 'id'>) => void;
  updateSchedule: (id: string, schedule: Partial<ClassSchedule>) => void;
  removeSchedule: (id: string) => void;
  
  // Actions - Draft & Persistence
  saveDraft: () => Promise<void>;
  loadDraft: (draftId: string) => Promise<void>;
  clearDraft: () => void;
  
  // Actions - Submission
  submitClass: () => Promise<{ success: boolean; classId?: string; error?: string }>;
  reset: () => void;
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

export interface WizardStepProps {
  store: ClassCreationStore;
  onNext: () => void;
  onBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    id: number;
    label: string;
    description?: string;
    status: 'completed' | 'current' | 'upcoming' | 'error';
  }>;
  onStepClick?: (stepId: number) => void;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

export interface ClassDetailsFormProps {
  classConfig: Partial<ClassConfiguration>;
  difficultyLevels: DifficultyLevel[];
  onUpdate: (config: Partial<ClassConfiguration>) => void;
  errors?: Record<string, string>;
}

export interface ScheduleSelectorProps {
  schedules: ClassSchedule[];
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  onAdd: (schedule: Omit<ClassSchedule, 'id'>) => void;
  onUpdate: (id: string, schedule: Partial<ClassSchedule>) => void;
  onRemove: (id: string) => void;
  maxSchedules?: number;
  errors?: string[];
}

export interface StudentFormProps {
  onAdd: (student: Omit<Student, 'id'>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

export interface StudentListProps {
  students: Student[];
  onEdit: (id: string, student: Partial<Student>) => void;
  onRemove: (id: string) => void;
  maxStudents?: number;
  emptyStateMessage?: string;
}

export interface ReviewSectionProps {
  title: string;
  items: Array<{ label: string; value: string | React.ReactNode }>;
  onEdit?: () => void;
  isEditable?: boolean;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

import { z } from 'zod';

export const ClassNameSchema = z
  .string()
  .min(3, 'Class name must be at least 3 characters')
  .max(60, 'Class name must be less than 60 characters')
  .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Class name contains invalid characters');

export const EmailSchema = z
  .string()
  .email('Please enter a valid email address')
  .toLowerCase();

export const StudentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: EmailSchema,
  personalMessage: z.string().max(500).optional(),
});

export const ScheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine(
  (data) => {
    const start = new Date(`2000-01-01T${data.startTime}`);
    const end = new Date(`2000-01-01T${data.endTime}`);
    return end > start;
  },
  { message: "End time must be after start time" }
);

export const ClassConfigSchema = z.object({
  name: ClassNameSchema,
  domainId: z.string().uuid(),
  difficultyLevelId: z.string().uuid(),
  frequency: z.enum(['weekly', 'bi-weekly', 'monthly']),
  schedules: z.array(ScheduleSchema).min(1, 'At least one schedule is required'),
  enableStudentMessaging: z.boolean(),
  maxStudents: z.number().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

// ============================================================================
// COMPONENT IMPLEMENTATIONS
// ============================================================================

/**
 * Main Wizard Container Component
 * 
 * Features:
 * - Manages step navigation
 * - Handles draft persistence
 * - Provides keyboard navigation
 * - Implements focus management
 */
export const ClassCreationWizard: React.FC = () => {
  // Implementation details...
};

/**
 * Step 1: Domain Selection Component
 * 
 * Features:
 * - Auto-selects if single domain
 * - Shows domain details on hover
 * - Keyboard navigable radio group
 * - Loading state for domain fetch
 */
export const DomainSelectionStep: React.FC<WizardStepProps> = () => {
  // Implementation details...
};

/**
 * Step 2: Class Configuration Component
 * 
 * Features:
 * - Dynamic difficulty level loading
 * - Schedule conflict detection
 * - Real-time validation
 * - Frequency-based schedule UI
 */
export const ClassConfigurationStep: React.FC<WizardStepProps> = () => {
  // Implementation details...
};

/**
 * Step 3: Student Management Component
 * 
 * Features:
 * - Bulk student import
 * - Email validation
 * - Duplicate detection
 * - Virtual scrolling for large lists
 */
export const StudentManagementStep: React.FC<WizardStepProps> = () => {
  // Implementation details...
};

/**
 * Step 4: Review & Confirmation Component
 * 
 * Features:
 * - Grouped information display
 * - Edit-in-place functionality
 * - Final validation check
 * - Warning highlights
 */
export const ReviewConfirmationStep: React.FC<WizardStepProps> = () => {
  // Implementation details...
};

/**
 * Step 5: Success State Component
 * 
 * Features:
 * - Animated success indicator
 * - Next action suggestions
 * - Class ID copy functionality
 * - Invitation tracking
 */
export const SuccessStateStep: React.FC<WizardStepProps> = () => {
  // Implementation details...
};

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Progress Indicator with Step Navigation
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  steps,
  onStepClick,
  orientation = 'horizontal',
  size = 'md',
}) => {
  // Implementation with proper ARIA attributes
};

/**
 * Schedule Time Picker
 */
export const ScheduleTimePicker: React.FC<{
  value: string;
  onChange: (time: string) => void;
  min?: string;
  max?: string;
  step?: number;
  disabled?: boolean;
}> = () => {
  // Custom time picker implementation
};

/**
 * Student Card Component
 */
export const StudentCard: React.FC<{
  student: Student;
  onEdit: () => void;
  onRemove: () => void;
  isEditing?: boolean;
}> = () => {
  // Card with inline edit capability
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook for managing wizard navigation
 */
export const useWizardNavigation = (store: ClassCreationStore) => {
  // Navigation logic, keyboard shortcuts, etc.
};

/**
 * Hook for form validation
 */
export const useFormValidation = <T extends z.ZodSchema>(
  schema: T,
  data: unknown
) => {
  // Validation logic with debouncing
};

/**
 * Hook for draft management
 */
export const useDraftPersistence = (store: ClassCreationStore) => {
  // Auto-save, recovery, expiry logic
};

/**
 * Hook for schedule conflict detection
 */
export const useScheduleConflicts = (
  schedules: ClassSchedule[],
  teacherId: string
) => {
  // Conflict detection logic
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    name: 'Domain Selection',
    component: DomainSelectionStep,
    canSkip: false,
  },
  {
    id: 2,
    name: 'Class Configuration',
    component: ClassConfigurationStep,
    canSkip: false,
  },
  {
    id: 3,
    name: 'Student Management',
    component: StudentManagementStep,
    canSkip: true,
  },
  {
    id: 4,
    name: 'Review & Confirmation',
    component: ReviewConfirmationStep,
    canSkip: false,
  },
  {
    id: 5,
    name: 'Success',
    component: SuccessStateStep,
    canSkip: false,
  },
];

export const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly', description: 'Classes meet once a week' },
  { value: 'bi-weekly', label: 'Bi-weekly', description: 'Classes meet every two weeks' },
  { value: 'monthly', label: 'Monthly', description: 'Classes meet once a month' },
];

export const DAY_OPTIONS = [
  { value: 0, label: 'Sunday', abbr: 'Sun' },
  { value: 1, label: 'Monday', abbr: 'Mon' },
  { value: 2, label: 'Tuesday', abbr: 'Tue' },
  { value: 3, label: 'Wednesday', abbr: 'Wed' },
  { value: 4, label: 'Thursday', abbr: 'Thu' },
  { value: 5, label: 'Friday', abbr: 'Fri' },
  { value: 6, label: 'Saturday', abbr: 'Sat' },
];

export const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const time = `${hour.toString().padStart(2, '0')}:${minute}`;
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return {
    value: time,
    label: `${displayHour}:${minute} ${period}`,
  };
});

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  DUPLICATE_EMAIL: 'This email is already in the student list',
  SCHEDULE_CONFLICT: 'This time slot conflicts with another class',
  MAX_STUDENTS_REACHED: 'Maximum number of students reached',
  NETWORK_ERROR: 'Unable to connect. Please check your connection and try again.',
  SAVE_DRAFT_ERROR: 'Unable to save draft. Your work may be lost if you leave.',
  VALIDATION_ERROR: 'Please correct the errors before continuing',
};