-- ============================================================
-- Add User-Tenant Association for flm.velardi+ta1010@gmail.com
-- This migration adds the test user to user_tenants table
-- ============================================================

BEGIN;

-- 1. First, ensure we have the necessary tenant and role data
-- Check if we have a default tenant, if not create one
INSERT INTO public.tenants (id, name, slug, status)
VALUES (
  gen_random_uuid(),
  'Default Tenant',
  'default-tenant',
  'active'
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Ensure we have the tenant_admin role
INSERT INTO public.user_roles (id, name, display_name, description)
VALUES (
  gen_random_uuid(),
  'tenant_admin',
  'Tenant Administrator',
  'Administrator for a specific tenant'
)
ON CONFLICT (name) DO NOTHING;

-- 3. Add the user to user_tenants table
-- This requires finding the user's ID from auth.users
DO $$
DECLARE
  v_user_id uuid;
  v_tenant_id uuid;
  v_role_id uuid;
  v_user_email text := 'flm.velardi+ta1010@gmail.com';
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_user_email;
  
  -- If user doesn't exist yet, skip this migration
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User % not found in auth.users. User needs to sign up first.', v_user_email;
    RETURN;
  END IF;
  
  -- Get the default tenant ID
  SELECT id INTO v_tenant_id
  FROM public.tenants
  WHERE slug = 'default-tenant'
  LIMIT 1;
  
  -- Get the tenant_admin role ID
  SELECT id INTO v_role_id
  FROM public.user_roles
  WHERE name = 'tenant_admin'
  LIMIT 1;
  
  -- Insert the user-tenant association
  INSERT INTO public.user_tenants (
    user_id,
    tenant_id,
    role_id,
    email,
    status,
    is_primary,
    joined_at
  )
  VALUES (
    v_user_id,
    v_tenant_id,
    v_role_id,
    v_user_email,
    'active',
    true,
    NOW()
  )
  ON CONFLICT (user_id, tenant_id) 
  DO UPDATE SET
    role_id = EXCLUDED.role_id,
    email = EXCLUDED.email,
    status = EXCLUDED.status,
    is_primary = EXCLUDED.is_primary;
  
  RAISE NOTICE 'Successfully added % to tenant as tenant_admin', v_user_email;
END $$;

-- 4. Also ensure admin@gemeos.ai has proper platform admin setup
DO $$
DECLARE
  v_admin_id uuid;
  v_tenant_id uuid;
  v_admin_role_id uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = 'admin@gemeos.ai';
  
  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'Admin user admin@gemeos.ai not found.';
    RETURN;
  END IF;
  
  -- Ensure platform_admin role exists
  INSERT INTO public.user_roles (id, name, display_name, description)
  VALUES (
    gen_random_uuid(),
    'platform_admin',
    'Platform Administrator',
    'Full system administrator with access to all tenants'
  )
  ON CONFLICT (name) DO NOTHING;
  
  -- Get the platform_admin role ID
  SELECT id INTO v_admin_role_id
  FROM public.user_roles
  WHERE name = 'platform_admin'
  LIMIT 1;
  
  -- Get the default tenant ID
  SELECT id INTO v_tenant_id
  FROM public.tenants
  WHERE slug = 'default-tenant'
  LIMIT 1;
  
  -- Add admin to user_tenants with platform_admin role
  INSERT INTO public.user_tenants (
    user_id,
    tenant_id,
    role_id,
    email,
    status,
    is_primary,
    joined_at
  )
  VALUES (
    v_admin_id,
    v_tenant_id,
    v_admin_role_id,
    'admin@gemeos.ai',
    'active',
    true,
    NOW()
  )
  ON CONFLICT (user_id, tenant_id) 
  DO UPDATE SET
    role_id = EXCLUDED.role_id,
    email = EXCLUDED.email,
    status = EXCLUDED.status;
  
  RAISE NOTICE 'Successfully set up admin@gemeos.ai as platform_admin';
END $$;

COMMIT;

-- Verification queries (run these separately to check):
/*
-- Check user_tenants entries
SELECT 
  ut.email,
  ut.status,
  ut.is_primary,
  t.name as tenant_name,
  r.display_name as role_name
FROM public.user_tenants ut
JOIN public.tenants t ON ut.tenant_id = t.id
JOIN public.user_roles r ON ut.role_id = r.id
WHERE ut.email IN ('flm.velardi+ta1010@gmail.com', 'admin@gemeos.ai');

-- Check available roles
SELECT name, display_name FROM public.user_roles;

-- Check tenants
SELECT name, slug, status FROM public.tenants;
*/