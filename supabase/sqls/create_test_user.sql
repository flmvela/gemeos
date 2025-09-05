-- Create test platform admin user directly in auth.users
-- NOTE: This is for development/testing only

-- Step 1: Create a test user in auth.users table
-- Password hash for 'test123' (bcrypt)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000'::uuid,
    'admin@test.com',
    '$2a$10$8PvhwXX1oEn/EFn8Dg5IpeOJRU0mZ3c8WjYm8w2lPMcZi0J6J3Hla', -- password: test123
    now(),
    now(),
    now(),
    '',
    '',
    '',
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"name": "Test Admin"}'::jsonb,
    false,
    'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Step 2: Get the user ID and create tenant assignment
WITH test_user AS (
    SELECT id as user_id FROM auth.users WHERE email = 'admin@test.com'
),
platform_role AS (
    SELECT id as role_id FROM public.user_roles WHERE name = 'platform_admin'
),
default_tenant AS (
    SELECT id as tenant_id FROM public.tenants LIMIT 1
)
INSERT INTO public.user_tenants (
    user_id,
    tenant_id,
    role_id,
    is_primary,
    status,
    joined_at
)
SELECT 
    test_user.user_id,
    default_tenant.tenant_id,
    platform_role.role_id,
    true,
    'active'::public.user_tenant_status,
    now()
FROM test_user, platform_role, default_tenant
ON CONFLICT (user_id, tenant_id) DO NOTHING;