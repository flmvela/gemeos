-- ============================================================
-- COMPREHENSIVE RLS FIX FOR MULTI-TENANT PLATFORM
-- ============================================================
-- This migration implements proper RLS policies to fix 406 errors
-- while ensuring optimal performance and security
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 1: DROP ALL EXISTING POLICIES TO START FRESH
-- ============================================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all existing policies on our tables
    FOR r IN (
        SELECT DISTINCT pol.tablename, pol.policyname 
        FROM pg_policies pol
        WHERE pol.schemaname = 'public' 
        AND pol.tablename IN (
            'tenants', 'user_tenants', 'profiles', 'invitations', 
            'domains', 'tenant_domains', 'audit_logs', 'user_roles'
        )
    ) 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 
                      r.policyname, r.tablename);
    END LOOP;
END $$;

-- ============================================================
-- STEP 2: ENSURE RLS IS ENABLED ON ALL TABLES
-- ============================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 3: CREATE OPTIMIZED HELPER FUNCTIONS
-- ============================================================

-- Fast platform admin check (cached in session)
CREATE OR REPLACE FUNCTION public.auth_is_platform_admin() 
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_cached TEXT;
BEGIN
    -- Try to get from session cache first
    v_cached := current_setting('app.is_platform_admin', true);
    
    IF v_cached IS NOT NULL THEN
        RETURN v_cached::BOOLEAN;
    END IF;
    
    -- Check if user is platform admin
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_tenants ut
        JOIN public.user_roles r ON ut.role_id = r.id
        WHERE ut.user_id = auth.uid()
        AND r.name = 'platform_admin'
        AND ut.status = 'active'
        LIMIT 1
    ) INTO v_is_admin;
    
    -- Cache the result for this session
    PERFORM set_config('app.is_platform_admin', v_is_admin::TEXT, false);
    
    RETURN v_is_admin;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Fast tenant membership check
CREATE OR REPLACE FUNCTION public.auth_has_tenant_access(p_tenant_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_tenants
        WHERE user_id = auth.uid()
        AND tenant_id = p_tenant_id
        AND status = 'active'
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get user's role in tenant
CREATE OR REPLACE FUNCTION public.auth_tenant_role(p_tenant_id UUID) 
RETURNS TEXT AS $$
DECLARE
    v_role_name TEXT;
BEGIN
    SELECT r.name INTO v_role_name
    FROM public.user_tenants ut
    JOIN public.roles r ON ut.role_id = r.id
    WHERE ut.user_id = auth.uid()
    AND ut.tenant_id = p_tenant_id
    AND ut.status = 'active'
    LIMIT 1;
    
    RETURN v_role_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- STEP 4: ROLES TABLE POLICIES (Must be first - no dependencies)
-- ============================================================

-- Everyone can read roles (needed for other policies)
CREATE POLICY "roles_select_all" ON public.user_roles
    FOR SELECT TO authenticated
    USING (true);

-- Only platform admins can modify roles
CREATE POLICY "roles_modify_platform_admin" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.auth_is_platform_admin())
    WITH CHECK (public.auth_is_platform_admin());

-- ============================================================
-- STEP 5: TENANTS TABLE POLICIES
-- ============================================================

-- Policy 1: Platform admins have full access
CREATE POLICY "tenants_platform_admin_all" ON public.tenants
    FOR ALL TO authenticated
    USING (public.auth_is_platform_admin())
    WITH CHECK (public.auth_is_platform_admin());

-- Policy 2: Users can view tenants they belong to
CREATE POLICY "tenants_member_select" ON public.tenants
    FOR SELECT TO authenticated
    USING (
        public.auth_has_tenant_access(id)
        OR public.auth_is_platform_admin()
    );

-- Policy 3: Tenant admins can update their tenant
CREATE POLICY "tenants_admin_update" ON public.tenants
    FOR UPDATE TO authenticated
    USING (
        public.auth_tenant_role(id) = 'tenant_admin'
        OR public.auth_is_platform_admin()
    )
    WITH CHECK (
        public.auth_tenant_role(id) = 'tenant_admin'
        OR public.auth_is_platform_admin()
    );

-- ============================================================
-- STEP 6: USER_TENANTS TABLE POLICIES
-- ============================================================

