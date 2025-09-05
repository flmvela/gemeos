-- ============================================================
-- COMPLETE DATABASE RESET FOR ENHANCED AUTHENTICATION
-- ============================================================
-- WARNING: This will drop and recreate tables that may conflict
-- BACKUP YOUR DATA BEFORE RUNNING THIS MIGRATION
-- ============================================================

-- ============================================================
-- SECTION 1: DROP CONFLICTING TABLES AND DEPENDENCIES
-- ============================================================

-- Drop tables that might have conflicting structures
-- (Comment out any tables you want to keep)
DROP TABLE IF EXISTS public.user_tenants CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- Drop any conflicting functions
DROP FUNCTION IF EXISTS public.get_user_role_in_tenant(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.user_has_min_role_level(UUID, UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_permissions(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.has_permission(UUID, UUID, TEXT, TEXT) CASCADE;

-- ============================================================
-- SECTION 2: CREATE TENANTS TABLE
-- ============================================================

CREATE TABLE public.tenants (
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

-- Create indexes
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_status ON public.tenants(status);

-- ============================================================
-- SECTION 3: CREATE ROLES TABLE
-- ============================================================

CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    hierarchy_level INTEGER NOT NULL, -- Lower number = higher privilege
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert system roles
INSERT INTO public.user_roles (name, display_name, description, hierarchy_level, is_system_role) VALUES
    ('platform_admin', 'Platform Administrator', 'Full system access across all tenants', 0, true),
    ('tenant_admin', 'Tenant Administrator', 'Full access within their tenant', 10, true),
    ('teacher', 'Teacher', 'Can manage courses and students within assigned domains', 20, true),
    ('student', 'Student', 'Can access learning materials and track progress', 30, true);

-- ============================================================
-- SECTION 4: CREATE USER-TENANT RELATIONSHIPS
-- ============================================================

CREATE TABLE public.user_tenants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.user_roles(id) ON DELETE RESTRICT,
    is_primary BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended', 'inactive')),
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, tenant_id)
);

-- Create indexes
CREATE INDEX idx_user_tenants_user_id ON public.user_tenants(user_id);
CREATE INDEX idx_user_tenants_tenant_id ON public.user_tenants(tenant_id);
CREATE INDEX idx_user_tenants_role_id ON public.user_tenants(role_id);
CREATE INDEX idx_user_tenants_status ON public.user_tenants(status);

-- ============================================================
-- SECTION 5: CREATE PERMISSIONS SYSTEM
-- ============================================================

CREATE TABLE public.permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    resource TEXT NOT NULL, -- e.g., 'concepts', 'domains', 'users'
    action TEXT NOT NULL, -- e.g., 'create', 'read', 'update', 'delete'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(resource, action)
);

-- Insert basic permissions
INSERT INTO public.permissions (resource, action, description) VALUES
    ('tenants', 'create', 'Create new tenants'),
    ('tenants', 'read', 'View tenant information'),
    ('tenants', 'update', 'Modify tenant settings'),
    ('tenants', 'delete', 'Delete tenants'),
    
    ('users', 'create', 'Create new users'),
    ('users', 'read', 'View user information'),
    ('users', 'update', 'Modify user details'),
    ('users', 'delete', 'Delete users'),
    ('users', 'invite', 'Invite users to tenant'),
    
    ('domains', 'create', 'Create learning domains'),
    ('domains', 'read', 'View domains'),
    ('domains', 'update', 'Modify domains'),
    ('domains', 'delete', 'Delete domains'),
    ('domains', 'assign', 'Assign domains to teachers'),
    
    ('concepts', 'create', 'Create concepts'),
    ('concepts', 'read', 'View concepts'),
    ('concepts', 'update', 'Modify concepts'),
    ('concepts', 'delete', 'Delete concepts'),
    ('concepts', 'approve', 'Approve AI suggestions'),
    
    ('learning_goals', 'create', 'Create learning goals'),
    ('learning_goals', 'read', 'View learning goals'),
    ('learning_goals', 'update', 'Modify learning goals'),
    ('learning_goals', 'delete', 'Delete learning goals'),
    ('learning_goals', 'approve', 'Approve AI suggestions');

-- ============================================================
-- SECTION 6: CREATE ROLE-PERMISSION RELATIONSHIPS
-- ============================================================

CREATE TABLE public.role_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID NOT NULL REFERENCES public.user_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(role_id, permission_id)
);

-- Assign permissions to roles
DO $$
DECLARE
    platform_admin_id UUID;
    tenant_admin_id UUID;
    teacher_id UUID;
    student_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO platform_admin_id FROM public.user_roles WHERE name = 'platform_admin';
    SELECT id INTO tenant_admin_id FROM public.user_roles WHERE name = 'tenant_admin';
    SELECT id INTO teacher_id FROM public.user_roles WHERE name = 'teacher';
    SELECT id INTO student_id FROM public.user_roles WHERE name = 'student';
    
    -- Platform Admin: All permissions
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT platform_admin_id, id FROM public.permissions;
    
    -- Tenant Admin: Most permissions except tenant management
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT tenant_admin_id, p.id 
    FROM public.permissions p
    WHERE p.resource != 'tenants' OR p.action = 'read';
    
    -- Teacher: Domain and content management
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT teacher_id, p.id 
    FROM public.permissions p
    WHERE p.resource IN ('domains', 'concepts', 'learning_goals')
    OR (p.resource = 'users' AND p.action IN ('read', 'invite'));
    
    -- Student: Read-only access
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT student_id, p.id 
    FROM public.permissions p
    WHERE p.action = 'read';
