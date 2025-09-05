-- ============================================================
-- Enhanced Authentication System - MINIMAL SAFE MIGRATION
-- ============================================================
-- This migration adds essential multi-tenant RBAC tables
-- without conflicting with existing schema
-- ============================================================

-- ============================================================
-- SECTION 1: TENANTS TABLE
-- ============================================================

-- Create tenants table if it doesn't exist
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

-- Create indexes for tenant lookup
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);

-- ============================================================
-- SECTION 2: ROLES TABLE
-- ============================================================

-- Create roles table for flexible role management
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    hierarchy_level INTEGER NOT NULL, -- 0=Platform Admin, 10=Tenant Admin, 20=Teacher, 30=Student
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default system roles
INSERT INTO public.user_roles (name, display_name, description, hierarchy_level, is_system_role) VALUES
    ('platform_admin', 'Platform Administrator', 'Full system access across all tenants', 0, true),
    ('tenant_admin', 'Tenant Administrator', 'Full access within their tenant', 10, true),
    ('teacher', 'Teacher', 'Can manage courses and students within assigned domains', 20, true),
    ('student', 'Student', 'Can access learning materials and track progress', 30, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SECTION 3: USER-TENANT RELATIONSHIPS
-- ============================================================

-- Create user_tenants table (many-to-many)
CREATE TABLE IF NOT EXISTS public.user_tenants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.user_roles(id) ON DELETE RESTRICT,
    is_primary BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended', 'inactive')),
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, tenant_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON public.user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON public.user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_role_id ON public.user_tenants(role_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_status ON public.user_tenants(status);

-- ============================================================
-- SECTION 4: BASIC RLS POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for tenants
DROP POLICY IF EXISTS "tenants_select_policy" ON public.tenants;
CREATE POLICY "tenants_select_policy"
    ON public.tenants FOR SELECT
    TO authenticated
    USING (
        -- Platform admins can see all tenants
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.user_roles ur ON ut.role_id = ur.id
            WHERE ut.user_id = auth.uid() 
            AND ur.name = 'platform_admin'
            AND ut.status = 'active'
        )
        OR
        -- Users can see their own tenants
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            WHERE ut.tenant_id = tenants.id 
            AND ut.user_id = auth.uid()
            AND ut.status = 'active'
        )
    );

-- Basic RLS policies for user_roles (readable by all authenticated users)
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
CREATE POLICY "user_roles_select_policy"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (true);

-- Basic RLS policies for user_tenants
DROP POLICY IF EXISTS "user_tenants_select_policy" ON public.user_tenants;
CREATE POLICY "user_tenants_select_policy"
    ON public.user_tenants FOR SELECT
    TO authenticated
    USING (
        -- Users can see their own tenant relationships
        user_id = auth.uid()
        OR
        -- Platform admins can see all relationships
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.user_roles ur ON ut.role_id = ur.id
            WHERE ut.user_id = auth.uid() 
            AND ur.name = 'platform_admin'
            AND ut.status = 'active'
        )
        OR
        -- Tenant admins can see relationships within their tenant
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.user_roles ur ON ut.role_id = ur.id
            WHERE ut.user_id = auth.uid()
            AND ut.tenant_id = user_tenants.tenant_id
            AND ur.name = 'tenant_admin'
            AND ut.status = 'active'
        )
    );

-- ============================================================
-- SECTION 5: HELPER FUNCTIONS
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

-- Function to check if user has minimum role level
CREATE OR REPLACE FUNCTION public.user_has_min_role_level(user_uuid UUID, tenant_uuid UUID, min_level INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN (
        SELECT CASE 
            WHEN ur.hierarchy_level <= min_level THEN true 
            ELSE false 
        END
        FROM public.user_tenants ut
        JOIN public.user_roles ur ON ut.role_id = ur.id
        WHERE ut.user_id = user_uuid 
        AND ut.tenant_id = tenant_uuid
        AND ut.status = 'active'
        LIMIT 1
    );
END;
$$;

-- ============================================================
-- SECTION 6: SEED DEFAULT TENANT FOR EXISTING USERS
-- ============================================================

-- Create a default tenant for migration
INSERT INTO public.tenants (name, slug, description) 
VALUES ('Default Organization', 'default', 'Default tenant for existing users')
ON CONFLICT (slug) DO NOTHING;

-- Get the default tenant ID and create platform admin role for existing users
DO $$
DECLARE
    default_tenant_id UUID;
    platform_admin_role_id UUID;
BEGIN
    -- Get default tenant and platform admin role
    SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'default';
    SELECT id INTO platform_admin_role_id FROM public.user_roles WHERE name = 'platform_admin';
    
    -- Assign existing users to default tenant as platform admins (you can adjust this later)
    INSERT INTO public.user_tenants (user_id, tenant_id, role_id, is_primary, status, joined_at)
    SELECT 
        au.id,
        default_tenant_id,
        platform_admin_role_id,
        true,
        'active',
        now()
    FROM auth.users au
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_tenants ut 
        WHERE ut.user_id = au.id
    );
END $$;