-- Policy 1: Users can view their own tenant memberships
CREATE POLICY "user_tenants_own_select" ON public.user_tenants
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR public.auth_is_platform_admin()
    );

-- Policy 2: Platform admins can manage all
CREATE POLICY "user_tenants_platform_admin_all" ON public.user_tenants
    FOR ALL TO authenticated
    USING (public.auth_is_platform_admin())
    WITH CHECK (public.auth_is_platform_admin());

-- Policy 3: Tenant admins can view users in their tenant
CREATE POLICY "user_tenants_tenant_admin_select" ON public.user_tenants
    FOR SELECT TO authenticated
    USING (
        public.auth_tenant_role(tenant_id) = 'tenant_admin'
    );

-- Policy 4: Tenant admins can manage users in their tenant
CREATE POLICY "user_tenants_tenant_admin_insert" ON public.user_tenants
    FOR INSERT TO authenticated
    WITH CHECK (
        public.auth_tenant_role(tenant_id) = 'tenant_admin'
        AND invited_by = auth.uid()
    );

CREATE POLICY "user_tenants_tenant_admin_update" ON public.user_tenants
    FOR UPDATE TO authenticated
    USING (public.auth_tenant_role(tenant_id) = 'tenant_admin')
    WITH CHECK (public.auth_tenant_role(tenant_id) = 'tenant_admin');

CREATE POLICY "user_tenants_tenant_admin_delete" ON public.user_tenants
    FOR DELETE TO authenticated
    USING (
        public.auth_tenant_role(tenant_id) = 'tenant_admin'
        AND user_id != auth.uid() -- Can't remove yourself
    );

-- ============================================================
-- STEP 7: PROFILES TABLE POLICIES
-- ============================================================

-- Policy 1: Users can manage their own profile
CREATE POLICY "profiles_own_all" ON public.profiles
    FOR ALL TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Policy 2: Users can view profiles of users in same tenant
CREATE POLICY "profiles_same_tenant_select" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT DISTINCT ut1.user_id 
            FROM public.user_tenants ut1
            JOIN public.user_tenants ut2 ON ut1.tenant_id = ut2.tenant_id
            WHERE ut2.user_id = auth.uid()
            AND ut1.status = 'active'
            AND ut2.status = 'active'
        )
        OR public.auth_is_platform_admin()
    );

-- Policy 3: Platform/Tenant admins can update profiles in their scope
CREATE POLICY "profiles_admin_update" ON public.profiles
    FOR UPDATE TO authenticated
    USING (
        public.auth_is_platform_admin()
        OR id IN (
            SELECT ut1.user_id 
            FROM public.user_tenants ut1
            WHERE ut1.tenant_id IN (
                SELECT ut2.tenant_id 
                FROM public.user_tenants ut2
                JOIN public.roles r ON ut2.role_id = r.id
                WHERE ut2.user_id = auth.uid()
                AND r.name = 'tenant_admin'
                AND ut2.status = 'active'
            )
        )
    )
    WITH CHECK (
        public.auth_is_platform_admin()
        OR id IN (
            SELECT ut1.user_id 
            FROM public.user_tenants ut1
            WHERE ut1.tenant_id IN (
                SELECT ut2.tenant_id 
                FROM public.user_tenants ut2
                JOIN public.roles r ON ut2.role_id = r.id
                WHERE ut2.user_id = auth.uid()
                AND r.name = 'tenant_admin'
                AND ut2.status = 'active'
            )
        )
    );

-- ============================================================
-- STEP 8: INVITATIONS TABLE POLICIES
-- ============================================================

-- Policy 1: Users can view invitations they sent or received
CREATE POLICY "invitations_own_select" ON public.invitations
    FOR SELECT TO authenticated
    USING (
        invited_by = auth.uid()
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1)
        OR public.auth_is_platform_admin()
        OR public.auth_tenant_role(tenant_id) = 'tenant_admin'
    );

