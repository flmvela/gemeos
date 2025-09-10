-- ============================================================
-- RBAC Seed Data - Phase 1 (FIXED)
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
('page:tenant_admin', 'page', 'Tenant admin dashboard with tenant overview', 'dashboard'),
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
('api:tenant_create', 'api', 'Create new tenant', 'api'),
('api:tenant_update', 'api', 'Update tenant information', 'api'),
('api:tenant_delete', 'api', 'Delete tenant', 'api'),
('api:user_invite', 'api', 'Send user invitations', 'api'),
('api:user_manage', 'api', 'Manage user accounts', 'api'),
('api:domain_create', 'api', 'Create learning domains', 'api'),
('api:domain_update', 'api', 'Update domain content', 'api'),
('api:concept_create', 'api', 'Create new concepts', 'api'),
('api:concept_update', 'api', 'Update existing concepts', 'api'),
('api:learning_goal_create', 'api', 'Create learning goals', 'api'),
('api:exercise_create', 'api', 'Create practice exercises', 'api'),
('api:file_upload', 'api', 'Upload files to system', 'api'),
('api:ai_generate', 'api', 'Generate AI content', 'api'),

-- Features
('feature:bulk_operations', 'feature', 'Perform bulk operations on content', 'feature'),
('feature:advanced_analytics', 'feature', 'Access detailed analytics and reports', 'feature'),
('feature:export_data', 'feature', 'Export system data', 'feature'),
('feature:import_data', 'feature', 'Import content from external sources', 'feature')

ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = now();

-- ============================================================
-- 3. SEED ROLE PERMISSIONS
-- ============================================================

-- Get role IDs for permission assignments
WITH role_ids AS (
  SELECT 
    (SELECT id FROM public.user_roles WHERE name = 'platform_admin') as platform_admin_id,
    (SELECT id FROM public.user_roles WHERE name = 'tenant_admin') as tenant_admin_id,
    (SELECT id FROM public.user_roles WHERE name = 'teacher') as teacher_id,
    (SELECT id FROM public.user_roles WHERE name = 'student') as student_id
)

-- PLATFORM ADMIN PERMISSIONS (Full access to everything)
INSERT INTO public.role_permissions (role_id, resource_id, actions)
SELECT 
  r.platform_admin_id,
  res.id,
  ARRAY['read', 'write', 'create', 'update', 'delete', 'admin']::text[]
FROM role_ids r
CROSS JOIN public.resources res

UNION ALL

-- TENANT ADMIN PERMISSIONS (Tenant-scoped management)
SELECT 
  r.tenant_admin_id,
  res.id,
  CASE 
    -- Full access to tenant management pages
    WHEN res.key IN ('page:tenant_admin', 'page:teacher_management', 'page:student_management', 
                     'page:user_invitations', 'page:access_management') 
    THEN ARRAY['read', 'write', 'create', 'update', 'delete']::text[]
    
    -- Content management access
    WHEN res.key IN ('page:domain_management', 'page:domain_concepts', 'page:learning_goals', 
                     'page:exercises') 
    THEN ARRAY['read', 'write', 'update']::text[]
    
    -- API access for tenant operations
    WHEN res.key LIKE 'api:user_%' OR res.key LIKE 'api:domain_%' OR res.key LIKE 'api:concept_%'
    THEN ARRAY['read', 'write', 'update']::text[]
    
    -- Basic read access to other resources
    ELSE ARRAY['read']::text[]
  END
FROM role_ids r
CROSS JOIN public.resources res
WHERE res.key NOT IN ('page:system_settings', 'page:permission_management', 'page:tenant_management')

UNION ALL

-- TEACHER PERMISSIONS (Domain-specific access)
SELECT 
  r.teacher_id,
  res.id,
  CASE 
    -- Access to teacher dashboard and content
    WHEN res.key IN ('page:teacher_dashboard', 'page:domain_concepts', 'page:learning_goals', 
                     'page:exercises', 'page:student_management') 
    THEN ARRAY['read', 'write']::text[]
    
    -- Content creation APIs
    WHEN res.key IN ('api:concept_update', 'api:learning_goal_create', 'api:exercise_create')
    THEN ARRAY['read', 'write', 'create']::text[]
    
    -- Basic read access
    ELSE ARRAY['read']::text[]
  END
FROM role_ids r
CROSS JOIN public.resources res
WHERE res.key IN (
  'page:teacher_dashboard', 'page:domain_concepts', 'page:learning_goals', 'page:exercises',
  'page:student_management', 'api:concept_update', 'api:learning_goal_create', 'api:exercise_create'
)

UNION ALL

-- STUDENT PERMISSIONS (Learning content access only)
SELECT 
  r.student_id,
  res.id,
  ARRAY['read']::text[]
FROM role_ids r
CROSS JOIN public.resources res
WHERE res.key IN (
  'page:student_dashboard', 'page:domain_concepts', 'page:learning_goals', 'page:exercises'
)

ON CONFLICT (role_id, resource_id) DO UPDATE SET
  actions = EXCLUDED.actions,
  updated_at = now();

-- ============================================================
-- 4. VERIFICATION QUERIES
-- ============================================================

-- Show summary of what was created
SELECT 'RBAC Seed Data Installation Complete!' as status;

SELECT 
  'Roles Created' as item,
  COUNT(*) as count
FROM public.user_roles
WHERE is_system = true

UNION ALL

SELECT 
  'Resources Created' as item,
  COUNT(*) as count  
FROM public.resources
WHERE is_active = true

UNION ALL

SELECT 
  'Permissions Created' as item,
  COUNT(*) as count
FROM public.role_permissions;

-- Show role breakdown
SELECT 
  ur.name as role,
  ur.display_name,
  COUNT(rp.id) as permission_count
FROM public.user_roles ur
LEFT JOIN public.role_permissions rp ON rp.role_id = ur.id
WHERE ur.is_system = true
GROUP BY ur.id, ur.name, ur.display_name
ORDER BY ur.name;

-- Test permission function with seeded data
SELECT 
  'Permission Test' as test_name,
  'Should still return false (no users assigned roles yet)' as expected_result,
  public.check_permission('page:admin_dashboard', 'read') as actual_result;