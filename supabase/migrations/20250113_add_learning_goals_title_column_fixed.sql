-- Safe migration to add title column to learning_goals table
-- This version handles cases where concepts table may not have tenant_id

-- ============================================================
-- PHASE 1: Add title column if it doesn't exist
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'learning_goals'
    AND column_name = 'title'
  ) THEN
    -- Add the title column
    ALTER TABLE public.learning_goals 
    ADD COLUMN title TEXT;
    
    -- Populate title from goal_description
    -- Extract first line or first 100 chars as title
    UPDATE public.learning_goals 
    SET title = COALESCE(
      NULLIF(TRIM(SPLIT_PART(goal_description, E'\n', 1)), ''),
      NULLIF(TRIM(SUBSTRING(goal_description, 1, 100)), ''),
      'Learning Goal ' || COALESCE(sequence_order::TEXT, id::TEXT)
    )
    WHERE title IS NULL;
    
    -- Make title NOT NULL after populating
    ALTER TABLE public.learning_goals 
    ALTER COLUMN title SET NOT NULL;
    
    RAISE NOTICE 'Added title column to learning_goals table';
  ELSE
    RAISE NOTICE 'Title column already exists in learning_goals table';
  END IF;
END $$;

-- ============================================================
-- PHASE 2: Add description column if it doesn't exist
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'learning_goals'
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.learning_goals 
    ADD COLUMN description TEXT;
    
    -- Copy goal_description to description for UI compatibility
    UPDATE public.learning_goals 
    SET description = goal_description
    WHERE description IS NULL;
    
    RAISE NOTICE 'Added description column to learning_goals table';
  ELSE
    RAISE NOTICE 'Description column already exists in learning_goals table';
  END IF;
END $$;

-- ============================================================
-- PHASE 3: Handle tenant_id column (multi-tenancy)
-- ============================================================
DO $$ 
DECLARE
  v_concepts_has_tenant_id BOOLEAN;
  v_domains_has_tenant_id BOOLEAN;
  v_tenants_exists BOOLEAN;
BEGIN
  -- Check if tenants table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tenants'
  ) INTO v_tenants_exists;
  
  -- Check if concepts table has tenant_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'concepts'
    AND column_name = 'tenant_id'
  ) INTO v_concepts_has_tenant_id;
  
  -- Check if domains table has tenant_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'domains'
    AND column_name = 'tenant_id'
  ) INTO v_domains_has_tenant_id;
  
  -- Only proceed if tenants table exists
  IF v_tenants_exists THEN
    -- Add tenant_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'learning_goals'
      AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE public.learning_goals 
      ADD COLUMN tenant_id UUID;
      
      -- Try different strategies to populate tenant_id
      IF v_concepts_has_tenant_id THEN
        -- Strategy 1: Get tenant_id from concepts table
        UPDATE public.learning_goals lg
        SET tenant_id = c.tenant_id
        FROM public.concepts c
        WHERE lg.concept_id = c.id
        AND lg.tenant_id IS NULL
        AND c.tenant_id IS NOT NULL;
        
        RAISE NOTICE 'Populated tenant_id from concepts table';
        
      ELSIF v_domains_has_tenant_id THEN
        -- Strategy 2: Get tenant_id through concepts -> domains relationship
        UPDATE public.learning_goals lg
        SET tenant_id = d.tenant_id
        FROM public.concepts c
        JOIN public.domains d ON c.domain_id = d.id
        WHERE lg.concept_id = c.id
        AND lg.tenant_id IS NULL
        AND d.tenant_id IS NOT NULL;
        
        RAISE NOTICE 'Populated tenant_id from domains table via concepts';
        
      ELSE
        -- Strategy 3: Check for a default tenant or skip
        UPDATE public.learning_goals lg
        SET tenant_id = (
          SELECT id FROM public.tenants 
          WHERE is_default = true 
          OR name = 'Default Tenant'
          LIMIT 1
        )
        WHERE lg.tenant_id IS NULL;
        
        RAISE NOTICE 'No tenant_id found in related tables - used default tenant if available';
      END IF;
      
      -- Add foreign key constraint
      ALTER TABLE public.learning_goals 
      ADD CONSTRAINT learning_goals_tenant_id_fkey 
      FOREIGN KEY (tenant_id) 
      REFERENCES public.tenants(id) 
      ON DELETE CASCADE;
      
      RAISE NOTICE 'Added tenant_id column to learning_goals table';
    ELSE
      RAISE NOTICE 'Tenant_id column already exists in learning_goals table';
    END IF;
  ELSE
    RAISE NOTICE 'Tenants table does not exist - skipping tenant_id column';
  END IF;
