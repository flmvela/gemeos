# Teacher Class Creation System - Implementation Roadmap

## Executive Summary

This roadmap outlines the implementation phases for the teacher class creation system, with detailed component structures, milestones, and deliverables for each phase.

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal**: Establish database schema and core data models

#### Deliverables
1. Database migrations for all tables
2. TypeScript type definitions
3. Supabase RLS policies
4. Basic service layer structure

#### Tasks
- [ ] Create and test database migrations
- [ ] Implement enum types in database
- [ ] Set up RLS policies for multi-tenant isolation
- [ ] Create TypeScript interfaces and types
- [ ] Implement base service classes
- [ ] Set up error handling framework

### Phase 2: State Management & Services (Week 2-3)
**Goal**: Implement Zustand store and service layer

#### Deliverables
1. Complete Zustand store implementation
2. Service layer for all operations
3. Custom hooks for wizard logic
4. Draft persistence system

#### Tasks
- [ ] Implement `classWizard.store.ts` with all actions
- [ ] Create `ClassService` with CRUD operations
- [ ] Create `ScheduleService` with conflict detection
- [ ] Create `StudentService` with validation
- [ ] Implement auto-save functionality
- [ ] Add optimistic updates and rollback

### Phase 3: Core UI Components (Week 3-4)
**Goal**: Build the wizard framework and step components

#### Deliverables
1. Wizard container component
2. All five step components
3. Progress indicator
4. Navigation controls

#### Tasks
- [ ] Create `ClassCreationWizard.tsx` container
- [ ] Implement `WizardProgress.tsx` component
- [ ] Build `DomainSelectionStep.tsx`
- [ ] Build `ClassConfigurationStep.tsx`
- [ ] Build `ScheduleConfigurationStep.tsx`
- [ ] Build `StudentManagementStep.tsx`
- [ ] Build `ReviewConfirmStep.tsx`

### Phase 4: Advanced Features (Week 4-5)
**Goal**: Implement complex features and interactions

#### Deliverables
1. Schedule conflict detection
2. CSV import functionality
3. Bulk student management
4. Email invitation system

#### Tasks
- [ ] Implement real-time conflict detection
- [ ] Create CSV parser and validator
- [ ] Build bulk import modal
- [ ] Integrate with email service
- [ ] Add invitation tracking
- [ ] Implement resend functionality

### Phase 5: Polish & Optimization (Week 5-6)
**Goal**: Enhance UX and performance

#### Deliverables
1. Loading states and animations
2. Error recovery mechanisms
3. Accessibility improvements
4. Performance optimizations

#### Tasks
- [ ] Add skeleton loaders
- [ ] Implement smooth transitions
- [ ] Add keyboard navigation
- [ ] Optimize bundle size
- [ ] Implement virtual scrolling
- [ ] Add comprehensive error boundaries

### Phase 6: Testing & Documentation (Week 6)
**Goal**: Ensure quality and maintainability

#### Deliverables
1. Unit test coverage > 80%
2. Integration tests for critical paths
3. User documentation
4. Developer documentation

#### Tasks
- [ ] Write unit tests for all services
- [ ] Create integration tests for wizard flow
- [ ] Add E2E tests for happy path
- [ ] Document component APIs
- [ ] Create user guide
- [ ] Record demo video

## Component Implementation Details

### 1. ClassCreationWizard Component

