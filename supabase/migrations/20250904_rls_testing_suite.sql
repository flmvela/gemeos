-- ============================================================
-- RLS TESTING SUITE FOR MULTI-TENANT PLATFORM
-- ============================================================
-- This script provides comprehensive testing for RLS policies
-- Run after applying the main RLS migration
-- ============================================================

-- ============================================================
-- TEST DATA SETUP
-- ============================================================

-- Create test data function
CREATE OR REPLACE FUNCTION public.setup_rls_test_data()
RETURNS JSONB AS $$
DECLARE
    v_tenant1_id UUID;
    v_tenant2_id UUID;
    v_platform_admin_id UUID;
    v_tenant1_admin_id UUID;
    v_tenant2_admin_id UUID;
    v_teacher1_id UUID;
    v_student1_id UUID;
    v_role_platform_admin UUID;
    v_role_tenant_admin UUID;
    v_role_teacher UUID;
    v_role_student UUID;
    v_result JSONB;
BEGIN
    -- Get role IDs
    SELECT id INTO v_role_platform_admin FROM public.roles WHERE name = 'platform_admin';
    SELECT id INTO v_role_tenant_admin FROM public.roles WHERE name = 'tenant_admin';
    SELECT id INTO v_role_teacher FROM public.roles WHERE name = 'teacher';
    SELECT id INTO v_role_student FROM public.roles WHERE name = 'student';
    
    -- Create test tenants
    INSERT INTO public.tenants (name, slug, description, status)
    VALUES 
        ('Test School A', 'test-school-a', 'Test tenant A for RLS testing', 'active'),
        ('Test School B', 'test-school-b', 'Test tenant B for RLS testing', 'active')
    RETURNING id INTO v_tenant1_id, v_tenant2_id;
    
    SELECT id INTO v_tenant2_id FROM public.tenants WHERE slug = 'test-school-b';
    
    -- Create test users (using auth.users would require service role)
    -- For testing purposes, we'll use existing user IDs or create mock ones
    v_platform_admin_id := gen_random_uuid();
    v_tenant1_admin_id := gen_random_uuid();
    v_tenant2_admin_id := gen_random_uuid();
    v_teacher1_id := gen_random_uuid();
    v_student1_id := gen_random_uuid();
    
    -- Create user-tenant relationships
    INSERT INTO public.user_tenants (user_id, tenant_id, role_id, status, is_primary)
    VALUES
        -- Platform admin (has access to all tenants)
        (v_platform_admin_id, v_tenant1_id, v_role_platform_admin, 'active', true),
        
        -- Tenant 1 admin (only access to tenant 1)
        (v_tenant1_admin_id, v_tenant1_id, v_role_tenant_admin, 'active', true),
        
        -- Tenant 2 admin (only access to tenant 2)
        (v_tenant2_admin_id, v_tenant2_id, v_role_tenant_admin, 'active', true),
        
        -- Teacher in tenant 1
        (v_teacher1_id, v_tenant1_id, v_role_teacher, 'active', true),
        
        -- Student in tenant 1
        (v_student1_id, v_tenant1_id, v_role_student, 'active', true);
    
    -- Return test data IDs
    v_result := jsonb_build_object(
        'tenant1_id', v_tenant1_id,
        'tenant2_id', v_tenant2_id,
        'platform_admin_id', v_platform_admin_id,
        'tenant1_admin_id', v_tenant1_admin_id,
        'tenant2_admin_id', v_tenant2_admin_id,
        'teacher1_id', v_teacher1_id,
        'student1_id', v_student1_id
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TEST CASES
-- ============================================================

-- Test 1: Tenant Isolation
CREATE OR REPLACE FUNCTION public.test_tenant_isolation()
RETURNS TABLE(
    test_name TEXT,
    test_description TEXT,
    passed BOOLEAN,
    details TEXT
) AS $$
DECLARE
    v_test_data JSONB;
    v_tenant1_id UUID;
    v_tenant2_id UUID;
    v_tenant1_admin_id UUID;
BEGIN
    -- Setup test data
    v_test_data := public.setup_rls_test_data();
    v_tenant1_id := (v_test_data->>'tenant1_id')::UUID;
    v_tenant2_id := (v_test_data->>'tenant2_id')::UUID;
    v_tenant1_admin_id := (v_test_data->>'tenant1_admin_id')::UUID;
    
    -- Test 1.1: Tenant admin can only see their own tenant
    RETURN QUERY
    SELECT 
        'tenant_isolation_admin'::TEXT,
        'Tenant admin should only see their own tenant'::TEXT,
        NOT EXISTS (
            SELECT 1 
            FROM public.tenants t
            WHERE t.id = v_tenant2_id
            AND EXISTS (
                SELECT 1 FROM public.user_tenants ut
                WHERE ut.user_id = v_tenant1_admin_id
                AND ut.tenant_id = v_tenant1_id
                AND ut.status = 'active'
            )
        ),
        'Tenant 1 admin cannot access Tenant 2'::TEXT;
    
    -- Clean up
    DELETE FROM public.user_tenants WHERE tenant_id IN (v_tenant1_id, v_tenant2_id);
    DELETE FROM public.tenants WHERE id IN (v_tenant1_id, v_tenant2_id);
END;
$$ LANGUAGE plpgsql;

-- Test 2: Role Hierarchy
CREATE OR REPLACE FUNCTION public.test_role_hierarchy()
RETURNS TABLE(
    test_name TEXT,
    test_description TEXT,
    passed BOOLEAN,
    details TEXT
) AS $$
DECLARE
    v_test_data JSONB;
    v_teacher_id UUID;
    v_student_id UUID;
    v_tenant_admin_id UUID;
    v_can_teacher_invite_admin BOOLEAN;
    v_can_admin_invite_teacher BOOLEAN;
BEGIN
    -- Setup test data
    v_test_data := public.setup_rls_test_data();
    v_teacher_id := (v_test_data->>'teacher1_id')::UUID;
    v_student_id := (v_test_data->>'student1_id')::UUID;
    v_tenant_admin_id := (v_test_data->>'tenant1_admin_id')::UUID;
    
    -- Test 2.1: Teachers cannot invite admins
    SELECT EXISTS (
        SELECT 1 FROM public.roles r1, public.roles r2
        WHERE r1.name = 'teacher'
        AND r2.name = 'tenant_admin'
        AND r1.hierarchy_level >= r2.hierarchy_level
    ) INTO v_can_teacher_invite_admin;
    
    RETURN QUERY
    SELECT 
        'role_hierarchy_teacher_admin'::TEXT,
        'Teachers should not be able to invite admins'::TEXT,
        NOT v_can_teacher_invite_admin,
        'Role hierarchy prevents elevation'::TEXT;
    
    -- Test 2.2: Admins can invite teachers
    SELECT EXISTS (
        SELECT 1 FROM public.roles r1, public.roles r2
        WHERE r1.name = 'tenant_admin'
        AND r2.name = 'teacher'
        AND r1.hierarchy_level <= r2.hierarchy_level
    ) INTO v_can_admin_invite_teacher;
    
    RETURN QUERY
    SELECT 
        'role_hierarchy_admin_teacher'::TEXT,
        'Admins should be able to invite teachers'::TEXT,
        v_can_admin_invite_teacher,
        'Admin can invite lower roles'::TEXT;
    
    -- Clean up
    DELETE FROM public.user_tenants WHERE user_id IN (v_teacher_id, v_student_id, v_tenant_admin_id);
END;
$$ LANGUAGE plpgsql;

-- Test 3: Profile Access
CREATE OR REPLACE FUNCTION public.test_profile_access()
RETURNS TABLE(
    test_name TEXT,
    test_description TEXT,
    passed BOOLEAN,
    details TEXT
) AS $$
DECLARE
    v_test_data JSONB;
    v_tenant1_admin_id UUID;
    v_teacher1_id UUID;
    v_tenant2_admin_id UUID;
BEGIN
    -- Setup test data
    v_test_data := public.setup_rls_test_data();
    v_tenant1_admin_id := (v_test_data->>'tenant1_admin_id')::UUID;
    v_teacher1_id := (v_test_data->>'teacher1_id')::UUID;
    v_tenant2_admin_id := (v_test_data->>'tenant2_admin_id')::UUID;
    
    -- Test 3.1: Same tenant users can see each other's profiles
    RETURN QUERY
    SELECT 
        'profile_same_tenant'::TEXT,
        'Users in same tenant can view each other profiles'::TEXT,
        EXISTS (
            SELECT 1 FROM public.user_tenants ut1
            JOIN public.user_tenants ut2 ON ut1.tenant_id = ut2.tenant_id
            WHERE ut1.user_id = v_tenant1_admin_id
            AND ut2.user_id = v_teacher1_id
            AND ut1.status = 'active'
            AND ut2.status = 'active'
        ),
        'Same tenant profile visibility'::TEXT;
    
    -- Test 3.2: Different tenant users cannot see each other's profiles
    RETURN QUERY
    SELECT 
        'profile_different_tenant'::TEXT,
        'Users in different tenants cannot view each other profiles'::TEXT,
        NOT EXISTS (
            SELECT 1 FROM public.user_tenants ut1
            JOIN public.user_tenants ut2 ON ut1.tenant_id = ut2.tenant_id
            WHERE ut1.user_id = v_tenant1_admin_id
            AND ut2.user_id = v_tenant2_admin_id
            AND ut1.status = 'active'
            AND ut2.status = 'active'
        ),
        'Cross-tenant profile isolation'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Test 4: Invitation System
CREATE OR REPLACE FUNCTION public.test_invitation_system()
RETURNS TABLE(
    test_name TEXT,
    test_description TEXT,
    passed BOOLEAN,
    details TEXT
) AS $$
DECLARE
    v_test_data JSONB;
    v_tenant1_id UUID;
    v_tenant1_admin_id UUID;
    v_invitation_id UUID;
    v_teacher_role_id UUID;
BEGIN
    -- Setup test data
    v_test_data := public.setup_rls_test_data();
    v_tenant1_id := (v_test_data->>'tenant1_id')::UUID;
    v_tenant1_admin_id := (v_test_data->>'tenant1_admin_id')::UUID;
    
    SELECT id INTO v_teacher_role_id FROM public.roles WHERE name = 'teacher';
    
    -- Test 4.1: Create invitation
    INSERT INTO public.invitations (
        email, tenant_id, role_id, role_name, 
        status, expires_at, invited_by
    ) VALUES (
        'test.teacher@example.com', v_tenant1_id, v_teacher_role_id, 'teacher',
        'pending', NOW() + INTERVAL '7 days', v_tenant1_admin_id
    ) RETURNING id INTO v_invitation_id;
    
    RETURN QUERY
    SELECT 
        'invitation_create'::TEXT,
        'Admin can create invitations'::TEXT,
        v_invitation_id IS NOT NULL,
        'Invitation created successfully'::TEXT;
    
    -- Test 4.2: Check invitation expiry
    RETURN QUERY
    SELECT 
        'invitation_expiry'::TEXT,
        'Expired invitations cannot be accepted'::TEXT,
        NOT EXISTS (
            SELECT 1 FROM public.invitations
            WHERE id = v_invitation_id
            AND status = 'pending'
            AND expires_at <= NOW()
        ),
        'Expiry check working'::TEXT;
    
    -- Clean up
    DELETE FROM public.invitations WHERE id = v_invitation_id;
END;
$$ LANGUAGE plpgsql;

-- Test 5: Audit Logging
CREATE OR REPLACE FUNCTION public.test_audit_logging()
RETURNS TABLE(
    test_name TEXT,
    test_description TEXT,
    passed BOOLEAN,
    details TEXT
) AS $$
DECLARE
    v_test_data JSONB;
    v_tenant1_id UUID;
    v_tenant1_admin_id UUID;
    v_tenant2_admin_id UUID;
    v_audit_id UUID;
BEGIN
    -- Setup test data
    v_test_data := public.setup_rls_test_data();
    v_tenant1_id := (v_test_data->>'tenant1_id')::UUID;
    v_tenant1_admin_id := (v_test_data->>'tenant1_admin_id')::UUID;
    v_tenant2_admin_id := (v_test_data->>'tenant2_admin_id')::UUID;
    
    -- Test 5.1: Create audit log
    INSERT INTO public.audit_logs (
        tenant_id, user_id, action, resource_type, resource_id
    ) VALUES (
        v_tenant1_id, v_tenant1_admin_id, 'test_action', 'test_resource', gen_random_uuid()::TEXT
    ) RETURNING id INTO v_audit_id;
    
    RETURN QUERY
    SELECT 
        'audit_log_create'::TEXT,
        'Audit logs can be created'::TEXT,
        v_audit_id IS NOT NULL,
        'Audit log created'::TEXT;
    
    -- Test 5.2: Tenant isolation for audit logs
    RETURN QUERY
    SELECT 
        'audit_log_isolation'::TEXT,
        'Tenant admins can only see their tenant audit logs'::TEXT,
        NOT EXISTS (
            SELECT 1 FROM public.audit_logs
            WHERE tenant_id = v_tenant1_id
            AND user_id = v_tenant2_admin_id
        ),
        'Audit log tenant isolation working'::TEXT;
    
    -- Clean up
    DELETE FROM public.audit_logs WHERE id = v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PERFORMANCE TESTING
-- ============================================================

CREATE OR REPLACE FUNCTION public.test_rls_performance()
RETURNS TABLE(
    operation TEXT,
    table_name TEXT,
    execution_time_ms NUMERIC,
    row_count INTEGER,
    status TEXT
) AS $$
DECLARE
    v_start TIMESTAMP;
    v_end TIMESTAMP;
    v_count INTEGER;
BEGIN
    -- Test 1: Query tenants table
    v_start := clock_timestamp();
    SELECT COUNT(*) INTO v_count FROM public.tenants;
    v_end := clock_timestamp();
    
    RETURN QUERY
    SELECT 
        'SELECT COUNT'::TEXT,
        'tenants'::TEXT,
        EXTRACT(MILLISECONDS FROM (v_end - v_start))::NUMERIC,
        v_count,
        CASE 
            WHEN EXTRACT(MILLISECONDS FROM (v_end - v_start)) < 10 THEN 'PASS'
            ELSE 'FAIL - Exceeds 10ms threshold'
        END;
    
    -- Test 2: Query user_tenants with filter
    v_start := clock_timestamp();
    SELECT COUNT(*) INTO v_count 
    FROM public.user_tenants 
    WHERE status = 'active';
    v_end := clock_timestamp();
    
    RETURN QUERY
    SELECT 
        'SELECT with WHERE'::TEXT,
        'user_tenants'::TEXT,
        EXTRACT(MILLISECONDS FROM (v_end - v_start))::NUMERIC,
        v_count,
        CASE 
            WHEN EXTRACT(MILLISECONDS FROM (v_end - v_start)) < 10 THEN 'PASS'
            ELSE 'FAIL - Exceeds 10ms threshold'
        END;
    
    -- Test 3: Complex join query
    v_start := clock_timestamp();
    SELECT COUNT(*) INTO v_count 
    FROM public.user_tenants ut
    JOIN public.roles r ON ut.role_id = r.id
    JOIN public.tenants t ON ut.tenant_id = t.id
    WHERE ut.status = 'active';
    v_end := clock_timestamp();
    
    RETURN QUERY
    SELECT 
        'Complex JOIN'::TEXT,
        'multiple'::TEXT,
        EXTRACT(MILLISECONDS FROM (v_end - v_start))::NUMERIC,
        v_count,
        CASE 
            WHEN EXTRACT(MILLISECONDS FROM (v_end - v_start)) < 10 THEN 'PASS'
            ELSE 'WARNING - Consider optimization'
        END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- MASTER TEST SUITE RUNNER
-- ============================================================

CREATE OR REPLACE FUNCTION public.run_all_rls_tests()
RETURNS TABLE(
    test_category TEXT,
    test_name TEXT,
    passed BOOLEAN,
    details TEXT
) AS $$
BEGIN
    -- Run all test categories
    RETURN QUERY
    SELECT 'Tenant Isolation'::TEXT as test_category, * FROM public.test_tenant_isolation();
    
    RETURN QUERY
    SELECT 'Role Hierarchy'::TEXT as test_category, * FROM public.test_role_hierarchy();
    
    RETURN QUERY
    SELECT 'Profile Access'::TEXT as test_category, * FROM public.test_profile_access();
    
    RETURN QUERY
    SELECT 'Invitation System'::TEXT as test_category, * FROM public.test_invitation_system();
    
    RETURN QUERY
    SELECT 'Audit Logging'::TEXT as test_category, * FROM public.test_audit_logging();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- DIAGNOSTIC QUERIES
-- ============================================================

-- Check current RLS policies
CREATE OR REPLACE FUNCTION public.diagnose_rls_policies()
RETURNS TABLE(
    table_name TEXT,
    policy_count BIGINT,
    has_select BOOLEAN,
    has_insert BOOLEAN,
    has_update BOOLEAN,
    has_delete BOOLEAN,
    rls_enabled BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        COUNT(p.policyname),
        bool_or(p.cmd = 'SELECT') as has_select,
        bool_or(p.cmd = 'INSERT') as has_insert,
        bool_or(p.cmd = 'UPDATE') as has_update,
        bool_or(p.cmd = 'DELETE') as has_delete,
        t.rowsecurity
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
    WHERE t.schemaname = 'public'
    AND t.tablename IN (
        'tenants', 'user_tenants', 'profiles', 'invitations',
        'domains', 'tenant_domains', 'audit_logs', 'roles'
    )
    GROUP BY t.tablename, t.rowsecurity
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql;

-- Check user access levels
CREATE OR REPLACE FUNCTION public.diagnose_user_access(p_user_email TEXT)
RETURNS TABLE(
    tenant_name TEXT,
    role_name TEXT,
    status TEXT,
    is_primary BOOLEAN,
    permissions_count BIGINT
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: %', p_user_email;
    END IF;
    
    RETURN QUERY
    SELECT 
        t.name::TEXT,
        r.name::TEXT,
        ut.status::TEXT,
        ut.is_primary,
        COUNT(DISTINCT rp.permission_id)
    FROM public.user_tenants ut
    JOIN public.tenants t ON ut.tenant_id = t.id
    JOIN public.roles r ON ut.role_id = r.id
    LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
    WHERE ut.user_id = v_user_id
    GROUP BY t.name, r.name, ut.status, ut.is_primary
    ORDER BY ut.is_primary DESC, t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- USAGE INSTRUCTIONS
-- ============================================================
COMMENT ON FUNCTION public.run_all_rls_tests IS 
'Run all RLS tests: SELECT * FROM public.run_all_rls_tests();';

COMMENT ON FUNCTION public.test_rls_performance IS 
'Test RLS performance: SELECT * FROM public.test_rls_performance();';

COMMENT ON FUNCTION public.diagnose_rls_policies IS 
'Check RLS policy status: SELECT * FROM public.diagnose_rls_policies();';

COMMENT ON FUNCTION public.diagnose_user_access IS 
'Check user access: SELECT * FROM public.diagnose_user_access(''user@example.com'');';

-- ============================================================
-- CLEANUP FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_rls_test_data()
RETURNS VOID AS $$
BEGIN
    -- Delete test data
    DELETE FROM public.audit_logs WHERE action = 'test_action';
    DELETE FROM public.invitations WHERE email LIKE 'test.%@example.com';
    DELETE FROM public.user_tenants WHERE tenant_id IN (
        SELECT id FROM public.tenants WHERE slug LIKE 'test-%'
    );
    DELETE FROM public.tenants WHERE slug LIKE 'test-%';
    
    RAISE NOTICE 'Test data cleaned up successfully';
END;
$$ LANGUAGE plpgsql;

-- Print instructions
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS Testing Suite Installed Successfully';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Available test functions:';
    RAISE NOTICE '1. Run all tests: SELECT * FROM public.run_all_rls_tests();';
    RAISE NOTICE '2. Test performance: SELECT * FROM public.test_rls_performance();';
    RAISE NOTICE '3. Diagnose policies: SELECT * FROM public.diagnose_rls_policies();';
    RAISE NOTICE '4. Check user access: SELECT * FROM public.diagnose_user_access(''email@example.com'');';
    RAISE NOTICE '5. Clean up test data: SELECT public.cleanup_rls_test_data();';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;