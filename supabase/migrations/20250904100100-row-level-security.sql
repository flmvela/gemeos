-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================
-- This migration sets up Row Level Security (RLS) policies to ensure
-- users can only access data they're authorized to see

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TENANTS TABLE POLICIES
-- ============================================================

-- Platform admins can see all tenants
CREATE POLICY "Platform admins can view all tenants" ON public.tenants
    FOR SELECT
    USING (public.is_platform_admin(auth.uid()));

-- Users can see tenants they belong to
CREATE POLICY "Users can view their tenants" ON public.tenants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants
            WHERE user_tenants.tenant_id = tenants.id
            AND user_tenants.user_id = auth.uid()
            AND user_tenants.status = 'active'
        )
    );

-- Only platform admins can create tenants
CREATE POLICY "Platform admins can create tenants" ON public.tenants
    FOR INSERT
    WITH CHECK (public.is_platform_admin(auth.uid()));

-- Platform admins can update any tenant
CREATE POLICY "Platform admins can update tenants" ON public.tenants
    FOR UPDATE
    USING (public.is_platform_admin(auth.uid()));

-- Tenant admins can update their own tenant
CREATE POLICY "Tenant admins can update their tenant" ON public.tenants
    FOR UPDATE
    USING (
        public.user_has_role_in_tenant(auth.uid(), id, 'tenant_admin')
    );

-- ============================================================
-- ROLES TABLE POLICIES
-- ============================================================

-- Everyone can view system roles
CREATE POLICY "Anyone can view system roles" ON public.roles
    FOR SELECT
    USING (is_system_role = TRUE);

-- Only platform admins can manage roles
CREATE POLICY "Platform admins can manage roles" ON public.roles
    FOR ALL
    USING (public.is_platform_admin(auth.uid()));

-- ============================================================
-- PROFILES TABLE POLICIES
-- ============================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can view profiles of users in the same tenant
CREATE POLICY "Users can view profiles in same tenant" ON public.profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut1
            WHERE ut1.user_id = auth.uid()
            AND ut1.status = 'active'
            AND EXISTS (
                SELECT 1 FROM public.user_tenants ut2
                WHERE ut2.user_id = profiles.id
                AND ut2.tenant_id = ut1.tenant_id
                AND ut2.status = 'active'
            )
        )
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can create own profile" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================================
-- USER_TENANTS TABLE POLICIES
-- ============================================================

-- Platform admins can view all user-tenant relationships
CREATE POLICY "Platform admins can view all user_tenants" ON public.user_tenants
    FOR SELECT
    USING (public.is_platform_admin(auth.uid()));

-- Users can view their own tenant memberships
CREATE POLICY "Users can view own tenant memberships" ON public.user_tenants
    FOR SELECT
    USING (user_id = auth.uid());

-- Tenant admins can view all users in their tenant
CREATE POLICY "Tenant admins can view tenant users" ON public.user_tenants
    FOR SELECT
    USING (
        public.user_has_role_in_tenant(auth.uid(), tenant_id, 'tenant_admin')
    );

-- Platform admins can create user-tenant relationships
CREATE POLICY "Platform admins can create user_tenants" ON public.user_tenants
    FOR INSERT
    WITH CHECK (public.is_platform_admin(auth.uid()));

-- Tenant admins can add users to their tenant (for teacher/student roles only)
CREATE POLICY "Tenant admins can add users to tenant" ON public.user_tenants
    FOR INSERT
    WITH CHECK (
        public.user_has_role_in_tenant(auth.uid(), tenant_id, 'tenant_admin')
        AND EXISTS (
            SELECT 1 FROM public.roles
            WHERE roles.id = role_id
            AND roles.name IN ('teacher', 'student')
        )
    );

-- Platform admins can update any user-tenant relationship
CREATE POLICY "Platform admins can update user_tenants" ON public.user_tenants
    FOR UPDATE
    USING (public.is_platform_admin(auth.uid()));

-- Tenant admins can update users in their tenant
CREATE POLICY "Tenant admins can update tenant users" ON public.user_tenants
    FOR UPDATE
    USING (
        public.user_has_role_in_tenant(auth.uid(), tenant_id, 'tenant_admin')
    );

-- ============================================================
-- INVITATIONS TABLE POLICIES
-- ============================================================

-- Platform admins can view all invitations
CREATE POLICY "Platform admins can view all invitations" ON public.invitations
    FOR SELECT
    USING (public.is_platform_admin(auth.uid()));

-- Users can view invitations they sent
CREATE POLICY "Users can view invitations they sent" ON public.invitations
    FOR SELECT
    USING (invited_by = auth.uid());

