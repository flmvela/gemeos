-- Optimize Access Control Tables for Performance and Platform Admin Support
-- This migration adds indexes and optimizes the access control schema

-- Add platform admin flag to user profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT false;

-- Create index for faster platform admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_platform_admin 
ON public.profiles(is_platform_admin) 
WHERE is_platform_admin = true;

-- Add indexes for page_permissions table
CREATE INDEX IF NOT EXISTS idx_page_permissions_role 
ON public.page_permissions(role);

CREATE INDEX IF NOT EXISTS idx_page_permissions_page_role 
ON public.page_permissions(page_id, role);

CREATE INDEX IF NOT EXISTS idx_page_permissions_active 
ON public.page_permissions(is_active) 
WHERE is_active = true;

-- Add indexes for pages table
CREATE INDEX IF NOT EXISTS idx_pages_path 
ON public.pages(path);

-- Create audit log indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
ON public.audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource 
ON public.audit_logs(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
ON public.audit_logs(action);

-- Create a materialized view for user accessible paths (for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_accessible_paths_mv AS
SELECT 
    pp.role,
    p.path,
    p.id as page_id,
    pp.is_active
FROM public.page_permissions pp
JOIN public.pages p ON pp.page_id = p.id
WHERE pp.is_active = true;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_user_accessible_paths_mv_role 
ON user_accessible_paths_mv(role);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_user_accessible_paths()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_accessible_paths_mv;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view on changes
CREATE OR REPLACE FUNCTION trigger_refresh_accessible_paths()
RETURNS trigger AS $$
BEGIN
    -- Async refresh to avoid blocking
    PERFORM pg_notify('refresh_accessible_paths', '');
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic refresh
CREATE TRIGGER refresh_paths_on_permission_change
AFTER INSERT OR UPDATE OR DELETE ON public.page_permissions
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_accessible_paths();

CREATE TRIGGER refresh_paths_on_page_change
AFTER INSERT OR UPDATE OR DELETE ON public.pages
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_accessible_paths();

-- Function to check if user is platform admin (optimized)
CREATE OR REPLACE FUNCTION is_platform_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- First check profiles table
    SELECT is_platform_admin INTO is_admin
    FROM public.profiles
    WHERE profiles.user_id = $1;
    
    IF is_admin IS NOT NULL THEN
        RETURN is_admin;
    END IF;
    
    -- Fallback to JWT check
    RETURN (auth.jwt() ->> 'is_platform_admin')::boolean = true;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function for fast permission check with platform admin bypass
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id UUID,
    p_resource TEXT,
    p_action TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Platform admin bypass
    IF is_platform_admin(p_user_id) THEN
        RETURN true;
    END IF;
    
    -- Regular permission check
    -- Implementation depends on your permission model
    RETURN false; -- Placeholder
END;
$$ LANGUAGE plpgsql STABLE;

-- Update RLS policies to use the optimized platform admin check
ALTER POLICY "Admins can manage pages" ON public.pages
USING (is_platform_admin(auth.uid()));

ALTER POLICY "Admins can manage page permissions" ON public.page_permissions
USING (is_platform_admin(auth.uid()));

-- Add policy for platform admins to bypass all checks
CREATE POLICY "Platform admins have universal access" 
ON public.pages 
FOR ALL 
TO authenticated
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

-- Performance monitoring function
CREATE OR REPLACE FUNCTION get_access_control_stats()
RETURNS TABLE (
    total_pages BIGINT,
    total_permissions BIGINT,
    active_permissions BIGINT,
    platform_admins BIGINT,
    cache_hit_ratio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.pages) as total_pages,
        (SELECT COUNT(*) FROM public.page_permissions) as total_permissions,
        (SELECT COUNT(*) FROM public.page_permissions WHERE is_active = true) as active_permissions,
        (SELECT COUNT(*) FROM public.profiles WHERE is_platform_admin = true) as platform_admins,
        ROUND(
            (SELECT SUM(heap_blks_hit)::numeric / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0) * 100 
             FROM pg_statio_user_tables 
             WHERE schemaname = 'public' 
             AND tablename IN ('pages', 'page_permissions')), 
            2
        ) as cache_hit_ratio;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON user_accessible_paths_mv TO authenticated;
GRANT EXECUTE ON FUNCTION is_platform_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_permission(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_access_control_stats() TO authenticated;

-- Comments for documentation
COMMENT ON COLUMN public.profiles.is_platform_admin IS 'Indicates if user has platform administrator privileges with universal access';
COMMENT ON MATERIALIZED VIEW user_accessible_paths_mv IS 'Cached view of user accessible paths for performance optimization';
COMMENT ON FUNCTION is_platform_admin IS 'Optimized function to check if a user is a platform administrator';
COMMENT ON FUNCTION check_user_permission IS 'Main permission checking function with platform admin bypass';