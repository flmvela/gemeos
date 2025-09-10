-- ============================================================
-- RBAC Seed Data - Phase 1
-- Initial roles, resources, and permission mappings
-- ============================================================

-- ============================================================
-- 1. SEED USER ROLES
-- ============================================================

INSERT INTO public.user_roles (name, display_name, description, is_system) VALUES
('platform_admin', 'Platform Administrator', 'Full system access across all tenants and features', true),
('tenant_admin', 'Tenant Administrator', 'Manage tenant content, users, and domain assignments', true),
('teacher', 'Teacher', 'Access assigned domains and manage students within tenant', true),
('student', 'Student', 'Access learning content assigned to them', true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  updated_at = now();

-- ============================================================
-- 2. SEED RESOURCES (Pages, Features, APIs)
-- ============================================================

-- Core admin pages
INSERT INTO public.resources (key, kind, description, category) VALUES
-- Dashboard pages
('page:admin_dashboard', 'page', 'Platform admin dashboard with system overview', 'dashboard'),
('page:tenant_dashboard', 'page', 'Tenant admin dashboard with tenant overview', 'dashboard'),
('page:teacher_dashboard', 'page', 'Teacher dashboard with assigned domains', 'dashboard'),
('page:student_dashboard', 'page', 'Student dashboard with learning progress', 'dashboard'),

-- Content management pages
('page:domain_management', 'page', 'Create and manage learning domains', 'content'),
('page:domain_concepts', 'page', 'View and edit domain concepts', 'content'),
('page:learning_goals', 'page', 'Manage learning goals for concepts', 'content'),
('page:exercises', 'page', 'Create and manage practice exercises', 'content'),
('page:ai_training', 'page', 'AI model training and configuration', 'content'),

-- User management pages
('page:tenant_management', 'page', 'Create and manage tenants', 'users'),
('page:user_invitations', 'page', 'Send and manage user invitations', 'users'),
('page:teacher_management', 'page', 'Manage teachers within tenant', 'users'),
('page:student_management', 'page', 'Manage students and class assignments', 'users'),
('page:access_management', 'page', 'Manage user roles and permissions', 'users'),

-- System administration
('page:system_settings', 'page', 'System configuration and settings', 'system'),
('page:permission_management', 'page', 'Manage role-based permissions', 'system'),
('page:audit_logs', 'page', 'View system audit and activity logs', 'system'),
('page:file_upload', 'page', 'Upload content files and documents', 'system'),

-- API endpoints
('api:tenant_create', 'api', 'Create new tenant organizations', 'api'),
('api:user_invite', 'api', 'Send user invitations', 'api'),
('api:domain_create', 'api', 'Create new learning domains', 'api'),
('api:domain_edit', 'api', 'Modify existing domains', 'api'),
('api:concept_create', 'api', 'Create new concepts', 'api'),
('api:concept_edit', 'api', 'Edit concept content and metadata', 'api'),
('api:exercise_create', 'api', 'Create new exercises', 'api'),
('api:user_role_assign', 'api', 'Assign roles to users', 'api'),

-- Features
('feature:domain_ai_guidance', 'feature', 'AI-powered domain guidance and recommendations', 'ai'),
('feature:concept_structuring', 'feature', 'Automated concept hierarchy structuring', 'ai'),
('feature:bulk_upload', 'feature', 'Bulk content upload functionality', 'content'),
('feature:advanced_analytics', 'feature', 'Advanced learning analytics and reporting', 'analytics'),
('feature:custom_branding', 'feature', 'Custom tenant branding and themes', 'customization')

ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = now();

-- ============================================================
-- 3. SEED ROLE PERMISSIONS
-- Define what each role can access
-- ============================================================

-- ============================================================
-- PLATFORM ADMIN - Full access to everything
-- ============================================================
INSERT INTO public.role_permissions (role_id, resource_id, actions, granted_by)
SELECT 
  (SELECT id FROM public.user_roles WHERE name = 'platform_admin'),
  r.id,
  ARRAY['read', 'write', 'admin', 'create', 'update', 'delete'],
  (SELECT auth.uid())
FROM public.resources r
ON CONFLICT (role_id, resource_id) DO UPDATE SET
  actions = EXCLUDED.actions,
  updated_at = now();

-- ============================================================
-- TENANT ADMIN - Tenant-focused management access
-- ============================================================
INSERT INTO public.role_permissions (role_id, resource_id, actions, granted_by)
SELECT 
  (SELECT id FROM public.user_roles WHERE name = 'tenant_admin'),
  r.id,
  CASE 
    -- Read-write access for tenant management
    WHEN r.key IN (
      'page:tenant_dashboard',
      'page:domain_concepts',
      'page:learning_goals', 
      'page:exercises',
      'page:teacher_management',
      'page:student_management',
      'page:user_invitations',
      'page:file_upload',
      'api:user_invite',
      'api:concept_edit',
      'api:exercise_create',
      'api:user_role_assign',
      'feature:bulk_upload'
    ) THEN ARRAY['read', 'write', 'create', 'update']
    
    -- Read-only access for monitoring
    WHEN r.key IN (
      'page:domain_management',
      'feature:domain_ai_guidance',
      'feature:concept_structuring',
      'feature:advanced_analytics'
    ) THEN ARRAY['read']
    
    ELSE ARRAY['read']
  END,
  (SELECT auth.uid())
FROM public.resources r
WHERE r.key IN (
  'page:tenant_dashboard',
  'page:domain_management', 
  'page:domain_concepts',
  'page:learning_goals',
  'page:exercises',
  'page:teacher_management',
  'page:student_management', 
  'page:user_invitations',
  'page:file_upload',
  'api:user_invite',
  'api:concept_edit',
  'api:exercise_create',
  'api:user_role_assign',
  'feature:domain_ai_guidance',
  'feature:concept_structuring',
  'feature:bulk_upload',
  'feature:advanced_analytics'
)
ON CONFLICT (role_id, resource_id) DO UPDATE SET
  actions = EXCLUDED.actions,
  updated_at = now();

-- ============================================================
-- TEACHER - Content access within assigned domains
-- ============================================================
INSERT INTO public.role_permissions (role_id, resource_id, actions, granted_by)
SELECT 
  (SELECT id FROM public.user_roles WHERE name = 'teacher'),
  r.id,
  CASE 
    -- Write access for content management
    WHEN r.key IN (
      'page:teacher_dashboard',
      'page:domain_concepts',
      'page:learning_goals',
      'page:exercises', 
      'page:student_management',
      'api:concept_edit',
      'api:exercise_create'
    ) THEN ARRAY['read', 'write', 'update']
    
    -- Read access for reference
    WHEN r.key IN (
      'feature:domain_ai_guidance',
      'feature:concept_structuring',
      'page:file_upload'
    ) THEN ARRAY['read']
    
    ELSE ARRAY['read']
  END,
  (SELECT auth.uid())
FROM public.resources r
WHERE r.key IN (
  'page:teacher_dashboard',
  'page:domain_concepts',
  'page:learning_goals', 
  'page:exercises',
  'page:student_management',
  'page:file_upload',
  'api:concept_edit',
  'api:exercise_create', 
  'feature:domain_ai_guidance',
  'feature:concept_structuring'
)
ON CONFLICT (role_id, resource_id) DO UPDATE SET
  actions = EXCLUDED.actions,
  updated_at = now();

-- ============================================================
-- STUDENT - Learning content access only
-- ============================================================
INSERT INTO public.role_permissions (role_id, resource_id, actions, granted_by)
SELECT 
  (SELECT id FROM public.user_roles WHERE name = 'student'),
  r.id,
  ARRAY['read'],
  (SELECT auth.uid())
FROM public.resources r
WHERE r.key IN (
  'page:student_dashboard',
  'page:domain_concepts',
  'page:exercises'
)
ON CONFLICT (role_id, resource_id) DO UPDATE SET
  actions = EXCLUDED.actions,
  updated_at = now();

-- ============================================================
-- 4. REFRESH PERFORMANCE CACHE
-- ============================================================

-- Refresh the materialized view with new data
SELECT public.refresh_permissions_cache();

-- ============================================================
-- 5. VALIDATION QUERIES
-- Test that the permissions were set up correctly
-- ============================================================

DO $$
DECLARE
  role_count int;
  resource_count int;
  permission_count int;
BEGIN
  -- Count seeded data
  SELECT COUNT(*) INTO role_count FROM public.user_roles;
  SELECT COUNT(*) INTO resource_count FROM public.resources;
  SELECT COUNT(*) INTO permission_count FROM public.role_permissions;
  
  -- Validate minimum expected counts
  IF role_count < 4 THEN
    RAISE EXCEPTION 'Seed failed: Expected at least 4 roles, found %', role_count;
  END IF;
  
  IF resource_count < 20 THEN
    RAISE EXCEPTION 'Seed failed: Expected at least 20 resources, found %', resource_count;
  END IF;
  
  IF permission_count < 10 THEN
    RAISE EXCEPTION 'Seed failed: Expected at least 10 permissions, found %', permission_count;
  END IF;
  
  RAISE NOTICE '✅ RBAC Seed Data Migration completed successfully';
  RAISE NOTICE 'Seeded: % roles, % resources, % permissions', role_count, resource_count, permission_count;
  RAISE NOTICE 'Roles: platform_admin, tenant_admin, teacher, student';
  RAISE NOTICE 'Resource categories: dashboard, content, users, system, api, ai, analytics';
END
$$;