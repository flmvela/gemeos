-- ============================================================
-- MULTI-TENANT EDUCATIONAL PLATFORM - CORE SCHEMA
-- ============================================================
-- This migration creates the foundational tables for the multi-tenant system
-- including tenants, roles, user management, and audit logging

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================
-- 1. TENANTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'inactive')),
    subscription_tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise')),
    max_users INTEGER NOT NULL DEFAULT 10,
    max_domains INTEGER NOT NULL DEFAULT 2,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for tenants
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_tenants_subscription_tier ON public.tenants(subscription_tier);
CREATE INDEX idx_tenants_name_trgm ON public.tenants USING gin(name gin_trgm_ops);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    hierarchy_level INTEGER NOT NULL,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for roles
CREATE INDEX idx_roles_name ON public.roles(name);
CREATE INDEX idx_roles_hierarchy_level ON public.roles(hierarchy_level);

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. USER PROFILES TABLE (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone_number VARCHAR(20),
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for profiles
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_full_name_trgm ON public.profiles USING gin(full_name gin_trgm_ops);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. USER_TENANTS TABLE (Many-to-Many with Roles)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended', 'inactive')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- Create indexes for user_tenants
CREATE INDEX idx_user_tenants_user_id ON public.user_tenants(user_id);
CREATE INDEX idx_user_tenants_tenant_id ON public.user_tenants(tenant_id);
CREATE INDEX idx_user_tenants_role_id ON public.user_tenants(role_id);
CREATE INDEX idx_user_tenants_status ON public.user_tenants(status);
CREATE INDEX idx_user_tenants_user_tenant ON public.user_tenants(user_id, tenant_id);

CREATE TRIGGER update_user_tenants_updated_at BEFORE UPDATE ON public.user_tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. INVITATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    role_name VARCHAR(50) NOT NULL, -- Denormalized for convenience
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ NOT NULL,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invitation_token VARCHAR(255) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for invitations
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_tenant_id ON public.invitations(tenant_id);
CREATE INDEX idx_invitations_status ON public.invitations(status);
CREATE INDEX idx_invitations_expires_at ON public.invitations(expires_at);
CREATE INDEX idx_invitations_token ON public.invitations(invitation_token);
CREATE INDEX idx_invitations_email_tenant ON public.invitations(email, tenant_id);

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON public.invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. DOMAINS TABLE (Learning Domains/Subjects)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon_name VARCHAR(100),
    parent_domain_id UUID REFERENCES public.domains(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for domains
CREATE INDEX idx_domains_name ON public.domains(name);
CREATE INDEX idx_domains_parent_domain_id ON public.domains(parent_domain_id);
CREATE INDEX idx_domains_is_active ON public.domains(is_active);

CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON public.domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. TENANT_DOMAINS TABLE (Many-to-Many)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tenant_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_teachers INTEGER NOT NULL DEFAULT 5,
    max_students INTEGER NOT NULL DEFAULT 100,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, domain_id)
);

-- Create indexes for tenant_domains
CREATE INDEX idx_tenant_domains_tenant_id ON public.tenant_domains(tenant_id);
CREATE INDEX idx_tenant_domains_domain_id ON public.tenant_domains(domain_id);
CREATE INDEX idx_tenant_domains_is_active ON public.tenant_domains(is_active);

CREATE TRIGGER update_tenant_domains_updated_at BEFORE UPDATE ON public.tenant_domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. AUDIT_LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for audit_logs
CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================================
-- 9. INSERT DEFAULT ROLES
-- ============================================================
INSERT INTO public.roles (name, display_name, description, hierarchy_level, is_system_role)
VALUES 
    ('platform_admin', 'Platform Administrator', 'Full system access across all tenants', 0, TRUE),
    ('tenant_admin', 'Tenant Administrator', 'Full access within assigned tenant', 10, TRUE),
    ('teacher', 'Teacher', 'Can manage courses and students within assigned domains', 20, TRUE),
    ('student', 'Student', 'Can access learning materials and submit assignments', 30, TRUE)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 10. INSERT DEFAULT DOMAINS (Sample Data)
-- ============================================================
INSERT INTO public.domains (name, description, icon_name)
VALUES 
    ('Mathematics', 'Mathematical concepts and problem solving', 'calculator'),
    ('Science', 'Natural sciences including physics, chemistry, and biology', 'flask'),
    ('Language Arts', 'Reading, writing, and communication skills', 'book'),
    ('History', 'Historical events and social studies', 'clock'),
    ('Computer Science', 'Programming and computational thinking', 'computer')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 11. CREATE HELPER FUNCTIONS
-- ============================================================

-- Function to check if a user has a specific role in a tenant
CREATE OR REPLACE FUNCTION public.user_has_role_in_tenant(
    p_user_id UUID,
    p_tenant_id UUID,
    p_role_name VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_tenants ut
        JOIN public.roles r ON ut.role_id = r.id
        WHERE ut.user_id = p_user_id 
        AND ut.tenant_id = p_tenant_id 
        AND r.name = p_role_name
        AND ut.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role in a tenant
CREATE OR REPLACE FUNCTION public.get_user_role_in_tenant(
    p_user_id UUID,
    p_tenant_id UUID
)
RETURNS VARCHAR AS $$
DECLARE
    v_role_name VARCHAR;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_tenants ut
        JOIN public.roles r ON ut.role_id = r.id
        WHERE ut.user_id = p_user_id 
        AND r.name = 'platform_admin'
        AND ut.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 12. GRANT PERMISSIONS
-- ============================================================
GRANT ALL ON public.tenants TO authenticated;
GRANT ALL ON public.roles TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_tenants TO authenticated;
GRANT ALL ON public.invitations TO authenticated;
GRANT ALL ON public.domains TO authenticated;
GRANT ALL ON public.tenant_domains TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;

-- Grant permissions for service role (used by Supabase Edge Functions)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;