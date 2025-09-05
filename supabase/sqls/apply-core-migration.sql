-- ============================================================
-- CORE MIGRATION - ESSENTIAL TABLES FOR TENANT SYSTEM
-- ============================================================
-- Apply this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Helper function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- 1. ROLES TABLE (if not exists)
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

CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_hierarchy_level ON public.roles(hierarchy_level);

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. USER PROFILES TABLE (extends auth.users)
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

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. USER_TENANTS TABLE (Many-to-Many with Roles)
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

CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON public.user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON public.user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_role_id ON public.user_tenants(role_id);
CREATE TRIGGER update_user_tenants_updated_at BEFORE UPDATE ON public.user_tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. INVITATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    role_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ NOT NULL,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invitation_token VARCHAR(255) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_tenant_id ON public.invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(invitation_token);
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON public.invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. TENANT_DOMAINS TABLE (if not exists)
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

CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant_id ON public.tenant_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_domain_id ON public.tenant_domains(domain_id);
CREATE TRIGGER update_tenant_domains_updated_at BEFORE UPDATE ON public.tenant_domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. INSERT DEFAULT ROLES
-- ============================================================
INSERT INTO public.roles (name, display_name, description, hierarchy_level, is_system_role)
VALUES 
    ('platform_admin', 'Platform Administrator', 'Full system access across all tenants', 0, TRUE),
    ('tenant_admin', 'Tenant Administrator', 'Full access within assigned tenant', 10, TRUE),
    ('teacher', 'Teacher', 'Can manage courses and students within assigned domains', 20, TRUE),
    ('student', 'Student', 'Can access learning materials and submit assignments', 30, TRUE)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 7. HELPER FUNCTIONS
-- ============================================================
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

-- ============================================================
-- 8. GRANT PERMISSIONS
-- ============================================================
GRANT ALL ON public.roles TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_tenants TO authenticated;
GRANT ALL ON public.invitations TO authenticated;
GRANT ALL ON public.tenant_domains TO authenticated;

-- Grant permissions for service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;