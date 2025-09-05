# Teacher Class Creation System - Technical Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Component Architecture](#component-architecture)
4. [State Management](#state-management)
5. [Service Layer](#service-layer)
6. [Security Architecture](#security-architecture)
7. [Performance Strategy](#performance-strategy)
8. [Testing Framework](#testing-framework)
9. [Deployment Strategy](#deployment-strategy)

---

## System Overview

### Architecture Principles
- **Domain-Driven Design**: Classes as aggregate root with related entities
- **Event-Driven Architecture**: Real-time updates via Supabase Realtime
- **Microservices Pattern**: Modular service boundaries with clear interfaces
- **CQRS Pattern**: Separate read models for performance optimization
- **Repository Pattern**: Data access abstraction for testability

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
├─────────────────────────────────────────────────────────┤
│         Presentation Layer (Components/Pages)            │
├─────────────────────────────────────────────────────────┤
│           State Management (Zustand Stores)              │
├─────────────────────────────────────────────────────────┤
│              Service Layer (API Clients)                 │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                  Backend (Supabase)                      │
├─────────────────────────────────────────────────────────┤
│                    PostgREST API                         │
├─────────────────────────────────────────────────────────┤
│              PostgreSQL with RLS Policies                │
├─────────────────────────────────────────────────────────┤
│           Edge Functions (Deno) for Complex Logic        │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

```sql
-- ============================================================
-- CLASSES TABLE - Main aggregate root
-- ============================================================
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE RESTRICT,
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    class_code VARCHAR(20) NOT NULL UNIQUE, -- Auto-generated unique code for student join
    
    -- Class Configuration
    difficulty_level INTEGER NOT NULL,
    max_students INTEGER NOT NULL DEFAULT 30,
    min_students INTEGER NOT NULL DEFAULT 1,
    
    -- Schedule Configuration
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('weekly', 'bi_weekly', 'monthly', 'custom')),
    schedule_config JSONB NOT NULL DEFAULT '{}', -- Stores complex schedule patterns
    start_date DATE NOT NULL,
    end_date DATE,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    
    -- Status Management
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed', 'archived')),
    published_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Settings
    settings JSONB NOT NULL DEFAULT '{}',
    features JSONB NOT NULL DEFAULT '{}', -- Enabled features for this class
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT classes_valid_dates CHECK (end_date IS NULL OR end_date > start_date),
    CONSTRAINT classes_valid_students CHECK (max_students >= min_students)
);

-- Indexes for performance
CREATE INDEX idx_classes_tenant_id ON public.classes(tenant_id);
CREATE INDEX idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX idx_classes_domain_id ON public.classes(domain_id);
CREATE INDEX idx_classes_status ON public.classes(status);
CREATE INDEX idx_classes_class_code ON public.classes(class_code);
CREATE INDEX idx_classes_schedule_type ON public.classes(schedule_type);
CREATE INDEX idx_classes_start_date ON public.classes(start_date);

-- ============================================================
-- CLASS_SESSIONS TABLE - Individual class sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    
    -- Session Details
    session_number INTEGER NOT NULL,
    title VARCHAR(255),
    description TEXT,
    
    -- Timing
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
    
    -- Virtual Meeting Info
    meeting_url TEXT,
    meeting_provider VARCHAR(50), -- zoom, teams, meet, etc.
    meeting_id VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT class_sessions_valid_times CHECK (scheduled_end > scheduled_start),
    CONSTRAINT class_sessions_unique_number UNIQUE (class_id, session_number)
);

CREATE INDEX idx_class_sessions_class_id ON public.class_sessions(class_id);
CREATE INDEX idx_class_sessions_scheduled_start ON public.class_sessions(scheduled_start);
CREATE INDEX idx_class_sessions_status ON public.class_sessions(status);

-- ============================================================
-- CLASS_ENROLLMENTS TABLE - Student enrollments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.class_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Enrollment Details
    enrollment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (enrollment_status IN ('pending', 'active', 'completed', 'dropped', 'expelled')),
    enrollment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Invitation Tracking
    invited_by UUID REFERENCES auth.users(id),
    invitation_sent_at TIMESTAMPTZ,
    invitation_accepted_at TIMESTAMPTZ,
    invitation_token UUID DEFAULT uuid_generate_v4(),
    
    -- Progress Tracking
    attendance_rate DECIMAL(5,2) DEFAULT 0 CHECK (attendance_rate >= 0 AND attendance_rate <= 100),
    completion_rate DECIMAL(5,2) DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT class_enrollments_unique_student UNIQUE (class_id, student_id)
);

CREATE INDEX idx_class_enrollments_class_id ON public.class_enrollments(class_id);
CREATE INDEX idx_class_enrollments_student_id ON public.class_enrollments(student_id);
CREATE INDEX idx_class_enrollments_status ON public.class_enrollments(enrollment_status);
CREATE INDEX idx_class_enrollments_invitation_token ON public.class_enrollments(invitation_token);

-- ============================================================
-- CLASS_INVITATIONS TABLE - Pending invitations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.class_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    
    -- Recipient Information
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    
    -- Invitation Details
    invitation_type VARCHAR(20) NOT NULL DEFAULT 'student' 
        CHECK (invitation_type IN ('student', 'observer', 'assistant')),
    invitation_token UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    
    -- Status Tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'sent', 'accepted', 'declined', 'expired', 'cancelled')),
    
    -- Communication
    sent_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Metadata
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    message TEXT, -- Personal message from teacher
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT class_invitations_unique_email UNIQUE (class_id, email)
);

CREATE INDEX idx_class_invitations_class_id ON public.class_invitations(class_id);
CREATE INDEX idx_class_invitations_email ON public.class_invitations(email);
CREATE INDEX idx_class_invitations_token ON public.class_invitations(invitation_token);
CREATE INDEX idx_class_invitations_status ON public.class_invitations(status);
CREATE INDEX idx_class_invitations_expires_at ON public.class_invitations(expires_at);

-- ============================================================
-- CLASS_SCHEDULES TABLE - Recurring schedule patterns
-- ============================================================
CREATE TABLE IF NOT EXISTS public.class_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    
    -- Recurrence Pattern
    recurrence_rule TEXT NOT NULL, -- RFC 5545 RRULE format
    
    -- Time Configuration
    day_of_week INTEGER[] NOT NULL CHECK (array_length(day_of_week, 1) > 0), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    
    -- Validity Period
    effective_from DATE NOT NULL,
    effective_until DATE,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_class_schedules_class_id ON public.class_schedules(class_id);

-- ============================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================
CREATE TRIGGER update_classes_updated_at 
    BEFORE UPDATE ON public.classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_sessions_updated_at 
    BEFORE UPDATE ON public.class_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_enrollments_updated_at 
    BEFORE UPDATE ON public.class_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_invitations_updated_at 
    BEFORE UPDATE ON public.class_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_schedules_updated_at 
    BEFORE UPDATE ON public.class_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Classes RLS Policies
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own classes" ON public.classes
    FOR SELECT USING (
        auth.uid() = teacher_id OR
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            WHERE ut.user_id = auth.uid()
            AND ut.tenant_id = classes.tenant_id
            AND ut.role_id IN (
                SELECT id FROM public.roles WHERE name IN ('tenant_admin', 'platform_admin')
            )
        )
    );

CREATE POLICY "Teachers can create classes in their tenant" ON public.classes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid()
            AND ut.tenant_id = classes.tenant_id
            AND r.name IN ('teacher', 'tenant_admin', 'platform_admin')
        )
    );

CREATE POLICY "Teachers can update their own classes" ON public.classes
    FOR UPDATE USING (
        auth.uid() = teacher_id OR
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid()
            AND ut.tenant_id = classes.tenant_id
            AND r.name IN ('tenant_admin', 'platform_admin')
        )
    );

CREATE POLICY "Teachers can delete their draft classes" ON public.classes
    FOR DELETE USING (
        status = 'draft' AND (
            auth.uid() = teacher_id OR
            EXISTS (
                SELECT 1 FROM public.user_tenants ut
                JOIN public.roles r ON ut.role_id = r.id
                WHERE ut.user_id = auth.uid()
                AND ut.tenant_id = classes.tenant_id
                AND r.name IN ('tenant_admin', 'platform_admin')
            )
        )
    );

-- Class Sessions RLS Policies
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sessions for accessible classes" ON public.class_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = class_sessions.class_id
            AND (
                c.teacher_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.class_enrollments ce
                    WHERE ce.class_id = c.id
                    AND ce.student_id = auth.uid()
                    AND ce.enrollment_status = 'active'
                )
            )
        )
    );

-- Class Enrollments RLS Policies
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view enrollments for their classes" ON public.class_enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = class_enrollments.class_id
            AND c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can view their own enrollments" ON public.class_enrollments
    FOR SELECT USING (student_id = auth.uid());

-- Class Invitations RLS Policies
ALTER TABLE public.class_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage invitations for their classes" ON public.class_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = class_invitations.class_id
            AND c.teacher_id = auth.uid()
        )
    );

-- Class Schedules RLS Policies
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view schedules for accessible classes" ON public.class_schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = class_schedules.class_id
            AND (
                c.teacher_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.class_enrollments ce
                    WHERE ce.class_id = c.id
                    AND ce.student_id = auth.uid()
                    AND ce.enrollment_status = 'active'
                )
            )
        )
    );
```

### Database Functions

```sql
-- ============================================================
-- FUNCTION: Generate unique class code
-- ============================================================
CREATE OR REPLACE FUNCTION generate_class_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Generate class sessions from schedule
-- ============================================================
CREATE OR REPLACE FUNCTION generate_class_sessions(
    p_class_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_schedule_config JSONB
)
RETURNS VOID AS $$
DECLARE
    v_current_date DATE;
    v_session_number INTEGER := 1;
    v_schedule_type VARCHAR(20);
    v_day_of_week INTEGER[];
    v_start_time TIME;
    v_duration_minutes INTEGER;
BEGIN
    -- Extract schedule configuration
    v_schedule_type := p_schedule_config->>'schedule_type';
    v_day_of_week := ARRAY(SELECT jsonb_array_elements_text(p_schedule_config->'days_of_week')::INTEGER);
    v_start_time := (p_schedule_config->>'start_time')::TIME;
    v_duration_minutes := (p_schedule_config->>'duration_minutes')::INTEGER;
    
    -- Generate sessions based on schedule type
    v_current_date := p_start_date;
    
    WHILE v_current_date <= COALESCE(p_end_date, p_start_date + INTERVAL '6 months') LOOP
        -- Check if current day matches schedule
        IF EXTRACT(DOW FROM v_current_date)::INTEGER = ANY(v_day_of_week) THEN
            -- Insert session
            INSERT INTO public.class_sessions (
                class_id,
                session_number,
                scheduled_start,
                scheduled_end,
                status
            ) VALUES (
                p_class_id,
                v_session_number,
                v_current_date + v_start_time,
                v_current_date + v_start_time + (v_duration_minutes || ' minutes')::INTERVAL,
                'scheduled'
            );
            
            v_session_number := v_session_number + 1;
        END IF;
        
        -- Increment date based on schedule type
        CASE v_schedule_type
            WHEN 'weekly' THEN
                v_current_date := v_current_date + INTERVAL '1 day';
            WHEN 'bi_weekly' THEN
                v_current_date := v_current_date + INTERVAL '1 day';
                -- Skip alternate weeks
                IF EXTRACT(WEEK FROM v_current_date) % 2 = 0 THEN
                    v_current_date := v_current_date + INTERVAL '7 days';
                END IF;
            WHEN 'monthly' THEN
                v_current_date := v_current_date + INTERVAL '1 day';
            ELSE
                v_current_date := v_current_date + INTERVAL '1 day';
        END CASE;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Send class invitation email
-- ============================================================
CREATE OR REPLACE FUNCTION send_class_invitation(
    p_invitation_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_invitation RECORD;
    v_class RECORD;
    v_teacher RECORD;
BEGIN
    -- Get invitation details
    SELECT * INTO v_invitation
    FROM public.class_invitations
    WHERE id = p_invitation_id;
    
    -- Get class details
    SELECT * INTO v_class
    FROM public.classes
    WHERE id = v_invitation.class_id;
    
    -- Get teacher details
    SELECT p.* INTO v_teacher
    FROM public.profiles p
    WHERE p.id = v_class.teacher_id;
    
    -- Queue email (integrate with your email service)
    INSERT INTO public.email_queue (
        to_email,
        template_id,
        template_data,
        scheduled_for
    ) VALUES (
        v_invitation.email,
        'class_invitation',
        jsonb_build_object(
            'invitation_token', v_invitation.invitation_token,
            'class_name', v_class.name,
            'teacher_name', v_teacher.full_name,
            'personal_message', v_invitation.message,
            'class_code', v_class.class_code
        ),
        NOW()
    );
    
    -- Update invitation status
    UPDATE public.class_invitations
    SET status = 'sent', sent_at = NOW()
    WHERE id = p_invitation_id;
END;
$$ LANGUAGE plpgsql;
```

---

## Component Architecture

### Component Hierarchy

```typescript
// File Structure
src/
├── pages/
│   └── teacher/
│       └── ClassCreationWizard.tsx
├── components/
│   └── class-creation/
│       ├── wizard/
│       │   ├── ClassWizardContainer.tsx
│       │   ├── ClassWizardStepper.tsx
│       │   └── ClassWizardNavigation.tsx
│       ├── steps/
│       │   ├── DomainSelectionStep.tsx
│       │   ├── ClassDetailsStep.tsx
│       │   ├── ScheduleConfigStep.tsx
│       │   ├── StudentInvitationStep.tsx
│       │   └── ReviewAndCreateStep.tsx
│       ├── forms/
│       │   ├── ClassDetailsForm.tsx
│       │   ├── ScheduleForm.tsx
│       │   └── StudentInvitationForm.tsx
│       └── shared/
│           ├── DomainCard.tsx
│           ├── SchedulePreview.tsx
│           └── InvitationList.tsx
├── hooks/
│   └── class-creation/
│       ├── useClassWizard.ts
│       ├── useDomainSelection.ts
│       ├── useScheduleBuilder.ts
│       └── useStudentInvitations.ts
├── stores/
│   └── classWizard.store.ts
├── services/
│   └── class.service.ts
└── schemas/
    └── class.schema.ts
```

### Component Interfaces

```typescript
// src/types/class.types.ts
export interface ClassCreationData {
  // Basic Information
  name: string;
  description?: string;
  domainId: string;
  difficultyLevel: number;
  
  // Configuration
  maxStudents: number;
  minStudents: number;
  
  // Schedule
  scheduleType: 'weekly' | 'bi_weekly' | 'monthly' | 'custom';
  scheduleConfig: ScheduleConfig;
  startDate: Date;
  endDate?: Date;
  timezone: string;
  
  // Students
  invitations: StudentInvitation[];
  
  // Settings
  features: ClassFeatures;
  settings: ClassSettings;
}

export interface ScheduleConfig {
  daysOfWeek: number[]; // 0-6, Sunday to Saturday
  startTime: string; // HH:MM format
  durationMinutes: number;
  recurrenceRule?: string; // RFC 5545 RRULE
  exceptions?: ScheduleException[];
}

export interface StudentInvitation {
  email: string;
  firstName?: string;
  lastName?: string;
  personalMessage?: string;
  sendImmediately: boolean;
}

export interface ClassFeatures {
  recordSessions: boolean;
  allowGuestSpeakers: boolean;
  enableDiscussionForum: boolean;
  enableAssignments: boolean;
  enableQuizzes: boolean;
}

export interface ClassSettings {
  autoAcceptEnrollments: boolean;
  requireApproval: boolean;
  allowLateJoin: boolean;
  notificationPreferences: NotificationPreferences;
}
```

### Main Components

```typescript
// src/components/class-creation/wizard/ClassWizardContainer.tsx
import React, { useEffect } from 'react';
import { useClassWizardStore } from '@/stores/classWizard.store';
import { ClassWizardStepper } from './ClassWizardStepper';
import { ClassWizardNavigation } from './ClassWizardNavigation';
import { DomainSelectionStep } from '../steps/DomainSelectionStep';
import { ClassDetailsStep } from '../steps/ClassDetailsStep';
import { ScheduleConfigStep } from '../steps/ScheduleConfigStep';
import { StudentInvitationStep } from '../steps/StudentInvitationStep';
import { ReviewAndCreateStep } from '../steps/ReviewAndCreateStep';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const ClassWizardContainer: React.FC = () => {
  const {
    currentStep,
    isLoading,
    error,
    initializeWizard,
    submitClass
  } = useClassWizardStore();
  
  const { session } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (session?.user_id) {
      initializeWizard(session.user_id);
    }
  }, [session, initializeWizard]);
  
  const renderStep = () => {
    switch (currentStep) {
      case 'domain':
        return <DomainSelectionStep />;
      case 'details':
        return <ClassDetailsStep />;
      case 'schedule':
        return <ScheduleConfigStep />;
      case 'students':
        return <StudentInvitationStep />;
      case 'review':
        return <ReviewAndCreateStep />;
      default:
        return null;
    }
  };
  
  const handleSubmit = async () => {
    try {
      await submitClass();
      toast({
        title: "Class created successfully",
        description: "Students will receive their invitations shortly."
      });
    } catch (error) {
      toast({
        title: "Failed to create class",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <Card className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Class</h1>
          <p className="text-muted-foreground mt-2">
            Follow the steps below to set up your class
          </p>
        </div>
        
        <ClassWizardStepper currentStep={currentStep} />
        
        <div className="my-8">
          {renderStep()}
        </div>
        
        <ClassWizardNavigation 
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
};

// src/components/class-creation/steps/DomainSelectionStep.tsx
import React, { useEffect } from 'react';
import { useDomainSelection } from '@/hooks/class-creation/useDomainSelection';
import { DomainCard } from '../shared/DomainCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Info } from 'lucide-react';

export const DomainSelectionStep: React.FC = () => {
  const {
    domains,
    selectedDomain,
    isLoading,
    selectDomain,
    loadDomains
  } = useDomainSelection();
  
  useEffect(() => {
    loadDomains();
  }, [loadDomains]);
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }
  
  if (domains.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No domains available. Please contact your administrator.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Auto-select if only one domain
  useEffect(() => {
    if (domains.length === 1 && !selectedDomain) {
      selectDomain(domains[0].id);
    }
  }, [domains, selectedDomain, selectDomain]);
  
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Select Domain</h2>
        <p className="text-sm text-muted-foreground">
          Choose the subject domain for your class
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {domains.map((domain) => (
          <DomainCard
            key={domain.id}
            domain={domain}
            isSelected={selectedDomain?.id === domain.id}
            onSelect={() => selectDomain(domain.id)}
          />
        ))}
      </div>
    </div>
  );
};

// src/components/class-creation/steps/ScheduleConfigStep.tsx
import React from 'react';
import { useScheduleBuilder } from '@/hooks/class-creation/useScheduleBuilder';
import { ScheduleForm } from '../forms/ScheduleForm';
import { SchedulePreview } from '../shared/SchedulePreview';
import { Card } from '@/components/ui/card';

export const ScheduleConfigStep: React.FC = () => {
  const {
    schedule,
    updateSchedule,
    generateSessions,
    previewSessions
  } = useScheduleBuilder();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Configure Schedule</h2>
        <p className="text-sm text-muted-foreground">
          Set up when your class will meet
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScheduleForm
          schedule={schedule}
          onChange={updateSchedule}
          onGeneratePreview={generateSessions}
        />
        
        <Card className="p-4">
          <h3 className="font-medium mb-4">Schedule Preview</h3>
          <SchedulePreview sessions={previewSessions} />
        </Card>
      </div>
    </div>
  );
};
```

---

## State Management

### Zustand Store Design

```typescript
// src/stores/classWizard.store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ClassCreationData, WizardStep } from '@/types/class.types';

interface ClassWizardState {
  // Wizard Navigation
  currentStep: WizardStep;
  completedSteps: Set<WizardStep>;
  visitedSteps: Set<WizardStep>;
  
  // Data
  data: Partial<ClassCreationData>;
  draft: Partial<ClassCreationData>; // Auto-saved draft
  
  // Domain State
  availableDomains: Domain[];
  selectedDomain: Domain | null;
  difficultyLabels: DifficultyLabel[];
  
  // Schedule State
  previewSessions: ClassSession[];
  scheduleValidation: ValidationResult;
  
  // Student State
  invitations: StudentInvitation[];
  invitationValidation: ValidationResult;
  
  // UI State
  isLoading: boolean;
  isSaving: boolean;
  isValidating: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  
  // Actions - Navigation
  goToStep: (step: WizardStep) => void;
  goNext: () => Promise<boolean>;
  goPrevious: () => void;
  canGoNext: () => boolean;
  
  // Actions - Data Management
  updateData: (field: keyof ClassCreationData, value: any) => void;
  updateMultipleFields: (updates: Partial<ClassCreationData>) => void;
  saveDraft: () => Promise<void>;
  loadDraft: () => Promise<void>;
  clearDraft: () => void;
  
  // Actions - Domain
  loadDomains: () => Promise<void>;
  selectDomain: (domainId: string) => void;
  loadDifficultyLabels: (domainId: string) => Promise<void>;
  
  // Actions - Schedule
  updateSchedule: (schedule: Partial<ScheduleConfig>) => void;
  generateSchedulePreview: () => Promise<void>;
  validateSchedule: () => Promise<boolean>;
  addScheduleException: (exception: ScheduleException) => void;
  removeScheduleException: (date: string) => void;
  
  // Actions - Students
  addInvitation: (invitation: StudentInvitation) => void;
  removeInvitation: (email: string) => void;
  updateInvitation: (email: string, updates: Partial<StudentInvitation>) => void;
  importInvitations: (file: File) => Promise<void>;
  validateInvitations: () => Promise<boolean>;
  
  // Actions - Submission
  validateStep: (step: WizardStep) => Promise<boolean>;
  validateAll: () => Promise<boolean>;
  submitClass: () => Promise<ClassResponse>;
  
  // Actions - State Management
  initializeWizard: (teacherId: string) => void;
  resetWizard: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (step: WizardStep, errors: string[]) => void;
  clearErrors: (step?: WizardStep) => void;
}

const initialState = {
  currentStep: 'domain' as WizardStep,
  completedSteps: new Set<WizardStep>(),
  visitedSteps: new Set<WizardStep>(['domain']),
  data: {},
  draft: {},
  availableDomains: [],
  selectedDomain: null,
  difficultyLabels: [],
  previewSessions: [],
  scheduleValidation: { isValid: true, errors: [] },
  invitations: [],
  invitationValidation: { isValid: true, errors: [] },
  isLoading: false,
  isSaving: false,
  isValidating: false,
  errors: {},
  warnings: {}
};

export const useClassWizardStore = create<ClassWizardState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,
        
        // Navigation Actions
        goToStep: (step) => {
          set((state) => {
            state.currentStep = step;
            state.visitedSteps.add(step);
          });
        },
        
        goNext: async () => {
          const { currentStep, validateStep } = get();
          const isValid = await validateStep(currentStep);
          
          if (isValid) {
            set((state) => {
              state.completedSteps.add(currentStep);
              const steps: WizardStep[] = ['domain', 'details', 'schedule', 'students', 'review'];
              const currentIndex = steps.indexOf(currentStep);
              if (currentIndex < steps.length - 1) {
                state.currentStep = steps[currentIndex + 1];
                state.visitedSteps.add(steps[currentIndex + 1]);
              }
            });
            return true;
          }
          return false;
        },
        
        goPrevious: () => {
          set((state) => {
            const steps: WizardStep[] = ['domain', 'details', 'schedule', 'students', 'review'];
            const currentIndex = steps.indexOf(state.currentStep);
            if (currentIndex > 0) {
              state.currentStep = steps[currentIndex - 1];
            }
          });
        },
        
        canGoNext: () => {
          const { currentStep, data } = get();
          switch (currentStep) {
            case 'domain':
              return !!data.domainId;
            case 'details':
              return !!(data.name && data.difficultyLevel);
            case 'schedule':
              return !!(data.scheduleConfig && data.startDate);
            case 'students':
              return true; // Students are optional
            case 'review':
              return true;
            default:
              return false;
          }
        },
        
        // Data Management Actions
        updateData: (field, value) => {
          set((state) => {
            state.data[field] = value;
            // Auto-save to draft
            state.draft[field] = value;
          });
          
          // Debounced auto-save
          const { saveDraft } = get();
          setTimeout(() => saveDraft(), 1000);
        },
        
        updateMultipleFields: (updates) => {
          set((state) => {
            Object.assign(state.data, updates);
            Object.assign(state.draft, updates);
          });
        },
        
        saveDraft: async () => {
          const { data } = get();
          set((state) => {
            state.isSaving = true;
          });
          
          try {
            // Save to localStorage or API
            localStorage.setItem('class-wizard-draft', JSON.stringify(data));
          } finally {
            set((state) => {
              state.isSaving = false;
            });
          }
        },
        
        loadDraft: async () => {
          try {
            const draft = localStorage.getItem('class-wizard-draft');
            if (draft) {
              set((state) => {
                state.draft = JSON.parse(draft);
                state.data = JSON.parse(draft);
              });
            }
          } catch (error) {
            console.error('Failed to load draft:', error);
          }
        },
        
        clearDraft: () => {
          localStorage.removeItem('class-wizard-draft');
          set((state) => {
            state.draft = {};
          });
        },
        
        // Domain Actions
        loadDomains: async () => {
          set((state) => {
            state.isLoading = true;
          });
          
          try {
            const domains = await classService.getTeacherDomains();
            set((state) => {
              state.availableDomains = domains;
              // Auto-select if only one domain
              if (domains.length === 1) {
                state.selectedDomain = domains[0];
                state.data.domainId = domains[0].id;
              }
            });
          } catch (error) {
            set((state) => {
              state.errors.domain = ['Failed to load domains'];
            });
          } finally {
            set((state) => {
              state.isLoading = false;
            });
          }
        },
        
        selectDomain: (domainId) => {
          const domain = get().availableDomains.find(d => d.id === domainId);
          if (domain) {
            set((state) => {
              state.selectedDomain = domain;
              state.data.domainId = domainId;
            });
            // Load difficulty labels for the domain
            get().loadDifficultyLabels(domainId);
          }
        },
        
        loadDifficultyLabels: async (domainId) => {
          try {
            const labels = await classService.getDifficultyLabels(domainId);
            set((state) => {
              state.difficultyLabels = labels;
            });
          } catch (error) {
            console.error('Failed to load difficulty labels:', error);
          }
        },
        
        // Schedule Actions
        updateSchedule: (schedule) => {
          set((state) => {
            state.data.scheduleConfig = {
              ...state.data.scheduleConfig,
              ...schedule
            };
          });
          // Regenerate preview
          get().generateSchedulePreview();
        },
        
        generateSchedulePreview: async () => {
          const { data } = get();
          if (!data.scheduleConfig || !data.startDate) return;
          
          try {
            const sessions = await classService.generateSessionPreview({
              scheduleConfig: data.scheduleConfig,
              startDate: data.startDate,
              endDate: data.endDate
            });
            
            set((state) => {
              state.previewSessions = sessions;
            });
          } catch (error) {
            console.error('Failed to generate schedule preview:', error);
          }
        },
        
        validateSchedule: async () => {
          const { data } = get();
          const errors: string[] = [];
          
          if (!data.scheduleConfig?.daysOfWeek?.length) {
            errors.push('Please select at least one day of the week');
          }
          
          if (!data.scheduleConfig?.startTime) {
            errors.push('Please specify a start time');
          }
          
          if (!data.scheduleConfig?.durationMinutes || data.scheduleConfig.durationMinutes < 15) {
            errors.push('Duration must be at least 15 minutes');
          }
          
          if (!data.startDate) {
            errors.push('Please select a start date');
          }
          
          if (data.endDate && data.endDate <= data.startDate) {
            errors.push('End date must be after start date');
          }
          
          set((state) => {
            state.scheduleValidation = {
              isValid: errors.length === 0,
              errors
            };
            if (errors.length > 0) {
              state.errors.schedule = errors;
            }
          });
          
          return errors.length === 0;
        },
        
        // Student Actions
        addInvitation: (invitation) => {
          set((state) => {
            if (!state.invitations.some(inv => inv.email === invitation.email)) {
              state.invitations.push(invitation);
              state.data.invitations = state.invitations;
            }
          });
        },
        
        removeInvitation: (email) => {
          set((state) => {
            state.invitations = state.invitations.filter(inv => inv.email !== email);
            state.data.invitations = state.invitations;
          });
        },
        
        updateInvitation: (email, updates) => {
          set((state) => {
            const index = state.invitations.findIndex(inv => inv.email === email);
            if (index !== -1) {
              state.invitations[index] = {
                ...state.invitations[index],
                ...updates
              };
              state.data.invitations = state.invitations;
            }
          });
        },
        
        importInvitations: async (file) => {
          try {
            const invitations = await classService.parseInvitationsCsv(file);
            set((state) => {
              // Merge with existing, avoiding duplicates
              const existingEmails = new Set(state.invitations.map(inv => inv.email));
              const newInvitations = invitations.filter(inv => !existingEmails.has(inv.email));
              state.invitations = [...state.invitations, ...newInvitations];
              state.data.invitations = state.invitations;
            });
          } catch (error) {
            set((state) => {
              state.errors.students = ['Failed to import invitations'];
            });
          }
        },
        
        validateInvitations: async () => {
          const { invitations } = get();
          const errors: string[] = [];
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          
          for (const invitation of invitations) {
            if (!emailRegex.test(invitation.email)) {
              errors.push(`Invalid email: ${invitation.email}`);
            }
          }
          
          // Check for duplicates
          const emails = invitations.map(inv => inv.email);
          const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);
          if (duplicates.length > 0) {
            errors.push(`Duplicate emails: ${duplicates.join(', ')}`);
          }
          
          set((state) => {
            state.invitationValidation = {
              isValid: errors.length === 0,
              errors
            };
            if (errors.length > 0) {
              state.errors.students = errors;
            }
          });
          
          return errors.length === 0;
        },
        
        // Validation Actions
        validateStep: async (step) => {
          const { data } = get();
          let isValid = true;
          
          switch (step) {
            case 'domain':
              isValid = !!data.domainId;
              if (!isValid) {
                set((state) => {
                  state.errors.domain = ['Please select a domain'];
                });
              }
              break;
              
            case 'details':
              const detailErrors: string[] = [];
              if (!data.name?.trim()) detailErrors.push('Class name is required');
              if (!data.difficultyLevel) detailErrors.push('Difficulty level is required');
              if (!data.maxStudents || data.maxStudents < 1) detailErrors.push('Maximum students must be at least 1');
              
              isValid = detailErrors.length === 0;
              if (!isValid) {
                set((state) => {
                  state.errors.details = detailErrors;
                });
              }
              break;
              
            case 'schedule':
              isValid = await get().validateSchedule();
              break;
              
            case 'students':
              isValid = await get().validateInvitations();
              break;
              
            case 'review':
              isValid = await get().validateAll();
              break;
          }
          
          return isValid;
        },
        
        validateAll: async () => {
          const steps: WizardStep[] = ['domain', 'details', 'schedule', 'students'];
          let allValid = true;
          
          for (const step of steps) {
            const isValid = await get().validateStep(step);
            if (!isValid) allValid = false;
          }
          
          return allValid;
        },
        
        // Submission Actions
        submitClass: async () => {
          const { data, validateAll } = get();
          
          set((state) => {
            state.isLoading = true;
          });
          
          try {
            // Final validation
            const isValid = await validateAll();
            if (!isValid) {
              throw new Error('Please fix validation errors before submitting');
            }
            
            // Submit to API
            const response = await classService.createClass(data as ClassCreationData);
            
            // Clear draft on success
            get().clearDraft();
            
            // Reset wizard
            get().resetWizard();
            
            return response;
          } catch (error) {
            set((state) => {
              state.errors.submit = [error.message];
            });
            throw error;
          } finally {
            set((state) => {
              state.isLoading = false;
            });
          }
        },
        
        // State Management Actions
        initializeWizard: (teacherId) => {
          set((state) => {
            state.data.teacherId = teacherId;
          });
          
          // Load initial data
          get().loadDomains();
          get().loadDraft();
        },
        
        resetWizard: () => {
          set(() => ({
            ...initialState,
            completedSteps: new Set<WizardStep>(),
            visitedSteps: new Set<WizardStep>(['domain'])
          }));
        },
        
        setLoading: (isLoading) => {
          set((state) => {
            state.isLoading = isLoading;
          });
        },
        
        setError: (step, errors) => {
          set((state) => {
            state.errors[step] = errors;
          });
        },
        
        clearErrors: (step) => {
          set((state) => {
            if (step) {
              delete state.errors[step];
            } else {
              state.errors = {};
            }
          });
        }
      })),
      {
        name: 'class-wizard-store',
        partialize: (state) => ({
          data: state.data,
          draft: state.draft,
          currentStep: state.currentStep,
          completedSteps: Array.from(state.completedSteps),
          visitedSteps: Array.from(state.visitedSteps)
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.completedSteps = new Set(state.completedSteps);
            state.visitedSteps = new Set(state.visitedSteps);
          }
        }
      }
    ),
    { name: 'class-wizard' }
  )
);
```

---

## Service Layer

### API Service Implementation

```typescript
// src/services/class.service.ts
import { supabase } from '@/integrations/supabase/client';
import type { 
  ClassCreationData, 
  ClassResponse,
  Domain,
  DifficultyLabel,
  ClassSession,
  StudentInvitation
} from '@/types/class.types';

export class ClassService {
  private readonly BATCH_SIZE = 100;
  
  /**
   * Get domains available to the teacher
   */
  async getTeacherDomains(): Promise<Domain[]> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) throw new Error('Not authenticated');
    
    // Get teacher's tenant
    const { data: userTenant, error: tenantError } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', session.session.user.id)
      .single();
    
    if (tenantError) throw tenantError;
    
    // Get domains for the tenant
    const { data: domains, error } = await supabase
      .from('tenant_domains')
      .select(`
        domain:domains(
          id,
          name,
          description,
          configuration
        )
      `)
      .eq('tenant_id', userTenant.tenant_id)
      .eq('is_active', true);
    
    if (error) throw error;
    
    return domains?.map(td => td.domain).filter(Boolean) || [];
  }
  
  /**
   * Get difficulty labels for a domain
   */
  async getDifficultyLabels(domainId: string): Promise<DifficultyLabel[]> {
    // First try domain-specific labels
    let { data: labels, error } = await supabase
      .from('difficulty_level_labels')
      .select('*')
      .eq('domain_id', domainId)
      .order('display_order');
    
    if (error) throw error;
    
    // If no domain-specific labels, get global labels
    if (!labels || labels.length === 0) {
      const { data: globalLabels, error: globalError } = await supabase
        .from('difficulty_level_labels')
        .select('*')
        .is('domain_id', null)
        .order('display_order');
      
      if (globalError) throw globalError;
      labels = globalLabels;
    }
    
    return labels || [];
  }
  
  /**
   * Generate session preview based on schedule configuration
   */
  async generateSessionPreview(config: {
    scheduleConfig: ScheduleConfig;
    startDate: Date;
    endDate?: Date;
  }): Promise<ClassSession[]> {
    const sessions: ClassSession[] = [];
    const { scheduleConfig, startDate, endDate } = config;
    
    // Calculate sessions based on schedule type
    const currentDate = new Date(startDate);
    const finalDate = endDate || new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days default
    let sessionNumber = 1;
    
    while (currentDate <= finalDate && sessions.length < 50) { // Limit preview to 50 sessions
      const dayOfWeek = currentDate.getDay();
      
      if (scheduleConfig.daysOfWeek.includes(dayOfWeek)) {
        const [hours, minutes] = scheduleConfig.startTime.split(':').map(Number);
        const sessionStart = new Date(currentDate);
        sessionStart.setHours(hours, minutes, 0, 0);
        
        const sessionEnd = new Date(sessionStart);
        sessionEnd.setMinutes(sessionEnd.getMinutes() + scheduleConfig.durationMinutes);
        
        sessions.push({
          id: `preview-${sessionNumber}`,
          sessionNumber,
          scheduledStart: sessionStart,
          scheduledEnd: sessionEnd,
          status: 'scheduled'
        });
        
        sessionNumber++;
      }
      
      // Increment date based on schedule type
      switch (scheduleConfig.scheduleType) {
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'bi_weekly':
          currentDate.setDate(currentDate.getDate() + 1);
          // Skip alternate weeks
          if (currentDate.getDay() === 0) { // Sunday, start of new week
            const weekNumber = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
            if (weekNumber % 2 === 1) {
              currentDate.setDate(currentDate.getDate() + 7);
            }
          }
          break;
        case 'monthly':
          // For monthly, jump to same days in next month
          if (dayOfWeek === scheduleConfig.daysOfWeek[scheduleConfig.daysOfWeek.length - 1]) {
            currentDate.setMonth(currentDate.getMonth() + 1);
            currentDate.setDate(1);
          } else {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          break;
        default:
          currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    return sessions;
  }
  
  /**
   * Parse CSV file for student invitations
   */
  async parseInvitationsCsv(file: File): Promise<StudentInvitation[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
          
          const emailIndex = headers.findIndex(h => h.includes('email'));
          const firstNameIndex = headers.findIndex(h => h.includes('first') || h.includes('fname'));
          const lastNameIndex = headers.findIndex(h => h.includes('last') || h.includes('lname'));
          
          if (emailIndex === -1) {
            throw new Error('CSV must contain an email column');
          }
          
          const invitations: StudentInvitation[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const email = values[emailIndex];
            
            if (email && email.includes('@')) {
              invitations.push({
                email,
                firstName: firstNameIndex !== -1 ? values[firstNameIndex] : undefined,
                lastName: lastNameIndex !== -1 ? values[lastNameIndex] : undefined,
                sendImmediately: true
              });
            }
          }
          
          resolve(invitations);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  
  /**
   * Create a new class
   */
  async createClass(data: ClassCreationData): Promise<ClassResponse> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) throw new Error('Not authenticated');
    
    // Get teacher's tenant
    const { data: userTenant, error: tenantError } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', session.session.user.id)
      .single();
    
    if (tenantError) throw tenantError;
    
    // Start transaction
    const classData = {
      tenant_id: userTenant.tenant_id,
      teacher_id: session.session.user.id,
      domain_id: data.domainId,
      name: data.name,
      description: data.description,
      class_code: await this.generateUniqueClassCode(),
      difficulty_level: data.difficultyLevel,
      max_students: data.maxStudents,
      min_students: data.minStudents,
      schedule_type: data.scheduleType,
      schedule_config: data.scheduleConfig,
      start_date: data.startDate,
      end_date: data.endDate,
      timezone: data.timezone,
      status: 'draft',
      settings: data.settings || {},
      features: data.features || {},
      created_by: session.session.user.id
    };
    
    // Create class
    const { data: newClass, error: classError } = await supabase
      .from('classes')
      .insert(classData)
      .select()
      .single();
    
    if (classError) throw classError;
    
    // Create schedule
    if (data.scheduleConfig) {
      const { error: scheduleError } = await supabase
        .from('class_schedules')
        .insert({
          class_id: newClass.id,
          recurrence_rule: data.scheduleConfig.recurrenceRule || this.generateRRule(data.scheduleConfig),
          day_of_week: data.scheduleConfig.daysOfWeek,
          start_time: data.scheduleConfig.startTime,
          duration_minutes: data.scheduleConfig.durationMinutes,
          effective_from: data.startDate,
          effective_until: data.endDate
        });
      
      if (scheduleError) throw scheduleError;
    }
    
    // Generate sessions
    const { error: sessionError } = await supabase
      .rpc('generate_class_sessions', {
        p_class_id: newClass.id,
        p_start_date: data.startDate,
        p_end_date: data.endDate,
        p_schedule_config: data.scheduleConfig
      });
    
    if (sessionError) throw sessionError;
    
    // Create invitations
    if (data.invitations && data.invitations.length > 0) {
      const invitations = data.invitations.map(inv => ({
        class_id: newClass.id,
        email: inv.email,
        first_name: inv.firstName,
        last_name: inv.lastName,
        invitation_type: 'student',
        message: inv.personalMessage,
        invited_by: session.session.user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }));
      
      // Batch insert invitations
      for (let i = 0; i < invitations.length; i += this.BATCH_SIZE) {
        const batch = invitations.slice(i, i + this.BATCH_SIZE);
        const { error: inviteError } = await supabase
          .from('class_invitations')
          .insert(batch);
        
        if (inviteError) throw inviteError;
      }
      
      // Send invitations if requested
      const immediateInvitations = data.invitations
        .filter(inv => inv.sendImmediately)
        .map(inv => inv.email);
      
      if (immediateInvitations.length > 0) {
        await this.sendInvitations(newClass.id, immediateInvitations);
      }
    }
    
    return {
      id: newClass.id,
      ...newClass,
      invitationsSent: data.invitations?.filter(inv => inv.sendImmediately).length || 0
    };
  }
  
  /**
   * Generate unique class code
   */
  private async generateUniqueClassCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let attempts = 0;
    
    while (attempts < 10) {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      
      // Check if code exists
      const { data: existing } = await supabase
        .from('classes')
        .select('id')
        .eq('class_code', code)
        .single();
      
      if (!existing) {
        return code;
      }
      
      attempts++;
    }
    
    throw new Error('Failed to generate unique class code');
  }
  
  /**
   * Generate RFC 5545 RRULE from schedule config
   */
  private generateRRule(config: ScheduleConfig): string {
    const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const days = config.daysOfWeek.map(d => dayMap[d]).join(',');
    
    switch (config.scheduleType) {
      case 'weekly':
        return `FREQ=WEEKLY;BYDAY=${days}`;
      case 'bi_weekly':
        return `FREQ=WEEKLY;INTERVAL=2;BYDAY=${days}`;
      case 'monthly':
        return `FREQ=MONTHLY;BYDAY=${days}`;
      default:
        return `FREQ=WEEKLY;BYDAY=${days}`;
    }
  }
  
  /**
   * Send invitations to students
   */
  private async sendInvitations(classId: string, emails: string[]): Promise<void> {
    // Get invitations
    const { data: invitations, error } = await supabase
      .from('class_invitations')
      .select('id')
      .eq('class_id', classId)
      .in('email', emails);
    
    if (error) throw error;
    
    // Trigger email sending for each invitation
    for (const invitation of invitations || []) {
      await supabase.rpc('send_class_invitation', {
        p_invitation_id: invitation.id
      });
    }
  }
  
  /**
   * Update class status
   */
  async updateClassStatus(classId: string, status: string): Promise<void> {
    const updateData: any = { status };
    
    // Add timestamp based on status
    switch (status) {
      case 'published':
        updateData.published_at = new Date().toISOString();
        break;
      case 'active':
        updateData.activated_at = new Date().toISOString();
        break;
      case 'completed':
        updateData.completed_at = new Date().toISOString();
        break;
    }
    
    const { error } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', classId);
    
    if (error) throw error;
  }
  
  /**
   * Get class details
   */
  async getClass(classId: string): Promise<ClassResponse> {
    const { data: classData, error } = await supabase
      .from('classes')
      .select(`
        *,
        domain:domains(id, name, description),
        teacher:profiles!teacher_id(id, full_name, email),
        enrollments:class_enrollments(count),
        sessions:class_sessions(count),
        invitations:class_invitations(count)
      `)
      .eq('id', classId)
      .single();
    
    if (error) throw error;
    if (!classData) throw new Error('Class not found');
    
    return classData;
  }
}

// Export singleton instance
export const classService = new ClassService();
```

---

## Security Architecture

### Authentication & Authorization

```typescript
// src/middleware/class-security.ts
import { supabase } from '@/integrations/supabase/client';
import type { ClassPermission } from '@/types/auth.types';

export class ClassSecurityService {
  /**
   * Check if user can create class in domain
   */
  async canCreateClass(userId: string, domainId: string): Promise<boolean> {
    // Check if user is teacher in tenant that has this domain
    const { data, error } = await supabase
      .rpc('check_class_creation_permission', {
        p_user_id: userId,
        p_domain_id: domainId
      });
    
    return !error && data === true;
  }
  
  /**
   * Check if user can edit class
   */
  async canEditClass(userId: string, classId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('classes')
      .select('teacher_id, tenant_id')
      .eq('id', classId)
      .single();
    
    if (error || !data) return false;
    
    // Owner can edit
    if (data.teacher_id === userId) return true;
    
    // Tenant admin can edit
    const { data: isAdmin } = await supabase
      .rpc('is_tenant_admin', {
        p_user_id: userId,
        p_tenant_id: data.tenant_id
      });
    
    return isAdmin === true;
  }
  
  /**
   * Sanitize user input
   */
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove script tags and SQL injection attempts
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/['";\\]/g, '');
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const key in input) {
        sanitized[key] = this.sanitizeInput(input[key]);
      }
      return sanitized;
    }
    
    return input;
  }
  
  /**
   * Validate CSRF token
   */
  async validateCSRFToken(token: string): Promise<boolean> {
    const storedToken = sessionStorage.getItem('csrf_token');
    return token === storedToken;
  }
  
  /**
   * Generate CSRF token
   */
  generateCSRFToken(): string {
    const token = crypto.randomUUID();
    sessionStorage.setItem('csrf_token', token);
    return token;
  }
  
  /**
   * Rate limiting check
   */
  async checkRateLimit(userId: string, action: string): Promise<boolean> {
    const key = `rate_limit_${userId}_${action}`;
    const limit = this.getRateLimitForAction(action);
    
    // Get current count from Redis/memory cache
    const current = await this.getRateLimitCount(key);
    
    if (current >= limit) {
      return false;
    }
    
    // Increment counter
    await this.incrementRateLimit(key);
    return true;
  }
  
  private getRateLimitForAction(action: string): number {
    const limits: Record<string, number> = {
      'create_class': 10, // 10 classes per hour
      'send_invitations': 100, // 100 invitations per hour
      'update_schedule': 30, // 30 updates per hour
    };
    
    return limits[action] || 60; // Default 60 per hour
  }
  
  private async getRateLimitCount(key: string): Promise<number> {
    // Implementation would use Redis or in-memory cache
    // For now, using localStorage as example
    const data = localStorage.getItem(key);
    if (!data) return 0;
    
    const { count, timestamp } = JSON.parse(data);
    const hourAgo = Date.now() - 3600000;
    
    if (timestamp < hourAgo) {
      localStorage.removeItem(key);
      return 0;
    }
    
    return count;
  }
  
  private async incrementRateLimit(key: string): Promise<void> {
    const current = await this.getRateLimitCount(key);
    localStorage.setItem(key, JSON.stringify({
      count: current + 1,
      timestamp: Date.now()
    }));
  }
}

export const classSecurityService = new ClassSecurityService();
```

### Data Encryption

```typescript
// src/utils/encryption.ts
export class EncryptionService {
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();
  
  /**
   * Encrypt sensitive data before storage
   */
  async encryptData(data: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = this.encoder.encode(data);
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encoded
    );
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }
  
  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedData: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encrypted
    );
    
    return this.decoder.decode(decrypted);
  }
  
  /**
   * Generate encryption key from password
   */
  async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      this.encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
}

export const encryptionService = new EncryptionService();
```

---

## Performance Strategy

### Optimization Techniques

```typescript
// src/utils/performance.ts
import { lazy, Suspense } from 'react';
import { QueryClient } from '@tanstack/react-query';

// 1. Code Splitting
export const ClassWizard = lazy(() => 
  import('@/components/class-creation/wizard/ClassWizardContainer')
);

// 2. Query Caching
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 2
    }
  }
});

// 3. Debouncing
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// 4. Virtual Scrolling for large lists
import { FixedSizeList } from 'react-window';

export const VirtualStudentList: React.FC<{ students: Student[] }> = ({ students }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <StudentCard student={students[index]} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={students.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};

// 5. Memoization
export const MemoizedDomainCard = React.memo(DomainCard, (prevProps, nextProps) => {
  return (
    prevProps.domain.id === nextProps.domain.id &&
    prevProps.isSelected === nextProps.isSelected
  );
});

// 6. Lazy Loading Images
export const LazyImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, [src]);
  
  return <img ref={imgRef} src={imageSrc || '/placeholder.png'} alt={alt} />;
};

// 7. Request Batching
class BatchProcessor {
  private queue: Array<{ id: string; resolve: (value: any) => void }> = [];
  private timer: NodeJS.Timeout | null = null;
  
  add(id: string): Promise<any> {
    return new Promise((resolve) => {
      this.queue.push({ id, resolve });
      this.scheduleProcess();
    });
  }
  
  private scheduleProcess() {
    if (this.timer) return;
    
    this.timer = setTimeout(() => {
      this.process();
    }, 50); // Batch window of 50ms
  }
  
  private async process() {
    const batch = [...this.queue];
    this.queue = [];
    this.timer = null;
    
    if (batch.length === 0) return;
    
    const ids = batch.map(item => item.id);
    const results = await this.fetchBatch(ids);
    
    batch.forEach((item, index) => {
      item.resolve(results[index]);
    });
  }
  
  private async fetchBatch(ids: string[]): Promise<any[]> {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .in('id', ids);
    
    return data || [];
  }
}

export const batchProcessor = new BatchProcessor();

// 8. Service Worker for Caching
// src/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('class-wizard-v1').then((cache) => {
      return cache.addAll([
        '/static/js/bundle.js',
        '/static/css/main.css',
        '/api/domains',
        '/api/difficulty-labels'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### Performance Monitoring

```typescript
// src/utils/monitoring.ts
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }
  
  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark) || 0;
    const end = endMark ? (this.marks.get(endMark) || performance.now()) : performance.now();
    const duration = end - start;
    
    // Send to analytics
    this.sendMetric(name, duration);
    
    return duration;
  }
  
  private sendMetric(name: string, value: number): void {
    // Send to your analytics service
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name,
        value: Math.round(value)
      });
    }
  }
  
  // Web Vitals monitoring
  observeWebVitals(): void {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.sendMetric('LCP', entry.startTime);
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    
    // First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const delay = entry.processingStart - entry.startTime;
        this.sendMetric('FID', delay);
      }
    }).observe({ type: 'first-input', buffered: true });
    
    // Cumulative Layout Shift
    let cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      }
      this.sendMetric('CLS', cls);
    }).observe({ type: 'layout-shift', buffered: true });
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

