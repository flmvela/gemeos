-- ============================================================
-- ENHANCED RBAC SYSTEM WITH ATTRIBUTE-BASED ACCESS CONTROL
-- ============================================================

-- 1. RESOURCE REGISTRY
-- Centralized registry of all protected resources in the system
CREATE TABLE IF NOT EXISTS public.resource_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type VARCHAR(100) NOT NULL UNIQUE,
  resource_name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_resource VARCHAR(100) REFERENCES resource_registry(resource_type),
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ACTION REGISTRY
-- Define all possible actions in the system
CREATE TABLE IF NOT EXISTS public.action_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_code VARCHAR(50) NOT NULL UNIQUE,
  action_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PERMISSION TEMPLATES
-- Reusable permission sets for common scenarios
CREATE TABLE IF NOT EXISTS public.permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL, -- Array of {resource, actions[]}
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DYNAMIC PERMISSIONS
-- Runtime permission rules with conditions
CREATE TABLE IF NOT EXISTS public.dynamic_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
  resource_type VARCHAR(100) NOT NULL,
  action_code VARCHAR(50) NOT NULL,
  
  -- Conditional access rules (JSONB for flexibility)
  conditions JSONB DEFAULT '{}',
  -- Examples:
  -- {"tenant_id": "specific-tenant-uuid"}
  -- {"owner_id": "$current_user"}
  -- {"status": ["published", "approved"]}
  -- {"time_based": {"from": "09:00", "to": "17:00"}}
  
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT dynamic_permission_unique 
    UNIQUE(role_id, resource_type, action_code, conditions)
);

-- 5. RESOURCE INSTANCES
-- Track specific resource instances for fine-grained control
CREATE TABLE IF NOT EXISTS public.resource_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id),
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT resource_instance_unique 
    UNIQUE(resource_type, resource_id)
);

-- 6. INSTANCE PERMISSIONS
-- Permissions for specific resource instances
CREATE TABLE IF NOT EXISTS public.instance_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_instance_id UUID NOT NULL REFERENCES resource_instances(id) ON DELETE CASCADE,
  grantee_type VARCHAR(20) NOT NULL CHECK (grantee_type IN ('user', 'role', 'group')),
  grantee_id UUID NOT NULL,
  actions TEXT[] NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT instance_permission_unique 
    UNIQUE(resource_instance_id, grantee_type, grantee_id)
);

-- 7. PERMISSION CACHE
-- Materialized view for fast permission lookups
CREATE TABLE IF NOT EXISTS public.permission_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  resource_type VARCHAR(100) NOT NULL,
  action_code VARCHAR(50) NOT NULL,
  is_allowed BOOLEAN NOT NULL,
  conditions JSONB,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes',
  
  CONSTRAINT permission_cache_unique 
    UNIQUE(user_id, tenant_id, resource_type, action_code)
);

-- 8. ROLE HIERARCHIES
-- Define role inheritance relationships
CREATE TABLE IF NOT EXISTS public.role_hierarchies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
  child_role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT role_hierarchy_unique 
    UNIQUE(parent_role_id, child_role_id, tenant_id),
  
  CONSTRAINT no_self_inheritance 
    CHECK (parent_role_id != child_role_id)
);

-- 9. FEATURE FLAGS
-- Control feature access at runtime
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key VARCHAR(100) NOT NULL UNIQUE,
  feature_name VARCHAR(255) NOT NULL,
  description TEXT,
  enabled_for JSONB DEFAULT '{"roles": [], "tenants": [], "users": []}',
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Check if user has permission (with caching)
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id UUID,
  p_tenant_id UUID,
  p_resource_type VARCHAR,
  p_action VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_allowed BOOLEAN;
  v_is_platform_admin BOOLEAN;
  v_cached_result BOOLEAN;
BEGIN
  -- Check platform admin status first
  SELECT EXISTS (
    SELECT 1 FROM user_tenants ut
    JOIN user_roles ur ON ut.role_id = ur.id
    WHERE ut.user_id = p_user_id 
      AND ur.name = 'platform_admin'
      AND ut.status = 'active'
  ) INTO v_is_platform_admin;
  
  IF v_is_platform_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Check cache first
  SELECT is_allowed INTO v_cached_result
  FROM permission_cache
  WHERE user_id = p_user_id
    AND tenant_id = p_tenant_id
    AND resource_type = p_resource_type
    AND action_code = p_action
    AND expires_at > NOW();
  
  IF FOUND THEN
    RETURN v_cached_result;
  END IF;
  
  -- Compute permission
  SELECT EXISTS (
    SELECT 1 FROM user_tenants ut
    JOIN user_roles ur ON ut.role_id = ur.id
    JOIN role_permissions rp ON ur.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ut.user_id = p_user_id
      AND ut.tenant_id = p_tenant_id
      AND ut.status = 'active'
      AND p.resource = p_resource_type
      AND p.action = p_action
  ) INTO v_is_allowed;
  
  -- Cache the result
  INSERT INTO permission_cache (
    user_id, tenant_id, resource_type, action_code, is_allowed
  ) VALUES (
    p_user_id, p_tenant_id, p_resource_type, p_action, v_is_allowed
  ) ON CONFLICT (user_id, tenant_id, resource_type, action_code)
  DO UPDATE SET 
    is_allowed = EXCLUDED.is_allowed,
    computed_at = NOW(),
    expires_at = NOW() + INTERVAL '5 minutes';
  
  RETURN v_is_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get effective permissions for a user in a tenant
