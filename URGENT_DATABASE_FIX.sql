-- URGENT: Fix the tenant trigger that's preventing tenant creation/deletion
-- Run this SQL in your Supabase dashboard under SQL Editor

-- Replace the broken trigger function with the corrected version
CREATE OR REPLACE FUNCTION trigger_refresh_tenant_statistics()
RETURNS TRIGGER AS $$
DECLARE
    affected_tenant_id UUID;
BEGIN
    -- Determine the tenant_id based on which table triggered the function
    IF TG_TABLE_NAME = 'tenants' THEN
        -- For the tenants table, use the 'id' field (NOT tenant_id)
        affected_tenant_id := COALESCE(NEW.id, OLD.id);
    ELSE
        -- For other tables (user_tenants, tenant_domains), use tenant_id field
        affected_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    END IF;
    
    -- Use pg_notify to signal that a refresh is needed
    PERFORM pg_notify('tenant_stats_refresh', json_build_object(
        'action', TG_OP,
        'table', TG_TABLE_NAME,
        'tenant_id', affected_tenant_id
    )::text);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;