---

## Testing Framework

### Unit Testing

```typescript
// src/components/class-creation/__tests__/ClassWizardContainer.test.tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClassWizardContainer } from '../wizard/ClassWizardContainer';
import { useClassWizardStore } from '@/stores/classWizard.store';
import { classService } from '@/services/class.service';

// Mock dependencies
jest.mock('@/services/class.service');
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    session: { user_id: 'test-user-id' },
    hasPermission: () => true
  })
}));

describe('ClassWizardContainer', () => {
  beforeEach(() => {
    // Reset store
    useClassWizardStore.getState().resetWizard();
    
    // Mock API responses
    (classService.getTeacherDomains as jest.Mock).mockResolvedValue([
      { id: 'domain-1', name: 'Mathematics' },
      { id: 'domain-2', name: 'Science' }
    ]);
  });
  
  it('should render wizard with initial step', async () => {
    render(<ClassWizardContainer />);
    
    expect(screen.getByText('Create New Class')).toBeInTheDocument();
    expect(screen.getByText('Select Domain')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
      expect(screen.getByText('Science')).toBeInTheDocument();
    });
  });
  
  it('should navigate through wizard steps', async () => {
    const user = userEvent.setup();
    render(<ClassWizardContainer />);
    
    // Wait for domains to load
    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    });
    
    // Select domain
    await user.click(screen.getByText('Mathematics'));
    
    // Go to next step
    await user.click(screen.getByText('Next'));
    
    // Should be on details step
    expect(screen.getByText('Class Details')).toBeInTheDocument();
  });
  
  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<ClassWizardContainer />);
    
    // Try to proceed without selecting domain
    await user.click(screen.getByText('Next'));
    
    // Should show error
    expect(screen.getByText('Please select a domain')).toBeInTheDocument();
  });
  
  it('should auto-save draft', async () => {
    const user = userEvent.setup();
    render(<ClassWizardContainer />);
    
    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    });
    
    // Select domain
    await user.click(screen.getByText('Mathematics'));
    
    // Wait for auto-save
    await waitFor(() => {
      const draft = localStorage.getItem('class-wizard-draft');
      expect(draft).toBeTruthy();
      const parsed = JSON.parse(draft!);
      expect(parsed.domainId).toBe('domain-1');
    });
  });
  
  it('should handle submission', async () => {
    const user = userEvent.setup();
    (classService.createClass as jest.Mock).mockResolvedValue({
      id: 'new-class-id',
      name: 'Test Class'
    });
    
    // Set up complete wizard data
    useClassWizardStore.setState({
      data: {
        domainId: 'domain-1',
        name: 'Test Class',
        difficultyLevel: 1,
        maxStudents: 30,
        minStudents: 5,
        scheduleType: 'weekly',
        scheduleConfig: {
          daysOfWeek: [1, 3, 5],
          startTime: '10:00',
          durationMinutes: 60
        },
        startDate: new Date('2024-01-01'),
        timezone: 'UTC',
        invitations: [],
        features: {},
        settings: {}
      },
      currentStep: 'review'
    });
    
    render(<ClassWizardContainer />);
    
    // Submit
    await user.click(screen.getByText('Create Class'));
    
    await waitFor(() => {
      expect(classService.createClass).toHaveBeenCalled();
    });
  });
});
```

