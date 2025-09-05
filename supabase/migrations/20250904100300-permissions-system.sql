-- ============================================================
-- PERMISSIONS AND RBAC SYSTEM
-- ============================================================
-- This migration creates the permissions system for fine-grained access control

-- ============================================================
-- PERMISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(resource, action)
);

-- Create indexes for permissions
CREATE INDEX idx_permissions_resource ON public.permissions(resource);
CREATE INDEX idx_permissions_action ON public.permissions(action);

-- ============================================================
-- ROLE_PERMISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- NULL for global permissions
    conditions JSONB DEFAULT '{}', -- Additional conditions for the permission
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(role_id, permission_id, tenant_id)
);

-- Create indexes for role_permissions
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX idx_role_permissions_tenant_id ON public.role_permissions(tenant_id);

-- ============================================================
-- INSERT DEFAULT PERMISSIONS
-- ============================================================
INSERT INTO public.permissions (resource, action, description) VALUES
    -- User management permissions
    ('users', 'create', 'Create new users'),
    ('users', 'read', 'View user information'),
    ('users', 'update', 'Update user information'),
    ('users', 'delete', 'Delete users'),
    ('users', 'invite', 'Send user invitations'),
    
    -- Domain management permissions
    ('domains', 'create', 'Create new domains'),
    ('domains', 'read', 'View domain information'),
    ('domains', 'update', 'Update domain information'),
    ('domains', 'delete', 'Delete domains'),
    ('domains', 'assign', 'Assign domains to tenants'),
    
    -- Concept management permissions
    ('concepts', 'create', 'Create new concepts'),
    ('concepts', 'read', 'View concept information'),
    ('concepts', 'update', 'Update concept information'),
    ('concepts', 'delete', 'Delete concepts'),
    ('concepts', 'publish', 'Publish concepts'),
    
    -- Learning goals permissions
    ('learning_goals', 'create', 'Create learning goals'),
    ('learning_goals', 'read', 'View learning goals'),
    ('learning_goals', 'update', 'Update learning goals'),
    ('learning_goals', 'delete', 'Delete learning goals'),
    ('learning_goals', 'assign', 'Assign learning goals'),
    
    -- Tenant management permissions
    ('tenants', 'create', 'Create new tenants'),
    ('tenants', 'read', 'View tenant information'),
    ('tenants', 'update', 'Update tenant information'),
    ('tenants', 'delete', 'Delete tenants'),
    ('tenants', 'manage', 'Full tenant management'),
    
    -- Reports and analytics permissions
    ('reports', 'view', 'View reports'),
    ('reports', 'export', 'Export reports'),
    ('reports', 'create', 'Create custom reports')
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================================
-- ASSIGN PERMISSIONS TO ROLES
-- ============================================================

-- Platform Admin - Full access to everything
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'platform_admin'
ON CONFLICT (role_id, permission_id, tenant_id) DO NOTHING;

-- Tenant Admin - Full access within their tenant
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'tenant_admin'
AND p.resource != 'tenants' -- Cannot manage other tenants
AND NOT (p.resource = 'domains' AND p.action IN ('create', 'delete')) -- Cannot create/delete domains
ON CONFLICT (role_id, permission_id, tenant_id) DO NOTHING;

-- Teacher - Limited access
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'teacher'
AND (
    -- Can manage concepts and learning goals
    (p.resource IN ('concepts', 'learning_goals') AND p.action IN ('create', 'read', 'update'))
    -- Can view domains
    OR (p.resource = 'domains' AND p.action = 'read')
    -- Can view users in their classes
    OR (p.resource = 'users' AND p.action = 'read')
    -- Can view basic reports
    OR (p.resource = 'reports' AND p.action = 'view')
)
ON CONFLICT (role_id, permission_id, tenant_id) DO NOTHING;

-- Student - Very limited access
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'student'
AND (
    -- Can view concepts and learning goals
    (p.resource IN ('concepts', 'learning_goals') AND p.action = 'read')
    -- Can view domains they're enrolled in
    OR (p.resource = 'domains' AND p.action = 'read')
    -- Can view their own reports
    OR (p.resource = 'reports' AND p.action = 'view')
)
ON CONFLICT (role_id, permission_id, tenant_id) DO NOTHING;

