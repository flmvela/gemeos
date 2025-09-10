-- ============================================================
-- Teacher Management - Fix Existing Tables and Add Missing Columns
-- This migration handles tables that may already exist
-- ============================================================

BEGIN;

-- ============================================================
-- 1. FIX TEACHERS TABLE
-- ============================================================
-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(50),
  bio TEXT,
  avatar_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, tenant_id)
);

-- Add missing columns if table already exists
DO $$
BEGIN
  -- Add status column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'teachers' AND column_name = 'status') THEN
    ALTER TABLE public.teachers ADD COLUMN status VARCHAR(50) DEFAULT 'active';
  END IF;
  
  -- Add constraint if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                 WHERE constraint_name = 'teachers_status_check') THEN
    ALTER TABLE public.teachers ADD CONSTRAINT teachers_status_check 
      CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated'));
  END IF;
END $$;

-- ============================================================
-- 2. FIX TEACHER_DOMAINS TABLE
-- ============================================================
-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.teacher_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  certification_level VARCHAR(50) DEFAULT 'basic',
  max_students INTEGER,
  preferred_class_size INTEGER,
  certified_date DATE,
  certification_expires DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, domain_id)
);

-- Add missing columns if table already exists
DO $$
BEGIN
  -- Check if is_primary column exists, if not add it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'teacher_domains' AND column_name = 'is_primary') THEN
    ALTER TABLE public.teacher_domains ADD COLUMN is_primary BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Check if certification_level column exists, if not add it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'teacher_domains' AND column_name = 'certification_level') THEN
    ALTER TABLE public.teacher_domains ADD COLUMN certification_level VARCHAR(50) DEFAULT 'basic';
  END IF;
  
  -- Check if max_students column exists, if not add it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'teacher_domains' AND column_name = 'max_students') THEN
    ALTER TABLE public.teacher_domains ADD COLUMN max_students INTEGER;
  END IF;
  
  -- Check if preferred_class_size column exists, if not add it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'teacher_domains' AND column_name = 'preferred_class_size') THEN
    ALTER TABLE public.teacher_domains ADD COLUMN preferred_class_size INTEGER;
  END IF;
  
  -- Add constraint if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                 WHERE constraint_name = 'teacher_domains_certification_level_check') THEN
    ALTER TABLE public.teacher_domains ADD CONSTRAINT teacher_domains_certification_level_check 
      CHECK (certification_level IN ('basic', 'intermediate', 'advanced', 'expert'));
  END IF;
END $$;

-- ============================================================
-- 3. CREATE TEACHER_MODALITIES TABLE
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'teaching_modality') THEN
    CREATE TYPE teaching_modality AS ENUM ('in-person', 'online', 'hybrid');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.teacher_modalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  modality teaching_modality NOT NULL,
  is_preferred BOOLEAN DEFAULT FALSE,
  equipment_available TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, modality)
);

-- ============================================================
-- 4. CREATE TEACHER_SCHEDULES TABLE
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'day_of_week') THEN
    CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.teacher_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  day_of_week day_of_week NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, day_of_week, start_time, end_time),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- ============================================================
-- 5. CREATE TEACHER_SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID UNIQUE NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  min_class_duration INTEGER DEFAULT 60,
  max_classes_per_day INTEGER DEFAULT 6,
  buffer_between_classes INTEGER DEFAULT 15,
  notification_preferences JSONB DEFAULT '{
    "email_notifications": true,
    "sms_notifications": false,
    "in_app_notifications": true,
    "notification_types": {
      "new_student": true,
      "class_reminder": true,
      "schedule_change": true,
      "student_message": true
    }
  }'::jsonb,
  custom_permissions JSONB DEFAULT '{
    "can_create_classes": true,
    "can_manage_students": true,
    "can_view_reports": false,
    "can_manage_domain_content": false,
    "restrict_to_own_students": true,
    "restrict_to_own_classes": true,
    "is_lead_teacher": false,
    "can_approve_enrollments": false
  }'::jsonb,
  auto_accept_students BOOLEAN DEFAULT FALSE,
  max_pending_enrollments INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. CREATE TEACHER_UNAVAILABILITY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_unavailability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(200),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- ============================================================
-- 7. CREATE INDEXES (only after columns are confirmed to exist)
-- ============================================================

-- Teachers table indexes
CREATE INDEX IF NOT EXISTS idx_teachers_tenant ON public.teachers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user ON public.teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_status ON public.teachers(status);
CREATE INDEX IF NOT EXISTS idx_teachers_name ON public.teachers(last_name, first_name);

-- Teacher domains indexes (now that we know is_primary exists)
CREATE INDEX IF NOT EXISTS idx_teacher_domains_teacher ON public.teacher_domains(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_domains_domain ON public.teacher_domains(domain_id);
-- Now we can safely create this index
CREATE INDEX IF NOT EXISTS idx_teacher_domains_primary ON public.teacher_domains(teacher_id, is_primary);

-- Teacher modalities index
CREATE INDEX IF NOT EXISTS idx_teacher_modalities_teacher ON public.teacher_modalities(teacher_id);

-- Teacher schedules indexes
CREATE INDEX IF NOT EXISTS idx_teacher_schedules_teacher ON public.teacher_schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_schedules_day ON public.teacher_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_teacher_schedules_available ON public.teacher_schedules(teacher_id, is_available);

-- Teacher settings index
CREATE INDEX IF NOT EXISTS idx_teacher_settings_teacher ON public.teacher_settings(teacher_id);

-- Teacher unavailability indexes
CREATE INDEX IF NOT EXISTS idx_teacher_unavailability_teacher ON public.teacher_unavailability(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_unavailability_dates ON public.teacher_unavailability(start_date, end_date);

COMMIT;

-- ============================================================
-- Verification
-- ============================================================
DO $$
DECLARE
  v_table_count INTEGER;
  v_column_exists BOOLEAN;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('teachers', 'teacher_domains', 'teacher_modalities', 
                       'teacher_schedules', 'teacher_settings', 'teacher_unavailability');
  
  RAISE NOTICE 'Teacher tables created: %/6', v_table_count;
  
  -- Check specific columns
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teacher_domains' AND column_name = 'is_primary'
  ) INTO v_column_exists;
  
  IF v_column_exists THEN
    RAISE NOTICE '✓ teacher_domains.is_primary column exists';
  ELSE
    RAISE NOTICE '✗ teacher_domains.is_primary column MISSING';
  END IF;
  
  -- List all columns in teacher_domains for debugging
  RAISE NOTICE 'Columns in teacher_domains table:';
  FOR v_column_exists IN 
    SELECT column_name || ' (' || data_type || ')'
    FROM information_schema.columns 
    WHERE table_name = 'teacher_domains'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  - %', v_column_exists;
  END LOOP;
END $$;