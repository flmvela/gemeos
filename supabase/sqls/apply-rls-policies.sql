-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================
-- Apply this in Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TENANTS TABLE POLICIES
-- ============================================================
-- Platform admins can see all tenants
CREATE POLICY "Platform admins can view all tenants" ON public.tenants
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.user_roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid()
            AND r.name = 'platform_admin'
            AND ut.status = 'active'
        )
    );

-- Platform admins can create tenants
CREATE POLICY "Platform admins can create tenants" ON public.tenants
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.user_roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid()
            AND r.name = 'platform_admin'
            AND ut.status = 'active'
        )
    );

-- Platform admins can update tenants
CREATE POLICY "Platform admins can update tenants" ON public.tenants
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.user_roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid()
            AND r.name = 'platform_admin'
            AND ut.status = 'active'
        )
    );

-- Users can view their own tenants
CREATE POLICY "Users can view their own tenants" ON public.tenants
    FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT tenant_id FROM public.user_tenants
            WHERE user_id = auth.uid()
            AND status = 'active'
        )
    );

-- ============================================================
-- USER_ROLES TABLE POLICIES
-- ============================================================
-- Everyone can view roles (needed for role lookups)
CREATE POLICY "All authenticated users can view roles" ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (true);

-- ============================================================
-- PROFILES TABLE POLICIES
-- ============================================================
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- Platform admins can view all profiles
CREATE POLICY "Platform admins can view all profiles" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.user_roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid()
            AND r.name = 'platform_admin'
            AND ut.status = 'active'
        )
    );

-- ============================================================
-- USER_TENANTS TABLE POLICIES
-- ============================================================
-- Users can view their own tenant relationships
CREATE POLICY "Users can view their own tenant relationships" ON public.user_tenants
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Platform admins can view all tenant relationships
CREATE POLICY "Platform admins can view all tenant relationships" ON public.user_tenants
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.user_roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid()
            AND r.name = 'platform_admin'
            AND ut.status = 'active'
        )
    );

-- Platform admins can create tenant relationships
CREATE POLICY "Platform admins can create tenant relationships" ON public.user_tenants
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.user_roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid()
            AND r.name = 'platform_admin'
            AND ut.status = 'active'
        )
    );

-- Platform admins can update tenant relationships
CREATE POLICY "Platform admins can update tenant relationships" ON public.user_tenants
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.user_roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid()
            AND r.name = 'platform_admin'
            AND ut.status = 'active'
        )
    );

-- ============================================================
-- INVITATIONS TABLE POLICIES
-- ============================================================
-- Platform admins can view all invitations
CREATE POLICY "Platform admins can view all invitations" ON public.invitations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.user_roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid()
            AND r.name = 'platform_admin'
            AND ut.status = 'active'
        )
    );

-- Platform admins can create invitations
CREATE POLICY "Platform admins can create invitations" ON public.invitations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.user_roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid()
            AND r.name = 'platform_admin'
            AND ut.status = 'active'
        )
    );

-- Platform admins can update invitations
CREATE POLICY "Platform admins can update invitations" ON public.invitations
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.user_roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid()
            AND r.name = 'platform_admin'
            AND ut.status = 'active'
        )
    );

-- Users who invited someone can view their invitations
CREATE POLICY "Users can view invitations they sent" ON public.invitations
    FOR SELECT
    TO authenticated
    USING (invited_by = auth.uid());

-- ============================================================
-- DOMAINS TABLE POLICIES
-- ============================================================
-- All authenticated users can view domains
CREATE POLICY "All authenticated users can view domains" ON public.domains
    FOR SELECT
    TO authenticated
    USING (true);

-- Platform admins can manage domains
CREATE POLICY "Platform admins can manage domains" ON public.domains
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.user_roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid()
            AND r.name = 'platform_admin'
            AND ut.status = 'active'
        )
    );

-- ============================================================
-- TENANT_DOMAINS TABLE POLICIES
-- ============================================================
-- Users can view domains assigned to their tenants
CREATE POLICY "Users can view their tenant domains" ON public.tenant_domains
    FOR SELECT
    TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_tenants
            WHERE user_id = auth.uid()
            AND status = 'active'
        )
    );

-- Platform admins can manage all tenant domains
CREATE POLICY "Platform admins can manage tenant domains" ON public.tenant_domains
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.user_roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid()
            AND r.name = 'platform_admin'
            AND ut.status = 'active'
        )
    );

-- ============================================================
-- GRANT ADDITIONAL PERMISSIONS
-- ============================================================
-- Ensure service role has full access (needed for Edge Functions)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;