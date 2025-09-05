# Teacher Class Creation System - Database Schema

## Overview

This document defines the database schema for the class creation system, including all tables, relationships, indexes, and security policies required for multi-tenant class management.

## Core Tables

### 1. classes

Primary table storing class information.

```sql
CREATE TABLE classes (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant & Domain Context
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE RESTRICT,
  
  -- Teacher Assignment
  teacher_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE RESTRICT,
  
  -- Class Information
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) GENERATED ALWAYS AS (lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))) STORED,
  description TEXT,
  
  -- Configuration
  difficulty_level_id UUID NOT NULL REFERENCES difficulty_level_labels(id),
  lesson_frequency lesson_frequency_type NOT NULL,
  
  -- Student Settings
  max_students INTEGER DEFAULT 30,
  allow_student_messaging BOOLEAN DEFAULT true,
  
  -- Status
  status class_status DEFAULT 'active',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT unique_class_name_per_teacher UNIQUE(teacher_id, tenant_id, name),
  CONSTRAINT valid_student_count CHECK (max_students > 0 AND max_students <= 100)
);

-- Indexes
CREATE INDEX idx_classes_tenant_id ON classes(tenant_id);
CREATE INDEX idx_classes_domain_id ON classes(domain_id);
CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX idx_classes_status ON classes(status);
CREATE INDEX idx_classes_created_at ON classes(created_at DESC);
```

### 2. class_schedules

Stores individual schedule entries for each class.

```sql
CREATE TABLE class_schedules (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  
  -- Schedule Information
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone VARCHAR(50) NOT NULL, -- IANA timezone identifier
  
  -- Recurrence Pattern
  recurrence_pattern recurrence_type DEFAULT 'weekly',
  recurrence_interval INTEGER DEFAULT 1, -- Every N weeks/months
  
  -- Date Range
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date > start_date)
);

-- Indexes
CREATE INDEX idx_class_schedules_class_id ON class_schedules(class_id);
CREATE INDEX idx_class_schedules_day_of_week ON class_schedules(day_of_week);
CREATE INDEX idx_class_schedules_active ON class_schedules(is_active) WHERE is_active = true;
```

### 3. class_students

Junction table managing student enrollment in classes.

```sql
CREATE TABLE class_students (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Invitation Information
  invited_email VARCHAR(255) NOT NULL,
  invited_first_name VARCHAR(100),
  invited_last_name VARCHAR(100),
  
  -- Status
  enrollment_status enrollment_status_type DEFAULT 'invited',
  
  -- Timestamps
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  
  -- Metadata
  invited_by UUID NOT NULL REFERENCES profiles(user_id),
  invitation_message TEXT,
  
  -- Constraints
  CONSTRAINT unique_student_per_class UNIQUE(class_id, invited_email),
  CONSTRAINT valid_email CHECK (invited_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_class_students_class_id ON class_students(class_id);
CREATE INDEX idx_class_students_student_id ON class_students(student_id);
CREATE INDEX idx_class_students_status ON class_students(enrollment_status);
CREATE INDEX idx_class_students_invited_email ON class_students(invited_email);
```

### 4. class_invitations

Tracks invitation details and status.

```sql
CREATE TABLE class_invitations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  class_student_id UUID NOT NULL REFERENCES class_students(id) ON DELETE CASCADE,
  
  -- Invitation Details
  invitation_token UUID DEFAULT gen_random_uuid(),
  invitation_url TEXT GENERATED ALWAYS AS (
    'https://app.gemeos.com/invite/' || invitation_token::text
  ) STORED,
  
  -- Email Status
  email_status email_status_type DEFAULT 'pending',
  email_sent_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  email_clicked_at TIMESTAMPTZ,
  email_bounced_at TIMESTAMPTZ,
  bounce_reason TEXT,
  
  -- Response
  responded_at TIMESTAMPTZ,
  response_type response_type DEFAULT NULL,
  
  -- Expiration
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resent_count INTEGER DEFAULT 0,
  last_resent_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT unique_invitation_token UNIQUE(invitation_token)
);

-- Indexes
CREATE INDEX idx_class_invitations_token ON class_invitations(invitation_token);
CREATE INDEX idx_class_invitations_email_status ON class_invitations(email_status);
CREATE INDEX idx_class_invitations_expires_at ON class_invitations(expires_at);
```

### 5. class_schedule_exceptions

Handles one-time changes to regular schedules.

