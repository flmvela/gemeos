-- ============================================================
-- COMBINED OVERRIDE PATTERN MIGRATION
-- ============================================================
-- This file combines all 8 override pattern migrations into a single file
-- to avoid multiple migration runs and syntax issues

-- ============================================================
-- PHASE 1: FOUNDATION
-- ============================================================

-- Create owner scope enum for content inheritance (if not exists)
DO $$ BEGIN
  CREATE TYPE public.owner_scope AS ENUM ('platform', 'tenant', 'teacher');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create generation source enum for content origin tracking (if not exists)
DO $$ BEGIN
  CREATE TYPE public.generation_source AS ENUM ('platform', 'tenant', 'teacher', 'ai_generated', 'user_created');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Get current user's tenant ID (for convenience)
CREATE OR REPLACE FUNCTION get_current_tenant_id() 
RETURNS UUID AS $$
  SELECT tenant_id FROM user_tenants 
  WHERE user_id = auth.uid() AND status = 'active' 
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if current user is platform admin
CREATE OR REPLACE FUNCTION auth_is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_tenants ut
    JOIN user_roles ur ON ut.role_id = ur.id
    WHERE ut.user_id = auth.uid() 
      AND ur.name = 'platform_admin'
      AND ut.status = 'active'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Get tenant role for a specific tenant
CREATE OR REPLACE FUNCTION auth_tenant_role(p_tenant_id UUID)
RETURNS TEXT AS $$
  SELECT ur.name FROM user_tenants ut
  JOIN user_roles ur ON ut.role_id = ur.id
  WHERE ut.user_id = auth.uid() 
    AND ut.tenant_id = p_tenant_id
    AND ut.status = 'active'
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user has access to specific tenant
CREATE OR REPLACE FUNCTION auth_has_tenant_access(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_tenants ut
    WHERE ut.user_id = auth.uid() 
      AND ut.tenant_id = p_tenant_id
      AND ut.status = 'active'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Get all tenant IDs accessible to current user
CREATE OR REPLACE FUNCTION get_user_tenant_ids()
RETURNS SETOF UUID AS $$
  SELECT tenant_id FROM user_tenants
  WHERE user_id = auth.uid() AND status = 'active';
$$ LANGUAGE SQL SECURITY DEFINER;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_active 
  ON user_tenants(user_id, status) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_active 
  ON user_tenants(tenant_id, status) 
  WHERE status = 'active';

-- ============================================================
-- PHASE 2: OVERRIDE TABLES
-- ============================================================

-- CONCEPT OVERRIDES TABLE
CREATE TABLE IF NOT EXISTS public.concept_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  
  -- Ownership scope: tenant or teacher level
  scope public.owner_scope NOT NULL CHECK (scope IN ('tenant','teacher')),
  tenant_id UUID NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  teacher_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Override fields (NULL = not overridden, inherit from parent)
  name TEXT NULL,
  description TEXT NULL,
  difficulty_level INTEGER NULL,
  status public.review_status NULL,
  display_order INTEGER NULL,
  metadata JSONB NULL,
  
  -- Audit and versioning
  created_by UUID DEFAULT auth.uid(),
  updated_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Version control and soft delete support
  version INTEGER DEFAULT 1,
  change_reason TEXT,
  is_hidden BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ NULL,
  
  -- CONSTRAINTS
  CONSTRAINT concept_override_unique_per_owner
    UNIQUE (base_concept_id, scope, tenant_id, teacher_id),
  
  CONSTRAINT concept_override_scope_coherence
    CHECK (
      (scope = 'tenant' AND tenant_id IS NOT NULL AND teacher_id IS NULL) OR
      (scope = 'teacher' AND teacher_id IS NOT NULL AND tenant_id IS NOT NULL)
    )
);

