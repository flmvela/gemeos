-- Migration to add title column to existing learning_goals table
-- Based on the existing schema, the table uses goal_description instead of title
-- This migration adds a title column and populates it from goal_description

-- Add title column if it doesn't exist
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
    
    -- Populate title from the first line of goal_description or a default
    UPDATE public.learning_goals 
    SET title = COALESCE(
      SPLIT_PART(goal_description, E'\n', 1),
      SUBSTRING(goal_description, 1, 100),
      'Learning Goal ' || COALESCE(sequence_order::TEXT, id::TEXT)
    )
    WHERE title IS NULL;
    
    -- Make title NOT NULL after populating
    ALTER TABLE public.learning_goals 
    ALTER COLUMN title SET NOT NULL;
  END IF;
END $$;

-- Add description column if it doesn't exist (as an alias/copy of goal_description for consistency)
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
    
    -- Copy goal_description to description
    UPDATE public.learning_goals 
    SET description = goal_description
    WHERE description IS NULL;
  END IF;
END $$;

-- Add tenant_id column if it doesn't exist (for multi-tenancy support)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'learning_goals'
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.learning_goals 
    ADD COLUMN tenant_id UUID;
    
    -- Set tenant_id from the concept's tenant_id
    UPDATE public.learning_goals lg
    SET tenant_id = c.tenant_id
    FROM public.concepts c
    WHERE lg.concept_id = c.id
    AND lg.tenant_id IS NULL;
    
    -- Add foreign key constraint if tenants table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'tenants'
    ) THEN
      ALTER TABLE public.learning_goals 
      ADD CONSTRAINT learning_goals_tenant_id_fkey 
      FOREIGN KEY (tenant_id) 
      REFERENCES public.tenants(id) 
      ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Update bloom_level values to match our standard taxonomy if needed
UPDATE public.learning_goals
SET bloom_level = CASE 
  WHEN LOWER(bloom_level) LIKE '%remember%' THEN 'Remember'
  WHEN LOWER(bloom_level) LIKE '%understand%' THEN 'Understand'
  WHEN LOWER(bloom_level) LIKE '%apply%' OR LOWER(bloom_level) LIKE '%application%' THEN 'Apply'
  WHEN LOWER(bloom_level) LIKE '%analy%' THEN 'Analyze'
  WHEN LOWER(bloom_level) LIKE '%evaluat%' THEN 'Evaluate'
  WHEN LOWER(bloom_level) LIKE '%creat%' OR LOWER(bloom_level) LIKE '%synthesis%' THEN 'Create'
  ELSE bloom_level
END
WHERE bloom_level IS NOT NULL;

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
  END IF;
END $$;

-- Create index on title for better search performance
CREATE INDEX IF NOT EXISTS idx_learning_goals_title ON public.learning_goals(title);
CREATE INDEX IF NOT EXISTS idx_learning_goals_tenant_id ON public.learning_goals(tenant_id);

-- Add RLS policies if not already enabled
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view learning goals" ON public.learning_goals;
DROP POLICY IF EXISTS "Teachers and admins can manage learning goals" ON public.learning_goals;

-- Policy for viewing learning goals (all authenticated users)
CREATE POLICY "Users can view learning goals"
  ON public.learning_goals
  FOR SELECT
  TO authenticated
  USING (true);  -- Adjust based on your security requirements

-- Policy for managing learning goals (teachers and admins)
CREATE POLICY "Teachers and admins can manage learning goals"
  ON public.learning_goals
  FOR ALL
  TO authenticated
  USING (
    -- Check if user has appropriate role
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_tenant_id IN (
        SELECT id FROM public.user_tenants 
        WHERE user_id = auth.uid()
      )
      AND r.name IN ('platform_admin', 'tenant_admin', 'teacher', 'domain_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_tenant_id IN (
        SELECT id FROM public.user_tenants 
        WHERE user_id = auth.uid()
      )
      AND r.name IN ('platform_admin', 'tenant_admin', 'teacher', 'domain_admin')
    )
  );

-- Add comments for documentation
COMMENT ON COLUMN public.learning_goals.title IS 'The title/name of the learning goal (derived from goal_description)';
COMMENT ON COLUMN public.learning_goals.description IS 'Detailed description of the learning goal (copy of goal_description for consistency)';
COMMENT ON COLUMN public.learning_goals.tenant_id IS 'Reference to the tenant this goal belongs to';