```sql
CREATE TABLE class_schedule_exceptions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  class_schedule_id UUID NOT NULL REFERENCES class_schedules(id) ON DELETE CASCADE,
  
  -- Exception Details
  exception_date DATE NOT NULL,
  exception_type exception_type NOT NULL, -- 'cancelled', 'rescheduled', 'modified'
  
  -- Rescheduled Time (if applicable)
  new_start_time TIME,
  new_end_time TIME,
  new_timezone VARCHAR(50),
  
  -- Reason
  reason TEXT,
  
  -- Notification
  students_notified BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_exception_per_date UNIQUE(class_schedule_id, exception_date),
  CONSTRAINT valid_reschedule_time CHECK (
    (exception_type != 'rescheduled') OR 
    (new_start_time IS NOT NULL AND new_end_time IS NOT NULL AND new_end_time > new_start_time)
  )
);

-- Indexes
CREATE INDEX idx_schedule_exceptions_schedule_id ON class_schedule_exceptions(class_schedule_id);
CREATE INDEX idx_schedule_exceptions_date ON class_schedule_exceptions(exception_date);
```

## Enum Types

```sql
-- Lesson Frequency
CREATE TYPE lesson_frequency_type AS ENUM (
  'weekly',
  'bi_weekly',
  'monthly',
  'custom'
);

-- Class Status
CREATE TYPE class_status AS ENUM (
  'draft',
  'active',
  'paused',
  'completed',
  'archived'
);

-- Enrollment Status
CREATE TYPE enrollment_status_type AS ENUM (
  'invited',
  'accepted',
  'declined',
  'enrolled',
  'dropped',
  'completed'
);

-- Email Status
CREATE TYPE email_status_type AS ENUM (
  'pending',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'failed'
);

-- Response Type
CREATE TYPE response_type AS ENUM (
  'accepted',
  'declined',
  'maybe'
);

-- Recurrence Type
CREATE TYPE recurrence_type AS ENUM (
  'weekly',
  'bi_weekly',
  'monthly',
  'custom'
);

-- Exception Type
CREATE TYPE exception_type AS ENUM (
  'cancelled',
  'rescheduled',
  'modified'
);
```

## Views

### 1. class_overview

Aggregated view for class dashboard.

```sql
CREATE VIEW class_overview AS
SELECT 
  c.id,
  c.name,
  c.tenant_id,
  c.domain_id,
  d.name as domain_name,
  c.teacher_id,
  p.first_name || ' ' || p.last_name as teacher_name,
  c.difficulty_level_id,
  dll.label as difficulty_label,
  c.lesson_frequency,
  c.status,
  c.max_students,
  COUNT(DISTINCT cs.id) FILTER (WHERE cs.enrollment_status = 'enrolled') as enrolled_students,
  COUNT(DISTINCT cs.id) FILTER (WHERE cs.enrollment_status = 'invited') as pending_invitations,
  c.allow_student_messaging,
  c.created_at,
  c.started_at,
  c.ended_at
FROM classes c
JOIN domains d ON c.domain_id = d.id
JOIN profiles p ON c.teacher_id = p.user_id
LEFT JOIN difficulty_level_labels dll ON c.difficulty_level_id = dll.id
LEFT JOIN class_students cs ON c.id = cs.class_id
GROUP BY c.id, d.name, p.first_name, p.last_name, dll.label;
```

### 2. teacher_schedule_view

Complete schedule view for teachers.

```sql
CREATE VIEW teacher_schedule_view AS
SELECT 
  c.teacher_id,
  c.id as class_id,
  c.name as class_name,
  cs.id as schedule_id,
  cs.day_of_week,
  cs.start_time,
  cs.end_time,
  cs.timezone,
  cs.start_date,
  cs.end_date,
  cse.exception_date,
  cse.exception_type,
  cse.new_start_time,
  cse.new_end_time
FROM classes c
JOIN class_schedules cs ON c.id = cs.class_id
LEFT JOIN class_schedule_exceptions cse ON cs.id = cse.class_schedule_id
WHERE c.status = 'active' AND cs.is_active = true;
```

## Row Level Security (RLS)

### Classes Table RLS

```sql
-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own classes
CREATE POLICY "Teachers can view own classes" ON classes
  FOR SELECT
  USING (teacher_id = auth.uid());

-- Teachers can create classes in their assigned domains
CREATE POLICY "Teachers can create classes" ON classes
  FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid() AND
    domain_id IN (
      SELECT domain_id FROM teacher_domains 
      WHERE teacher_id = auth.uid()
    )
  );

-- Teachers can update their own classes
CREATE POLICY "Teachers can update own classes" ON classes
  FOR UPDATE
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Tenant admins can manage all classes in their tenant
CREATE POLICY "Tenant admins can manage tenant classes" ON classes
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### Class Students Table RLS

```sql
-- Enable RLS
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