-- Users can view invitations sent to their email
CREATE POLICY "Users can view invitations to their email" ON public.invitations
    FOR SELECT
    USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Tenant admins can view invitations for their tenant
CREATE POLICY "Tenant admins can view tenant invitations" ON public.invitations
    FOR SELECT
    USING (
        public.user_has_role_in_tenant(auth.uid(), tenant_id, 'tenant_admin')
    );

-- Platform admins can create invitations for any tenant
CREATE POLICY "Platform admins can create invitations" ON public.invitations
    FOR INSERT
    WITH CHECK (
        public.is_platform_admin(auth.uid())
    );

-- Tenant admins can create invitations for their tenant (teacher/student only)
CREATE POLICY "Tenant admins can invite to their tenant" ON public.invitations
    FOR INSERT
    WITH CHECK (
        public.user_has_role_in_tenant(auth.uid(), tenant_id, 'tenant_admin')
        AND role_name IN ('teacher', 'student')
    );

-- Users can update invitations they sent
CREATE POLICY "Users can update invitations they sent" ON public.invitations
    FOR UPDATE
    USING (invited_by = auth.uid());

-- Users can accept invitations sent to them
CREATE POLICY "Users can accept their invitations" ON public.invitations
    FOR UPDATE
    USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ============================================================
-- DOMAINS TABLE POLICIES
-- ============================================================

-- Everyone can view active domains
CREATE POLICY "Anyone can view active domains" ON public.domains
    FOR SELECT
    USING (is_active = TRUE);

-- Platform admins can manage all domains
CREATE POLICY "Platform admins can manage domains" ON public.domains
    FOR ALL
    USING (public.is_platform_admin(auth.uid()));

-- ============================================================
-- TENANT_DOMAINS TABLE POLICIES
-- ============================================================

-- Platform admins can view all tenant-domain assignments
CREATE POLICY "Platform admins can view all tenant_domains" ON public.tenant_domains
    FOR SELECT
    USING (public.is_platform_admin(auth.uid()));

-- Users can view domain assignments for their tenants
CREATE POLICY "Users can view their tenant domains" ON public.tenant_domains
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants
            WHERE user_tenants.tenant_id = tenant_domains.tenant_id
            AND user_tenants.user_id = auth.uid()
            AND user_tenants.status = 'active'
        )
    );

-- Platform admins can create domain assignments
CREATE POLICY "Platform admins can assign domains" ON public.tenant_domains
    FOR INSERT
    WITH CHECK (public.is_platform_admin(auth.uid()));

-- Platform admins can update domain assignments
CREATE POLICY "Platform admins can update domain assignments" ON public.tenant_domains
    FOR UPDATE
    USING (public.is_platform_admin(auth.uid()));

-- Tenant admins can update domain settings for their tenant
CREATE POLICY "Tenant admins can update their domain settings" ON public.tenant_domains
    FOR UPDATE
    USING (
        public.user_has_role_in_tenant(auth.uid(), tenant_id, 'tenant_admin')
    );

-- Platform admins can remove domain assignments
CREATE POLICY "Platform admins can remove domain assignments" ON public.tenant_domains
    FOR DELETE
    USING (public.is_platform_admin(auth.uid()));

-- ============================================================
-- AUDIT_LOGS TABLE POLICIES
-- ============================================================

-- Platform admins can view all audit logs
CREATE POLICY "Platform admins can view all audit logs" ON public.audit_logs
    FOR SELECT
    USING (public.is_platform_admin(auth.uid()));

-- Tenant admins can view audit logs for their tenant
CREATE POLICY "Tenant admins can view tenant audit logs" ON public.audit_logs
    FOR SELECT
    USING (
        tenant_id IS NOT NULL 
        AND public.user_has_role_in_tenant(auth.uid(), tenant_id, 'tenant_admin')
    );

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT
    USING (user_id = auth.uid());

-- System can create audit logs (no user restriction for INSERT)
CREATE POLICY "System can create audit logs" ON public.audit_logs
    FOR INSERT
    WITH CHECK (TRUE);

-- ============================================================
-- ADDITIONAL SECURITY FUNCTIONS
-- ============================================================

-- Function to check if user can access tenant data
CREATE OR REPLACE FUNCTION public.can_access_tenant(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_tenants
        WHERE tenant_id = p_tenant_id
        AND user_id = auth.uid()
        AND status = 'active'
    ) OR public.is_platform_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can manage tenant
CREATE OR REPLACE FUNCTION public.can_manage_tenant(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.user_has_role_in_tenant(auth.uid(), p_tenant_id, 'tenant_admin')
        OR public.is_platform_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;