```typescript
// components/class-creation/ClassCreationWizard.tsx

import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useClassWizard } from '@/hooks/class-creation/useClassWizard';
import { WizardProgress } from './ui/WizardProgress';
import { DomainSelectionStep } from './steps/DomainSelectionStep';
import { ClassConfigurationStep } from './steps/ClassConfigurationStep';
import { ScheduleConfigurationStep } from './steps/ScheduleConfigurationStep';
import { StudentManagementStep } from './steps/StudentManagementStep';
import { ReviewConfirmStep } from './steps/ReviewConfirmStep';
import { ClassCreationErrorBoundary } from './ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';

export const ClassCreationWizard: React.FC = () => {
  const {
    currentStep,
    formData,
    isLoading,
    validateCurrentStep,
    goToNextStep,
    goToPreviousStep,
    handleCreateClass,
  } = useClassWizard();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        handleNext();
      } else if (e.key === 'Escape') {
        // Handle escape
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [currentStep]);

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      goToNextStep();
    }
  };

  const renderStep = () => {
    const stepComponents = {
      domain: <DomainSelectionStep />,
      configuration: <ClassConfigurationStep />,
      schedule: <ScheduleConfigurationStep />,
      students: <StudentManagementStep />,
      review: <ReviewConfirmStep onConfirm={handleCreateClass} />,
    };

    return stepComponents[currentStep];
  };

  return (
    <ClassCreationErrorBoundary>
      <div className="container mx-auto max-w-4xl py-6">
        <Card className="p-6">
          <WizardProgress currentStep={currentStep} />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === 'domain' || isLoading}
            >
              Back
            </Button>
            
            {currentStep !== 'review' ? (
              <Button
                onClick={handleNext}
                disabled={isLoading}
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleCreateClass}
                disabled={isLoading}
              >
                Create Class
              </Button>
            )}
          </div>
        </Card>
      </div>
    </ClassCreationErrorBoundary>
  );
};
```

### 2. Schedule Configuration Component

```typescript
// components/class-creation/steps/ScheduleConfigurationStep.tsx

import React, { useState } from 'react';
import { useClassWizardStore } from '@/stores/class-creation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Alert } from '@/components/ui/alert';
import { useScheduleConflicts } from '@/hooks/class-creation/useScheduleConflicts';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

export const ScheduleConfigurationStep: React.FC = () => {
  const { formData, addSchedule, updateSchedule, removeSchedule } = useClassWizardStore();
  const { conflicts, checkConflicts } = useScheduleConflicts();
  const [currentSchedule, setCurrentSchedule] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    startDate: new Date(),
    endDate: null,
    recurrencePattern: 'weekly' as const,
  });

  const handleAddSchedule = async () => {
    const hasConflicts = await checkConflicts(currentSchedule);
    
    if (!hasConflicts) {
      addSchedule(currentSchedule);
      // Reset form
      setCurrentSchedule({
        ...currentSchedule,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
      });
    }
  };

  const calculateTotalLessons = () => {
    // Calculate based on frequency and date range
    if (!currentSchedule.startDate) return 0;
    
    const start = new Date(currentSchedule.startDate);
    const end = currentSchedule.endDate ? new Date(currentSchedule.endDate) : 
                new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days default
    
    const weeks = Math.floor((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    switch (formData.lessonFrequency) {
      case 'weekly':
        return weeks;
      case 'bi_weekly':
        return Math.floor(weeks / 2);
      case 'monthly':
        return Math.floor(weeks / 4);
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Schedule Your Classes</h2>
        <p className="text-muted-foreground">
          Define when your classes will take place
        </p>
      </div>

      {/* Current Schedules */}
      {formData.schedules.length > 0 && (
        <div className="space-y-2">
          <Label>Current Schedules</Label>
          {formData.schedules.map((schedule) => (
            <Card key={schedule.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {getDayName(schedule.dayOfWeek)} {schedule.startTime} - {schedule.endTime}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSchedule(schedule.id)}
                >
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Schedule */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Day of Week</Label>
            <Select
              value={currentSchedule.dayOfWeek.toString()}
              onValueChange={(value) => 
                setCurrentSchedule({ ...currentSchedule, dayOfWeek: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Time Zone</Label>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{currentSchedule.timezone}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Time</Label>
            <TimePicker
              value={currentSchedule.startTime}
              onChange={(time) => 
                setCurrentSchedule({ ...currentSchedule, startTime: time })
              }
            />
          </div>

          <div>
            <Label>End Time</Label>
            <TimePicker
              value={currentSchedule.endTime}
              onChange={(time) => 
                setCurrentSchedule({ ...currentSchedule, endTime: time })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <DatePicker
              value={currentSchedule.startDate}
              onChange={(date) => 
                setCurrentSchedule({ ...currentSchedule, startDate: date })
              }
            />
          </div>

          <div>
            <Label>End Date (Optional)</Label>
            <DatePicker
              value={currentSchedule.endDate}
              onChange={(date) => 
                setCurrentSchedule({ ...currentSchedule, endDate: date })
              }
            />
          </div>
        </div>

        <Button onClick={handleAddSchedule} className="w-full">
          Add Schedule
        </Button>
      </Card>

      {/* Conflict Warnings */}
      {conflicts.length > 0 && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Schedule Conflicts Detected</AlertTitle>
          <AlertDescription>
            {conflicts.map((conflict, index) => (
              <div key={index}>
                Conflicts with "{conflict.className}" on {getDayName(conflict.dayOfWeek)} 
                at {conflict.startTime}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Total Lessons */}
      <div className="bg-muted p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Lessons</span>
          <span className="text-2xl font-bold">{calculateTotalLessons()}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Based on {formData.lessonFrequency.replace('_', ' ')} frequency
        </p>
      </div>
    </div>
  );
};

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
  'Thursday', 'Friday', 'Saturday'
];

const getDayName = (dayIndex: number) => DAYS_OF_WEEK[dayIndex];
```