-- ============================================================
-- PERMISSION CHECK FUNCTIONS
-- ============================================================

-- Main permission check function
CREATE OR REPLACE FUNCTION public.check_permission(
    p_user_id UUID,
    p_tenant_id UUID,
    p_resource VARCHAR,
    p_action VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN := FALSE;
BEGIN
    -- Check if user is platform admin (has all permissions)
    IF public.is_platform_admin(p_user_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Check user's permissions in the specific tenant
    SELECT EXISTS(
        SELECT 1
        FROM public.user_tenants ut
        JOIN public.role_permissions rp ON ut.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ut.user_id = p_user_id
        AND ut.tenant_id = p_tenant_id
        AND ut.status = 'active'
        AND p.resource = p_resource
        AND p.action = p_action
        AND (rp.tenant_id IS NULL OR rp.tenant_id = p_tenant_id)
    ) INTO v_has_permission;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simplified permission check for current user
CREATE OR REPLACE FUNCTION public.has_permission(
    p_tenant_id UUID,
    p_resource VARCHAR,
    p_action VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.check_permission(auth.uid(), p_tenant_id, p_resource, p_action);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all permissions for a user in a tenant
CREATE OR REPLACE FUNCTION public.get_user_permissions(
    p_user_id UUID,
    p_tenant_id UUID
)
RETURNS TABLE(
    resource VARCHAR,
    action VARCHAR,
    description TEXT
) AS $$
BEGIN
    -- Platform admin has all permissions
    IF public.is_platform_admin(p_user_id) THEN
        RETURN QUERY
        SELECT p.resource, p.action, p.description
        FROM public.permissions p
        ORDER BY p.resource, p.action;
    ELSE
        -- Regular user permissions based on role
        RETURN QUERY
        SELECT DISTINCT p.resource, p.action, p.description
        FROM public.user_tenants ut
        JOIN public.role_permissions rp ON ut.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ut.user_id = p_user_id
        AND ut.tenant_id = p_tenant_id
        AND ut.status = 'active'
        AND (rp.tenant_id IS NULL OR rp.tenant_id = p_tenant_id)
        ORDER BY p.resource, p.action;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY FOR PERMISSION TABLES
-- ============================================================

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone can view permissions (they need to know what's available)
CREATE POLICY "Anyone can view permissions" ON public.permissions
    FOR SELECT USING (TRUE);

-- Only platform admins can manage permissions
CREATE POLICY "Platform admins can manage permissions" ON public.permissions
    FOR ALL USING (public.is_platform_admin(auth.uid()));

-- Users can view role permissions for their roles
CREATE POLICY "Users can view their role permissions" ON public.role_permissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            WHERE ut.user_id = auth.uid()
            AND ut.role_id = role_permissions.role_id
            AND ut.status = 'active'
        )
        OR public.is_platform_admin(auth.uid())
    );

-- Only platform admins can manage role permissions
CREATE POLICY "Platform admins can manage role permissions" ON public.role_permissions
    FOR ALL USING (public.is_platform_admin(auth.uid()));

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================
GRANT ALL ON public.permissions TO authenticated;
GRANT ALL ON public.role_permissions TO authenticated;

-- ============================================================
-- HELPER VIEW FOR USER PERMISSIONS
-- ============================================================
CREATE OR REPLACE VIEW public.user_permissions_view AS
SELECT 
    ut.user_id,
    ut.tenant_id,
    t.name as tenant_name,
    r.name as role_name,
    r.display_name as role_display_name,
    p.resource,
    p.action,
    p.description as permission_description
FROM public.user_tenants ut
JOIN public.tenants t ON ut.tenant_id = t.id
JOIN public.roles r ON ut.role_id = r.id
JOIN public.role_permissions rp ON r.id = rp.role_id
JOIN public.permissions p ON rp.permission_id = p.id
WHERE ut.status = 'active'
AND (rp.tenant_id IS NULL OR rp.tenant_id = ut.tenant_id);

-- Grant access to the view
GRANT SELECT ON public.user_permissions_view TO authenticated;