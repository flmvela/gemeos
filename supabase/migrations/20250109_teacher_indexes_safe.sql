-- ============================================================
-- Teacher Management - Safe Indexes and Triggers
-- This version checks column existence before creating indexes
-- ============================================================

BEGIN;

-- ============================================================
-- VERIFY COLUMNS EXIST
-- ============================================================
DO $$
DECLARE
  v_column_exists BOOLEAN;
BEGIN
  -- Check is_primary column in teacher_domains
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teacher_domains' 
      AND column_name = 'is_primary'
      AND table_schema = 'public'
  ) INTO v_column_exists;
  
  IF NOT v_column_exists THEN
    RAISE NOTICE 'WARNING: is_primary column does not exist in teacher_domains table';
    RAISE NOTICE 'Columns in teacher_domains:';
    FOR v_column_exists IN 
      SELECT column_name || ' (' || data_type || ')'
      FROM information_schema.columns 
      WHERE table_name = 'teacher_domains' AND table_schema = 'public'
      ORDER BY ordinal_position
    LOOP
      RAISE NOTICE '  - %', v_column_exists;
    END LOOP;
  ELSE
    RAISE NOTICE '✓ is_primary column exists in teacher_domains';
  END IF;
  
  -- Check is_available column in teacher_schedules
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teacher_schedules' 
      AND column_name = 'is_available'
      AND table_schema = 'public'
  ) INTO v_column_exists;
  
  IF NOT v_column_exists THEN
    RAISE NOTICE 'WARNING: is_available column does not exist in teacher_schedules table';
  ELSE
    RAISE NOTICE '✓ is_available column exists in teacher_schedules';
  END IF;
END $$;

-- ============================================================
-- BASIC INDEXES (Only create if columns exist)
-- ============================================================

-- Teachers table indexes
CREATE INDEX IF NOT EXISTS idx_teachers_tenant ON public.teachers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user ON public.teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_name ON public.teachers(last_name, first_name);

-- Only create status index if status column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'teachers' AND column_name = 'status' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_teachers_status ON public.teachers(status);
    RAISE NOTICE '✓ Created idx_teachers_status';
  END IF;
END $$;

