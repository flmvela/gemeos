-- ============================================================
-- RBAC Functions - Phase 1 (FINAL FIXED VERSION)
-- Core permission checking and utility functions
-- ============================================================

-- ============================================================
-- 1. MAIN PERMISSION CHECK FUNCTION
-- Fast, optimized permission checking with caching hints
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_permission(
  p_resource_key text,
  p_action text DEFAULT 'read',
  p_tenant_id uuid DEFAULT NULL
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
  p_permissions jsonb, -- [{"resource": "page:admin", "action": "read"}, ...]
  p_tenant_id uuid DEFAULT NULL
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
    FOR perm_item IN SELECT * 
    FROM jsonb_array_elements(p_permissions) LOOP
      result := result || jsonb_build_object(
        (perm_item->>'resource') || ':' || COALESCE(perm_item->>'action', 'read'),
        true
      );
    END LOOP;
    RETURN result;
  END IF;

  -- Check each permission individually
  FOR perm_item IN SELECT * 
  FROM jsonb_array_elements(p_permissions) LOOP
    SELECT public.check_permission(
      perm_item->>'resource',
      COALESCE(perm_item->>'action', 'read'),
      p_tenant_id
    ) INTO has_access;
    
    result := result || jsonb_build_object(
      (perm_item->>'resource') || ':' || COALESCE(perm_item->>'action', 'read'),
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
-- Return all permissions for current user (for UI loading)
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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Platform admins get all permissions
  IF auth_is_platform_admin() THEN
    RETURN QUERY
    SELECT 
      r.key,
      r.kind,
      r.description,
      ARRAY['read', 'write', 'create', 'update', 'delete', 'admin']::text[],
      'platform_admin'::text,
      NULL::timestamptz
    FROM public.resources r 
    WHERE r.is_active = true;
  ELSE
    RETURN QUERY
    SELECT 
      r.key,
      r.kind,
      r.description,
      rp.actions,
      ur.name,
      rp.expires_at
    FROM public.user_tenants ut
    JOIN public.user_roles ur ON ur.id = ut.role_id
    JOIN public.role_permissions rp ON rp.role_id = ut.role_id
    JOIN public.resources r ON r.id = rp.resource_id
    WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = COALESCE(p_tenant_id, ut.tenant_id)
      AND ut.status = 'active'
      AND r.is_active = true
      AND (rp.expires_at IS NULL OR rp.expires_at > now());
  END IF;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_permissions TO authenticated;

-- ============================================================
-- 4. HELPER FUNCTIONS
-- ============================================================

-- Check if current user is platform admin
CREATE OR REPLACE FUNCTION public.auth_is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_tenants ut
    JOIN public.user_roles ur ON ur.id = ut.role_id
    WHERE ut.user_id = auth.uid()
      AND ur.name = 'platform_admin'
      AND ut.status = 'active'
  );
$$;

-- Grant helper function access
GRANT EXECUTE ON FUNCTION public.auth_is_platform_admin TO authenticated;

-- ============================================================
-- 5. ADMIN UTILITY FUNCTIONS
-- For permission management UI
-- ============================================================

-- Grant permission to a role
CREATE OR REPLACE FUNCTION public.grant_permission(
  p_role_name text,
  p_resource_key text,
  p_actions text[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_uuid uuid;
  resource_uuid uuid;
BEGIN
  -- Only platform admins can grant permissions
  IF NOT auth_is_platform_admin() THEN
    RAISE EXCEPTION 'Access denied. Only platform admins can grant permissions.';
  END IF;

  -- Get role ID
  SELECT id INTO role_uuid 
  FROM public.user_roles 
  WHERE name = p_role_name;
  
  IF role_uuid IS NULL THEN
    RAISE EXCEPTION 'Role % not found', p_role_name;
  END IF;

  -- Get resource ID
  SELECT id INTO resource_uuid 
  FROM public.resources 
  WHERE key = p_resource_key;
  
  IF resource_uuid IS NULL THEN
    RAISE EXCEPTION 'Resource % not found', p_resource_key;
  END IF;

  -- Insert or update permission
  INSERT INTO public.role_permissions (role_id, resource_id, actions)
  VALUES (role_uuid, resource_uuid, p_actions)
  ON CONFLICT (role_id, resource_id) 
  DO UPDATE SET 
    actions = EXCLUDED.actions,
    updated_at = now();

  RETURN true;
END;
$$;

-- Revoke permission from a role
CREATE OR REPLACE FUNCTION public.revoke_permission(
  p_role_name text,
  p_resource_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_uuid uuid;
  resource_uuid uuid;
BEGIN
  -- Only platform admins can revoke permissions
  IF NOT auth_is_platform_admin() THEN
    RAISE EXCEPTION 'Access denied. Only platform admins can revoke permissions.';
  END IF;

  -- Get role ID
  SELECT id INTO role_uuid 
  FROM public.user_roles 
  WHERE name = p_role_name;

  -- Get resource ID  
  SELECT id INTO resource_uuid 
  FROM public.resources 
  WHERE key = p_resource_key;

  -- Delete permission
  DELETE FROM public.role_permissions 
  WHERE role_id = role_uuid AND resource_id = resource_uuid;

  RETURN true;
END;
$$;

-- Grant admin functions to authenticated users
GRANT EXECUTE ON FUNCTION public.grant_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_permission TO authenticated;

-- ============================================================
-- 6. PERMISSION DETAILS VIEW
-- Materialized view for admin UI and reporting
-- ============================================================

CREATE OR REPLACE VIEW public.permission_details AS
SELECT 
  rp.id,
  ur.name as role_name,
  ur.display_name as role_display_name,
  r.key as resource_key,
  r.kind as resource_kind,
  r.description as resource_description,
  r.category as resource_category,
  rp.actions,
  rp.expires_at,
  rp.created_at,
  rp.updated_at,
  rp.role_id,
  rp.resource_id
FROM public.role_permissions rp
JOIN public.user_roles ur ON ur.id = rp.role_id
JOIN public.resources r ON r.id = rp.resource_id
WHERE r.is_active = true
ORDER BY ur.name, r.category, r.key;

-- Grant view access
GRANT SELECT ON public.permission_details TO authenticated;

-- ============================================================
-- COMPLETED: RBAC FUNCTIONS PHASE 1
-- ============================================================

-- Summary of functions created:
-- ✅ check_permission(resource, action, tenant_id) - Core permission check
-- ✅ check_permissions_batch(permissions, tenant_id) - Batch checking
-- ✅ get_user_permissions(tenant_id) - Get all user permissions  
-- ✅ grant_permission(role, resource, actions) - Admin utility
-- ✅ revoke_permission(role, resource) - Admin utility
-- ✅ auth_is_platform_admin() - Helper function
-- ✅ permission_details view - Admin reporting

SELECT 'RBAC Functions Phase 1 - Installation Complete! 🎉' as status;