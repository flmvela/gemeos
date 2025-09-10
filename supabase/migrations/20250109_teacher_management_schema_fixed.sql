-- ============================================================
-- Teacher Management Database Schema (Fixed Version)
-- This migration creates all necessary tables for teacher management
-- ============================================================

BEGIN;

-- ============================================================
-- 1. TEACHERS TABLE - Core teacher profile information
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Basic Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(50),
  bio TEXT,
  avatar_url TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(user_id, tenant_id)
);

-- Create indexes for teachers table
CREATE INDEX IF NOT EXISTS idx_teachers_tenant ON public.teachers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user ON public.teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_status ON public.teachers(status);
CREATE INDEX IF NOT EXISTS idx_teachers_name ON public.teachers(last_name, first_name);

-- ============================================================
-- 2. TEACHER_DOMAINS TABLE - Teacher subject expertise
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  
  -- Domain Details
  is_primary BOOLEAN DEFAULT FALSE,
  certification_level VARCHAR(50) DEFAULT 'basic' 
    CHECK (certification_level IN ('basic', 'intermediate', 'advanced', 'expert')),
  
  -- Teaching Capacity
  max_students INTEGER,
  preferred_class_size INTEGER,
  
  -- Metadata
  certified_date DATE,
  certification_expires DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(teacher_id, domain_id)
);

-- Create indexes for teacher_domains
CREATE INDEX IF NOT EXISTS idx_teacher_domains_teacher ON public.teacher_domains(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_domains_domain ON public.teacher_domains(domain_id);
CREATE INDEX IF NOT EXISTS idx_teacher_domains_primary ON public.teacher_domains(teacher_id) WHERE is_primary = TRUE;

-- ============================================================
-- 3. TEACHER_MODALITIES TABLE - Teaching delivery methods
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
  
  -- Modality Preferences
  is_preferred BOOLEAN DEFAULT FALSE,
  equipment_available TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(teacher_id, modality)
);

-- Create index for teacher_modalities
CREATE INDEX IF NOT EXISTS idx_teacher_modalities_teacher ON public.teacher_modalities(teacher_id);

-- ============================================================
-- 4. TEACHER_SCHEDULES TABLE - Weekly availability
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
  
  -- Schedule Details
  day_of_week day_of_week NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  
  -- Time Zone
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  
  -- Metadata
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(teacher_id, day_of_week, start_time, end_time),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create indexes for teacher_schedules
CREATE INDEX IF NOT EXISTS idx_teacher_schedules_teacher ON public.teacher_schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_schedules_day ON public.teacher_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_teacher_schedules_available ON public.teacher_schedules(teacher_id) WHERE is_available = TRUE;

-- ============================================================
-- 5. TEACHER_SETTINGS TABLE - Teacher preferences and settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID UNIQUE NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  
  -- Class Settings
  min_class_duration INTEGER DEFAULT 60,
  max_classes_per_day INTEGER DEFAULT 6,
  buffer_between_classes INTEGER DEFAULT 15,
  
  -- Notification Preferences (JSONB for flexibility)
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
  
  -- Permissions (using JSONB for flexibility)
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
  
  -- Other Settings
  auto_accept_students BOOLEAN DEFAULT FALSE,
  max_pending_enrollments INTEGER DEFAULT 10,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for teacher_settings
CREATE INDEX IF NOT EXISTS idx_teacher_settings_teacher ON public.teacher_settings(teacher_id);

-- ============================================================
-- 6. TEACHER_UNAVAILABILITY TABLE - Specific dates when teacher is unavailable
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_unavailability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  
  -- Unavailability Period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(200),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern VARCHAR(50),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create indexes for teacher_unavailability
CREATE INDEX IF NOT EXISTS idx_teacher_unavailability_teacher ON public.teacher_unavailability(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_unavailability_dates ON public.teacher_unavailability(start_date, end_date);

-- ============================================================
-- 7. TRIGGER FUNCTIONS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_teacher_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
DROP TRIGGER IF EXISTS update_teachers_updated_at ON public.teachers;
CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_teacher_updated_at();

DROP TRIGGER IF EXISTS update_teacher_domains_updated_at ON public.teacher_domains;
CREATE TRIGGER update_teacher_domains_updated_at
  BEFORE UPDATE ON public.teacher_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.update_teacher_updated_at();

DROP TRIGGER IF EXISTS update_teacher_schedules_updated_at ON public.teacher_schedules;
CREATE TRIGGER update_teacher_schedules_updated_at
  BEFORE UPDATE ON public.teacher_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_teacher_updated_at();

DROP TRIGGER IF EXISTS update_teacher_settings_updated_at ON public.teacher_settings;
CREATE TRIGGER update_teacher_settings_updated_at
  BEFORE UPDATE ON public.teacher_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_teacher_updated_at();

-- Function to ensure only one primary domain per teacher
CREATE OR REPLACE FUNCTION public.ensure_single_primary_domain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN
    -- Set all other domains for this teacher to non-primary
    UPDATE public.teacher_domains
    SET is_primary = FALSE
    WHERE teacher_id = NEW.teacher_id
      AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_primary_domain_trigger ON public.teacher_domains;
CREATE TRIGGER ensure_single_primary_domain_trigger
  BEFORE INSERT OR UPDATE ON public.teacher_domains
  FOR EACH ROW
  WHEN (NEW.is_primary = TRUE)
  EXECUTE FUNCTION public.ensure_single_primary_domain();

-- Function to create teacher settings on teacher creation
CREATE OR REPLACE FUNCTION public.create_default_teacher_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.teacher_settings (teacher_id)
  VALUES (NEW.id)
  ON CONFLICT (teacher_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_teacher_settings_on_insert ON public.teachers;
CREATE TRIGGER create_teacher_settings_on_insert
  AFTER INSERT ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_teacher_settings();

-- ============================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all teacher tables
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_unavailability ENABLE ROW LEVEL SECURITY;

-- Teachers table policies
CREATE POLICY "Teachers visible to same tenant users" ON public.teachers
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Teachers can view own profile" ON public.teachers
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Teachers can update own profile" ON public.teachers
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Tenant admins can manage teachers" ON public.teachers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = teachers.tenant_id
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

-- Teacher domains policies
CREATE POLICY "Teacher domains visible to same tenant" ON public.teacher_domains
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_domains.teacher_id
        AND t.tenant_id IN (
          SELECT tenant_id FROM public.user_tenants
          WHERE user_id = auth.uid() AND status = 'active'
        )
    )
  );

