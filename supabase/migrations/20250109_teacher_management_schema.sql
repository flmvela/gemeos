-- ============================================================
-- Teacher Management Database Schema
-- This migration creates all necessary tables for teacher management
-- including profiles, domains, schedules, settings, and permissions
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
  UNIQUE(user_id, tenant_id),
  
  -- Indexes for performance
  CONSTRAINT teachers_phone_format CHECK (
    phone_number IS NULL OR 
    phone_number ~ '^\+?[1-9]\d{1,14}$'
  )
);

-- Create indexes for teachers table
CREATE INDEX idx_teachers_tenant ON public.teachers(tenant_id);
CREATE INDEX idx_teachers_user ON public.teachers(user_id);
CREATE INDEX idx_teachers_status ON public.teachers(status);
CREATE INDEX idx_teachers_name ON public.teachers(last_name, first_name);

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
  UNIQUE(teacher_id, domain_id),
  CONSTRAINT positive_students CHECK (
    (max_students IS NULL OR max_students > 0) AND
    (preferred_class_size IS NULL OR preferred_class_size > 0)
  ),
  CONSTRAINT valid_class_size CHECK (
    preferred_class_size IS NULL OR 
    max_students IS NULL OR 
    preferred_class_size <= max_students
  )
);

-- Create indexes for teacher_domains
CREATE INDEX idx_teacher_domains_teacher ON public.teacher_domains(teacher_id);
CREATE INDEX idx_teacher_domains_domain ON public.teacher_domains(domain_id);
CREATE INDEX idx_teacher_domains_primary ON public.teacher_domains(teacher_id, is_primary) 
  WHERE teacher_domains.is_primary = TRUE;

-- ============================================================
-- 3. TEACHER_MODALITIES TABLE - Teaching delivery methods
-- ============================================================
CREATE TYPE teaching_modality AS ENUM ('in-person', 'online', 'hybrid');

CREATE TABLE IF NOT EXISTS public.teacher_modalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  modality teaching_modality NOT NULL,
  
  -- Modality Preferences
  is_preferred BOOLEAN DEFAULT FALSE,
  equipment_available TEXT[], -- e.g., ['webcam', 'microphone', 'digital_piano']
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(teacher_id, modality)
);

-- Create index for teacher_modalities
CREATE INDEX idx_teacher_modalities_teacher ON public.teacher_modalities(teacher_id);

-- ============================================================
-- 4. TEACHER_SCHEDULES TABLE - Weekly availability
-- ============================================================
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

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
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_effective_dates CHECK (
    effective_until IS NULL OR 
    effective_until >= effective_from
  )
);

-- Create indexes for teacher_schedules
CREATE INDEX idx_teacher_schedules_teacher ON public.teacher_schedules(teacher_id);
CREATE INDEX idx_teacher_schedules_day ON public.teacher_schedules(day_of_week);
CREATE INDEX idx_teacher_schedules_available ON public.teacher_schedules(teacher_id, is_available) 
  WHERE teacher_schedules.is_available = TRUE;

-- ============================================================
-- 5. TEACHER_SETTINGS TABLE - Teacher preferences and settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID UNIQUE NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  
  -- Class Settings
  min_class_duration INTEGER DEFAULT 60, -- in minutes
  max_classes_per_day INTEGER DEFAULT 6,
  buffer_between_classes INTEGER DEFAULT 15, -- in minutes
  
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_durations CHECK (
    min_class_duration > 0 AND
    max_classes_per_day > 0 AND
    buffer_between_classes >= 0
  )
);

-- Create index for teacher_settings
CREATE INDEX idx_teacher_settings_teacher ON public.teacher_settings(teacher_id);

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
  recurrence_pattern VARCHAR(50), -- 'yearly', 'monthly', etc.
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create indexes for teacher_unavailability
CREATE INDEX idx_teacher_unavailability_teacher ON public.teacher_unavailability(teacher_id);
CREATE INDEX idx_teacher_unavailability_dates ON public.teacher_unavailability(start_date, end_date);

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
CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_teacher_updated_at();

