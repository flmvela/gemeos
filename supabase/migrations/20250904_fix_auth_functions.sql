-- ============================================================
-- Fix Authentication Functions
-- ============================================================
-- This migration adds the missing database function needed by auth.service.ts
-- ============================================================

-- Create the missing function that auth.service.ts is trying to call
CREATE OR REPLACE FUNCTION public.get_user_tenants_with_roles(p_user_id UUID)
RETURNS TABLE(
    tenant_id UUID,
    tenant_name TEXT,
    tenant_slug TEXT,
    role_name TEXT,
    role_display_name TEXT,
    hierarchy_level INTEGER,
    is_primary BOOLEAN,
    status TEXT,
    joined_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        t.slug as tenant_slug,
        ur.name as role_name,
        ur.display_name as role_display_name,
        ur.hierarchy_level,
        ut.is_primary,
        ut.status,
        ut.joined_at
    FROM public.user_tenants ut
    JOIN public.tenants t ON ut.tenant_id = t.id
    JOIN public.user_roles ur ON ut.role_id = ur.id
    WHERE ut.user_id = p_user_id
    AND ut.status = 'active'
    ORDER BY ut.is_primary DESC, ur.hierarchy_level ASC;
END;
$$;

-- Also create a function to get user session data (what the auth service needs)
CREATE OR REPLACE FUNCTION public.get_user_session_data(p_user_id UUID)
RETURNS TABLE(
    user_id UUID,
    is_platform_admin BOOLEAN,
    primary_tenant_id UUID,
    primary_tenant_name TEXT,
    primary_tenant_slug TEXT,
    primary_role_name TEXT,
    primary_role_display_name TEXT,
    primary_hierarchy_level INTEGER,
    all_tenants JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    primary_tenant_record RECORD;
    all_tenants_json JSONB;
    is_platform_admin_flag BOOLEAN := FALSE;
BEGIN
    -- Check if user is platform admin
    SELECT EXISTS(
        SELECT 1 FROM public.user_tenants ut
        JOIN public.user_roles ur ON ut.role_id = ur.id
        WHERE ut.user_id = p_user_id 
        AND ur.name = 'platform_admin'
        AND ut.status = 'active'
    ) INTO is_platform_admin_flag;

    -- Get primary tenant info
    SELECT 
        t.id, t.name, t.slug, ur.name, ur.display_name, ur.hierarchy_level
    INTO primary_tenant_record
    FROM public.user_tenants ut
    JOIN public.tenants t ON ut.tenant_id = t.id
    JOIN public.user_roles ur ON ut.role_id = ur.id
    WHERE ut.user_id = p_user_id
    AND ut.status = 'active'
    AND ut.is_primary = true
    LIMIT 1;

    -- If no primary tenant, get the first active one
    IF primary_tenant_record IS NULL THEN
        SELECT 
            t.id, t.name, t.slug, ur.name, ur.display_name, ur.hierarchy_level
        INTO primary_tenant_record
        FROM public.user_tenants ut
        JOIN public.tenants t ON ut.tenant_id = t.id
        JOIN public.user_roles ur ON ut.role_id = ur.id
        WHERE ut.user_id = p_user_id
        AND ut.status = 'active'
        ORDER BY ur.hierarchy_level ASC
        LIMIT 1;
    END IF;

    -- Get all user tenants as JSON
    SELECT COALESCE(
        json_agg(
            json_build_object(
                'tenant_id', t.id,
                'tenant_name', t.name,
                'tenant_slug', t.slug,
                'role_name', ur.name,
                'role_display_name', ur.display_name,
                'hierarchy_level', ur.hierarchy_level,
                'is_primary', ut.is_primary,
                'status', ut.status,
                'joined_at', ut.joined_at
            )
        ), '[]'::json
    )::jsonb INTO all_tenants_json
    FROM public.user_tenants ut
    JOIN public.tenants t ON ut.tenant_id = t.id
    JOIN public.user_roles ur ON ut.role_id = ur.id
    WHERE ut.user_id = p_user_id
    AND ut.status = 'active';

    -- Return the session data
    RETURN QUERY SELECT 
        p_user_id,
        is_platform_admin_flag,
        primary_tenant_record.id,
        primary_tenant_record.name,
        primary_tenant_record.slug,
        primary_tenant_record.name,
        primary_tenant_record.display_name,
        primary_tenant_record.hierarchy_level,
        all_tenants_json;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_tenants_with_roles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_session_data(UUID) TO authenticated;