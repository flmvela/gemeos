-- =====================================================
-- ACCESS MANAGEMENT SYSTEM OPTIMIZATION MIGRATION
-- =====================================================
-- This migration enhances the access management system with:
-- 1. Platform admin flag for universal access
-- 2. Performance indexes for permission checks
-- 3. Materialized views for access paths
-- 4. Audit logging enhancements
-- 5. Optimized RLS policies

-- =====================================================
-- STEP 1: Add platform_admin flag to profiles
-- =====================================================

-- Add is_platform_admin column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT FALSE;

-- Set admin@gemeos.ai as platform admin
UPDATE profiles 
SET is_platform_admin = TRUE 
WHERE email = 'admin@gemeos.ai';

-- Create index for platform admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_platform_admin 
ON profiles(is_platform_admin) 
WHERE is_platform_admin = TRUE;

-- =====================================================
-- STEP 2: Create user_permissions table for fine-grained control
-- =====================================================

CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, resource, action)
);

-- Add indexes for user permissions
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id 
ON user_permissions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_permissions_resource_action 
ON user_permissions(resource, action);

CREATE INDEX IF NOT EXISTS idx_user_permissions_expires 
ON user_permissions(expires_at) 
WHERE expires_at IS NOT NULL;

-- =====================================================
-- STEP 3: Performance indexes for existing tables
-- =====================================================

-- Indexes for page_permissions table
CREATE INDEX IF NOT EXISTS idx_page_permissions_page_role 
ON page_permissions(page_id, role) 
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_page_permissions_role_active 
ON page_permissions(role) 
WHERE is_active = TRUE;

-- Indexes for pages table
CREATE INDEX IF NOT EXISTS idx_pages_path 
ON pages(path);

-- Pattern matching index for dynamic routes
CREATE INDEX IF NOT EXISTS idx_pages_path_pattern 
ON pages(path) 
WHERE path LIKE '%:%';

-- Indexes for role_permissions table (if exists)
CREATE INDEX IF NOT EXISTS idx_role_permissions_role 
ON role_permissions(role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission 
ON role_permissions(permission_id);

-- Composite index for role-permission lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_composite 
ON role_permissions(role_id, permission_id);

-- =====================================================
-- STEP 4: Create materialized view for user access paths
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_accessible_routes AS
WITH user_roles AS (
  SELECT 
    p.user_id,
    p.email,
    p.is_platform_admin,
    COALESCE(
      CASE 
        WHEN ut.role_id IS NOT NULL THEN r.name
        ELSE p.app_metadata->>'role'
      END,
      'guest'
    ) AS role_name
  FROM profiles p
  LEFT JOIN user_tenants ut ON p.user_id = ut.user_id AND ut.status = 'active'
  LEFT JOIN roles r ON ut.role_id = r.id
),
accessible_routes AS (
  SELECT DISTINCT
    ur.user_id,
    ur.email,
    pg.path,
    CASE 
      WHEN ur.is_platform_admin THEN 'platform_admin'
      ELSE ur.role_name
    END AS access_reason
  FROM user_roles ur
  CROSS JOIN pages pg
  LEFT JOIN page_permissions pp ON pg.id = pp.page_id AND pp.role = ur.role_name
  WHERE 
    ur.is_platform_admin = TRUE -- Platform admins get all routes
    OR (pp.is_active = TRUE AND pp.role = ur.role_name)
)
SELECT * FROM accessible_routes;

-- Create indexes on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_user_routes_unique 
ON mv_user_accessible_routes(user_id, path);

CREATE INDEX IF NOT EXISTS idx_mv_user_routes_user 
ON mv_user_accessible_routes(user_id);

CREATE INDEX IF NOT EXISTS idx_mv_user_routes_email 
ON mv_user_accessible_routes(email);

-- =====================================================
-- STEP 5: Enhanced audit logging
-- =====================================================

-- Add indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user 
ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant 
ON audit_logs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created 
ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_resource 
ON audit_logs(action, resource_type);

-- Partial index for permission-related audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_permissions 
ON audit_logs(action, resource_type) 
WHERE action IN ('permission_check', 'permission_update', 'permission_grant', 'permission_revoke');

-- =====================================================
-- STEP 6: Optimized RLS policies
-- =====================================================

-- Drop existing policies if they exist to recreate with optimizations
DROP POLICY IF EXISTS "Platform admins have full access" ON pages;
DROP POLICY IF EXISTS "Platform admins have full access" ON page_permissions;
DROP POLICY IF EXISTS "Platform admins have full access" ON user_permissions;
DROP POLICY IF EXISTS "Platform admins have full access" ON audit_logs;

-- Create optimized RLS policy for platform admins (pages table)
CREATE POLICY "Platform admins have full access" ON pages
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_platform_admin = TRUE
  )
);