CREATE OR REPLACE FUNCTION get_effective_permissions(
  p_user_id UUID,
  p_tenant_id UUID
) RETURNS TABLE (
  resource_type VARCHAR,
  actions TEXT[]
) AS $$
BEGIN
  -- Platform admin gets everything
  IF EXISTS (
    SELECT 1 FROM user_tenants ut
    JOIN user_roles ur ON ut.role_id = ur.id
    WHERE ut.user_id = p_user_id 
      AND ur.name = 'platform_admin'
      AND ut.status = 'active'
  ) THEN
    RETURN QUERY
    SELECT DISTINCT 
      p.resource::VARCHAR,
      array_agg(DISTINCT p.action)::TEXT[]
    FROM permissions p
    GROUP BY p.resource;
  ELSE
    -- Regular user permissions
    RETURN QUERY
    WITH role_permissions AS (
      SELECT DISTINCT p.resource, p.action
      FROM user_tenants ut
      JOIN user_roles ur ON ut.role_id = ur.id
      JOIN role_permissions rp ON ur.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ut.user_id = p_user_id
        AND ut.tenant_id = p_tenant_id
        AND ut.status = 'active'
    ),
    inherited_permissions AS (
      SELECT DISTINCT p.resource, p.action
      FROM user_tenants ut
      JOIN role_hierarchies rh ON ut.role_id = rh.child_role_id
      JOIN role_permissions rp ON rh.parent_role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ut.user_id = p_user_id
        AND (rh.tenant_id = p_tenant_id OR rh.tenant_id IS NULL)
        AND ut.status = 'active'
    ),
    all_permissions AS (
      SELECT resource, action FROM role_permissions
      UNION
      SELECT resource, action FROM inherited_permissions
    )
    SELECT 
      resource::VARCHAR,
      array_agg(DISTINCT action)::TEXT[]
    FROM all_permissions
    GROUP BY resource;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clear permission cache for a user
CREATE OR REPLACE FUNCTION clear_user_permission_cache(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM permission_cache WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-clear cache on role changes
CREATE OR REPLACE FUNCTION trigger_clear_permission_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Clear cache for affected user
  IF TG_TABLE_NAME = 'user_tenants' THEN
    DELETE FROM permission_cache WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  ELSIF TG_TABLE_NAME = 'role_permissions' THEN
    DELETE FROM permission_cache; -- Clear all cache when permissions change
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clear_cache_on_user_tenant_change
  AFTER INSERT OR UPDATE OR DELETE ON user_tenants
  FOR EACH ROW EXECUTE FUNCTION trigger_clear_permission_cache();

CREATE TRIGGER clear_cache_on_role_permission_change
  AFTER INSERT OR UPDATE OR DELETE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION trigger_clear_permission_cache();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_dynamic_permissions_lookup 
  ON dynamic_permissions(role_id, resource_type, action_code) 
  WHERE is_active = TRUE;

CREATE INDEX idx_permission_cache_lookup 
  ON permission_cache(user_id, tenant_id, resource_type, action_code) 
  WHERE expires_at > NOW();

CREATE INDEX idx_resource_instances_lookup 
  ON resource_instances(resource_type, resource_id);

CREATE INDEX idx_instance_permissions_grantee 
  ON instance_permissions(grantee_type, grantee_id);

CREATE INDEX idx_feature_flags_active 
  ON feature_flags(feature_key) 
  WHERE is_active = TRUE;

-- ============================================================
-- INITIAL DATA
-- ============================================================

-- Insert core actions
INSERT INTO action_registry (action_code, action_name, description) VALUES
  ('create', 'Create', 'Create new resources'),
  ('read', 'Read', 'View resources'),
  ('update', 'Update', 'Modify existing resources'),
  ('delete', 'Delete', 'Remove resources'),
  ('publish', 'Publish', 'Make resources publicly available'),
  ('archive', 'Archive', 'Archive resources'),
  ('restore', 'Restore', 'Restore archived resources'),
  ('export', 'Export', 'Export data'),
  ('import', 'Import', 'Import data'),
  ('invite', 'Invite', 'Invite users'),
  ('assign', 'Assign', 'Assign resources to users'),
  ('approve', 'Approve', 'Approve pending items'),
  ('reject', 'Reject', 'Reject pending items')
ON CONFLICT (action_code) DO NOTHING;

-- Insert resource types
INSERT INTO resource_registry (resource_type, resource_name, description) VALUES
  ('domain', 'Learning Domain', 'Educational domains and subjects'),
  ('concept', 'Concept', 'Educational concepts within domains'),
  ('learning_goal', 'Learning Goal', 'Learning objectives and goals'),
  ('user', 'User', 'System users'),
  ('tenant', 'Tenant', 'Organization tenants'),
  ('class', 'Class', 'Student classes'),
  ('assessment', 'Assessment', 'Student assessments'),
  ('analytics', 'Analytics', 'Analytics and reports'),
  ('ai_model', 'AI Model', 'AI model configurations')
ON CONFLICT (resource_type) DO NOTHING;

-- Create permission templates
INSERT INTO permission_templates (template_name, description, permissions, is_system) VALUES
  ('content_creator', 'Standard content creation permissions', 
   '[{"resource": "domain", "actions": ["read", "update"]},
     {"resource": "concept", "actions": ["create", "read", "update"]},
     {"resource": "learning_goal", "actions": ["create", "read", "update"]}]'::JSONB,
   TRUE),
  ('content_reviewer', 'Content review and approval permissions',
   '[{"resource": "domain", "actions": ["read"]},
     {"resource": "concept", "actions": ["read", "approve", "reject"]},
     {"resource": "learning_goal", "actions": ["read", "approve", "reject"]}]'::JSONB,
   TRUE),
  ('class_manager', 'Class and student management permissions',
   '[{"resource": "class", "actions": ["create", "read", "update", "archive"]},
     {"resource": "user", "actions": ["read", "invite", "assign"]}]'::JSONB,
   TRUE)
ON CONFLICT (template_name) DO NOTHING;