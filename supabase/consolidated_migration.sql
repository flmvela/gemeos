-- ============================================================
-- MULTI-TENANT EDUCATIONAL PLATFORM - CONSOLIDATED MIGRATION
-- ============================================================
-- This is a consolidated migration script that creates all necessary tables
-- for the multi-tenant invitation system. Run this in Supabase SQL Editor.

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
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_tier ON public.tenants(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_tenants_name_trgm ON public.tenants USING gin(name gin_trgm_ops);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
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
    is_system_role BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for roles
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_hierarchy_level ON public.roles(hierarchy_level);

-- ============================================================
-- 3. PROFILES TABLE (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique ON public.profiles(email);

-- ============================================================
-- 4. USER_TENANTS TABLE (many-to-many with roles)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended', 'inactive')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, tenant_id, role_id)
);

DROP TRIGGER IF EXISTS update_user_tenants_updated_at ON public.user_tenants;
CREATE TRIGGER update_user_tenants_updated_at BEFORE UPDATE ON public.user_tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for user_tenants
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON public.user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON public.user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_role_id ON public.user_tenants(role_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_status ON public.user_tenants(status);
CREATE INDEX IF NOT EXISTS idx_user_tenants_is_primary ON public.user_tenants(is_primary);

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
    invitation_token VARCHAR(255) NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_invitations_updated_at ON public.invitations;
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON public.invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for invitations
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_tenant_id ON public.invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON public.invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON public.invitations(invited_by);

-- ============================================================
-- 6. DOMAINS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_domains_updated_at ON public.domains;
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON public.domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for domains
CREATE INDEX IF NOT EXISTS idx_domains_name ON public.domains(name);
CREATE INDEX IF NOT EXISTS idx_domains_is_active ON public.domains(is_active);

-- ============================================================
-- 7. TENANT_DOMAINS TABLE (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tenant_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    max_teachers INTEGER NOT NULL DEFAULT 5,
    max_students INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, domain_id)
);

DROP TRIGGER IF EXISTS update_tenant_domains_updated_at ON public.tenant_domains;
CREATE TRIGGER update_tenant_domains_updated_at BEFORE UPDATE ON public.tenant_domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for tenant_domains
CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant_id ON public.tenant_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_domain_id ON public.tenant_domains(domain_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_is_active ON public.tenant_domains(is_active);

-- ============================================================
-- 8. AUDIT_LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ============================================================
-- 9. INSERT INITIAL DATA
-- ============================================================

-- Insert system roles
INSERT INTO public.roles (name, display_name, description, hierarchy_level, is_system_role) VALUES
    ('platform_admin', 'Platform Administrator', 'Full system access and platform management', 0, true),
    ('tenant_admin', 'Tenant Administrator', 'Full tenant management and user administration', 10, true),
    ('teacher', 'Teacher', 'Content creation and student management within assigned domains', 20, true),
    ('student', 'Student', 'Access to assigned learning content and activities', 30, true)
ON CONFLICT (name) DO NOTHING;

-- Insert sample domains
INSERT INTO public.domains (name, description, icon_name) VALUES
    ('Mathematics', 'Mathematical concepts and problem solving', 'calculator'),
    ('Science', 'Scientific principles and experiments', 'globe'),
    ('Language Arts', 'Reading, writing, and communication skills', 'book-open')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 10. HELPER FUNCTIONS
-- ============================================================

-- Function to create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to accept an invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token TEXT, user_id UUID)
RETURNS JSONB AS $$
DECLARE
    invitation_record public.invitations;
    result JSONB;
BEGIN
    -- Get the invitation
    SELECT * INTO invitation_record
    FROM public.invitations
    WHERE invitation_token = accept_invitation.invitation_token
    AND status = 'pending'
    AND expires_at > NOW();

    -- Check if invitation exists and is valid
    IF invitation_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
    END IF;

    -- Check if user is already a member of this tenant with this role
    IF EXISTS (
        SELECT 1 FROM public.user_tenants
        WHERE user_id = accept_invitation.user_id
        AND tenant_id = invitation_record.tenant_id
        AND role_id = invitation_record.role_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'User is already a member with this role');
    END IF;

    -- Add user to tenant
    INSERT INTO public.user_tenants (user_id, tenant_id, role_id, status, joined_at)
    VALUES (
        accept_invitation.user_id,
        invitation_record.tenant_id,
        invitation_record.role_id,
        'active',
        NOW()
    );

    -- Mark invitation as accepted
    UPDATE public.invitations
    SET status = 'accepted', accepted_at = NOW(), updated_at = NOW()
    WHERE id = invitation_record.id;

    -- Log the action
    INSERT INTO public.audit_logs (tenant_id, user_id, action, resource_type, resource_id)
    VALUES (
        invitation_record.tenant_id,
        accept_invitation.user_id,
        'invitation_accepted',
        'invitation',
        invitation_record.id
    );

    result := jsonb_build_object(
        'success', true,
        'tenant_id', invitation_record.tenant_id,
        'role_name', invitation_record.role_name
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_tenants ut
        JOIN public.roles r ON ut.role_id = r.id
        WHERE ut.user_id = is_platform_admin.user_id
        AND r.name = 'platform_admin'
        AND ut.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user is tenant admin
CREATE OR REPLACE FUNCTION public.is_tenant_admin(user_id UUID, tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_tenants ut
        JOIN public.roles r ON ut.role_id = r.id
        WHERE ut.user_id = is_tenant_admin.user_id
        AND ut.tenant_id = is_tenant_admin.tenant_id
        AND r.name IN ('platform_admin', 'tenant_admin')
        AND ut.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for tenants
CREATE POLICY "Platform admins can manage all tenants" ON public.tenants
    FOR ALL USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Tenant admins can view their tenant" ON public.tenants
    FOR SELECT USING (
        public.is_tenant_admin(auth.uid(), id)
    );

-- RLS Policies for roles (readable by all authenticated users)
CREATE POLICY "Authenticated users can view roles" ON public.roles
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Platform admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_platform_admin(auth.uid()));

-- RLS Policies for user_tenants
CREATE POLICY "Platform admins can manage all user_tenants" ON public.user_tenants
    FOR ALL USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Tenant admins can manage users in their tenant" ON public.user_tenants
    FOR ALL USING (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Users can view their own tenant memberships" ON public.user_tenants
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for invitations
CREATE POLICY "Platform admins can manage all invitations" ON public.invitations
    FOR ALL USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Tenant admins can manage invitations for their tenant" ON public.invitations
    FOR ALL USING (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Users can view invitations sent to them" ON public.invitations
    FOR SELECT USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- RLS Policies for domains (readable by all authenticated users)
CREATE POLICY "Authenticated users can view domains" ON public.domains
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Platform admins can manage domains" ON public.domains
    FOR ALL USING (public.is_platform_admin(auth.uid()));

-- RLS Policies for tenant_domains
CREATE POLICY "Platform admins can manage all tenant_domains" ON public.tenant_domains
    FOR ALL USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Tenant admins can manage their tenant domains" ON public.tenant_domains
    FOR ALL USING (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Users can view domains assigned to their tenants" ON public.tenant_domains
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            WHERE ut.user_id = auth.uid()
            AND ut.tenant_id = tenant_domains.tenant_id
            AND ut.status = 'active'
        )
    );

-- RLS Policies for audit_logs
CREATE POLICY "Platform admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Tenant admins can view their tenant audit logs" ON public.audit_logs
    FOR SELECT USING (
        tenant_id IS NOT NULL AND public.is_tenant_admin(auth.uid(), tenant_id)
    );

-- ============================================================
-- 12. GRANT PERMISSIONS
-- ============================================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant access to anon users (for invitation acceptance)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.invitations TO anon;
GRANT EXECUTE ON FUNCTION public.accept_invitation TO anon;

COMMIT;