-- LEARNING GOAL OVERRIDES TABLE
CREATE TABLE IF NOT EXISTS public.learning_goal_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_goal_id UUID NOT NULL REFERENCES public.learning_goals(id) ON DELETE CASCADE,
  
  -- Ownership scope: tenant or teacher level
  scope public.owner_scope NOT NULL CHECK (scope IN ('tenant','teacher')),
  tenant_id UUID NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  teacher_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Override fields (NULL = not overridden, inherit from parent)
  goal_description TEXT NULL,
  goal_type TEXT NULL,
  bloom_level TEXT NULL,
  sequence_order INTEGER NULL,
  status public.review_status NULL,
  metadata JSONB NULL,
  goal_type_id UUID NULL REFERENCES learning_goal_types(id) ON DELETE SET NULL,
  
  -- Audit and versioning
  created_by UUID DEFAULT auth.uid(),
  updated_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Version control and soft delete support
  version INTEGER DEFAULT 1,
  change_reason TEXT,
  is_hidden BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ NULL,
  
  -- CONSTRAINTS
  CONSTRAINT learning_goal_override_unique_per_owner
    UNIQUE (base_goal_id, scope, tenant_id, teacher_id),
  
  CONSTRAINT learning_goal_override_scope_coherence
    CHECK (
      (scope = 'tenant' AND tenant_id IS NOT NULL AND teacher_id IS NULL) OR
      (scope = 'teacher' AND teacher_id IS NOT NULL AND tenant_id IS NOT NULL)
    )
);

