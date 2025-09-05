-- Fix AI concepts to have NULL teacher_id instead of all-zeros UUID
UPDATE concepts 
SET teacher_id = NULL 
WHERE teacher_id = '00000000-0000-0000-0000-000000000000'::uuid;