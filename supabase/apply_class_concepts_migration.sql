-- Instructions: Run this SQL script in the Supabase SQL Editor
-- Navigate to: https://supabase.com/dashboard/project/jfolpnyipoocflcrachg/editor

-- This script sets up the class concepts system for managing concept difficulty and class levels

-- First, check if migration already applied
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_concepts') THEN
        RAISE NOTICE 'Creating class_concepts system...';
        
        -- Copy the content from the migration file here
        -- /Users/fabiovelardi/gemeos/supabase/migrations/20250111_class_concepts_system.sql
        
    ELSE
        RAISE NOTICE 'class_concepts table already exists, skipping migration.';
    END IF;
END $$;

-- To apply this migration:
-- 1. Go to https://supabase.com/dashboard/project/jfolpnyipoocflcrachg/editor
-- 2. Copy the contents of /Users/fabiovelardi/gemeos/supabase/migrations/20250111_class_concepts_system.sql
-- 3. Paste and run in the SQL editor
-- 4. Verify the tables were created successfully