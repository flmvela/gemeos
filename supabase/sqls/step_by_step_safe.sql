-- ============================================================
-- SAFE STEP-BY-STEP MIGRATION
-- Run each step individually and check results
-- ============================================================

-- STEP 1: Check if table was created successfully
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'difficulty_level_labels' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 2a: Create first index (run this separately)
CREATE INDEX IF NOT EXISTS idx_difficulty_level_labels_domain_id 
ON public.difficulty_level_labels(domain_id);

-- STEP 2b: Create second index (run this separately)  
CREATE INDEX IF NOT EXISTS idx_difficulty_level_labels_level_order 
ON public.difficulty_level_labels(domain_id, level_order);

-- STEP 3: Check if indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'difficulty_level_labels';

-- STEP 4: Try to insert a test record to make sure everything works
-- First get a domain ID
SELECT id, name FROM public.domains LIMIT 1;

-- STEP 5: Insert test difficulty level (replace YOUR_DOMAIN_ID with actual ID from step 4)
/*
INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
VALUES ('YOUR_DOMAIN_ID', 'Test Level', 1, 'Test description', '#22c55e');
*/

-- STEP 6: Check if the insert worked
SELECT * FROM public.difficulty_level_labels LIMIT 1;

-- STEP 7: Clean up test data
-- DELETE FROM public.difficulty_level_labels WHERE level_name = 'Test Level';