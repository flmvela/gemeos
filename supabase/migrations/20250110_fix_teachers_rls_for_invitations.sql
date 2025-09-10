-- Fix RLS policies for teachers table to allow inserts during invitation acceptance

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Teachers can be created by tenant admins" ON public.teachers;
DROP POLICY IF EXISTS "Insert teachers with valid invitation" ON public.teachers;

-- Create a new insert policy that allows:
-- 1. Tenant admins to create teachers
-- 2. Users accepting a valid teacher invitation to create their own teacher profile
CREATE POLICY "Insert teachers with valid invitation or by admin"
ON public.teachers
FOR INSERT
WITH CHECK (
    -- Allow tenant admins to create teachers
    EXISTS (
        SELECT 1 FROM public.user_tenants ut
        JOIN public.user_roles ur ON ut.role_id = ur.id
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = teachers.tenant_id
        AND ut.status = 'active'
        AND ur.name IN ('tenant_admin', 'platform_admin')
    )
    OR
    -- Allow users to create their own teacher profile when accepting an invitation
    (
        auth.uid() = teachers.user_id
        AND EXISTS (
            SELECT 1 FROM public.invitations i
            WHERE i.email = auth.jwt()->>'email'
            AND i.tenant_id = teachers.tenant_id
            AND i.role_name = 'teacher'
            AND i.status IN ('pending', 'accepted') -- Allow both pending (during acceptance) and accepted
        )
    )
);

-- Also ensure user_tenants can be inserted during invitation acceptance
DROP POLICY IF EXISTS "Insert user_tenants for invitation acceptance" ON public.user_tenants;

CREATE POLICY "Insert user_tenants for invitation acceptance"
ON public.user_tenants
FOR INSERT
WITH CHECK (
    -- Allow platform admins
    auth.jwt()->>'role' = 'platform_admin'
    OR
    -- Allow tenant admins to add users to their tenant
    EXISTS (
        SELECT 1 FROM public.user_tenants existing_ut
        JOIN public.user_roles ur ON existing_ut.role_id = ur.id
        WHERE existing_ut.user_id = auth.uid()
        AND existing_ut.tenant_id = user_tenants.tenant_id
        AND existing_ut.status = 'active'
        AND ur.name IN ('tenant_admin', 'platform_admin')
    )
    OR
    -- Allow users to add themselves when they have a valid invitation
    (
        auth.uid() = user_tenants.user_id
        AND EXISTS (
            SELECT 1 FROM public.invitations i
            WHERE i.email = user_tenants.email
            AND i.tenant_id = user_tenants.tenant_id
            AND i.status IN ('pending', 'accepted')
        )
    )
);

-- Ensure teacher_domains can be inserted
DROP POLICY IF EXISTS "Insert teacher_domains with valid teacher" ON public.teacher_domains;

CREATE POLICY "Insert teacher_domains with valid teacher"
ON public.teacher_domains
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.teachers t
        WHERE t.id = teacher_domains.teacher_id
        AND (
            -- Teacher owns this record
            t.user_id = auth.uid()
            OR
            -- Or user is a tenant admin for this teacher's tenant
            EXISTS (
                SELECT 1 FROM public.user_tenants ut
                JOIN public.user_roles ur ON ut.role_id = ur.id
                WHERE ut.user_id = auth.uid()
                AND ut.tenant_id = t.tenant_id
                AND ut.status = 'active'
                AND ur.name IN ('tenant_admin', 'platform_admin')
            )
        )
    )
);

-- Ensure teacher_schedules can be inserted
DROP POLICY IF EXISTS "Insert teacher_schedules with valid teacher" ON public.teacher_schedules;

CREATE POLICY "Insert teacher_schedules with valid teacher"
ON public.teacher_schedules
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.teachers t
        WHERE t.id = teacher_schedules.teacher_id
        AND (
            -- Teacher owns this record
            t.user_id = auth.uid()
            OR
            -- Or user is a tenant admin for this teacher's tenant
            EXISTS (
                SELECT 1 FROM public.user_tenants ut
                JOIN public.user_roles ur ON ut.role_id = ur.id
                WHERE ut.user_id = auth.uid()
                AND ut.tenant_id = t.tenant_id
                AND ut.status = 'active'
                AND ur.name IN ('tenant_admin', 'platform_admin')
            )
        )
    )
);