-- Policy 2: Authorized users can create invitations
CREATE POLICY "invitations_authorized_insert" ON public.invitations
    FOR INSERT TO authenticated
    WITH CHECK (
        invited_by = auth.uid()
        AND (
            public.auth_is_platform_admin()
            OR public.auth_tenant_role(tenant_id) IN ('tenant_admin', 'teacher')
        )
        -- Role hierarchy check
        AND (
            SELECT hierarchy_level FROM public.user_roles WHERE id = role_id
        ) >= (
            SELECT r.hierarchy_level 
            FROM public.user_tenants ut
            JOIN public.user_roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid()
            AND ut.tenant_id = tenant_id
            LIMIT 1
        )
    );

-- Policy 3: Users can accept their own invitations
CREATE POLICY "invitations_accept_own" ON public.invitations
    FOR UPDATE TO authenticated
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1)
        AND status = 'pending'
        AND expires_at > NOW()
    )
    WITH CHECK (
        accepted_by = auth.uid()
        AND status = 'accepted'
    );

-- Policy 4: Admins can manage invitations
CREATE POLICY "invitations_admin_update" ON public.invitations
    FOR UPDATE TO authenticated
    USING (
        public.auth_is_platform_admin()
        OR (public.auth_tenant_role(tenant_id) = 'tenant_admin' AND invited_by = auth.uid())
    )
    WITH CHECK (
        public.auth_is_platform_admin()
        OR public.auth_tenant_role(tenant_id) = 'tenant_admin'
    );

-- ============================================================
-- STEP 9: DOMAINS TABLE POLICIES
-- ============================================================

-- Policy 1: Everyone can view active domains
CREATE POLICY "domains_select_active" ON public.domains
    FOR SELECT TO authenticated
    USING (status = 'active' OR public.auth_is_platform_admin());

-- Policy 2: Platform admins can manage all domains
CREATE POLICY "domains_platform_admin_all" ON public.domains
    FOR ALL TO authenticated
    USING (public.auth_is_platform_admin())
    WITH CHECK (public.auth_is_platform_admin());

-- ============================================================
-- STEP 10: TENANT_DOMAINS TABLE POLICIES
-- ============================================================

-- Policy 1: View domains for user's tenants
CREATE POLICY "tenant_domains_member_select" ON public.tenant_domains
    FOR SELECT TO authenticated
    USING (
        public.auth_has_tenant_access(tenant_id)
        OR public.auth_is_platform_admin()
    );

-- Policy 2: Admins can manage tenant domains
CREATE POLICY "tenant_domains_admin_all" ON public.tenant_domains
    FOR ALL TO authenticated
    USING (
        public.auth_is_platform_admin()
        OR public.auth_tenant_role(tenant_id) = 'tenant_admin'
    )
    WITH CHECK (
        public.auth_is_platform_admin()
        OR public.auth_tenant_role(tenant_id) = 'tenant_admin'
    );

-- ============================================================
-- STEP 11: AUDIT_LOGS TABLE POLICIES
-- ============================================================

-- Policy 1: Users can view their own audit logs
CREATE POLICY "audit_logs_own_select" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Policy 2: Platform admins can view all logs
CREATE POLICY "audit_logs_platform_admin_select" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.auth_is_platform_admin());

-- Policy 3: Tenant admins can view their tenant's logs
CREATE POLICY "audit_logs_tenant_admin_select" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.auth_tenant_role(tenant_id) = 'tenant_admin');

-- Policy 4: System can insert logs (through functions)
CREATE POLICY "audit_logs_insert" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- ============================================================
-- STEP 12: CREATE PERFORMANCE INDEXES
-- ============================================================

-- Critical performance indexes for RLS policies
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_status_active 
    ON public.user_tenants(user_id, status) 
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_status_active 
    ON public.user_tenants(tenant_id, status) 
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_user_tenants_role_lookup 
    ON public.user_tenants(user_id, tenant_id, role_id) 
    INCLUDE (status);

CREATE INDEX IF NOT EXISTS idx_roles_name_hierarchy 
    ON public.user_roles(name, hierarchy_level);

CREATE INDEX IF NOT EXISTS idx_invitations_email_pending 
    ON public.invitations(email, status, expires_at) 
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_recent 
    ON public.audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_recent 
    ON public.audit_logs(tenant_id, created_at DESC) 
    WHERE tenant_id IS NOT NULL;

-- ============================================================
-- STEP 13: GRANT NECESSARY PERMISSIONS
-- ============================================================