### Integration Testing

```typescript
// src/integration-tests/class-creation.test.ts
import { createClient } from '@supabase/supabase-js';
import { classService } from '@/services/class.service';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

describe('Class Creation Integration', () => {
  let testUserId: string;
  let testTenantId: string;
  let testDomainId: string;
  
  beforeAll(async () => {
    // Set up test data
    const { data: tenant } = await supabase
      .from('tenants')
      .insert({ name: 'Test Tenant', slug: 'test-tenant' })
      .select()
      .single();
    
    testTenantId = tenant.id;
    
    const { data: user } = await supabase.auth.admin.createUser({
      email: 'teacher@test.com',
      password: 'password123'
    });
    
    testUserId = user.user.id;
    
    // Assign user to tenant as teacher
    await supabase.from('user_tenants').insert({
      user_id: testUserId,
      tenant_id: testTenantId,
      role_id: 'teacher-role-id'
    });
    
    // Create test domain
    const { data: domain } = await supabase
      .from('domains')
      .insert({ name: 'Test Domain' })
      .select()
      .single();
    
    testDomainId = domain.id;
  });
  
  afterAll(async () => {
    // Clean up test data
    await supabase.from('tenants').delete().eq('id', testTenantId);
    await supabase.auth.admin.deleteUser(testUserId);
  });
  
  it('should create class with all components', async () => {
    const classData = {
      domainId: testDomainId,
      name: 'Integration Test Class',
      description: 'Test description',
      difficultyLevel: 2,
      maxStudents: 25,
      minStudents: 5,
      scheduleType: 'weekly' as const,
      scheduleConfig: {
        daysOfWeek: [1, 3, 5],
        startTime: '14:00',
        durationMinutes: 90
      },
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-05-31'),
      timezone: 'America/New_York',
      invitations: [
        {
          email: 'student1@test.com',
          firstName: 'John',
          lastName: 'Doe',
          sendImmediately: false
        }
      ],
      features: {
        recordSessions: true,
        enableDiscussionForum: true
      },
      settings: {
        autoAcceptEnrollments: false,
        requireApproval: true
      }
    };
    
    // Create class
    const result = await classService.createClass(classData);
    
    expect(result.id).toBeDefined();
    expect(result.name).toBe('Integration Test Class');
    expect(result.class_code).toMatch(/^[A-Z0-9]{6}$/);
    
    // Verify class was created
    const { data: createdClass } = await supabase
      .from('classes')
      .select('*')
      .eq('id', result.id)
      .single();
    
    expect(createdClass).toBeDefined();
    expect(createdClass.tenant_id).toBe(testTenantId);
    
    // Verify schedule was created
    const { data: schedule } = await supabase
      .from('class_schedules')
      .select('*')
      .eq('class_id', result.id)
      .single();
    
    expect(schedule).toBeDefined();
    expect(schedule.day_of_week).toEqual([1, 3, 5]);
    
    // Verify sessions were generated
    const { data: sessions } = await supabase
      .from('class_sessions')
      .select('*')
      .eq('class_id', result.id);
    
    expect(sessions.length).toBeGreaterThan(0);
    
    // Verify invitation was created
    const { data: invitations } = await supabase
      .from('class_invitations')
      .select('*')
      .eq('class_id', result.id);
    
    expect(invitations.length).toBe(1);
    expect(invitations[0].email).toBe('student1@test.com');
  });
  
  it('should enforce RLS policies', async () => {
    // Try to access class as different user
    const { data: otherUser } = await supabase.auth.admin.createUser({
      email: 'other@test.com',
      password: 'password123'
    });
    
    // Sign in as other user
    await supabase.auth.signInWithPassword({
      email: 'other@test.com',
      password: 'password123'
    });
    
    // Try to read class (should fail)
    const { data: classes, error } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', testUserId);
    
    expect(error).toBeDefined();
    expect(classes).toBeNull();
    
    // Clean up
    await supabase.auth.admin.deleteUser(otherUser.user.id);
  });
});
```

