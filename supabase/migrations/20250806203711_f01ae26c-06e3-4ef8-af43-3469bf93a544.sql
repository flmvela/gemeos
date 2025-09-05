-- Force update all concepts with zero UUID to NULL teacher_id
UPDATE concepts 
SET teacher_id = NULL 
WHERE teacher_id = '00000000-0000-0000-0000-000000000000';