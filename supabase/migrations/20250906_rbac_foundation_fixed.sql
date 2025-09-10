-- ============================================================
-- RBAC Foundation Migration - Phase 1 (Fixed)
-- Simple, scalable role-based access control system
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist to avoid conflicts
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.resources CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- ============================================================
-- 1. USER ROLES TABLE
-- Define system roles (platform_admin, tenant_admin, teacher, student)
-- ============================================================

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  is_system boolean DEFAULT true, -- System vs custom roles
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "user_roles_read_all" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

-- Only enable this if auth_is_platform_admin function exists
-- CREATE POLICY "user_roles_platform_admin_all" ON public.user_roles
--   FOR ALL TO authenticated USING (auth_is_platform_admin());

-- ============================================================
-- 2. RESOURCES TABLE  
-- Registry of all protectable resources (pages, features, APIs)
-- ============================================================

CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL, -- e.g. "page:admin_dashboard", "api:invite_user"
  kind text NOT NULL DEFAULT 'page', -- 'page', 'api', 'feature', 'entity'
  description text,
  category text, -- Group related resources
  metadata jsonb DEFAULT '{}', -- Extensibility for future needs
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_kind CHECK (kind IN ('page', 'api', 'feature', 'entity'))
);

-- Add RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies - anyone can read resources (for UI generation)
CREATE POLICY "resources_read_all" ON public.resources
  FOR SELECT TO authenticated USING (is_active = true);

-- ============================================================
-- 3. ROLE PERMISSIONS TABLE
-- Matrix of role × resource × action permissions
-- ============================================================

CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.user_roles(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  actions text[] NOT NULL DEFAULT ARRAY['read'], -- ['read', 'write', 'admin']
  
  -- Strategic extensibility columns
  granted_by uuid, -- Audit trail - references auth.users(id) but allow null for system
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz, -- Time-based permissions
  conditions jsonb DEFAULT '{}', -- Future ABAC conditions
  metadata jsonb DEFAULT '{}', -- Extensibility
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique role-resource combinations
  UNIQUE(role_id, resource_id),
  
  -- Validate actions
  CONSTRAINT valid_actions CHECK (
    actions <@ ARRAY['read', 'write', 'admin', 'delete', 'create', 'update']
  )
);

-- Add RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "role_permissions_read_all" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================

-- Core lookup indexes
CREATE INDEX idx_user_roles_name ON public.user_roles(name);
CREATE INDEX idx_resources_key ON public.resources(key);
CREATE INDEX idx_resources_kind ON public.resources(kind);
CREATE INDEX idx_resources_active ON public.resources(is_active);

-- Permission lookup optimization
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_resource_id ON public.role_permissions(resource_id);
CREATE INDEX idx_role_permissions_expires ON public.role_permissions(expires_at) WHERE expires_at IS NOT NULL;

-- Composite index for main permission check query
CREATE INDEX idx_role_permissions_lookup ON public.role_permissions(role_id, resource_id);

-- User tenant lookup (enhance existing user_tenants table if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_tenants') THEN
    CREATE INDEX IF NOT EXISTS idx_user_tenants_lookup ON public.user_tenants(user_id, tenant_id, status);
  END IF;
END
$$;

-- ============================================================
-- 5. UPDATED TRIGGERS
-- ============================================================

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON public.resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at
    BEFORE UPDATE ON public.role_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. HELPER VIEWS FOR EASIER QUERIES
-- ============================================================

-- View to get all permissions with names (for admin UI)
CREATE OR REPLACE VIEW public.permission_details AS
SELECT 
  rp.id,
  rp.role_id,
  ur.name as role_name,
  ur.display_name as role_display_name,
  rp.resource_id,
  r.key as resource_key,
  r.kind as resource_kind,
  r.description as resource_description,
  rp.actions,
  rp.expires_at,
  rp.granted_by,
  rp.granted_at,
  rp.created_at,
  rp.updated_at
FROM public.role_permissions rp
JOIN public.user_roles ur ON ur.id = rp.role_id
JOIN public.resources r ON r.id = rp.resource_id
WHERE r.is_active = true
  AND (rp.expires_at IS NULL OR rp.expires_at > now());

-- Grant permissions
GRANT SELECT ON public.permission_details TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.resources TO authenticated;
GRANT ALL ON public.role_permissions TO authenticated;

-- ============================================================
-- MIGRATION VALIDATION
-- ============================================================

DO $$
BEGIN
  -- Validate tables were created
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    RAISE EXCEPTION 'Migration failed: user_roles table not created';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resources') THEN
    RAISE EXCEPTION 'Migration failed: resources table not created';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'role_permissions') THEN
    RAISE EXCEPTION 'Migration failed: role_permissions table not created';
  END IF;
  
  RAISE NOTICE '✅ RBAC Foundation Migration completed successfully';
  RAISE NOTICE 'Tables created: user_roles, resources, role_permissions';
  RAISE NOTICE 'Next step: Run seed data migration';
END
$$;