-- Teachers can manage students in their classes
CREATE POLICY "Teachers can manage class students" ON class_students
  FOR ALL
  USING (
    class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  );

-- Students can view classes they're enrolled in
CREATE POLICY "Students can view their enrollments" ON class_students
  FOR SELECT
  USING (student_id = auth.uid());
```

## Functions and Triggers

### 1. Check Schedule Conflicts

```sql
CREATE OR REPLACE FUNCTION check_schedule_conflicts()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Check for overlapping schedules for the same teacher
  SELECT COUNT(*)
  INTO conflict_count
  FROM class_schedules cs1
  JOIN classes c1 ON cs1.class_id = c1.id
  JOIN class_schedules cs2 ON cs2.id != NEW.id
  JOIN classes c2 ON cs2.class_id = c2.id
  WHERE c1.teacher_id = c2.teacher_id
    AND cs1.id = NEW.id
    AND cs2.day_of_week = NEW.day_of_week
    AND cs2.is_active = true
    AND c2.status = 'active'
    AND (
      (NEW.start_time, NEW.end_time) OVERLAPS (cs2.start_time, cs2.end_time)
    );
  
  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Schedule conflict detected for this teacher';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_schedule_conflicts_trigger
BEFORE INSERT OR UPDATE ON class_schedules
FOR EACH ROW EXECUTE FUNCTION check_schedule_conflicts();
```

### 2. Update Enrollment Count

```sql
CREATE OR REPLACE FUNCTION update_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if class is at capacity
  IF TG_OP = 'INSERT' AND NEW.enrollment_status = 'enrolled' THEN
    IF (
      SELECT COUNT(*) 
      FROM class_students 
      WHERE class_id = NEW.class_id 
        AND enrollment_status = 'enrolled'
    ) >= (
      SELECT max_students 
      FROM classes 
      WHERE id = NEW.class_id
    ) THEN
      RAISE EXCEPTION 'Class is at maximum capacity';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_enrollment_limit
BEFORE INSERT OR UPDATE ON class_students
FOR EACH ROW EXECUTE FUNCTION update_enrollment_count();
```

### 3. Auto-expire Invitations

```sql
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE class_invitations
  SET email_status = 'failed'
  WHERE expires_at < NOW()
    AND email_status = 'pending';
  
  UPDATE class_students
  SET enrollment_status = 'declined'
  WHERE id IN (
    SELECT class_student_id
    FROM class_invitations
    WHERE expires_at < NOW()
      AND response_type IS NULL
  )
  AND enrollment_status = 'invited';
END;
$$ LANGUAGE plpgsql;

-- Schedule this function to run daily
SELECT cron.schedule(
  'cleanup-expired-invitations',
  '0 2 * * *', -- Run at 2 AM daily
  'SELECT cleanup_expired_invitations()'
);
```

## Migration Strategy

### Step 1: Create Enum Types
```sql
-- Run first to establish type definitions
```

### Step 2: Create Core Tables
```sql
-- Create tables in dependency order:
-- 1. classes
-- 2. class_schedules
-- 3. class_students
-- 4. class_invitations
-- 5. class_schedule_exceptions
```

### Step 3: Create Indexes
```sql
-- Create all indexes after tables are populated
```

### Step 4: Create Views
```sql
-- Create views after all tables exist
```

### Step 5: Enable RLS and Policies
```sql
-- Enable RLS and create policies last
```

### Step 6: Create Functions and Triggers
```sql
-- Add business logic functions and triggers
```

## Performance Considerations

1. **Indexing Strategy**
   - Composite index on (teacher_id, status) for active class queries
   - Partial indexes on boolean flags where applicable
   - BRIN indexes on timestamp columns for large tables

2. **Partitioning**
   - Consider partitioning class_students by created_at for large deployments
   - Archive completed classes to separate tables after 1 year

3. **Query Optimization**
   - Use materialized views for complex dashboard queries
   - Implement query result caching for schedule views
   - Batch invitation processing to avoid N+1 queries

4. **Data Retention**
   - Soft delete for classes (status = 'archived')
   - Hard delete invitation records after 90 days
   - Compress schedule exception history after 6 months