### 3. Student Import Service

```typescript
// services/class-creation/student-import.service.ts

import Papa from 'papaparse';
import { z } from 'zod';

const StudentSchema = z.object({
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export interface ImportResult {
  valid: StudentEntry[];
  invalid: Array<{
    row: number;
    data: any;
    errors: string[];
  }>;
  duplicates: Array<{
    email: string;
    existingLocation?: string;
  }>;
}

export class StudentImportService {
  /**
   * Parse CSV file and validate student data
   */
  static async parseCSV(file: File): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          // Normalize header names
          const normalized = header.toLowerCase().trim();
          const mapping = {
            'first name': 'firstName',
            'firstname': 'firstName',
            'last name': 'lastName',
            'lastname': 'lastName',
            'email': 'email',
            'e-mail': 'email',
          };
          return mapping[normalized] || normalized;
        },
        complete: (results) => {
          const importResult = this.validateStudents(results.data);
          resolve(importResult);
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        },
      });
    });
  }

  /**
   * Validate parsed student data
   */
  private static validateStudents(data: any[]): ImportResult {
    const valid: StudentEntry[] = [];
    const invalid: any[] = [];
    const emailSet = new Set<string>();
    const duplicates: any[] = [];

    data.forEach((row, index) => {
      try {
        const validated = StudentSchema.parse(row);
        
        // Check for duplicates
        if (emailSet.has(validated.email.toLowerCase())) {
          duplicates.push({
            email: validated.email,
            row: index + 2, // +2 for header and 0-index
          });
        } else {
          emailSet.add(validated.email.toLowerCase());
          valid.push({
            id: crypto.randomUUID(),
            ...validated,
            status: 'valid',
          });
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          invalid.push({
            row: index + 2,
            data: row,
            errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          });
        }
      }
    });

    return { valid, invalid, duplicates };
  }

  /**
   * Check for existing students in the system
   */
  static async checkExistingStudents(
    emails: string[],
    tenantId: string
  ): Promise<Map<string, string>> {
    const { data } = await supabase
      .from('class_students')
      .select('invited_email, classes!inner(name)')
      .in('invited_email', emails)
      .eq('classes.tenant_id', tenantId);

    const existingMap = new Map<string, string>();
    data?.forEach(student => {
      existingMap.set(student.invited_email, student.classes.name);
    });

    return existingMap;
  }

  /**
   * Generate CSV template
   */
  static generateTemplate(): string {
    const headers = ['First Name', 'Last Name', 'Email'];
    const sampleData = [
      ['John', 'Doe', 'john.doe@example.com'],
      ['Jane', 'Smith', 'jane.smith@example.com'],
    ];

    const csv = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');

    return csv;
  }

  /**
   * Download CSV template
   */
  static downloadTemplate() {
    const csv = this.generateTemplate();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
```

## Testing Strategy Implementation

### Unit Test Example

