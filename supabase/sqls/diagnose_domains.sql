-- ============================================================
-- DIAGNOSTIC QUERIES FOR DOMAINS TABLE
-- Run these to understand the current state
-- ============================================================

-- 1. Check if domains table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'domains'
);

-- 2. Check domains table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'domains' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check existing domains data
SELECT * FROM public.domains LIMIT 10;

-- 4. Check if difficulty_level_labels table already exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'difficulty_level_labels'
);

-- 5. If difficulty_level_labels exists, check its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'difficulty_level_labels' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Check for foreign key constraints on difficulty_level_labels
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'difficulty_level_labels';

-- 7. Check update_updated_at_column function exists
SELECT EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'update_updated_at_column'
    AND n.nspname = 'public'
);