CREATE POLICY "Teachers can manage own domains" ON public.teacher_domains
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_domains.teacher_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage teacher domains" ON public.teacher_domains
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON t.tenant_id = ut.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_domains.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

-- Similar policies for other tables (simplified for brevity)
CREATE POLICY "Teacher modalities visible to same tenant" ON public.teacher_modalities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_modalities.teacher_id
        AND t.tenant_id IN (
          SELECT tenant_id FROM public.user_tenants
          WHERE user_id = auth.uid() AND status = 'active'
        )
    )
  );

CREATE POLICY "Teacher schedules visible to same tenant" ON public.teacher_schedules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_schedules.teacher_id
        AND t.tenant_id IN (
          SELECT tenant_id FROM public.user_tenants
          WHERE user_id = auth.uid() AND status = 'active'
        )
    )
  );

CREATE POLICY "Teacher settings visible to teacher and admins" ON public.teacher_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_settings.teacher_id
        AND (
          t.user_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.user_roles ur ON ut.role_id = ur.id
            WHERE ut.user_id = auth.uid()
              AND ut.tenant_id = t.tenant_id
              AND ur.name IN ('tenant_admin', 'platform_admin')
              AND ut.status = 'active'
          )
        )
    )
  );

CREATE POLICY "Teacher unavailability visible to same tenant" ON public.teacher_unavailability
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_unavailability.teacher_id
        AND t.tenant_id IN (
          SELECT tenant_id FROM public.user_tenants
          WHERE user_id = auth.uid() AND status = 'active'
        )
    )
  );

-- ============================================================
-- 9. HELPER FUNCTIONS
-- ============================================================

-- Function to get teacher's full schedule
CREATE OR REPLACE FUNCTION public.get_teacher_full_schedule(p_teacher_id UUID)
RETURNS TABLE (
  day_of_week day_of_week,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN,
  timezone VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.day_of_week,
    ts.start_time,
    ts.end_time,
    ts.is_available,
    ts.timezone
  FROM public.teacher_schedules ts
  WHERE ts.teacher_id = p_teacher_id
    AND ts.is_available = TRUE
    AND (ts.effective_until IS NULL OR ts.effective_until >= CURRENT_DATE)
  ORDER BY 
    CASE ts.day_of_week
      WHEN 'monday' THEN 1
      WHEN 'tuesday' THEN 2
      WHEN 'wednesday' THEN 3
      WHEN 'thursday' THEN 4
      WHEN 'friday' THEN 5
      WHEN 'saturday' THEN 6
      WHEN 'sunday' THEN 7
    END,
    ts.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if teacher is available on specific date/time
CREATE OR REPLACE FUNCTION public.is_teacher_available(
  p_teacher_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  v_day_of_week day_of_week;
  v_is_available BOOLEAN := FALSE;
BEGIN
  -- Get day of week from date
  v_day_of_week := LOWER(TRIM(TO_CHAR(p_date, 'day')))::day_of_week;
  
  -- Check if teacher has availability for this day and time
  SELECT TRUE INTO v_is_available
  FROM public.teacher_schedules ts
  WHERE ts.teacher_id = p_teacher_id
    AND ts.day_of_week = v_day_of_week
    AND ts.is_available = TRUE
    AND ts.start_time <= p_start_time
    AND ts.end_time >= p_end_time
    AND (ts.effective_until IS NULL OR ts.effective_until >= p_date)
  LIMIT 1;
  
  -- If available, check for specific unavailability
  IF v_is_available THEN
    SELECT FALSE INTO v_is_available
    FROM public.teacher_unavailability tu
    WHERE tu.teacher_id = p_teacher_id
      AND p_date BETWEEN tu.start_date AND tu.end_date
    LIMIT 1;
  END IF;
  
  RETURN COALESCE(v_is_available, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ============================================================
-- Verification queries to run after migration
-- ============================================================
/*
SELECT 'Teachers table created' AS status, COUNT(*) AS count FROM information_schema.tables WHERE table_name = 'teachers';
SELECT 'Teacher domains table created' AS status, COUNT(*) AS count FROM information_schema.tables WHERE table_name = 'teacher_domains';
SELECT 'Teacher modalities table created' AS status, COUNT(*) AS count FROM information_schema.tables WHERE table_name = 'teacher_modalities';
SELECT 'Teacher schedules table created' AS status, COUNT(*) AS count FROM information_schema.tables WHERE table_name = 'teacher_schedules';
SELECT 'Teacher settings table created' AS status, COUNT(*) AS count FROM information_schema.tables WHERE table_name = 'teacher_settings';
SELECT 'Teacher unavailability table created' AS status, COUNT(*) AS count FROM information_schema.tables WHERE table_name = 'teacher_unavailability';
*/