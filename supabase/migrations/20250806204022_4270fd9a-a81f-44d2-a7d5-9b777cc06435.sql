-- Force set teacher_id to NULL for all AI-generated concepts
-- Use explicit cast to handle the zero UUID
UPDATE concepts 
SET teacher_id = NULL
WHERE teacher_id::text = '00000000-0000-0000-0000-000000000000' 
   OR teacher_id = '00000000-0000-0000-0000-000000000000'::uuid;

-- Verify the update
SELECT 
  'Before update' as phase,
  COUNT(*) as total_concepts,
  COUNT(CASE WHEN teacher_id IS NULL THEN 1 END) as null_teacher_id,
  COUNT(CASE WHEN teacher_id::text = '00000000-0000-0000-0000-000000000000' THEN 1 END) as zero_uuid
FROM concepts 
WHERE domain_id = 'jazz';