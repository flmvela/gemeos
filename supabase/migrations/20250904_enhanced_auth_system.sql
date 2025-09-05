-- ============================================================
-- Enhanced Authentication System for Gemeos Platform
-- ============================================================
-- This migration creates a comprehensive RBAC and multi-tenant system
-- Supporting: Platform Admin, Tenant Admin, Teacher, Student roles
-- Features: Tenant isolation, Role hierarchy, Permission management
-- ============================================================

-- ============================================================
-- SECTION 1: CLEANUP & PREPARATION
-- ============================================================

-- Drop existing constraints that might conflict
ALTER TABLE IF EXISTS public.page_permissions 
DROP CONSTRAINT IF EXISTS page_permissions_role_check;

-- ============================================================
-- SECTION 2: CORE TENANT TABLES
-- ============================================================

-- Create tenants table (organizations/institutions)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    settings JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'inactive')),
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise')),
    max_users INTEGER DEFAULT 10,
    max_domains INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for tenant lookup
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);

-- ============================================================
-- SECTION 3: ENHANCED ROLE SYSTEM
-- ============================================================

-- Create roles table for flexible role management
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    hierarchy_level INTEGER NOT NULL, -- 0=Platform Admin, 10=Tenant Admin, 20=Teacher, 30=Student
    is_system_role BOOLEAN DEFAULT false, -- System roles cannot be deleted
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default system roles
INSERT INTO public.roles (name, display_name, description, hierarchy_level, is_system_role) VALUES
    ('platform_admin', 'Platform Administrator', 'Full system access across all tenants', 0, true),
    ('tenant_admin', 'Tenant Administrator', 'Full access within their tenant', 10, true),
    ('teacher', 'Teacher', 'Can manage courses and students within assigned domains', 20, true),
    ('student', 'Student', 'Can access learning materials and track progress', 30, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SECTION 4: USER-TENANT-ROLE RELATIONSHIPS
-- ============================================================

-- Create user_tenants table (many-to-many: users can belong to multiple tenants)
CREATE TABLE IF NOT EXISTS public.user_tenants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    is_primary BOOLEAN DEFAULT false, -- Primary tenant for the user
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended', 'inactive')),
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, tenant_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON public.user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON public.user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_role_id ON public.user_tenants(role_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_status ON public.user_tenants(status);

-- ============================================================
-- SECTION 5: PERMISSION SYSTEM
-- ============================================================

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    resource TEXT NOT NULL, -- e.g., 'concepts', 'domains', 'users'
    action TEXT NOT NULL, -- e.g., 'create', 'read', 'update', 'delete'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(resource, action)
);

-- Create role_permissions table (which permissions each role has)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- NULL for global permissions
    conditions JSONB DEFAULT '{}', -- Additional conditions for the permission
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(role_id, permission_id, tenant_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_tenant_id ON public.role_permissions(tenant_id);

-- ============================================================
-- SECTION 6: ENHANCED PROFILES WITH TENANT SUPPORT
-- ============================================================

-- Add tenant support to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS primary_tenant_id UUID REFERENCES public.tenants(id),
ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT false;

-- Update existing teacher_domains to support multi-tenancy
ALTER TABLE public.teacher_domains 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- ============================================================
-- SECTION 7: TENANT-SCOPED DOMAINS
-- ============================================================

-- Create tenant_domains table (which domains are available for each tenant)
CREATE TABLE IF NOT EXISTS public.tenant_domains (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    domain_id TEXT NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    max_teachers INTEGER DEFAULT 5,
    max_students INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, domain_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant_id ON public.tenant_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_domain_id ON public.tenant_domains(domain_id);

-- ============================================================
-- SECTION 8: AUDIT LOGGING
-- ============================================================

-- Create audit_logs table for tracking important actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- ============================================================
-- SECTION 9: DEFAULT PERMISSIONS DATA
-- ============================================================

-- Insert default permissions
INSERT INTO public.permissions (resource, action, description) VALUES
    -- User management
    ('users', 'create', 'Create new users'),
    ('users', 'read', 'View user information'),
    ('users', 'update', 'Update user information'),
    ('users', 'delete', 'Delete users'),
    ('users', 'invite', 'Invite users to tenant'),
    
    -- Domain management
    ('domains', 'create', 'Create new domains'),
    ('domains', 'read', 'View domains'),
    ('domains', 'update', 'Update domain information'),
    ('domains', 'delete', 'Delete domains'),
    ('domains', 'assign', 'Assign domains to users'),
    
    -- Concept management
    ('concepts', 'create', 'Create new concepts'),
    ('concepts', 'read', 'View concepts'),
    ('concepts', 'update', 'Update concepts'),
    ('concepts', 'delete', 'Delete concepts'),
    ('concepts', 'publish', 'Publish concepts'),
    
    -- Learning goals
    ('learning_goals', 'create', 'Create learning goals'),
    ('learning_goals', 'read', 'View learning goals'),
    ('learning_goals', 'update', 'Update learning goals'),
    ('learning_goals', 'delete', 'Delete learning goals'),
    
    -- Tenant management
    ('tenants', 'create', 'Create new tenants'),
    ('tenants', 'read', 'View tenant information'),
    ('tenants', 'update', 'Update tenant settings'),
    ('tenants', 'delete', 'Delete tenants'),
    
    -- Reports and analytics
    ('reports', 'view', 'View reports and analytics'),
    ('reports', 'export', 'Export reports')
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================================
-- SECTION 10: ROLE-PERMISSION ASSIGNMENTS
-- ============================================================

-- Platform Admin gets all permissions globally
INSERT INTO public.role_permissions (role_id, permission_id, tenant_id)
SELECT r.id, p.id, NULL
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'platform_admin'
ON CONFLICT (role_id, permission_id, tenant_id) DO NOTHING;

-- Tenant Admin gets most permissions within their tenant (inserted dynamically)
-- Teacher gets specific permissions (inserted dynamically based on tenant)
-- Student gets limited read permissions (inserted dynamically based on tenant)

-- ============================================================
-- SECTION 11: ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenants policies
CREATE POLICY "Platform admins can manage all tenants" ON public.tenants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid() 
            AND r.name = 'platform_admin'
        )
    );

CREATE POLICY "Users can view their own tenants" ON public.tenants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            WHERE ut.user_id = auth.uid() 
            AND ut.tenant_id = tenants.id
            AND ut.status = 'active'
        )
    );