-- EXERCISE OVERRIDES TABLE (only if exercises table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercises') THEN
    CREATE TABLE IF NOT EXISTS public.exercise_overrides (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      base_exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
      
      -- Ownership scope: tenant or teacher level
      scope owner_scope NOT NULL CHECK (scope IN ('tenant','teacher')),
      tenant_id UUID NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      teacher_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Override fields (NULL = not overridden, inherit from parent)
      exercise_type TEXT NULL,
      content JSONB NULL,
      status TEXT NULL CHECK (status IS NULL OR status IN ('draft','published','archived')),
      
      -- Audit and versioning
      created_by UUID DEFAULT auth.uid(),
      updated_by UUID DEFAULT auth.uid(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      -- Version control and soft delete support
      version INTEGER DEFAULT 1,
      change_reason TEXT,
      is_hidden BOOLEAN DEFAULT false,
      deleted_at TIMESTAMPTZ NULL,
      
      -- CONSTRAINTS
      CONSTRAINT exercise_override_unique_per_owner
        UNIQUE (base_exercise_id, scope, tenant_id, teacher_id),
      
      CONSTRAINT exercise_override_scope_coherence
        CHECK (
          (scope = 'tenant' AND tenant_id IS NOT NULL AND teacher_id IS NULL) OR
          (scope = 'teacher' AND teacher_id IS NOT NULL AND tenant_id IS NOT NULL)
        )
    );
  END IF;
END $$;

-- ============================================================
-- PHASE 3: INDEXES AND PERFORMANCE
-- ============================================================

-- Concept overrides indexes
CREATE INDEX IF NOT EXISTS idx_concept_overrides_base ON concept_overrides(base_concept_id);
CREATE INDEX IF NOT EXISTS idx_concept_overrides_tenant ON concept_overrides(tenant_id);
CREATE INDEX IF NOT EXISTS idx_concept_overrides_teacher ON concept_overrides(teacher_id);
CREATE INDEX IF NOT EXISTS idx_concept_overrides_scope ON concept_overrides(scope);
CREATE INDEX IF NOT EXISTS idx_concept_overrides_resolution 
  ON concept_overrides(base_concept_id, scope, tenant_id, teacher_id) 
  WHERE deleted_at IS NULL AND NOT is_hidden;
CREATE INDEX IF NOT EXISTS idx_concept_overrides_active 
  ON concept_overrides(base_concept_id, tenant_id) 
  WHERE deleted_at IS NULL AND NOT is_hidden;

-- Learning goal overrides indexes
CREATE INDEX IF NOT EXISTS idx_learning_goal_overrides_base ON learning_goal_overrides(base_goal_id);
CREATE INDEX IF NOT EXISTS idx_learning_goal_overrides_tenant ON learning_goal_overrides(tenant_id);
CREATE INDEX IF NOT EXISTS idx_learning_goal_overrides_teacher ON learning_goal_overrides(teacher_id);
CREATE INDEX IF NOT EXISTS idx_learning_goal_overrides_scope ON learning_goal_overrides(scope);
CREATE INDEX IF NOT EXISTS idx_learning_goal_overrides_resolution 
  ON learning_goal_overrides(base_goal_id, scope, tenant_id, teacher_id) 
  WHERE deleted_at IS NULL AND NOT is_hidden;
CREATE INDEX IF NOT EXISTS idx_learning_goal_overrides_active 
  ON learning_goal_overrides(base_goal_id, tenant_id) 
  WHERE deleted_at IS NULL AND NOT is_hidden;

-- Exercise overrides indexes (conditional)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercise_overrides') THEN
    CREATE INDEX IF NOT EXISTS idx_exercise_overrides_base ON exercise_overrides(base_exercise_id);
    CREATE INDEX IF NOT EXISTS idx_exercise_overrides_tenant ON exercise_overrides(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_exercise_overrides_teacher ON exercise_overrides(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_exercise_overrides_scope ON exercise_overrides(scope);
    CREATE INDEX IF NOT EXISTS idx_exercise_overrides_resolution 
      ON exercise_overrides(base_exercise_id, scope, tenant_id, teacher_id) 
      WHERE deleted_at IS NULL AND NOT is_hidden;
    CREATE INDEX IF NOT EXISTS idx_exercise_overrides_active 
      ON exercise_overrides(base_exercise_id, tenant_id) 
      WHERE deleted_at IS NULL AND NOT is_hidden;
  END IF;
END $$;

-- ============================================================
-- PHASE 4: TRIGGERS
-- ============================================================

-- Concept overrides triggers
DROP TRIGGER IF EXISTS trg_concept_overrides_updated_at ON concept_overrides;
CREATE TRIGGER trg_concept_overrides_updated_at 
  BEFORE UPDATE ON concept_overrides 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION set_updated_by_concept_overrides()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_concept_overrides_updated_by ON concept_overrides;
CREATE TRIGGER trg_concept_overrides_updated_by 
  BEFORE UPDATE ON concept_overrides 
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_by_concept_overrides();

-- Learning goal overrides triggers
DROP TRIGGER IF EXISTS trg_learning_goal_overrides_updated_at ON learning_goal_overrides;
CREATE TRIGGER trg_learning_goal_overrides_updated_at 
  BEFORE UPDATE ON learning_goal_overrides 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION set_updated_by_learning_goal_overrides()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_learning_goal_overrides_updated_by ON learning_goal_overrides;
CREATE TRIGGER trg_learning_goal_overrides_updated_by 
  BEFORE UPDATE ON learning_goal_overrides 
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_by_learning_goal_overrides();

-- Exercise overrides trigger function
CREATE OR REPLACE FUNCTION set_updated_by_exercise_overrides()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exercise overrides triggers (conditional)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercise_overrides') THEN
    DROP TRIGGER IF EXISTS trg_exercise_overrides_updated_at ON exercise_overrides;
    CREATE TRIGGER trg_exercise_overrides_updated_at 
      BEFORE UPDATE ON exercise_overrides 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS trg_exercise_overrides_updated_by ON exercise_overrides;
    CREATE TRIGGER trg_exercise_overrides_updated_by 
      BEFORE UPDATE ON exercise_overrides 
      FOR EACH ROW 
      EXECUTE FUNCTION set_updated_by_exercise_overrides();
  END IF;
END $$;

-- ============================================================
-- PHASE 5: ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on override tables
ALTER TABLE concept_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_goal_overrides ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercise_overrides') THEN
    ALTER TABLE exercise_overrides ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Concept overrides policies
DROP POLICY IF EXISTS concept_overrides_admin_all ON concept_overrides;
CREATE POLICY concept_overrides_admin_all ON concept_overrides
  FOR ALL TO authenticated
  USING (auth_is_platform_admin())
  WITH CHECK (auth_is_platform_admin());

DROP POLICY IF EXISTS concept_overrides_read_access ON concept_overrides;
CREATE POLICY concept_overrides_read_access ON concept_overrides
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT * FROM get_user_tenant_ids()) 
    AND deleted_at IS NULL
  );

-- ============================================================
-- PHASE 6: EFFECTIVE CONTENT FUNCTIONS
-- ============================================================

-- Effective concepts resolver
CREATE OR REPLACE FUNCTION public.effective_concepts(
  p_tenant_id UUID DEFAULT get_current_tenant_id(),
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  concept_id UUID,
  domain_id UUID,
  parent_concept_id UUID,
  name TEXT,
  description TEXT,
  difficulty_level INTEGER,
  status public.review_status,
  display_order INTEGER,
  metadata JSONB,
  generation_source TEXT,
  override_level TEXT,
  is_customized BOOLEAN,
  customized_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  version INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  WITH base AS (
    SELECT c.* FROM concepts c
    WHERE (
      auth_is_platform_admin() OR
      c.domain_id IN (
        SELECT td.domain_id FROM tenant_domains td
        WHERE td.tenant_id = p_tenant_id AND td.is_active = true
      )
    )
  ),
  tenant_overrides AS (
    SELECT co.* FROM concept_overrides co
    WHERE co.scope = 'tenant' 
      AND co.tenant_id = p_tenant_id
      AND co.deleted_at IS NULL 
      AND NOT co.is_hidden
  ),
  teacher_overrides AS (
    SELECT co.* FROM concept_overrides co
    WHERE co.scope = 'teacher' 
      AND co.tenant_id = p_tenant_id 
      AND co.teacher_id = p_user_id
      AND co.deleted_at IS NULL 
      AND NOT co.is_hidden
  )
  SELECT
    b.id as concept_id,
    b.domain_id,
    b.parent_concept_id,
    COALESCE(teach.name, ten.name, b.name) as name,
    COALESCE(teach.description, ten.description, b.description) as description,
    COALESCE(teach.difficulty_level, ten.difficulty_level, 1) as difficulty_level,
    COALESCE(teach.status, ten.status, b.status) as status,
    COALESCE(teach.display_order, ten.display_order, 1) as display_order,
    COALESCE(teach.metadata, ten.metadata, '{}'::jsonb) as metadata,
    'platform' as generation_source,
    CASE 
      WHEN teach.id IS NOT NULL THEN 'teacher'
      WHEN ten.id IS NOT NULL THEN 'tenant' 
      ELSE 'platform'
    END as override_level,
    (teach.id IS NOT NULL OR ten.id IS NOT NULL) as is_customized,
    COALESCE(teach.created_by, ten.created_by) as customized_by,
    COALESCE(teach.created_at, ten.created_at, b.created_at) as created_at,
    COALESCE(teach.updated_at, ten.updated_at, b.updated_at) as updated_at,
    COALESCE(teach.version, ten.version, 1) as version
  FROM base b
  LEFT JOIN tenant_overrides ten ON ten.base_concept_id = b.id
  LEFT JOIN teacher_overrides teach ON teach.base_concept_id = b.id
  ORDER BY b.name;
$$;

-- Effective learning goals resolver
CREATE OR REPLACE FUNCTION public.effective_learning_goals(
  p_tenant_id UUID DEFAULT get_current_tenant_id(),
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  learning_goal_id UUID,
  concept_id UUID,
  goal_description TEXT,
  goal_type TEXT,
  bloom_level TEXT,
  sequence_order INTEGER,
  status public.review_status,
  metadata JSONB,
  goal_type_id UUID,
  generation_source TEXT,
  override_level TEXT,
  is_customized BOOLEAN,
  customized_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  version INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  WITH base AS (
    SELECT lg.* FROM learning_goals lg
    JOIN concepts c ON lg.concept_id = c.id
    WHERE (
      auth_is_platform_admin() OR
      c.domain_id IN (
        SELECT td.domain_id FROM tenant_domains td
        WHERE td.tenant_id = p_tenant_id AND td.is_active = true
      )
    )
  ),
  tenant_overrides AS (
    SELECT lgo.* FROM learning_goal_overrides lgo
    WHERE lgo.scope = 'tenant' 
      AND lgo.tenant_id = p_tenant_id
      AND lgo.deleted_at IS NULL 
      AND NOT lgo.is_hidden
  ),
  teacher_overrides AS (
    SELECT lgo.* FROM learning_goal_overrides lgo
    WHERE lgo.scope = 'teacher' 
      AND lgo.tenant_id = p_tenant_id 
      AND lgo.teacher_id = p_user_id
      AND lgo.deleted_at IS NULL 
      AND NOT lgo.is_hidden
  )
  SELECT
    b.id as learning_goal_id,
    b.concept_id,
    COALESCE(teach.goal_description, ten.goal_description, 'Learning Goal') as goal_description,
    COALESCE(teach.goal_type, ten.goal_type, 'standard') as goal_type,
    COALESCE(teach.bloom_level, ten.bloom_level, 'understand') as bloom_level,
    COALESCE(teach.sequence_order, ten.sequence_order, 1) as sequence_order,
    COALESCE(teach.status, ten.status, 'confirmed'::public.review_status) as status,
    COALESCE(teach.metadata, ten.metadata, '{}'::jsonb) as metadata,
    COALESCE(teach.goal_type_id, ten.goal_type_id, NULL) as goal_type_id,
    'platform' as generation_source,
    CASE 
      WHEN teach.id IS NOT NULL THEN 'teacher'
      WHEN ten.id IS NOT NULL THEN 'tenant' 
      ELSE 'platform'
    END as override_level,
    (teach.id IS NOT NULL OR ten.id IS NOT NULL) as is_customized,
    COALESCE(teach.created_by, ten.created_by) as customized_by,
    COALESCE(teach.created_at, ten.created_at, b.created_at) as created_at,
    COALESCE(teach.updated_at, ten.updated_at, b.updated_at) as updated_at,
    COALESCE(teach.version, ten.version, 1) as version
  FROM base b
  LEFT JOIN tenant_overrides ten ON ten.base_goal_id = b.id
  LEFT JOIN teacher_overrides teach ON teach.base_goal_id = b.id
  ORDER BY b.id;
$$;

-- ============================================================
-- PHASE 7: PERMISSIONS
-- ============================================================

-- Grant permissions
GRANT SELECT ON concept_overrides TO authenticated;
GRANT INSERT, UPDATE, DELETE ON concept_overrides TO authenticated;
GRANT SELECT ON learning_goal_overrides TO authenticated;  
GRANT INSERT, UPDATE, DELETE ON learning_goal_overrides TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercise_overrides') THEN
    GRANT SELECT ON exercise_overrides TO authenticated;
    GRANT INSERT, UPDATE, DELETE ON exercise_overrides TO authenticated;
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'OVERRIDE PATTERN SYSTEM SUCCESSFULLY DEPLOYED';
  RAISE NOTICE 'Tables created: concept_overrides, learning_goal_overrides';
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercise_overrides') THEN
    RAISE NOTICE 'Table created: exercise_overrides';
  END IF;
  RAISE NOTICE 'Functions created: effective_concepts, effective_learning_goals';
  RAISE NOTICE '============================================================';
END $$;