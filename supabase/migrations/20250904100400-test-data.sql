-- ============================================================
-- TEST DATA MIGRATION (OPTIONAL - FOR DEVELOPMENT)
-- ============================================================
-- This migration creates test data for development and testing
-- Comment out or delete this file for production deployments

-- Only run in development environments
DO $$
BEGIN
    -- Check if we're in a development environment (you can adjust this check)
    IF current_database() IN ('postgres', 'local', 'development', 'test') THEN
        
        -- ============================================================
        -- CREATE TEST TENANTS
        -- ============================================================
        INSERT INTO public.tenants (id, name, slug, description, subscription_tier, max_users, max_domains, status)
        VALUES
            ('11111111-1111-1111-1111-111111111111', 'Demo School District', 'demo-district', 'A demonstration school district for testing', 'premium', 100, 10, 'active'),
            ('22222222-2222-2222-2222-222222222222', 'Springfield Academy', 'springfield', 'Springfield Academy - Excellence in Education', 'basic', 50, 5, 'active'),
            ('33333333-3333-3333-3333-333333333333', 'Trial School', 'trial-school', 'A trial school testing the platform', 'free', 10, 2, 'trial')
        ON CONFLICT (id) DO NOTHING;

        -- ============================================================
        -- CREATE TEST USERS (Platform Admin)
        -- ============================================================
        -- Note: In a real scenario, users would be created through Supabase Auth
        -- This is just to demonstrate the user_tenants relationship
        
        -- First, ensure we have a platform admin user (if auth.users allows direct insert)
        -- This typically would be done through Supabase Auth signup flow
        
        -- Create user-tenant relationships for existing users
        -- Assuming you have some users in auth.users already
        
        -- Example: Assign first user as platform admin (if exists)
        INSERT INTO public.user_tenants (
            user_id,
            tenant_id,
            role_id,
            is_primary,
            status,
            joined_at
        )
        SELECT 
            u.id,
            '11111111-1111-1111-1111-111111111111',
            r.id,
            TRUE,
            'active',
            NOW()
        FROM auth.users u
        CROSS JOIN public.roles r
        WHERE r.name = 'platform_admin'
        AND u.email = 'admin@example.com' -- Replace with your admin email
        LIMIT 1
        ON CONFLICT (user_id, tenant_id) DO NOTHING;

        -- ============================================================
        -- ASSIGN DOMAINS TO TENANTS
        -- ============================================================
        
        -- Assign all domains to Demo School District
        INSERT INTO public.tenant_domains (tenant_id, domain_id, is_active, max_teachers, max_students)
        SELECT 
            '11111111-1111-1111-1111-111111111111',
            d.id,
            TRUE,
            10,
            200
        FROM public.domains d
        ON CONFLICT (tenant_id, domain_id) DO NOTHING;
        
        -- Assign Mathematics and Science to Springfield Academy
        INSERT INTO public.tenant_domains (tenant_id, domain_id, is_active, max_teachers, max_students)
        SELECT 
            '22222222-2222-2222-2222-222222222222',
            d.id,
            TRUE,
            5,
            100
        FROM public.domains d
        WHERE d.name IN ('Mathematics', 'Science')
        ON CONFLICT (tenant_id, domain_id) DO NOTHING;
        
        -- Assign only Mathematics to Trial School
        INSERT INTO public.tenant_domains (tenant_id, domain_id, is_active, max_teachers, max_students)
        SELECT 
            '33333333-3333-3333-3333-333333333333',
            d.id,
            TRUE,
            2,
            30
        FROM public.domains d
        WHERE d.name = 'Mathematics'
        ON CONFLICT (tenant_id, domain_id) DO NOTHING;

        -- ============================================================
        -- CREATE SAMPLE INVITATIONS
        -- ============================================================
        
        -- Create a pending invitation for a tenant admin
        INSERT INTO public.invitations (
            email,
            tenant_id,
            role_id,
            role_name,
            status,
            expires_at,
            invited_by
        )
        SELECT 
            'tenant.admin@springfield.edu',
            '22222222-2222-2222-2222-222222222222',
            r.id,
            'tenant_admin',
            'pending',
            NOW() + INTERVAL '7 days',
            u.id
        FROM public.roles r
        CROSS JOIN auth.users u
        WHERE r.name = 'tenant_admin'
        AND u.email = 'admin@example.com' -- Replace with your admin email
        LIMIT 1
        ON CONFLICT DO NOTHING;
        
        -- Create a pending invitation for a teacher
        INSERT INTO public.invitations (
            email,
            tenant_id,
            role_id,
            role_name,
            status,
            expires_at,
            invited_by
        )
        SELECT 
            'teacher@springfield.edu',
            '22222222-2222-2222-2222-222222222222',
            r.id,
            'teacher',
            'pending',
            NOW() + INTERVAL '7 days',
            u.id
        FROM public.roles r
        CROSS JOIN auth.users u
        WHERE r.name = 'teacher'
        AND u.email = 'admin@example.com' -- Replace with your admin email
        LIMIT 1
        ON CONFLICT DO NOTHING;

        -- ============================================================
        -- CREATE SAMPLE AUDIT LOGS
        -- ============================================================
        INSERT INTO public.audit_logs (
            tenant_id,
            user_id,
            action,
            resource_type,
            resource_id,
            changes,
            created_at
        )
        SELECT 
            '11111111-1111-1111-1111-111111111111',
            u.id,
            'CREATE',
            'tenant',
            '11111111-1111-1111-1111-111111111111',
            jsonb_build_object(
                'name', 'Demo School District',
                'subscription_tier', 'premium'
            ),
            NOW() - INTERVAL '30 days'
        FROM auth.users u
        WHERE u.email = 'admin@example.com' -- Replace with your admin email
        LIMIT 1
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Test data created successfully';
    ELSE
        RAISE NOTICE 'Skipping test data creation in production environment';
    END IF;
END $$;

-- ============================================================
-- HELPFUL DEVELOPMENT QUERIES
-- ============================================================
COMMENT ON SCHEMA public IS '
Useful queries for development:

-- View all tenants with user counts:
SELECT 
    t.name,
    t.slug,
    t.subscription_tier,
    t.status,
    COUNT(DISTINCT ut.user_id) as user_count,
    t.max_users
FROM public.tenants t
LEFT JOIN public.user_tenants ut ON t.id = ut.tenant_id AND ut.status = ''active''
GROUP BY t.id;

-- View all users and their roles:
SELECT 
    p.email,
    t.name as tenant_name,
    r.display_name as role,
    ut.status
FROM public.user_tenants ut
JOIN public.profiles p ON ut.user_id = p.id
JOIN public.tenants t ON ut.tenant_id = t.id
JOIN public.roles r ON ut.role_id = r.id
ORDER BY t.name, r.hierarchy_level;

-- View pending invitations:
SELECT 
    i.email,
    t.name as tenant_name,
    i.role_name,
    i.expires_at,
    p.email as invited_by_email
FROM public.invitations i
JOIN public.tenants t ON i.tenant_id = t.id
JOIN public.profiles p ON i.invited_by = p.id
WHERE i.status = ''pending''
AND i.expires_at > NOW();

-- View domain assignments:
SELECT 
    t.name as tenant_name,
    d.name as domain_name,
    td.max_teachers,
    td.max_students,
    td.is_active
FROM public.tenant_domains td
JOIN public.tenants t ON td.tenant_id = t.id
JOIN public.domains d ON td.domain_id = d.id
ORDER BY t.name, d.name;
';