### E2E Testing

```typescript
// src/e2e/class-creation.spec.ts
import { test, expect, Page } from '@playwright/test';

test.describe('Class Creation E2E', () => {
  let page: Page;
  
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // Login as teacher
    await page.goto('/login');
    await page.fill('[name="email"]', 'teacher@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');
    
    await page.waitForURL('/dashboard');
  });
  
  test('complete class creation flow', async () => {
    // Navigate to class creation
    await page.goto('/teacher/classes/new');
    
    // Step 1: Domain Selection
    await expect(page.locator('h2')).toContainText('Select Domain');
    await page.click('[data-domain-id="math-domain"]');
    await page.click('[data-testid="next-button"]');
    
    // Step 2: Class Details
    await expect(page.locator('h2')).toContainText('Class Details');
    await page.fill('[name="name"]', 'Algebra 101');
    await page.fill('[name="description"]', 'Introduction to Algebra');
    await page.selectOption('[name="difficultyLevel"]', '2');
    await page.fill('[name="maxStudents"]', '25');
    await page.click('[data-testid="next-button"]');
    
    // Step 3: Schedule
    await expect(page.locator('h2')).toContainText('Configure Schedule');
    await page.click('[data-day="1"]'); // Monday
    await page.click('[data-day="3"]'); // Wednesday
    await page.click('[data-day="5"]'); // Friday
    await page.fill('[name="startTime"]', '14:00');
    await page.fill('[name="duration"]', '90');
    await page.fill('[name="startDate"]', '2024-02-01');
    await page.click('[data-testid="next-button"]');
    
    // Step 4: Students
    await expect(page.locator('h2')).toContainText('Invite Students');
    await page.click('[data-testid="add-invitation"]');
    await page.fill('[name="invitations[0].email"]', 'student1@example.com');
    await page.fill('[name="invitations[0].firstName"]', 'John');
    await page.fill('[name="invitations[0].lastName"]', 'Doe');
    await page.click('[data-testid="next-button"]');
    
    // Step 5: Review
    await expect(page.locator('h2')).toContainText('Review and Create');
    await expect(page.locator('[data-testid="review-name"]')).toContainText('Algebra 101');
    await expect(page.locator('[data-testid="review-schedule"]')).toContainText('Monday, Wednesday, Friday');
    
    // Submit
    await page.click('[data-testid="create-class-button"]');
    
    // Wait for success
    await expect(page.locator('[role="alert"]')).toContainText('Class created successfully');
    
    // Should redirect to class detail page
    await page.waitForURL(/\/teacher\/classes\/[a-z0-9-]+/);
    
    // Verify class details
    await expect(page.locator('h1')).toContainText('Algebra 101');
    await expect(page.locator('[data-testid="class-code"]')).toMatch(/[A-Z0-9]{6}/);
  });
  
  test('should handle validation errors', async () => {
    await page.goto('/teacher/classes/new');
    
    // Try to proceed without selecting domain
    await page.click('[data-testid="next-button"]');
    
    // Should show error
    await expect(page.locator('[role="alert"]')).toContainText('Please select a domain');
    
    // Select domain and go to details
    await page.click('[data-domain-id="math-domain"]');
    await page.click('[data-testid="next-button"]');
    
    // Try to proceed without required fields
    await page.click('[data-testid="next-button"]');
    
    // Should show multiple errors
    await expect(page.locator('[role="alert"]')).toContainText('Class name is required');
  });
  
  test('should auto-save draft', async () => {
    await page.goto('/teacher/classes/new');
    
    // Fill some data
    await page.click('[data-domain-id="math-domain"]');
    await page.click('[data-testid="next-button"]');
    await page.fill('[name="name"]', 'Draft Class');
    
    // Refresh page
    await page.reload();
    
    // Should restore draft
    await expect(page.locator('[name="name"]')).toHaveValue('Draft Class');
  });
  
  test('should be mobile responsive', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/teacher/classes/new');
    
    // Check mobile layout
    await expect(page.locator('[data-testid="mobile-stepper"]')).toBeVisible();
    
    // Navigate should work
    await page.click('[data-domain-id="math-domain"]');
    await page.click('[data-testid="next-button"]');
    
    await expect(page.locator('h2')).toContainText('Class Details');
  });
});
```

