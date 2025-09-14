-- ============================================================
-- DIFFICULTY LEVEL CONSOLIDATION MIGRATION
-- Purpose: Consolidate difficulty levels to single source of truth
-- Date: 2025-01-12
-- ============================================================

BEGIN;

-- ============================================================
-- PHASE 1: PREPARE AND ANALYZE
-- ============================================================

-- Check if difficulty_level_labels table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'difficulty_level_labels'
  ) THEN
    RAISE NOTICE 'Table difficulty_level_labels exists - will migrate data';
  ELSE
    RAISE NOTICE 'Table difficulty_level_labels does not exist - skipping migration';
  END IF;
END
$$;

-- ============================================================
-- PHASE 2: ADD MISSING COLUMNS TO CONCEPTS TABLE
-- ============================================================

-- Add difficulty_level_id column to concepts if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'concepts' 
    AND column_name = 'difficulty_level_id'
  ) THEN
    ALTER TABLE public.concepts 
    ADD COLUMN difficulty_level_id UUID 
    REFERENCES public.domain_difficulty_levels(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Added difficulty_level_id column to concepts table';
  ELSE
    RAISE NOTICE 'Column difficulty_level_id already exists in concepts table';
  END IF;
END
$$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_concepts_difficulty_level_id 
ON public.concepts(difficulty_level_id);

-- ============================================================
-- PHASE 3: MIGRATE DATA FROM difficulty_level_labels IF EXISTS
-- ============================================================

DO $$
DECLARE
  migrated_count INTEGER := 0;
BEGIN
  -- Only proceed if the old table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'difficulty_level_labels'
  ) THEN
    
    -- Migrate data from difficulty_level_labels to domain_difficulty_levels
    INSERT INTO public.domain_difficulty_levels (
      domain_id, 
      level_number, 
      level_name, 
      description, 
      color_code,
      created_at,
      updated_at
    )
    SELECT 
      dll.domain_id,
      dll.level_order as level_number,
      dll.level_name,
      dll.description,
      dll.color_code,
      dll.created_at,
      dll.updated_at
    FROM public.difficulty_level_labels dll
    WHERE NOT EXISTS (
      SELECT 1 
      FROM public.domain_difficulty_levels ddl
      WHERE ddl.domain_id = dll.domain_id 
      AND ddl.level_number = dll.level_order
    );
    
    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % difficulty level records', migrated_count;
    
  END IF;
END
$$;

-- ============================================================
-- PHASE 4: UPDATE CONCEPTS TO USE PROPER FOREIGN KEYS
-- ============================================================

-- Update concepts that have numeric difficulty_level but no difficulty_level_id
DO $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Check if concepts table has difficulty_level column (numeric)
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'concepts' 
    AND column_name = 'difficulty_level'
    AND data_type IN ('integer', 'numeric', 'smallint')
  ) THEN
    
    -- Update concepts to reference the proper difficulty level
    UPDATE public.concepts c
    SET difficulty_level_id = ddl.id
    FROM public.domain_difficulty_levels ddl
    WHERE c.domain_id::text = ddl.domain_id::text
    AND ddl.level_number = c.difficulty_level
    AND c.difficulty_level_id IS NULL
    AND c.difficulty_level IS NOT NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % concept records with difficulty level references', updated_count;
    
  END IF;
END
$$;

-- ============================================================
-- PHASE 5: UPDATE CLASSES REFERENCES IF NEEDED
-- ============================================================

DO $$
DECLARE
  class_updated_count INTEGER := 0;
BEGIN
  -- Check if classes table references difficulty_level_labels
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'classes' 
    AND column_name = 'difficulty_level_id'
  ) AND EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'difficulty_level_labels'
  ) THEN
    
    -- Add temporary column if needed
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'classes' 
      AND column_name = 'difficulty_level_id_new'
    ) THEN
      ALTER TABLE public.classes 
      ADD COLUMN difficulty_level_id_new UUID 
      REFERENCES public.domain_difficulty_levels(id) ON DELETE SET NULL;
    END IF;
    
    -- Migrate class difficulty references
    UPDATE public.classes c
    SET difficulty_level_id_new = (
      SELECT ddl.id 
      FROM public.domain_difficulty_levels ddl
      JOIN public.difficulty_level_labels dll 
        ON ddl.domain_id = dll.domain_id 
        AND ddl.level_number = dll.level_order
      WHERE dll.id = c.difficulty_level_id
    )
    WHERE c.difficulty_level_id IS NOT NULL
    AND c.difficulty_level_id_new IS NULL;
    
    GET DIAGNOSTICS class_updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % class records with new difficulty level references', class_updated_count;
    
  END IF;
END
$$;

-- ============================================================
-- PHASE 6: CREATE HELPER FUNCTIONS
-- ============================================================