-- Create optimized RLS policy for platform admins (page_permissions table)
CREATE POLICY "Platform admins have full access" ON page_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_platform_admin = TRUE
  )
);

-- Create optimized RLS policy for platform admins (user_permissions table)
CREATE POLICY "Platform admins have full access" ON user_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_platform_admin = TRUE
  )
);

-- Users can view their own permissions
CREATE POLICY "Users can view own permissions" ON user_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create optimized RLS policy for audit logs
CREATE POLICY "Platform admins can view all audit logs" ON audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_platform_admin = TRUE
  )
);

-- =====================================================
-- STEP 7: Create helper functions
-- =====================================================

-- Function to check if user is platform admin (cached)
CREATE OR REPLACE FUNCTION is_platform_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT is_platform_admin INTO is_admin
  FROM profiles
  WHERE profiles.user_id = $1;
  
  RETURN COALESCE(is_admin, FALSE);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check user permission with platform admin bypass
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id UUID,
  p_resource TEXT,
  p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN;
BEGIN
  -- Check if user is platform admin first (fast path)
  IF is_platform_admin(p_user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Check user-specific permissions
  SELECT EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = p_user_id
    AND resource = p_resource
    AND action = p_action
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO has_permission;
  
  IF has_permission THEN
    RETURN TRUE;
  END IF;
  
  -- Check role-based permissions
  SELECT EXISTS (
    SELECT 1 
    FROM profiles p
    LEFT JOIN user_tenants ut ON p.user_id = ut.user_id
    LEFT JOIN role_permissions rp ON rp.role_id = ut.role_id
    LEFT JOIN permissions perm ON perm.id = rp.permission_id
    WHERE p.user_id = p_user_id
    AND perm.resource = p_resource
    AND perm.action = p_action
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to refresh materialized view (can be called periodically)
CREATE OR REPLACE FUNCTION refresh_user_routes_view()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_accessible_routes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 8: Create triggers for automatic updates
-- =====================================================

-- Trigger to log permission changes
CREATE OR REPLACE FUNCTION log_permission_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    changes,
    created_at
  ) VALUES (
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'permission_grant'
      WHEN TG_OP = 'UPDATE' THEN 'permission_update'
      WHEN TG_OP = 'DELETE' THEN 'permission_revoke'
    END,
    'permission',
    NEW.id,
    jsonb_build_object(
      'resource', NEW.resource,
      'action', NEW.action,
      'user_id', NEW.user_id,
      'operation', TG_OP
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to user_permissions table
DROP TRIGGER IF EXISTS trigger_log_permission_change ON user_permissions;
CREATE TRIGGER trigger_log_permission_change
AFTER INSERT OR UPDATE OR DELETE ON user_permissions
FOR EACH ROW
EXECUTE FUNCTION log_permission_change();

-- =====================================================
-- STEP 9: Performance statistics table
-- =====================================================

CREATE TABLE IF NOT EXISTS access_check_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  resource TEXT,
  action TEXT,
  check_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE,
  result BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for statistics
CREATE INDEX IF NOT EXISTS idx_access_stats_user 
ON access_check_stats(user_id);

CREATE INDEX IF NOT EXISTS idx_access_stats_created 
ON access_check_stats(created_at DESC);

-- Partition by month for better performance (optional)
-- This would require PostgreSQL 10+ and additional setup

-- =====================================================
-- STEP 10: Grant necessary permissions
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT ON mv_user_accessible_routes TO authenticated;
GRANT EXECUTE ON FUNCTION is_platform_admin TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_permission TO authenticated;

-- Grant permissions for service role (for background jobs)
GRANT EXECUTE ON FUNCTION refresh_user_routes_view TO service_role;

-- =====================================================
-- STEP 11: Initial data refresh
-- =====================================================

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW mv_user_accessible_routes;

-- =====================================================
-- STEP 12: Create scheduled job for view refresh (optional)
-- =====================================================
-- Note: This requires pg_cron extension
-- Uncomment if pg_cron is available

-- SELECT cron.schedule(
--   'refresh-user-routes',
--   '*/15 * * * *', -- Every 15 minutes
--   'SELECT refresh_user_routes_view();'
-- );

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration provides:
-- 1. Platform admin flag with universal access bypass
-- 2. Optimized indexes for fast permission lookups
-- 3. Materialized view for cached route access
-- 4. Enhanced audit logging with automatic triggers
-- 5. Helper functions for permission checks
-- 6. Statistics tracking for performance monitoring