END $$;

-- ============================================================
-- SECTION 7: CREATE AUDIT LOG
-- ============================================================

CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES public.tenants(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for audit log
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- ============================================================
-- SECTION 8: ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants
CREATE POLICY "tenants_policy" ON public.tenants FOR ALL TO authenticated USING (
    -- Platform admins can access all tenants
    EXISTS (
        SELECT 1 FROM public.user_tenants ut
        JOIN public.user_roles ur ON ut.role_id = ur.id
        WHERE ut.user_id = auth.uid() 
        AND ur.name = 'platform_admin'
        AND ut.status = 'active'
    )
    OR
    -- Users can access their own tenants
    EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE ut.tenant_id = tenants.id 
        AND ut.user_id = auth.uid()
        AND ut.status = 'active'
    )
);

-- RLS Policies for user_roles (readable by all)
CREATE POLICY "user_roles_policy" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- RLS Policies for user_tenants
CREATE POLICY "user_tenants_policy" ON public.user_tenants FOR ALL TO authenticated USING (
    user_id = auth.uid()
    OR
    -- Platform admins can see all
    EXISTS (
        SELECT 1 FROM public.user_tenants ut
        JOIN public.user_roles ur ON ut.role_id = ur.id
        WHERE ut.user_id = auth.uid() 
        AND ur.name = 'platform_admin'
        AND ut.status = 'active'
    )
    OR
    -- Tenant admins can see their tenant users
    EXISTS (
        SELECT 1 FROM public.user_tenants ut
        JOIN public.user_roles ur ON ut.role_id = ur.id
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = user_tenants.tenant_id
        AND ur.hierarchy_level <= 10 -- tenant_admin level or higher
        AND ut.status = 'active'
    )
);

-- RLS Policies for permissions (readable by all authenticated)
CREATE POLICY "permissions_policy" ON public.permissions FOR SELECT TO authenticated USING (true);

-- RLS Policies for role_permissions (readable by all authenticated)  
CREATE POLICY "role_permissions_policy" ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- RLS Policies for audit_logs
CREATE POLICY "audit_logs_policy" ON public.audit_logs FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR
    -- Platform admins can see all audit logs
    EXISTS (
        SELECT 1 FROM public.user_tenants ut
        JOIN public.user_roles ur ON ut.role_id = ur.id
        WHERE ut.user_id = auth.uid() 
        AND ur.name = 'platform_admin'
        AND ut.status = 'active'
    )
    OR
    -- Tenant admins can see their tenant's audit logs
    EXISTS (
        SELECT 1 FROM public.user_tenants ut
        JOIN public.user_roles ur ON ut.role_id = ur.id
        WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = audit_logs.tenant_id
        AND ur.hierarchy_level <= 10
        AND ut.status = 'active'
    )
);

-- ============================================================
-- SECTION 9: HELPER FUNCTIONS
-- ============================================================

-- Function to get user's role in a tenant
CREATE OR REPLACE FUNCTION public.get_user_role_in_tenant(user_uuid UUID, tenant_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN (
        SELECT ur.name
        FROM public.user_tenants ut
        JOIN public.user_roles ur ON ut.role_id = ur.id
        WHERE ut.user_id = user_uuid 
        AND ut.tenant_id = tenant_uuid
        AND ut.status = 'active'
        LIMIT 1
    );
END;
$$;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(user_uuid UUID, tenant_uuid UUID, resource_name TEXT, action_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_tenants ut
        JOIN public.user_roles ur ON ut.role_id = ur.id
        JOIN public.role_permissions rp ON ur.id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ut.user_id = user_uuid 
        AND ut.tenant_id = tenant_uuid
        AND ut.status = 'active'
        AND p.resource = resource_name
        AND p.action = action_name
    );
END;
$$;

-- Function to get all user permissions in a tenant
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_uuid UUID, tenant_uuid UUID)
RETURNS TABLE(resource TEXT, action TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.resource, p.action
    FROM public.user_tenants ut
    JOIN public.user_roles ur ON ut.role_id = ur.id
    JOIN public.role_permissions rp ON ur.id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ut.user_id = user_uuid 
    AND ut.tenant_id = tenant_uuid
    AND ut.status = 'active';
END;
$$;

-- ============================================================
-- SECTION 10: SEED DATA
-- ============================================================

-- Create default tenant
INSERT INTO public.tenants (name, slug, description) VALUES 
    ('Default Organization', 'default', 'Default tenant for existing users');

-- Assign existing users to default tenant as platform admins
DO $$
DECLARE
    default_tenant_id UUID;
    platform_admin_role_id UUID;
BEGIN
    SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'default';
    SELECT id INTO platform_admin_role_id FROM public.user_roles WHERE name = 'platform_admin';
    
    INSERT INTO public.user_tenants (user_id, tenant_id, role_id, is_primary, status, joined_at)
    SELECT 
        au.id,
        default_tenant_id,
        platform_admin_role_id,
        true,
        'active',
        now()
    FROM auth.users au
    WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = au.id); -- Only if users exist
END $$;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE 'Enhanced Authentication System successfully created!';
    RAISE NOTICE 'Default tenant "default" created with existing users as platform admins';
    RAISE NOTICE 'Ready for multi-tenant operations';
END $$;