-- User tenants policies
CREATE POLICY "Platform admins can manage all user-tenant relationships" ON public.user_tenants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid() 
            AND r.name = 'platform_admin'
        )
    );

CREATE POLICY "Tenant admins can manage users in their tenant" ON public.user_tenants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid() 
            AND ut.tenant_id = user_tenants.tenant_id
            AND r.name = 'tenant_admin'
            AND ut.status = 'active'
        )
    );

CREATE POLICY "Users can view their own tenant memberships" ON public.user_tenants
    FOR SELECT USING (user_id = auth.uid());

-- Roles policies (everyone can read roles)
CREATE POLICY "Roles are publicly readable" ON public.roles
    FOR SELECT USING (true);

-- Permissions policies (everyone can read permissions)
CREATE POLICY "Permissions are publicly readable" ON public.permissions
    FOR SELECT USING (true);

-- Audit logs policies
CREATE POLICY "Platform admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid() 
            AND r.name = 'platform_admin'
        )
    );

CREATE POLICY "Tenant admins can view their tenant audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid() 
            AND ut.tenant_id = audit_logs.tenant_id
            AND r.name = 'tenant_admin'
            AND ut.status = 'active'
        )
    );

-- ============================================================
-- SECTION 12: HELPER FUNCTIONS
-- ============================================================