-- Teacher domains indexes
CREATE INDEX IF NOT EXISTS idx_teacher_domains_teacher ON public.teacher_domains(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_domains_domain ON public.teacher_domains(domain_id);

-- Only create is_primary index if column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'teacher_domains' AND column_name = 'is_primary' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_teacher_domains_primary ON public.teacher_domains(teacher_id, is_primary);
    RAISE NOTICE '✓ Created idx_teacher_domains_primary';
  ELSE
    RAISE NOTICE '✗ Skipped idx_teacher_domains_primary - column does not exist';
  END IF;
END $$;

-- Teacher modalities index
CREATE INDEX IF NOT EXISTS idx_teacher_modalities_teacher ON public.teacher_modalities(teacher_id);

-- Teacher schedules indexes
CREATE INDEX IF NOT EXISTS idx_teacher_schedules_teacher ON public.teacher_schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_schedules_day ON public.teacher_schedules(day_of_week);

-- Only create is_available index if column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'teacher_schedules' AND column_name = 'is_available' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_teacher_schedules_available ON public.teacher_schedules(teacher_id, is_available);
    RAISE NOTICE '✓ Created idx_teacher_schedules_available';
  ELSE
    RAISE NOTICE '✗ Skipped idx_teacher_schedules_available - column does not exist';
  END IF;
END $$;

-- Teacher settings index
CREATE INDEX IF NOT EXISTS idx_teacher_settings_teacher ON public.teacher_settings(teacher_id);

-- Teacher unavailability indexes
CREATE INDEX IF NOT EXISTS idx_teacher_unavailability_teacher ON public.teacher_unavailability(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_unavailability_dates ON public.teacher_unavailability(start_date, end_date);

-- ============================================================
-- TRIGGER FUNCTIONS (Safe to create)
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_teacher_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers only to tables with updated_at column
DO $$
BEGIN
  -- Teachers table
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'teachers' AND column_name = 'updated_at' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS update_teachers_updated_at ON public.teachers;
    CREATE TRIGGER update_teachers_updated_at
      BEFORE UPDATE ON public.teachers
      FOR EACH ROW
      EXECUTE FUNCTION public.update_teacher_updated_at();
    RAISE NOTICE '✓ Created trigger for teachers.updated_at';
  END IF;
  
  -- Teacher domains table
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'teacher_domains' AND column_name = 'updated_at' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS update_teacher_domains_updated_at ON public.teacher_domains;
    CREATE TRIGGER update_teacher_domains_updated_at
      BEFORE UPDATE ON public.teacher_domains
      FOR EACH ROW
      EXECUTE FUNCTION public.update_teacher_updated_at();
    RAISE NOTICE '✓ Created trigger for teacher_domains.updated_at';
  END IF;
  
  -- Teacher schedules table
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'teacher_schedules' AND column_name = 'updated_at' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS update_teacher_schedules_updated_at ON public.teacher_schedules;
    CREATE TRIGGER update_teacher_schedules_updated_at
      BEFORE UPDATE ON public.teacher_schedules
      FOR EACH ROW
      EXECUTE FUNCTION public.update_teacher_updated_at();
    RAISE NOTICE '✓ Created trigger for teacher_schedules.updated_at';
  END IF;
  
  -- Teacher settings table
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'teacher_settings' AND column_name = 'updated_at' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS update_teacher_settings_updated_at ON public.teacher_settings;
    CREATE TRIGGER update_teacher_settings_updated_at
      BEFORE UPDATE ON public.teacher_settings
      FOR EACH ROW
      EXECUTE FUNCTION public.update_teacher_updated_at();
    RAISE NOTICE '✓ Created trigger for teacher_settings.updated_at';
  END IF;
END $$;

-- Function to ensure only one primary domain per teacher (only if is_primary exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'teacher_domains' AND column_name = 'is_primary' AND table_schema = 'public') THEN
    
    CREATE OR REPLACE FUNCTION public.ensure_single_primary_domain()
    RETURNS TRIGGER AS $func$
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
    $func$ LANGUAGE plpgsql;
    
    DROP TRIGGER IF EXISTS ensure_single_primary_domain_trigger ON public.teacher_domains;
    CREATE TRIGGER ensure_single_primary_domain_trigger
      BEFORE INSERT OR UPDATE ON public.teacher_domains
      FOR EACH ROW
      WHEN (NEW.is_primary = TRUE)
      EXECUTE FUNCTION public.ensure_single_primary_domain();
    
    RAISE NOTICE '✓ Created ensure_single_primary_domain trigger';
  ELSE
    RAISE NOTICE '✗ Skipped ensure_single_primary_domain trigger - is_primary column does not exist';
  END IF;
END $$;

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

DO $$
BEGIN
  RAISE NOTICE '✓ Created create_teacher_settings_on_insert trigger';
END $$;

-- ============================================================
-- ROW LEVEL SECURITY (Safe to apply)
-- ============================================================

-- Enable RLS on all teacher tables
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_unavailability ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '✓ Enabled RLS on all teacher tables';
END $$;

-- Basic RLS policy for teachers table (simplified)
DROP POLICY IF EXISTS "Teachers visible to same tenant users" ON public.teachers;
CREATE POLICY "Teachers visible to same tenant users" ON public.teachers
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

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

DO $$
BEGIN
  RAISE NOTICE '✓ Created basic RLS policies';
END $$;

COMMIT;

-- ============================================================
-- Final Verification
-- ============================================================
DO $$
DECLARE
  v_index_count INTEGER;
  v_trigger_count INTEGER;
  v_policy_count INTEGER;
BEGIN
  -- Count indexes
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes 
  WHERE schemaname = 'public' 
    AND tablename LIKE 'teacher%';
  
  -- Count triggers
  SELECT COUNT(*) INTO v_trigger_count
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public' 
    AND event_object_table LIKE 'teacher%';
  
  -- Count policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename LIKE 'teacher%';
  
  RAISE NOTICE '';
  RAISE NOTICE '========== SUMMARY ==========';
  RAISE NOTICE 'Indexes created: %', v_index_count;
  RAISE NOTICE 'Triggers created: %', v_trigger_count;
  RAISE NOTICE 'RLS policies created: %', v_policy_count;
  RAISE NOTICE '=============================';
END $$;