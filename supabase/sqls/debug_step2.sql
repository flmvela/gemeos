-- ============================================================
-- DEBUG STEP 2 - Check what happened after Step 1
-- ============================================================

-- 1. Check if difficulty_level_labels table was created
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'difficulty_level_labels'
) AS table_exists;

-- 2. Check the actual structure of difficulty_level_labels table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'difficulty_level_labels' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Try creating the index manually with full table qualification
CREATE INDEX IF NOT EXISTS idx_difficulty_level_labels_domain_id_manual 
ON public.difficulty_level_labels(domain_id);

-- 4. Check if the index was created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'difficulty_level_labels';