---

## Deployment Strategy

### CI/CD Pipeline

```yaml
# .github/workflows/class-creation-deployment.yml
name: Class Creation System Deployment

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

jobs:
  # 1. Quality Checks
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Type checking
        run: npm run type-check
      
      - name: Security audit
        run: npm audit --audit-level=moderate

  # 2. Testing
  test:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  # 3. E2E Testing
  e2e:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  # 4. Build
  build:
    runs-on: ubuntu-latest
    needs: [test, e2e]
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: dist/

  # 5. Database Migrations
  migrate:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Run migrations
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          supabase db push

  # 6. Deploy to Staging
  deploy-staging:
    runs-on: ubuntu-latest
    needs: migrate
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
          path: dist/
      
      - name: Deploy to Vercel Staging
        run: |
          npm i -g vercel
          vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }} --env=preview

  # 7. Deploy to Production
  deploy-production:
    runs-on: ubuntu-latest
    needs: migrate
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
          path: dist/
      
      - name: Deploy to Vercel Production
        run: |
          npm i -g vercel
          vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Class Creation System deployed to production'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  # 8. Performance Testing
  performance:
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun --config=lighthouserc.js
      
      - name: Run load testing
        run: |
          npm install -g artillery
          artillery run tests/load/class-creation.yml
```

