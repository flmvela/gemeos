-- ============================================================
-- Fix RLS Policies - Remove Infinite Recursion
-- ============================================================
-- This fixes the "infinite recursion detected in policy" error
-- by simplifying the Row Level Security policies
-- ============================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "user_tenants_policy" ON public.user_tenants;
DROP POLICY IF EXISTS "tenants_policy" ON public.tenants;

-- Create simpler, non-recursive policies for user_tenants
CREATE POLICY "user_tenants_select_own" ON public.user_tenants
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_tenants_insert_admin" ON public.user_tenants
FOR INSERT TO authenticated
WITH CHECK (
  -- Allow platform admins to create user-tenant relationships
  EXISTS (
    SELECT 1 FROM public.user_tenants ut2
    JOIN public.user_roles ur ON ut2.role_id = ur.id
    WHERE ut2.user_id = auth.uid() 
    AND ur.name = 'platform_admin'
    AND ut2.status = 'active'
  )
  -- Or allow users to be added to their own tenants (for invitations)
  OR user_id = auth.uid()
);

CREATE POLICY "user_tenants_update_admin" ON public.user_tenants
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() -- Users can update their own records
  OR EXISTS (
    SELECT 1 FROM public.user_tenants ut2
    JOIN public.user_roles ur ON ut2.role_id = ur.id
    WHERE ut2.user_id = auth.uid() 
    AND ur.name IN ('platform_admin', 'tenant_admin')
    AND ut2.status = 'active'
    AND (ur.name = 'platform_admin' OR ut2.tenant_id = user_tenants.tenant_id)
  )
);

-- Simplified tenant policies
CREATE POLICY "tenants_select_simple" ON public.tenants
FOR SELECT TO authenticated
USING (
  -- Always allow reading tenants for now - we'll control access at app level
  true
);

CREATE POLICY "tenants_modify_admin" ON public.tenants
FOR ALL TO authenticated
USING (
  -- Only platform admins can modify tenants
  EXISTS (
    SELECT 1 FROM public.user_tenants ut
    JOIN public.user_roles ur ON ut.role_id = ur.id
    WHERE ut.user_id = auth.uid() 
    AND ur.name = 'platform_admin'
    AND ut.status = 'active'
  )
);

-- Make sure user_roles is readable by all authenticated users (no recursion)
DROP POLICY IF EXISTS "user_roles_policy" ON public.user_roles;
CREATE POLICY "user_roles_select_all" ON public.user_roles
FOR SELECT TO authenticated
USING (true);

-- Also make permissions readable
DROP POLICY IF EXISTS "permissions_policy" ON public.permissions;
CREATE POLICY "permissions_select_all" ON public.permissions
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "role_permissions_policy" ON public.role_permissions;
CREATE POLICY "role_permissions_select_all" ON public.role_permissions
FOR SELECT TO authenticated
USING (true);

-- Simplified audit log policy
DROP POLICY IF EXISTS "audit_logs_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_own_tenant" ON public.audit_logs
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR tenant_id IN (
    SELECT ut.tenant_id FROM public.user_tenants ut
    JOIN public.user_roles ur ON ut.role_id = ur.id
    WHERE ut.user_id = auth.uid() 
    AND ur.name IN ('platform_admin', 'tenant_admin')
    AND ut.status = 'active'
  )
);