-- ============================================================
-- Teacher Management - Tables Only (Minimal Version)
-- This creates just the tables without any complex indexes
-- ============================================================

BEGIN;

-- ============================================================
-- 1. TEACHERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(50),
  bio TEXT,
  avatar_url TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, tenant_id)
);

-- ============================================================
-- 2. TEACHER_DOMAINS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  certification_level VARCHAR(50) DEFAULT 'basic' CHECK (certification_level IN ('basic', 'intermediate', 'advanced', 'expert')),
  max_students INTEGER,
  preferred_class_size INTEGER,
  certified_date DATE,
  certification_expires DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, domain_id)
);

-- ============================================================
-- 3. TEACHER_MODALITIES TABLE
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
-- 4. TEACHER_SCHEDULES TABLE
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
-- 5. TEACHER_SETTINGS TABLE
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
-- 6. TEACHER_UNAVAILABILITY TABLE
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

COMMIT;

-- ============================================================
-- Verification
-- ============================================================
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✓ Created'
    ELSE '✗ Failed'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'teachers',
    'teacher_domains',
    'teacher_modalities',
    'teacher_schedules',
    'teacher_settings',
    'teacher_unavailability'
  )
ORDER BY table_name;