-- ============================================================
-- Improve User Role System for Better Usability
-- ============================================================
-- Add role_name column and create views for easier querying
-- ============================================================

-- Add role_name column to user_tenants for easier identification
ALTER TABLE public.user_tenants 
ADD COLUMN role_name TEXT;

-- Update existing records with role names
UPDATE public.user_tenants 
SET role_name = ur.name
FROM public.user_roles ur
WHERE public.user_tenants.role_id = ur.id;

-- Create a constraint to keep role_name in sync
ALTER TABLE public.user_tenants 
ADD CONSTRAINT fk_role_name_consistency 
CHECK (
  role_name IN ('platform_admin', 'tenant_admin', 'teacher', 'student')
);

-- Create an index on role_name for fast queries
CREATE INDEX idx_user_tenants_role_name ON public.user_tenants(role_name);

-- Create a trigger to automatically set role_name when role_id changes
CREATE OR REPLACE FUNCTION public.sync_role_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Set role_name based on role_id
    SELECT name INTO NEW.role_name 
    FROM public.user_roles 
    WHERE id = NEW.role_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_sync_role_name_insert ON public.user_tenants;
CREATE TRIGGER trigger_sync_role_name_insert
    BEFORE INSERT ON public.user_tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_role_name();

DROP TRIGGER IF EXISTS trigger_sync_role_name_update ON public.user_tenants;
CREATE TRIGGER trigger_sync_role_name_update
    BEFORE UPDATE OF role_id ON public.user_tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_role_name();

-- ============================================================
-- Create Convenient Views
-- ============================================================

-- View: All users with their roles (easier to read)
CREATE OR REPLACE VIEW public.users_with_roles AS
SELECT 
    au.id as user_id,
    au.email,
    au.created_at as user_created_at,
    ut.tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug,
    ut.role_name,
    ur.display_name as role_display_name,
    ur.hierarchy_level,
    ut.is_primary,
    ut.status,
    ut.joined_at
FROM auth.users au
JOIN public.user_tenants ut ON au.id = ut.user_id
JOIN public.tenants t ON ut.tenant_id = t.id
JOIN public.user_roles ur ON ut.role_id = ur.id
ORDER BY au.email, ur.hierarchy_level;

-- View: Platform Admins (for quick access)
CREATE OR REPLACE VIEW public.platform_admins AS
SELECT 
    au.id as user_id,
    au.email,
    t.name as tenant_name,
    ut.status,
    ut.joined_at
FROM auth.users au
JOIN public.user_tenants ut ON au.id = ut.user_id
JOIN public.tenants t ON ut.tenant_id = t.id
WHERE ut.role_name = 'platform_admin'
AND ut.status = 'active';

-- View: Tenant Admins by tenant
CREATE OR REPLACE VIEW public.tenant_admins AS
SELECT 
    au.id as user_id,
    au.email,
    ut.tenant_id,
    t.name as tenant_name,
    ut.status,
    ut.joined_at
FROM auth.users au
JOIN public.user_tenants ut ON au.id = ut.user_id
JOIN public.tenants t ON ut.tenant_id = t.id
WHERE ut.role_name = 'tenant_admin'
AND ut.status = 'active';

-- View: Teachers by tenant
CREATE OR REPLACE VIEW public.teachers AS
SELECT 
    au.id as user_id,
    au.email,
    ut.tenant_id,
    t.name as tenant_name,
    ut.status,
    ut.joined_at
FROM auth.users au
JOIN public.user_tenants ut ON au.id = ut.user_id
JOIN public.tenants t ON ut.tenant_id = t.id
WHERE ut.role_name = 'teacher'
AND ut.status = 'active';

-- ============================================================
-- Create Helper Functions for Easy Role Checking
-- ============================================================

-- Function: Is user a platform admin?
CREATE OR REPLACE FUNCTION public.is_platform_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM public.user_tenants
        WHERE user_id = p_user_id 
        AND role_name = 'platform_admin'
        AND status = 'active'
    );
END;
$$;

-- Function: Is user a tenant admin for specific tenant?
CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_user_id UUID, p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM public.user_tenants
        WHERE user_id = p_user_id 
        AND tenant_id = p_tenant_id
        AND role_name = 'tenant_admin'
        AND status = 'active'
    );
END;
$$;

-- Function: Get user's role in a tenant (simplified)
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID, p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN (
        SELECT role_name
        FROM public.user_tenants
        WHERE user_id = p_user_id 
        AND tenant_id = p_tenant_id
        AND status = 'active'
        LIMIT 1
    );
END;
$$;

-- Grant permissions
GRANT SELECT ON public.users_with_roles TO authenticated;
GRANT SELECT ON public.platform_admins TO authenticated;
GRANT SELECT ON public.tenant_admins TO authenticated;
GRANT SELECT ON public.teachers TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID, UUID) TO authenticated;