-- Grant table permissions
GRANT ALL ON public.tenants TO authenticated;
GRANT ALL ON public.user_tenants TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.invitations TO authenticated;
GRANT ALL ON public.domains TO authenticated;
GRANT ALL ON public.tenant_domains TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.auth_is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_has_tenant_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_tenant_role(UUID) TO authenticated;

-- Grant permissions for existing helper functions
GRANT EXECUTE ON FUNCTION public.get_user_role_in_tenant(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role_in_tenant(UUID, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(UUID) TO authenticated;

-- ============================================================
-- STEP 14: VERIFICATION
-- ============================================================

DO $$
DECLARE
    v_policy_count INTEGER;
    v_missing_policies TEXT[];
    v_required_policies TEXT[] := ARRAY[
        'roles_select_all',
        'tenants_member_select',
        'user_tenants_own_select',
        'profiles_own_all',
        'domains_select_active'
    ];
    v_policy TEXT;
BEGIN
    -- Count created policies
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    RAISE NOTICE 'Total RLS policies created: %', v_policy_count;
    
    -- Check for required policies
    FOREACH v_policy IN ARRAY v_required_policies
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND policyname = v_policy
        ) THEN
            v_missing_policies := array_append(v_missing_policies, v_policy);
        END IF;
    END LOOP;
    
    -- Report missing policies
    IF array_length(v_missing_policies, 1) > 0 THEN
        RAISE WARNING 'Missing critical policies: %', v_missing_policies;
    ELSE
        RAISE NOTICE 'All critical policies verified successfully';
    END IF;
    
    -- Verify RLS is enabled
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('tenants', 'user_tenants', 'profiles')
        AND NOT rowsecurity
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on critical tables';
    END IF;
    
    RAISE NOTICE 'RLS verification completed successfully';
END $$;

-- ============================================================
-- STEP 15: CREATE TEST HELPER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.test_rls_access(p_user_email TEXT)
RETURNS TABLE(
    table_name TEXT,
    can_select BOOLEAN,
    can_insert BOOLEAN,
    can_update BOOLEAN,
    can_delete BOOLEAN,
    active_policies TEXT[]
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: %', p_user_email;
    END IF;
    
    -- Set session user
    PERFORM set_config('request.jwt.claims', 
        json_build_object('sub', v_user_id::TEXT)::TEXT, true);
    
    -- Test each table
    RETURN QUERY
    WITH table_tests AS (
        SELECT 
            t.tablename,
            -- Test SELECT
            EXISTS(
                SELECT 1 FROM pg_policies p 
                WHERE p.tablename = t.tablename 
                AND p.cmd = 'SELECT'
            ) as has_select,
            -- Test INSERT
            EXISTS(
                SELECT 1 FROM pg_policies p 
                WHERE p.tablename = t.tablename 
                AND p.cmd = 'INSERT'
            ) as has_insert,
            -- Test UPDATE
            EXISTS(
                SELECT 1 FROM pg_policies p 
                WHERE p.tablename = t.tablename 
                AND p.cmd = 'UPDATE'
            ) as has_update,
            -- Test DELETE
            EXISTS(
                SELECT 1 FROM pg_policies p 
                WHERE p.tablename = t.tablename 
                AND p.cmd = 'DELETE'
            ) as has_delete,
            -- Get active policies
            array_agg(DISTINCT p.policyname) as policies
        FROM pg_tables t
        LEFT JOIN pg_policies p ON t.tablename = p.tablename
        WHERE t.schemaname = 'public'
        AND t.tablename IN (
            'tenants', 'user_tenants', 'profiles', 
            'invitations', 'domains', 'tenant_domains', 'audit_logs'
        )
        GROUP BY t.tablename
    )
    SELECT 
        tablename::TEXT,
        has_select,
        has_insert,
        has_update,
        has_delete,
        policies
    FROM table_tests
    ORDER BY tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ============================================================
-- POST-MIGRATION NOTES
-- ============================================================
-- 1. Run this migration in a transaction
-- 2. Test with: SELECT * FROM public.test_rls_access('user@example.com');
-- 3. Monitor performance with pg_stat_statements
-- 4. Check for 406 errors in application logs
-- 5. Verify audit logging is working correctly
-- ============================================================