### Rollout Strategy

```typescript
// src/utils/feature-flags.ts
interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  userGroups?: string[];
}

export class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();
  
  async loadFlags(): Promise<void> {
    const { data } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('active', true);
    
    data?.forEach(flag => {
      this.flags.set(flag.name, flag);
    });
  }
  
  isEnabled(flagName: string, userId?: string): boolean {
    const flag = this.flags.get(flagName);
    if (!flag || !flag.enabled) return false;
    
    // Check rollout percentage
    if (flag.rolloutPercentage && flag.rolloutPercentage < 100) {
      const hash = this.hashUserId(userId || 'anonymous');
      const percentage = (hash % 100) + 1;
      return percentage <= flag.rolloutPercentage;
    }
    
    // Check user groups
    if (flag.userGroups && userId) {
      return this.isUserInGroups(userId, flag.userGroups);
    }
    
    return true;
  }
  
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  private async isUserInGroups(userId: string, groups: string[]): Promise<boolean> {
    // Check if user belongs to any of the specified groups
    const { data } = await supabase
      .from('user_groups')
      .select('group_name')
      .eq('user_id', userId)
      .in('group_name', groups);
    
    return (data?.length || 0) > 0;
  }
}

export const featureFlags = new FeatureFlagService();

// Usage in components
export const ClassCreationFeature: React.FC = () => {
  const { session } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  
  useEffect(() => {
    const checkFlag = async () => {
      await featureFlags.loadFlags();
      setIsEnabled(featureFlags.isEnabled('new_class_wizard', session?.user_id));
    };
    checkFlag();
  }, [session]);
  
  if (!isEnabled) {
    return <LegacyClassCreation />;
  }
  
  return <ClassWizardContainer />;
};
```

