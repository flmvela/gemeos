-- ============================================================
-- ADVANCED TRIGGERS AND FUNCTIONS
-- ============================================================
-- This migration creates advanced triggers and functions for
-- data integrity, automation, and business logic

-- ============================================================
-- PROFILE MANAGEMENT
-- ============================================================

-- Automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- INVITATION MANAGEMENT
-- ============================================================

-- Function to validate invitation before acceptance
CREATE OR REPLACE FUNCTION public.validate_invitation(p_invitation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_invitation RECORD;
BEGIN
    SELECT * INTO v_invitation
    FROM public.invitations
    WHERE id = p_invitation_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation not found';
    END IF;
    
    IF v_invitation.status != 'pending' THEN
        RAISE EXCEPTION 'Invitation is not pending';
    END IF;
    
    IF v_invitation.expires_at < NOW() THEN
        -- Update status to expired
        UPDATE public.invitations
        SET status = 'expired', updated_at = NOW()
        WHERE id = p_invitation_id;
        RAISE EXCEPTION 'Invitation has expired';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept invitation and create user-tenant relationship
CREATE OR REPLACE FUNCTION public.accept_invitation(
    p_invitation_token VARCHAR,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_invitation RECORD;
    v_user_tenant RECORD;
BEGIN
    -- Find invitation by token
    SELECT * INTO v_invitation
    FROM public.invitations
    WHERE invitation_token = p_invitation_token
    AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invitation token';
    END IF;
    
    -- Validate invitation
    PERFORM public.validate_invitation(v_invitation.id);
    
    -- Check if user already exists in tenant
    SELECT * INTO v_user_tenant
    FROM public.user_tenants
    WHERE user_id = p_user_id
    AND tenant_id = v_invitation.tenant_id;
    
    IF FOUND THEN
        RAISE EXCEPTION 'User already exists in this tenant';
    END IF;
    
    -- Create user-tenant relationship
    INSERT INTO public.user_tenants (
        user_id,
        tenant_id,
        role_id,
        status,
        invited_by,
        joined_at,
        is_primary
    ) VALUES (
        p_user_id,
        v_invitation.tenant_id,
        v_invitation.role_id,
        'active',
        v_invitation.invited_by,
        NOW(),
        FALSE
    );
    
    -- Update invitation status
    UPDATE public.invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        accepted_by = p_user_id,
        updated_at = NOW()
    WHERE id = v_invitation.id;
    
    -- Log the action
    INSERT INTO public.audit_logs (
        tenant_id,
        user_id,
        action,
        resource_type,
        resource_id,
        changes
    ) VALUES (
        v_invitation.tenant_id,
        p_user_id,
        'invitation_accepted',
        'invitation',
        v_invitation.id,
        jsonb_build_object(
            'invitation_id', v_invitation.id,
            'role_name', v_invitation.role_name
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'tenant_id', v_invitation.tenant_id,
        'role_name', v_invitation.role_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TENANT MANAGEMENT
-- ============================================================

-- Function to check tenant limits before adding users
CREATE OR REPLACE FUNCTION public.check_tenant_user_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant RECORD;
    v_user_count INTEGER;
BEGIN
    -- Get tenant information
    SELECT * INTO v_tenant
    FROM public.tenants
    WHERE id = NEW.tenant_id;
    
    -- Count active users in tenant
    SELECT COUNT(*) INTO v_user_count
    FROM public.user_tenants
    WHERE tenant_id = NEW.tenant_id
    AND status = 'active';
    
    -- Check if limit exceeded
    IF v_user_count >= v_tenant.max_users THEN
        RAISE EXCEPTION 'Tenant user limit (%) exceeded', v_tenant.max_users;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check tenant user limits
CREATE TRIGGER check_tenant_user_limit_trigger
    BEFORE INSERT ON public.user_tenants
    FOR EACH ROW EXECUTE FUNCTION public.check_tenant_user_limit();

-- Function to check tenant domain limits
CREATE OR REPLACE FUNCTION public.check_tenant_domain_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant RECORD;
    v_domain_count INTEGER;
BEGIN
    -- Get tenant information
    SELECT * INTO v_tenant
    FROM public.tenants
    WHERE id = NEW.tenant_id;
    
    -- Count assigned domains
    SELECT COUNT(*) INTO v_domain_count
    FROM public.tenant_domains
    WHERE tenant_id = NEW.tenant_id;
    
    -- Check if limit exceeded
    IF v_domain_count >= v_tenant.max_domains THEN
        RAISE EXCEPTION 'Tenant domain limit (%) exceeded', v_tenant.max_domains;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check tenant domain limits
CREATE TRIGGER check_tenant_domain_limit_trigger
    BEFORE INSERT ON public.tenant_domains
    FOR EACH ROW EXECUTE FUNCTION public.check_tenant_domain_limit();

-- ============================================================
-- AUDIT LOGGING
-- ============================================================

-- Function to automatically log tenant changes
CREATE OR REPLACE FUNCTION public.audit_tenant_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        tenant_id,
        user_id,
        action,
        resource_type,
        resource_id,
        changes
    ) VALUES (
        NEW.id,
        auth.uid(),
        TG_OP,
        'tenant',
        NEW.id,
        jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for important tables
CREATE TRIGGER audit_tenant_changes
    AFTER UPDATE OR DELETE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.audit_tenant_changes();

-- Function to log user-tenant changes
CREATE OR REPLACE FUNCTION public.audit_user_tenant_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        tenant_id,
        user_id,
        action,
        resource_type,
        resource_id,
        changes
    ) VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        auth.uid(),
        TG_OP,
        'user_tenant',
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW),
            'affected_user_id', COALESCE(NEW.user_id, OLD.user_id)
        )
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_user_tenant_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.user_tenants
    FOR EACH ROW EXECUTE FUNCTION public.audit_user_tenant_changes();

-- ============================================================
-- CLEANUP FUNCTIONS
-- ============================================================

-- Function to clean up expired invitations (can be called periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.invitations
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'pending'
    AND expires_at < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ensure only one primary tenant per user
CREATE OR REPLACE FUNCTION public.ensure_single_primary_tenant()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = TRUE THEN
        -- Remove primary flag from other tenants for this user
        UPDATE public.user_tenants
        SET is_primary = FALSE,
            updated_at = NOW()
        WHERE user_id = NEW.user_id
        AND id != NEW.id
        AND is_primary = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_tenant_trigger
    BEFORE INSERT OR UPDATE OF is_primary ON public.user_tenants
    FOR EACH ROW
    WHEN (NEW.is_primary = TRUE)
    EXECUTE FUNCTION public.ensure_single_primary_tenant();

-- ============================================================
-- STATISTICS FUNCTIONS
-- ============================================================

-- Function to get tenant statistics
CREATE OR REPLACE FUNCTION public.get_tenant_statistics(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_users', COUNT(DISTINCT ut.user_id),
        'active_users', COUNT(DISTINCT ut.user_id) FILTER (WHERE ut.status = 'active'),
        'total_domains', COUNT(DISTINCT td.domain_id),
        'active_domains', COUNT(DISTINCT td.domain_id) FILTER (WHERE td.is_active = TRUE),
        'pending_invitations', COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'pending'),
        'teachers', COUNT(DISTINCT ut.user_id) FILTER (WHERE r.name = 'teacher'),
        'students', COUNT(DISTINCT ut.user_id) FILTER (WHERE r.name = 'student')
    ) INTO v_stats
    FROM public.tenants t
    LEFT JOIN public.user_tenants ut ON t.id = ut.tenant_id
    LEFT JOIN public.roles r ON ut.role_id = r.id
    LEFT JOIN public.tenant_domains td ON t.id = td.tenant_id
    LEFT JOIN public.invitations i ON t.id = i.tenant_id
    WHERE t.id = p_tenant_id
    GROUP BY t.id;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VALIDATION FUNCTIONS
-- ============================================================

-- Function to validate email format
CREATE OR REPLACE FUNCTION public.is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate slug format
CREATE OR REPLACE FUNCTION public.is_valid_slug(slug TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add validation constraints using the functions
ALTER TABLE public.invitations 
    ADD CONSTRAINT check_valid_email 
    CHECK (public.is_valid_email(email));

ALTER TABLE public.tenants 
    ADD CONSTRAINT check_valid_slug 
    CHECK (public.is_valid_slug(slug));