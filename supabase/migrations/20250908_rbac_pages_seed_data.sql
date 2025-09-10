-- RBAC Pages Tab Seed Data Migration
-- Purpose: Populate required data for RBAC Management Pages tab testing
-- Date: 2025-09-08

-- 1. Insert System Roles (if not exists)
INSERT INTO user_roles (name, display_name, description, is_system)
VALUES 
  ('platform_admin', 'Platform Admin', 'Full system administration access', true),
  ('tenant_admin', 'Tenant Admin', 'Tenant-level administration access', true),
  ('teacher', 'Teacher', 'Teacher access to educational features', true),
  ('student', 'Student', 'Student access to learning features', true)
ON CONFLICT (name) DO UPDATE
SET 
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;

-- 2. Insert Page Resources
INSERT INTO resources (key, kind, description, category, is_active)
VALUES 
  -- Dashboard Pages
  ('page:admin_dashboard', 'page', 'Platform administrator main dashboard', 'dashboard', true),
  ('page:tenant_dashboard', 'page', 'Tenant administrator dashboard', 'dashboard', true),
  ('page:teacher_dashboard', 'page', 'Teacher main dashboard', 'dashboard', true),
  
  -- Domain Management Pages
  ('page:domain_selection', 'page', 'Domain selection interface', 'content', true),
  ('page:domain_management', 'page', 'Domain administration page', 'content', true),
  ('page:domain_admin', 'page', 'Domain detail administration', 'content', true),
  ('page:domain_concepts', 'page', 'Domain concepts management', 'content', true),
  ('page:learning_goals', 'page', 'Learning goals configuration', 'content', true),
  ('page:ai_guidance', 'page', 'AI guidance configuration', 'content', true),
  
  -- User Management Pages
  ('page:tenant_management', 'page', 'Tenant management interface', 'users', true),
  ('page:create_tenant', 'page', 'Create new tenant form', 'users', true),
  ('page:edit_tenant', 'page', 'Edit tenant details', 'users', true),
  ('page:access_management', 'page', 'User access control', 'users', true),
  
  -- System Pages
  ('page:rbac_management', 'page', 'RBAC permission management', 'system', true),
  ('page:rbac_permissions', 'page', 'Permission configuration', 'system', true),
  ('page:permissions', 'page', 'General permissions page', 'system', true),
  ('page:upload', 'page', 'File upload interface', 'system', true),
  ('page:feedback_settings', 'page', 'Feedback configuration', 'system', true),
  
  -- Class Management
  ('page:class_creation', 'page', 'Create new class interface', 'content', true),
  ('page:curriculum_setup', 'page', 'Curriculum configuration', 'content', true),
  ('page:administration', 'page', 'General administration', 'system', true)
ON CONFLICT (key) DO UPDATE
SET 
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active;

-- 3. Create Permission Matrix Function
CREATE OR REPLACE FUNCTION setup_default_permissions()
RETURNS void AS $$
DECLARE
  v_role_id uuid;
  v_resource_id uuid;
BEGIN
  -- Platform Admin gets full CRUD on all pages
  SELECT id INTO v_role_id FROM user_roles WHERE name = 'platform_admin';
  
  FOR v_resource_id IN (SELECT id FROM resources WHERE kind = 'page')
  LOOP
    INSERT INTO role_permissions (role_id, resource_id, actions)
    VALUES (v_role_id, v_resource_id, ARRAY['create', 'read', 'update', 'delete'])
    ON CONFLICT (role_id, resource_id) DO UPDATE
    SET actions = ARRAY['create', 'read', 'update', 'delete'];
  END LOOP;
  
  -- Tenant Admin gets CRUD on tenant-level pages
  SELECT id INTO v_role_id FROM user_roles WHERE name = 'tenant_admin';
  
  FOR v_resource_id IN (
    SELECT id FROM resources 
    WHERE kind = 'page' 
    AND key IN (
      'page:tenant_dashboard',
      'page:teacher_dashboard',
      'page:domain_management',
      'page:class_creation',
      'page:access_management',
      'page:curriculum_setup'
    )
  )
  LOOP
    INSERT INTO role_permissions (role_id, resource_id, actions)
    VALUES (v_role_id, v_resource_id, ARRAY['create', 'read', 'update', 'delete'])
    ON CONFLICT (role_id, resource_id) DO UPDATE
    SET actions = ARRAY['create', 'read', 'update', 'delete'];
  END LOOP;
  
  -- Teacher gets read/update on educational pages
  SELECT id INTO v_role_id FROM user_roles WHERE name = 'teacher';
  
  FOR v_resource_id IN (
    SELECT id FROM resources 
    WHERE kind = 'page' 
    AND key IN (
      'page:teacher_dashboard',
      'page:domain_selection',
      'page:class_creation',
      'page:curriculum_setup',
      'page:learning_goals'
    )
  )
  LOOP
    INSERT INTO role_permissions (role_id, resource_id, actions)
    VALUES (v_role_id, v_resource_id, ARRAY['read', 'update'])
    ON CONFLICT (role_id, resource_id) DO UPDATE
    SET actions = ARRAY['read', 'update'];
  END LOOP;
  
  -- Student gets read-only on specific pages
  SELECT id INTO v_role_id FROM user_roles WHERE name = 'student';
  
  FOR v_resource_id IN (
    SELECT id FROM resources 
    WHERE kind = 'page' 
    AND key IN (
      'page:domain_selection',
      'page:learning_goals'
    )
  )
  LOOP
    INSERT INTO role_permissions (role_id, resource_id, actions)
    VALUES (v_role_id, v_resource_id, ARRAY['read'])
    ON CONFLICT (role_id, resource_id) DO UPDATE
    SET actions = ARRAY['read'];
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Execute permission setup
SELECT setup_default_permissions();

-- 5. Add Feature Resources for testing
INSERT INTO resources (key, kind, description, category, is_active)
VALUES 
  ('feature:bulk_upload', 'feature', 'Bulk data upload capability', 'feature', true),
  ('feature:ai_generation', 'feature', 'AI content generation', 'feature', true),
  ('feature:export_data', 'feature', 'Data export functionality', 'feature', true),
  ('feature:analytics', 'feature', 'Analytics and reporting', 'feature', true)
ON CONFLICT (key) DO NOTHING;

-- 6. Verify data insertion
DO $$
DECLARE
  role_count int;
  resource_count int;
  permission_count int;
BEGIN
  SELECT COUNT(*) INTO role_count FROM user_roles;
  SELECT COUNT(*) INTO resource_count FROM resources WHERE kind = 'page';
  SELECT COUNT(*) INTO permission_count FROM role_permissions;
  
  RAISE NOTICE 'RBAC Seed Data Summary:';
  RAISE NOTICE '  Roles: %', role_count;
  RAISE NOTICE '  Page Resources: %', resource_count;
  RAISE NOTICE '  Permissions: %', permission_count;
END $$;