```typescript
// __tests__/stores/classWizard.store.test.ts

import { renderHook, act } from '@testing-library/react';
import { useClassWizardStore } from '@/stores/class-creation/classWizard.store';

describe('ClassWizardStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useClassWizardStore.setState({
      currentStep: 'domain',
      formData: {
        domainId: null,
        name: '',
        description: '',
        difficultyLevelId: null,
        lessonFrequency: 'weekly',
        maxStudents: 30,
        allowStudentMessaging: true,
        schedules: [],
        students: [],
        invitationMessage: '',
        tenantId: '',
        teacherId: '',
      },
      validationErrors: {},
      isLoading: false,
    });
  });

  test('should update form fields correctly', () => {
    const { result } = renderHook(() => useClassWizardStore());

    act(() => {
      result.current.updateFormField('name', 'Test Class');
    });

    expect(result.current.formData.name).toBe('Test Class');
  });

  test('should add and remove schedules', () => {
    const { result } = renderHook(() => useClassWizardStore());

    const schedule = {
      dayOfWeek: 1,
      startTime: '10:00',
      endTime: '11:00',
      timezone: 'America/New_York',
      startDate: '2025-01-01',
      recurrencePattern: 'weekly' as const,
    };

    act(() => {
      result.current.addSchedule(schedule);
    });

    expect(result.current.formData.schedules).toHaveLength(1);
    expect(result.current.formData.schedules[0]).toMatchObject(schedule);

    act(() => {
      result.current.removeSchedule(result.current.formData.schedules[0].id);
    });

    expect(result.current.formData.schedules).toHaveLength(0);
  });

  test('should validate required fields', async () => {
    const { result } = renderHook(() => useClassWizardStore());

    let isValid;
    await act(async () => {
      isValid = await result.current.validateStep('configuration');
    });

    expect(isValid).toBe(false);
    expect(result.current.validationErrors.name).toBeDefined();
  });
});
```

## Deployment Checklist

### Pre-deployment
- [ ] All database migrations tested in staging
- [ ] RLS policies verified with different user roles
- [ ] Performance testing completed (< 3s load time)
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Browser compatibility tested (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness verified
- [ ] Error tracking configured (Sentry)
- [ ] Analytics events implemented

### Deployment
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Edge functions deployed
- [ ] Static assets optimized and cached
- [ ] SSL certificates valid
- [ ] Rate limiting configured
- [ ] Monitoring alerts set up

### Post-deployment
- [ ] Smoke tests passed
- [ ] User acceptance testing completed
- [ ] Documentation published
- [ ] Support team trained
- [ ] Feature flags configured
- [ ] Rollback plan tested
- [ ] Performance metrics baseline established

## Success Metrics

### Technical Metrics
- **Page Load Time**: < 2 seconds (P95)
- **Time to Interactive**: < 3 seconds
- **API Response Time**: < 500ms (P95)
- **Error Rate**: < 0.5%
- **Test Coverage**: > 80%

### User Metrics
- **Wizard Completion Rate**: > 85%
- **Average Time to Create Class**: < 3 minutes
- **Student Invitation Success Rate**: > 75%
- **User Satisfaction Score**: > 4.5/5

### Business Metrics
- **Classes Created per Day**: Track growth
- **Average Students per Class**: Monitor engagement
- **Feature Adoption Rate**: > 60% of teachers
- **Support Ticket Volume**: < 5% of usage

## Risk Mitigation

### Technical Risks
1. **Database Performance**
   - Mitigation: Implement caching, optimize queries, add indexes
   
2. **Email Delivery Issues**
   - Mitigation: Multiple email providers, retry logic, fallback to in-app notifications

3. **Browser Compatibility**
   - Mitigation: Progressive enhancement, polyfills, graceful degradation

### Business Risks
1. **Low Adoption**
   - Mitigation: User training, in-app guidance, feature highlighting
   
2. **Data Loss**
   - Mitigation: Auto-save, draft recovery, confirmation dialogs

3. **Scalability**
   - Mitigation: Load testing, horizontal scaling plan, CDN usage

## Future Enhancements

### Phase 2 Features (Q2 2025)
- Class templates and presets
- Recurring class series
- Co-teacher support
- Advanced scheduling (holidays, exceptions)
- Integration with calendar apps

### Phase 3 Features (Q3 2025)
- AI-powered schedule optimization
- Automated student grouping
- Parent/guardian invitations
- Class capacity recommendations
- Performance analytics dashboard

### Phase 4 Features (Q4 2025)
- Mobile native app
- Offline mode with sync
- Video conferencing integration
- Automated attendance tracking
- Student self-enrollment