-- ============================================================
-- Teacher Management - Fix RLS Policies
-- This migration fixes RLS policies to allow tenant admins to manage teachers
-- ============================================================

BEGIN;

-- ============================================================
-- DROP EXISTING POLICIES
-- ============================================================

-- Teachers table
DROP POLICY IF EXISTS "Teachers visible to same tenant users" ON public.teachers;
DROP POLICY IF EXISTS "Teachers can view own profile" ON public.teachers;
DROP POLICY IF EXISTS "Teachers can update own profile" ON public.teachers;
DROP POLICY IF EXISTS "Tenant admins can manage teachers" ON public.teachers;

-- Teacher domains
DROP POLICY IF EXISTS "Teacher domains visible to same tenant" ON public.teacher_domains;

-- Teacher modalities
DROP POLICY IF EXISTS "Teacher modalities visible to same tenant" ON public.teacher_modalities;

-- Teacher schedules
DROP POLICY IF EXISTS "Teacher schedules visible to same tenant" ON public.teacher_schedules;

-- Teacher settings
DROP POLICY IF EXISTS "Teacher settings visible to same tenant" ON public.teacher_settings;

-- Teacher unavailability
DROP POLICY IF EXISTS "Teacher unavailability visible to same tenant" ON public.teacher_unavailability;

-- ============================================================
-- TEACHERS TABLE POLICIES
-- ============================================================

-- Allow users to view teachers in their tenant
CREATE POLICY "teachers_select_same_tenant" ON public.teachers
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Allow tenant admins and platform admins to insert teachers
CREATE POLICY "teachers_insert_admin" ON public.teachers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = teachers.tenant_id
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

-- Allow tenant admins and platform admins to update teachers
CREATE POLICY "teachers_update_admin" ON public.teachers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = teachers.tenant_id
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = teachers.tenant_id
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

-- Allow teachers to update their own profile
CREATE POLICY "teachers_update_self" ON public.teachers
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow tenant admins and platform admins to delete teachers
CREATE POLICY "teachers_delete_admin" ON public.teachers
  FOR DELETE
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

-- ============================================================
-- TEACHER_DOMAINS TABLE POLICIES
-- ============================================================

-- Allow viewing teacher domains for same tenant
CREATE POLICY "teacher_domains_select_same_tenant" ON public.teacher_domains
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

-- Allow admins to manage teacher domains
CREATE POLICY "teacher_domains_insert_admin" ON public.teacher_domains
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_domains.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

CREATE POLICY "teacher_domains_update_admin" ON public.teacher_domains
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_domains.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_domains.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

CREATE POLICY "teacher_domains_delete_admin" ON public.teacher_domains
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_domains.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

-- ============================================================
-- TEACHER_MODALITIES TABLE POLICIES
-- ============================================================

-- Allow viewing teacher modalities for same tenant
CREATE POLICY "teacher_modalities_select_same_tenant" ON public.teacher_modalities
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

-- Allow admins to manage teacher modalities
CREATE POLICY "teacher_modalities_insert_admin" ON public.teacher_modalities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_modalities.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

CREATE POLICY "teacher_modalities_update_admin" ON public.teacher_modalities
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_modalities.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_modalities.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

CREATE POLICY "teacher_modalities_delete_admin" ON public.teacher_modalities
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_modalities.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

-- ============================================================
-- TEACHER_SCHEDULES TABLE POLICIES
-- ============================================================

-- Allow viewing teacher schedules for same tenant
CREATE POLICY "teacher_schedules_select_same_tenant" ON public.teacher_schedules
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

-- Allow admins to manage teacher schedules
CREATE POLICY "teacher_schedules_insert_admin" ON public.teacher_schedules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_schedules.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

CREATE POLICY "teacher_schedules_update_admin" ON public.teacher_schedules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_schedules.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_schedules.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

CREATE POLICY "teacher_schedules_delete_admin" ON public.teacher_schedules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_schedules.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

-- ============================================================
-- TEACHER_SETTINGS TABLE POLICIES
-- ============================================================

-- Allow viewing teacher settings for same tenant
CREATE POLICY "teacher_settings_select_same_tenant" ON public.teacher_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_settings.teacher_id
        AND t.tenant_id IN (
          SELECT tenant_id FROM public.user_tenants
          WHERE user_id = auth.uid() AND status = 'active'
        )
    )
  );

-- Allow admins to manage teacher settings
CREATE POLICY "teacher_settings_insert_admin" ON public.teacher_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_settings.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

CREATE POLICY "teacher_settings_update_admin" ON public.teacher_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_settings.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_settings.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

CREATE POLICY "teacher_settings_delete_admin" ON public.teacher_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_settings.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

-- Allow teachers to update their own settings
CREATE POLICY "teacher_settings_update_self" ON public.teacher_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_settings.teacher_id
        AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_settings.teacher_id
        AND t.user_id = auth.uid()
    )
  );

-- ============================================================
-- TEACHER_UNAVAILABILITY TABLE POLICIES
-- ============================================================

-- Allow viewing teacher unavailability for same tenant
CREATE POLICY "teacher_unavailability_select_same_tenant" ON public.teacher_unavailability
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

-- Allow admins to manage teacher unavailability
CREATE POLICY "teacher_unavailability_insert_admin" ON public.teacher_unavailability
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_unavailability.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

CREATE POLICY "teacher_unavailability_update_admin" ON public.teacher_unavailability
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_unavailability.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_unavailability.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

CREATE POLICY "teacher_unavailability_delete_admin" ON public.teacher_unavailability
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON ut.tenant_id = t.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE t.id = teacher_unavailability.teacher_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

-- Allow teachers to manage their own unavailability
CREATE POLICY "teacher_unavailability_insert_self" ON public.teacher_unavailability
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_unavailability.teacher_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "teacher_unavailability_update_self" ON public.teacher_unavailability
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_unavailability.teacher_id
        AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_unavailability.teacher_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "teacher_unavailability_delete_self" ON public.teacher_unavailability
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_unavailability.teacher_id
        AND t.user_id = auth.uid()
    )
  );

COMMIT;

-- ============================================================
-- Verification
-- ============================================================
DO $$
DECLARE
  v_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename LIKE 'teacher%';
  
  RAISE NOTICE '';
  RAISE NOTICE '========== RLS POLICIES SUMMARY ==========';
  RAISE NOTICE 'Total RLS policies created: %', v_policy_count;
  RAISE NOTICE '==========================================';
END $$;