-- Function to get difficulty level for a concept
CREATE OR REPLACE FUNCTION public.get_concept_difficulty_level(p_concept_id UUID)
RETURNS TABLE (
  level_number INTEGER,
  level_name VARCHAR(100),
  color_code VARCHAR(7)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ddl.level_number,
    ddl.level_name,
    ddl.color_code
  FROM public.concepts c
  LEFT JOIN public.domain_difficulty_levels ddl ON c.difficulty_level_id = ddl.id
  WHERE c.id = p_concept_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to match concepts by difficulty level
CREATE OR REPLACE FUNCTION public.get_concepts_by_difficulty_range(
  p_domain_id UUID,
  p_min_level INTEGER,
  p_max_level INTEGER
)
RETURNS TABLE (
  concept_id UUID,
  concept_name VARCHAR(255),
  difficulty_level_number INTEGER,
  difficulty_level_name VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as concept_id,
    c.name as concept_name,
    ddl.level_number as difficulty_level_number,
    ddl.level_name as difficulty_level_name
  FROM public.concepts c
  JOIN public.domain_difficulty_levels ddl ON c.difficulty_level_id = ddl.id
  WHERE ddl.domain_id = p_domain_id
  AND ddl.level_number BETWEEN p_min_level AND p_max_level
  ORDER BY ddl.level_number, c.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- PHASE 7: CREATE MIGRATION STATUS VIEW
-- ============================================================

CREATE OR REPLACE VIEW public.difficulty_migration_status AS
SELECT 
  'concepts' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN difficulty_level_id IS NOT NULL THEN 1 END) as migrated_records,
  COUNT(CASE WHEN difficulty_level_id IS NULL THEN 1 END) as pending_records
FROM public.concepts
UNION ALL
SELECT 
  'domain_difficulty_levels' as table_name,
  COUNT(*) as total_records,
  COUNT(*) as migrated_records,
  0 as pending_records
FROM public.domain_difficulty_levels;

-- ============================================================
-- PHASE 8: DATA VALIDATION
-- ============================================================

-- Validate that all domains have difficulty levels
DO $$
DECLARE
  domain_record RECORD;
  missing_count INTEGER := 0;
BEGIN
  FOR domain_record IN 
    SELECT d.id, d.name 
    FROM public.domains d
    LEFT JOIN public.domain_difficulty_levels ddl ON d.id = ddl.domain_id
    WHERE ddl.id IS NULL
    GROUP BY d.id, d.name
  LOOP
    -- Create default difficulty levels for domains that don't have any
    PERFORM public.create_default_difficulty_levels(domain_record.id);
    missing_count := missing_count + 1;
    RAISE NOTICE 'Created default difficulty levels for domain: %', domain_record.name;
  END LOOP;
  
  IF missing_count > 0 THEN
    RAISE NOTICE 'Created difficulty levels for % domains', missing_count;
  ELSE
    RAISE NOTICE 'All domains have difficulty levels configured';
  END IF;
END
$$;

-- ============================================================
-- PHASE 9: CLEANUP (COMMENTED OUT - RUN MANUALLY AFTER VERIFICATION)
-- ============================================================

-- After verifying the migration is successful, run these commands manually:

-- -- Remove old difficulty_level column from concepts if exists
-- ALTER TABLE public.concepts DROP COLUMN IF EXISTS difficulty_level;

-- -- Remove old difficulty_level_id from classes and rename new column
-- ALTER TABLE public.classes DROP COLUMN IF EXISTS difficulty_level_id;
-- ALTER TABLE public.classes RENAME COLUMN difficulty_level_id_new TO difficulty_level_id;

-- -- Drop the legacy table
-- DROP TABLE IF EXISTS public.difficulty_level_labels CASCADE;

-- ============================================================
-- PHASE 10: FINAL REPORT
-- ============================================================

-- Display migration status
SELECT * FROM public.difficulty_migration_status;

-- Display domain difficulty level summary
SELECT 
  d.name as domain_name,
  COUNT(ddl.id) as difficulty_levels_count,
  MIN(ddl.level_number) as min_level,
  MAX(ddl.level_number) as max_level
FROM public.domains d
LEFT JOIN public.domain_difficulty_levels ddl ON d.id = ddl.domain_id
GROUP BY d.id, d.name
ORDER BY d.name;

COMMIT;

-- ============================================================
-- POST-MIGRATION NOTES
-- ============================================================
-- 1. After running this migration, verify data integrity using:
--    SELECT * FROM public.difficulty_migration_status;
--
-- 2. Test the application to ensure all difficulty level references work
--
-- 3. Once verified, run the cleanup commands in PHASE 9 manually
--
-- 4. Update application code to use difficulty_level_id instead of numeric values
-- ============================================================