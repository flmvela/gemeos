-- ============================================================
-- URL Restructure - Phase 1: Clean Resource Names
-- Update existing resources and add missing ones for clean URLs
-- ============================================================

-- ============================================================
-- 1. UPDATE EXISTING RESOURCE NAMES FOR CLARITY
-- ============================================================

-- Update admin dashboard
UPDATE public.resources SET 
    key = 'page:dashboard',
    description = 'Platform dashboard with system overview'
WHERE key = 'page:admin_dashboard';

-- Update tenant admin dashboard  
UPDATE public.resources SET 
    key = 'page:tenant_dashboard',
    description = 'Tenant admin dashboard and overview'
WHERE key = 'page:tenant_admin';

-- Update domain management (keep existing, will map to domain detail)
UPDATE public.resources SET 
    key = 'page:domain_detail',
    description = 'Domain management and configuration'
WHERE key = 'page:domain_management';

-- Update permission management
UPDATE public.resources SET 
    key = 'page:permission_management',
    description = 'RBAC permission management interface'
WHERE key = 'page:permission_management';

-- ============================================================
-- 2. ADD MISSING PAGE RESOURCES
-- ============================================================

INSERT INTO public.resources (key, kind, description, category) VALUES
-- Domain-related pages
('page:learning_concepts', 'page', 'Manage learning concepts within domains', 'content'),
('page:learning_goals', 'page', 'Manage learning goals and objectives', 'content'),
('page:ai_guidance', 'page', 'AI guidance configuration and training', 'content'),

-- Management pages
('page:tenants', 'page', 'Tenant management and administration', 'users'),
('page:content_upload', 'page', 'Upload content files and documents', 'system'),
('page:access_management', 'page', 'User access and role management', 'users'),

-- Additional admin pages
('page:clients', 'page', 'Client management and configuration', 'users'),
('page:ai_training', 'page', 'AI model training and configuration', 'system'),
('page:feedback_settings', 'page', 'Feedback system configuration', 'system')

ON CONFLICT (key) DO UPDATE SET
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    updated_at = now();

-- ============================================================
-- 3. ADD CLEAN API RESOURCES
-- ============================================================

INSERT INTO public.resources (key, kind, description, category) VALUES
-- Domain APIs
('api:domain_by_slug', 'api', 'Get domain by slug identifier', 'api'),
('api:domain_concepts', 'api', 'Access domain learning concepts', 'api'),
('api:domain_goals', 'api', 'Access domain learning goals', 'api'),
('api:domain_guidance', 'api', 'Access AI guidance for domains', 'api'),

-- File management APIs  
('api:file_upload', 'api', 'Upload files to system', 'api'),
('api:file_download', 'api', 'Download files from system', 'api'),

-- User management APIs
('api:user_roles', 'api', 'Manage user roles and assignments', 'api'),
('api:tenant_users', 'api', 'Manage tenant user memberships', 'api')

ON CONFLICT (key) DO UPDATE SET
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    updated_at = now();

-- ============================================================
-- 4. UPDATE ROLE PERMISSIONS FOR NEW RESOURCES
-- ============================================================

-- Grant platform admin access to all new resources
WITH platform_admin_role AS (
    SELECT id FROM public.user_roles WHERE name = 'platform_admin'
),
new_resources AS (
    SELECT id FROM public.resources 
    WHERE key IN (
        'page:learning_concepts', 'page:learning_goals', 'page:ai_guidance',
        'page:tenants', 'page:content_upload', 'page:access_management',
        'page:clients', 'page:ai_training', 'page:feedback_settings',
        'api:domain_by_slug', 'api:domain_concepts', 'api:domain_goals',
        'api:domain_guidance', 'api:file_upload', 'api:file_download',
        'api:user_roles', 'api:tenant_users'
    )
)
INSERT INTO public.role_permissions (role_id, resource_id, actions)
SELECT 
    pa.id as role_id,
    nr.id as resource_id,
    ARRAY['read', 'write', 'create', 'update', 'delete', 'admin']::text[] as actions
FROM platform_admin_role pa
CROSS JOIN new_resources nr
ON CONFLICT (role_id, resource_id) DO UPDATE SET
    actions = EXCLUDED.actions,
    updated_at = now();

-- Grant tenant admin access to relevant resources
WITH tenant_admin_role AS (
    SELECT id FROM public.user_roles WHERE name = 'tenant_admin'
)
INSERT INTO public.role_permissions (role_id, resource_id, actions)
SELECT 
    ta.id as role_id,
    r.id as resource_id,
    CASE 
        -- Full access to content management
        WHEN r.key IN ('page:learning_concepts', 'page:learning_goals', 'page:ai_guidance') 
        THEN ARRAY['read', 'write', 'create', 'update', 'delete']::text[]
        
        -- Read/write access to user management
        WHEN r.key IN ('page:access_management', 'api:tenant_users', 'api:user_roles')
        THEN ARRAY['read', 'write', 'update']::text[]
        
        -- Upload access
        WHEN r.key IN ('page:content_upload', 'api:file_upload')
        THEN ARRAY['read', 'write', 'create']::text[]
        
        -- API access for domain content
        WHEN r.key IN ('api:domain_by_slug', 'api:domain_concepts', 'api:domain_goals', 'api:domain_guidance')
        THEN ARRAY['read', 'write']::text[]
        
        ELSE ARRAY['read']::text[]
    END as actions
FROM tenant_admin_role ta
CROSS JOIN public.resources r
WHERE r.key IN (
    'page:learning_concepts', 'page:learning_goals', 'page:ai_guidance',
    'page:access_management', 'page:content_upload',
    'api:domain_by_slug', 'api:domain_concepts', 'api:domain_goals',
    'api:domain_guidance', 'api:file_upload', 'api:tenant_users', 'api:user_roles'
)
ON CONFLICT (role_id, resource_id) DO UPDATE SET
    actions = EXCLUDED.actions,
    updated_at = now();

-- Grant teacher access to learning content
WITH teacher_role AS (
    SELECT id FROM public.user_roles WHERE name = 'teacher'
)
INSERT INTO public.role_permissions (role_id, resource_id, actions)
SELECT 
    t.id as role_id,
    r.id as resource_id,
    CASE 
        -- Read/write access to learning content
        WHEN r.key IN ('page:learning_concepts', 'page:learning_goals') 
        THEN ARRAY['read', 'write', 'update']::text[]
        
        -- Read access to APIs
        WHEN r.key IN ('api:domain_concepts', 'api:domain_goals')
        THEN ARRAY['read']::text[]
        
        ELSE ARRAY['read']::text[]
    END as actions
FROM teacher_role t
CROSS JOIN public.resources r
WHERE r.key IN (
    'page:learning_concepts', 'page:learning_goals', 
    'api:domain_concepts', 'api:domain_goals'
)
ON CONFLICT (role_id, resource_id) DO UPDATE SET
    actions = EXCLUDED.actions,
    updated_at = now();

-- ============================================================
-- 5. VERIFICATION QUERY
-- ============================================================

-- Show updated resource structure
SELECT 
    'Resource Updates Complete' as status,
    COUNT(*) as total_resources,
    COUNT(*) FILTER (WHERE kind = 'page') as pages,
    COUNT(*) FILTER (WHERE kind = 'api') as apis,
    COUNT(*) FILTER (WHERE kind = 'feature') as features
FROM public.resources
WHERE is_active = true;

-- Show new clean resource names by category
SELECT 
    category,
    kind,
    key,
    description
FROM public.resources
WHERE is_active = true
ORDER BY category, kind, key;