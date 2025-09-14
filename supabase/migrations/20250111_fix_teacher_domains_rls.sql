-- Fix RLS policies for teacher_domains table
-- This ensures tenant admins can properly manage teacher domain assignments

BEGIN;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Teacher domains visible to same tenant" ON public.teacher_domains;
DROP POLICY IF EXISTS "Teachers can manage own domains" ON public.teacher_domains;
DROP POLICY IF EXISTS "Tenant admins can manage teacher domains" ON public.teacher_domains;

-- Create new comprehensive policies

-- Policy for SELECT: Allow tenant admins and platform admins to view all teacher domains in their tenant
CREATE POLICY "Teacher domains visible to authorized users" ON public.teacher_domains
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_tenants ut ON t.tenant_id = ut.tenant_id
      WHERE t.id = teacher_domains.teacher_id
        AND ut.user_id = auth.uid()
        AND ut.status = 'active'
    )
  );

-- Policy for INSERT: Allow tenant admins and platform admins to add domains to teachers
CREATE POLICY "Admins can add teacher domains" ON public.teacher_domains
  FOR INSERT
  WITH CHECK (
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

-- Policy for UPDATE: Allow tenant admins and platform admins to update teacher domains
CREATE POLICY "Admins can update teacher domains" ON public.teacher_domains
  FOR UPDATE
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
  )
  WITH CHECK (
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

-- Policy for DELETE: Allow tenant admins and platform admins to remove teacher domains
CREATE POLICY "Admins can delete teacher domains" ON public.teacher_domains
  FOR DELETE
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

-- Also allow teachers to view their own domains
CREATE POLICY "Teachers can view own domains" ON public.teacher_domains
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_domains.teacher_id
        AND t.user_id = auth.uid()
    )
  );

COMMIT;