-- Function to get user's role in a tenant
CREATE OR REPLACE FUNCTION public.get_user_role_in_tenant(
    p_user_id UUID,
    p_tenant_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role_name TEXT;
BEGIN
    SELECT r.name INTO v_role_name
    FROM public.user_tenants ut
    JOIN public.roles r ON ut.role_id = r.id
    WHERE ut.user_id = p_user_id 
    AND ut.tenant_id = p_tenant_id
    AND ut.status = 'active'
    LIMIT 1;
    
    RETURN v_role_name;
END;
$$;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
    p_user_id UUID,
    p_tenant_id UUID,
    p_resource TEXT,
    p_action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_permission BOOLEAN;
BEGIN
    -- Check if user has the permission either globally or for the specific tenant
    SELECT EXISTS(
        SELECT 1
        FROM public.user_tenants ut
        JOIN public.role_permissions rp ON ut.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ut.user_id = p_user_id
        AND (rp.tenant_id IS NULL OR rp.tenant_id = p_tenant_id)
        AND (ut.tenant_id = p_tenant_id OR rp.tenant_id IS NULL)
        AND p.resource = p_resource
        AND p.action = p_action
        AND ut.status = 'active'
    ) INTO v_has_permission;
    
    RETURN v_has_permission;
END;
$$;

-- Function to get user's tenants with roles
CREATE OR REPLACE FUNCTION public.get_user_tenants_with_roles(p_user_id UUID)
RETURNS TABLE(
    tenant_id UUID,
    tenant_name TEXT,
    tenant_slug TEXT,
    role_name TEXT,
    role_display_name TEXT,
    is_primary BOOLEAN,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id AS tenant_id,
        t.name AS tenant_name,
        t.slug AS tenant_slug,
        r.name AS role_name,
        r.display_name AS role_display_name,
        ut.is_primary,
        ut.status
    FROM public.user_tenants ut
    JOIN public.tenants t ON ut.tenant_id = t.id
    JOIN public.roles r ON ut.role_id = r.id
    WHERE ut.user_id = p_user_id
    ORDER BY ut.is_primary DESC, t.name;
END;
$$;

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION public.create_audit_log(
    p_tenant_id UUID,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT,
    p_changes JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        tenant_id,
        user_id,
        action,
        resource_type,
        resource_id,
        changes
    ) VALUES (
        p_tenant_id,
        auth.uid(),
        p_action,
        p_resource_type,
        p_resource_id,
        p_changes
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$;

-- ============================================================
-- SECTION 13: MIGRATION HELPERS
-- ============================================================

-- Function to migrate existing users to the new system
CREATE OR REPLACE FUNCTION public.migrate_existing_users_to_tenant_system()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_default_tenant_id UUID;
    v_teacher_role_id UUID;
    v_student_role_id UUID;
BEGIN
    -- Create a default tenant if it doesn't exist
    INSERT INTO public.tenants (name, slug, description, status)
    VALUES ('Default Organization', 'default', 'Default tenant for existing users', 'active')
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO v_default_tenant_id;
    
    IF v_default_tenant_id IS NULL THEN
        SELECT id INTO v_default_tenant_id FROM public.tenants WHERE slug = 'default';
    END IF;
    
    -- Get role IDs
    SELECT id INTO v_teacher_role_id FROM public.roles WHERE name = 'teacher';
    SELECT id INTO v_student_role_id FROM public.roles WHERE name = 'student';
    
    -- Migrate existing users based on their user_type in profiles
    INSERT INTO public.user_tenants (user_id, tenant_id, role_id, is_primary, status, joined_at)
    SELECT 
        p.user_id,
        v_default_tenant_id,
        CASE 
            WHEN p.user_type = 'teacher' THEN v_teacher_role_id
            WHEN p.user_type = 'student' THEN v_student_role_id
        END,
        true,
        'active',
        p.created_at
    FROM public.profiles p
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_tenants ut 
        WHERE ut.user_id = p.user_id
    );
    
    -- Update profiles with primary tenant
    UPDATE public.profiles p
    SET primary_tenant_id = v_default_tenant_id
    WHERE primary_tenant_id IS NULL;
    
    -- Update teacher_domains with tenant_id
    UPDATE public.teacher_domains td
    SET tenant_id = v_default_tenant_id
    WHERE tenant_id IS NULL;
    
    RAISE NOTICE 'Migration completed. Default tenant ID: %', v_default_tenant_id;
END;
$$;

-- ============================================================
-- SECTION 14: UPDATED TRIGGER FUNCTIONS
-- ============================================================

-- Update trigger for tenants
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for user_tenants
CREATE TRIGGER update_user_tenants_updated_at
BEFORE UPDATE ON public.user_tenants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for roles
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for tenant_domains
CREATE TRIGGER update_tenant_domains_updated_at
BEFORE UPDATE ON public.tenant_domains
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- SECTION 15: PERFORMANCE INDEXES
-- ============================================================

-- Additional composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_tenants_lookup ON public.user_tenants(user_id, tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_role_permissions_lookup ON public.role_permissions(role_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_datetime ON public.audit_logs(created_at DESC);

-- ============================================================
-- SECTION 16: INITIAL DATA MIGRATION
-- ============================================================

-- Run the migration function to move existing users to the new system
SELECT public.migrate_existing_users_to_tenant_system();

-- ============================================================
-- SECTION 17: GRANT PERMISSIONS
-- ============================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.tenants TO authenticated;
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.user_tenants TO authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.get_user_role_in_tenant TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenants_with_roles TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_audit_log TO authenticated;

-- ============================================================
-- END OF MIGRATION
-- ============================================================

-- Add a comment to track this migration
COMMENT ON SCHEMA public IS 'Enhanced Authentication System v1.0 - Multi-tenant RBAC implementation';