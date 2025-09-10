-- ============================================================
-- Teacher Management - Indexes, Triggers, and Functions
-- Run this AFTER the tables are created
-- ============================================================

BEGIN;

-- ============================================================
-- BASIC INDEXES (No partial indexes)
-- ============================================================

-- Teachers table indexes
CREATE INDEX IF NOT EXISTS idx_teachers_tenant ON public.teachers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user ON public.teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_status ON public.teachers(status);
CREATE INDEX IF NOT EXISTS idx_teachers_name ON public.teachers(last_name, first_name);

-- Teacher domains indexes
CREATE INDEX IF NOT EXISTS idx_teacher_domains_teacher ON public.teacher_domains(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_domains_domain ON public.teacher_domains(domain_id);
-- Simple composite index instead of partial index
CREATE INDEX IF NOT EXISTS idx_teacher_domains_primary ON public.teacher_domains(teacher_id, is_primary);

-- Teacher modalities index
CREATE INDEX IF NOT EXISTS idx_teacher_modalities_teacher ON public.teacher_modalities(teacher_id);

-- Teacher schedules indexes
CREATE INDEX IF NOT EXISTS idx_teacher_schedules_teacher ON public.teacher_schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_schedules_day ON public.teacher_schedules(day_of_week);
-- Simple composite index instead of partial index
CREATE INDEX IF NOT EXISTS idx_teacher_schedules_available ON public.teacher_schedules(teacher_id, is_available);

-- Teacher settings index
CREATE INDEX IF NOT EXISTS idx_teacher_settings_teacher ON public.teacher_settings(teacher_id);

-- Teacher unavailability indexes
CREATE INDEX IF NOT EXISTS idx_teacher_unavailability_teacher ON public.teacher_unavailability(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_unavailability_dates ON public.teacher_unavailability(start_date, end_date);

-- ============================================================
-- TRIGGER FUNCTIONS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_teacher_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
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
    UPDATE public.teacher_domains
    SET is_primary = FALSE
    WHERE teacher_id = NEW.teacher_id
      AND id != NEW.id
      AND is_primary = TRUE;
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
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_unavailability ENABLE ROW LEVEL SECURITY;

-- Teachers table policies
DROP POLICY IF EXISTS "Teachers visible to same tenant users" ON public.teachers;
CREATE POLICY "Teachers visible to same tenant users" ON public.teachers
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Teachers can view own profile" ON public.teachers;
CREATE POLICY "Teachers can view own profile" ON public.teachers
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can update own profile" ON public.teachers;
CREATE POLICY "Teachers can update own profile" ON public.teachers
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Tenant admins can manage teachers" ON public.teachers;
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
DROP POLICY IF EXISTS "Teacher domains visible to same tenant" ON public.teacher_domains;
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

-- Add similar policies for other tables as needed

COMMIT;

-- ============================================================
-- Verification
-- ============================================================
SELECT 
  indexname,
  tablename
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename LIKE 'teacher%'
ORDER BY tablename, indexname;