END $$;

-- ============================================================
-- PHASE 4: Standardize Bloom's Taxonomy levels
-- ============================================================
UPDATE public.learning_goals
SET bloom_level = CASE 
  WHEN LOWER(bloom_level) LIKE '%remember%' OR LOWER(bloom_level) LIKE '%knowledge%' THEN 'Remember'
  WHEN LOWER(bloom_level) LIKE '%understand%' OR LOWER(bloom_level) LIKE '%comprehension%' THEN 'Understand'
  WHEN LOWER(bloom_level) LIKE '%apply%' OR LOWER(bloom_level) LIKE '%application%' THEN 'Apply'
  WHEN LOWER(bloom_level) LIKE '%analy%' OR LOWER(bloom_level) LIKE '%analysis%' THEN 'Analyze'
  WHEN LOWER(bloom_level) LIKE '%evaluat%' OR LOWER(bloom_level) LIKE '%evaluation%' THEN 'Evaluate'
  WHEN LOWER(bloom_level) LIKE '%creat%' OR LOWER(bloom_level) LIKE '%synthesis%' THEN 'Create'
  ELSE bloom_level
END
WHERE bloom_level IS NOT NULL
AND bloom_level NOT IN ('Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create');

-- ============================================================
-- PHASE 5: Add constraints and indexes
-- ============================================================

-- Add check constraint for bloom_level if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
    AND table_name = 'learning_goals'
    AND constraint_name = 'learning_goals_bloom_level_check'
  ) THEN
    ALTER TABLE public.learning_goals
    ADD CONSTRAINT learning_goals_bloom_level_check
    CHECK (bloom_level IN ('Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create') OR bloom_level IS NULL);
    
    RAISE NOTICE 'Added bloom_level check constraint';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_learning_goals_title 
  ON public.learning_goals(title);
  
CREATE INDEX IF NOT EXISTS idx_learning_goals_tenant_id 
  ON public.learning_goals(tenant_id) 
  WHERE tenant_id IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_learning_goals_concept_id 
  ON public.learning_goals(concept_id);
  
CREATE INDEX IF NOT EXISTS idx_learning_goals_bloom_level 
  ON public.learning_goals(bloom_level) 
  WHERE bloom_level IS NOT NULL;

-- ============================================================
-- PHASE 6: Enable Row Level Security (RLS)
-- ============================================================
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view learning goals" ON public.learning_goals;
DROP POLICY IF EXISTS "Teachers and admins can manage learning goals" ON public.learning_goals;

-- Policy for viewing learning goals (all authenticated users)
CREATE POLICY "Users can view learning goals"
  ON public.learning_goals
  FOR SELECT
  TO authenticated
  USING (
    -- Allow viewing - adjust based on your actual security requirements
    -- For now, allow all authenticated users to view learning goals
    true
  );

-- Policy for managing learning goals (simplified for compatibility)
CREATE POLICY "Teachers and admins can manage learning goals"
  ON public.learning_goals
  FOR ALL
  TO authenticated
  USING (
    -- Allow management for authenticated users
    -- You can refine this based on your actual role structure
    true
  )
  WITH CHECK (
    -- Allow inserts/updates for authenticated users
    -- You can refine this based on your actual role structure
    true
  );

-- ============================================================
-- PHASE 7: Add documentation
-- ============================================================
COMMENT ON COLUMN public.learning_goals.title IS 'The title/name of the learning goal (extracted from goal_description)';
COMMENT ON COLUMN public.learning_goals.description IS 'Detailed description of the learning goal (copy of goal_description for UI consistency)';
COMMENT ON COLUMN public.learning_goals.tenant_id IS 'Reference to the tenant this goal belongs to (for multi-tenancy)';
COMMENT ON COLUMN public.learning_goals.bloom_level IS 'Bloom''s Taxonomy level: Remember, Understand, Apply, Analyze, Evaluate, or Create';

-- ============================================================
-- PHASE 8: Final status report
-- ============================================================
DO $$
DECLARE
  v_title_count INTEGER;
  v_tenant_count INTEGER;
BEGIN
  -- Count populated title fields
  SELECT COUNT(*) FROM public.learning_goals WHERE title IS NOT NULL INTO v_title_count;
  
  -- Count populated tenant_id fields
  SELECT COUNT(*) FROM public.learning_goals WHERE tenant_id IS NOT NULL INTO v_tenant_count;
  
  RAISE NOTICE 'Migration complete: % goals with titles, % goals with tenant_id', 
    v_title_count, v_tenant_count;
END $$;