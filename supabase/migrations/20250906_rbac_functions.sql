-- ============================================================
-- RBAC Functions - Phase 1
-- Core permission checking and utility functions
-- ============================================================

-- ============================================================
-- 1. MAIN PERMISSION CHECK FUNCTION
-- Fast, optimized permission checking with caching hints
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_permission(
  p_tenant_id uuid DEFAULT NULL,
  p_resource_key text,
  p_action text DEFAULT 'read'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  -- Platform admins have access to everything
  SELECT CASE 
    WHEN auth_is_platform_admin() THEN true
    ELSE EXISTS (
      SELECT 1 
      FROM public.user_tenants ut
      JOIN public.role_permissions rp ON rp.role_id = ut.role_id
      JOIN public.resources r ON r.id = rp.resource_id
      WHERE ut.user_id = auth.uid()
        AND ut.tenant_id = COALESCE(p_tenant_id, ut.tenant_id)
        AND ut.status = 'active'
        AND r.key = p_resource_key
        AND r.is_active = true
        AND p_action = ANY(rp.actions)
        AND (rp.expires_at IS NULL OR rp.expires_at > now())
    )
  END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.check_permission TO authenticated;

-- ============================================================
-- 2. BATCH PERMISSION CHECK FUNCTION
-- Check multiple permissions at once for better performance
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_permissions_batch(
  p_tenant_id uuid DEFAULT NULL,
  p_permissions jsonb -- [{"resource": "page:admin", "action": "read"}, ...]
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result jsonb := '{}';
  perm_item jsonb;
  has_access boolean;
BEGIN
  -- Platform admins have access to everything
  IF auth_is_platform_admin() THEN
    FOR perm_item IN SELECT * FROM jsonb_array_elements(p_permissions)
    LOOP
      result := result || jsonb_build_object(
        perm_item->>'resource' || ':' || COALESCE(perm_item->>'action', 'read'),
        true
      );
    END LOOP;
    RETURN result;
  END IF;

  -- Check each permission for regular users
  FOR perm_item IN SELECT * FROM jsonb_array_elements(p_permissions)
  LOOP
    SELECT public.check_permission(
      p_tenant_id,
      perm_item->>'resource',
      COALESCE(perm_item->>'action', 'read')
    ) INTO has_access;
    
    result := result || jsonb_build_object(
      perm_item->>'resource' || ':' || COALESCE(perm_item->>'action', 'read'),
      has_access
    );
  END LOOP;
  
  RETURN result;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.check_permissions_batch TO authenticated;

-- ============================================================
-- 3. GET USER PERMISSIONS FUNCTION
-- Return all permissions for a user (for debugging/UI)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_permissions(
  p_tenant_id uuid DEFAULT NULL
)
RETURNS TABLE (
  resource_key text,
  resource_kind text,
  resource_description text,
  actions text[],
  role_name text,
  expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  -- Platform admins see all resources
  SELECT 
    r.key,
    r.kind,
    r.description,
    ARRAY['read', 'write', 'admin', 'create', 'update', 'delete']::text[],
    'platform_admin'::text,
    NULL::timestamptz
  FROM public.resources r
  WHERE r.is_active = true
    AND auth_is_platform_admin()
  
  UNION ALL
  
  -- Regular users see only their granted permissions
  SELECT 
    r.key,
    r.kind,
    r.description,
    rp.actions,
    ur.name,
    rp.expires_at
  FROM public.user_tenants ut
  JOIN public.role_permissions rp ON rp.role_id = ut.role_id
  JOIN public.resources r ON r.id = rp.resource_id
  JOIN public.user_roles ur ON ur.id = ut.role_id
  WHERE ut.user_id = auth.uid()
    AND ut.tenant_id = COALESCE(p_tenant_id, ut.tenant_id)
    AND ut.status = 'active'
    AND r.is_active = true
    AND (rp.expires_at IS NULL OR rp.expires_at > now())
    AND NOT auth_is_platform_admin()
  
  ORDER BY resource_key, role_name;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_permissions TO authenticated;

-- ============================================================
-- 4. ADMIN UTILITY FUNCTIONS
-- Functions for managing permissions (platform admin only)
-- ============================================================

-- Grant permission to role
CREATE OR REPLACE FUNCTION public.grant_permission(
  p_role_name text,
  p_resource_key text,
  p_actions text[] DEFAULT ARRAY['read']
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_id uuid;
  resource_id uuid;
  permission_id uuid;
BEGIN
  -- Only platform admins can grant permissions
  IF NOT auth_is_platform_admin() THEN
    RAISE EXCEPTION 'Access denied: Only platform admins can grant permissions';
  END IF;

  -- Get role ID
  SELECT id INTO role_id FROM public.user_roles WHERE name = p_role_name;
  IF role_id IS NULL THEN
    RAISE EXCEPTION 'Role not found: %', p_role_name;
  END IF;

  -- Get resource ID
  SELECT id INTO resource_id FROM public.resources WHERE key = p_resource_key;
  IF resource_id IS NULL THEN
    RAISE EXCEPTION 'Resource not found: %', p_resource_key;
  END IF;

  -- Insert or update permission
  INSERT INTO public.role_permissions (role_id, resource_id, actions, granted_by)
  VALUES (role_id, resource_id, p_actions, auth.uid())
  ON CONFLICT (role_id, resource_id) 
  DO UPDATE SET 
    actions = EXCLUDED.actions,
    granted_by = EXCLUDED.granted_by,
    granted_at = now(),
    updated_at = now()
  RETURNING id INTO permission_id;

  RETURN permission_id;
END;
$$;

-- Revoke permission from role
CREATE OR REPLACE FUNCTION public.revoke_permission(
  p_role_name text,
  p_resource_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_id uuid;
  resource_id uuid;
BEGIN
  -- Only platform admins can revoke permissions
  IF NOT auth_is_platform_admin() THEN
    RAISE EXCEPTION 'Access denied: Only platform admins can revoke permissions';
  END IF;

  -- Get IDs
  SELECT ur.id, r.id INTO role_id, resource_id 
  FROM public.user_roles ur, public.resources r
  WHERE ur.name = p_role_name AND r.key = p_resource_key;

  IF role_id IS NULL OR resource_id IS NULL THEN
    RETURN false;
  END IF;

  -- Delete permission
  DELETE FROM public.role_permissions 
  WHERE role_id = role_id AND resource_id = resource_id;

  RETURN true;
END;
$$;

-- ============================================================
-- 5. PERFORMANCE OPTIMIZATIONS
-- ============================================================

-- Create materialized view for frequently accessed permissions
CREATE MATERIALIZED VIEW IF NOT EXISTS public.active_permissions AS
SELECT 
  rp.role_id,
  r.key as resource_key,
  rp.actions,
  ur.name as role_name
FROM public.role_permissions rp
JOIN public.resources r ON r.id = rp.resource_id
JOIN public.user_roles ur ON ur.id = rp.role_id
WHERE r.is_active = true
  AND (rp.expires_at IS NULL OR rp.expires_at > now());

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_permissions_role_resource 
ON public.active_permissions(role_id, resource_key);

-- Refresh function for the materialized view
CREATE OR REPLACE FUNCTION public.refresh_permissions_cache()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.active_permissions;
$$;

-- ============================================================
-- VALIDATION & TESTING
-- ============================================================

DO $$
BEGIN
  -- Test that functions were created
  IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'check_permission') THEN
    RAISE EXCEPTION 'Migration failed: check_permission function not created';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'check_permissions_batch') THEN
    RAISE EXCEPTION 'Migration failed: check_permissions_batch function not created';
  END IF;

  RAISE NOTICE '✅ RBAC Functions Migration completed successfully';
  RAISE NOTICE 'Functions created: check_permission, check_permissions_batch, get_user_permissions';
  RAISE NOTICE 'Admin functions: grant_permission, revoke_permission';
  RAISE NOTICE 'Performance: active_permissions materialized view created';
END
$$;