CREATE TRIGGER update_teacher_domains_updated_at
  BEFORE UPDATE ON public.teacher_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.update_teacher_updated_at();

CREATE TRIGGER update_teacher_schedules_updated_at
  BEFORE UPDATE ON public.teacher_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_teacher_updated_at();

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

-- Teacher modalities policies
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

CREATE POLICY "Teachers can manage own modalities" ON public.teacher_modalities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_modalities.teacher_id
        AND t.user_id = auth.uid()
    )
  );

-- Teacher schedules policies
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

CREATE POLICY "Teachers can manage own schedules" ON public.teacher_schedules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_schedules.teacher_id
        AND t.user_id = auth.uid()
    )
  );

-- Teacher settings policies
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

CREATE POLICY "Teachers can update own settings" ON public.teacher_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_settings.teacher_id
        AND t.user_id = auth.uid()
    )
  );

-- Teacher unavailability policies
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

CREATE POLICY "Teachers can manage own unavailability" ON public.teacher_unavailability
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_unavailability.teacher_id
        AND t.user_id = auth.uid()
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
  v_day_of_week := LOWER(TO_CHAR(p_date, 'day'))::day_of_week;
  
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

-- ============================================================
-- 10. COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.teachers IS 'Core teacher profiles linked to auth users and tenants';
COMMENT ON TABLE public.teacher_domains IS 'Teacher subject expertise and certification levels';
COMMENT ON TABLE public.teacher_modalities IS 'Teaching delivery methods (in-person, online, hybrid)';
COMMENT ON TABLE public.teacher_schedules IS 'Weekly availability schedules for teachers';
COMMENT ON TABLE public.teacher_settings IS 'Teacher preferences, permissions, and notification settings';
COMMENT ON TABLE public.teacher_unavailability IS 'Specific dates when teachers are not available';

COMMENT ON COLUMN public.teachers.status IS 'Teacher employment status: active, inactive, on_leave, terminated';
COMMENT ON COLUMN public.teacher_domains.certification_level IS 'Expertise level: basic, intermediate, advanced, expert';
COMMENT ON COLUMN public.teacher_settings.notification_preferences IS 'JSONB structure for flexible notification preferences';
COMMENT ON COLUMN public.teacher_settings.custom_permissions IS 'JSONB structure for teacher-specific permissions';

COMMIT;

-- ============================================================
-- ROLLBACK SCRIPT (Save separately)
-- ============================================================
/*
-- To rollback this migration, run:
BEGIN;

DROP TRIGGER IF EXISTS create_teacher_settings_on_insert ON public.teachers;
DROP TRIGGER IF EXISTS ensure_single_primary_domain_trigger ON public.teacher_domains;
DROP TRIGGER IF EXISTS update_teacher_settings_updated_at ON public.teacher_settings;
DROP TRIGGER IF EXISTS update_teacher_schedules_updated_at ON public.teacher_schedules;
DROP TRIGGER IF EXISTS update_teacher_domains_updated_at ON public.teacher_domains;
DROP TRIGGER IF EXISTS update_teachers_updated_at ON public.teachers;

DROP FUNCTION IF EXISTS public.is_teacher_available(UUID, DATE, TIME, TIME);
DROP FUNCTION IF EXISTS public.get_teacher_full_schedule(UUID);
DROP FUNCTION IF EXISTS public.create_default_teacher_settings();
DROP FUNCTION IF EXISTS public.ensure_single_primary_domain();
DROP FUNCTION IF EXISTS public.update_teacher_updated_at();

DROP TABLE IF EXISTS public.teacher_unavailability CASCADE;
DROP TABLE IF EXISTS public.teacher_settings CASCADE;
DROP TABLE IF EXISTS public.teacher_schedules CASCADE;
DROP TABLE IF EXISTS public.teacher_modalities CASCADE;
DROP TABLE IF EXISTS public.teacher_domains CASCADE;
DROP TABLE IF EXISTS public.teachers CASCADE;

DROP TYPE IF EXISTS day_of_week CASCADE;
DROP TYPE IF EXISTS teaching_modality CASCADE;

COMMIT;
*/