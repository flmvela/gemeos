-- TEMPORARY WORKAROUND: Disable the problematic trigger
-- Run this in Supabase dashboard if you need to delete tenants immediately

-- Temporarily drop the trigger to allow tenant operations
DROP TRIGGER IF EXISTS refresh_stats_on_tenant_change ON tenants;

-- You can re-create it later with the fixed function:
-- CREATE TRIGGER refresh_stats_on_tenant_change
-- AFTER INSERT OR UPDATE OR DELETE ON tenants
-- FOR EACH ROW EXECUTE FUNCTION trigger_refresh_tenant_statistics();