---

## Architecture Decision Records (ADRs)

### ADR-001: Wizard State Management

**Status**: Accepted  
**Context**: Need to manage complex multi-step wizard state with persistence  
**Decision**: Use Zustand with persistence middleware  
**Consequences**: 
- ✅ Simple API with TypeScript support
- ✅ Built-in persistence and devtools
- ✅ Lightweight (~8KB)
- ❌ Less ecosystem than Redux

### ADR-002: Schedule Storage Format

**Status**: Accepted  
**Context**: Need flexible schedule configuration supporting various patterns  
**Decision**: Store as JSONB with RFC 5545 RRULE for complex patterns  
**Consequences**:
- ✅ Flexible for future schedule types
- ✅ Standard format for calendar integration
- ✅ Efficient queries with JSONB indexing
- ❌ More complex validation logic

### ADR-003: Real-time Updates

**Status**: Accepted  
**Context**: Teachers need to see enrollment updates in real-time  
**Decision**: Use Supabase Realtime for enrollment notifications  
**Consequences**:
- ✅ Built-in with Supabase
- ✅ Automatic reconnection handling
- ✅ Row-level security integration
- ❌ Limited to PostgreSQL changes

### ADR-004: Invitation System

**Status**: Accepted  
**Context**: Need secure, trackable student invitations  
**Decision**: Token-based invitations with expiry  
**Consequences**:
- ✅ Secure and trackable
- ✅ Works for non-registered users
- ✅ Can be revoked
- ❌ Requires email service integration

---

## Conclusion

This architecture provides a robust, scalable foundation for the teacher class creation system with:

1. **Scalability**: Designed to handle thousands of concurrent users with efficient database queries and caching
2. **Security**: Multiple layers of security including RLS, input validation, CSRF protection, and rate limiting
3. **Performance**: Optimized with code splitting, lazy loading, and strategic caching achieving <2.5s page load
4. **Maintainability**: Clean separation of concerns with clear component boundaries and comprehensive testing
5. **Flexibility**: Extensible design supporting future enhancements like video conferencing and AI assistance

The system integrates seamlessly with the existing multi-tenant architecture while maintaining isolation and security boundaries between tenants.

### Next Steps

1. Implement core database schema and migrations
2. Build wizard components with Zustand store
3. Integrate with existing authentication system
4. Add comprehensive test coverage
5. Deploy to staging with feature flags
6. Progressive rollout with monitoring
7. Gather user feedback and iterate

### Key Success Metrics

- Page Load Time: <2.5s (P95)
- Interaction Response: <100ms (P95)
- Class Creation Success Rate: >95%
- User Satisfaction Score: >4.5/5
- Test Coverage: >80%
- Zero security vulnerabilities