-- Final fix: Update concepts with zero UUID to NULL
-- Handle this specific UUID value
UPDATE concepts 
SET teacher_id = NULL
WHERE domain_id = 'jazz' 
  AND teacher_id = '00000000-0000-0000-0000-000000000000'::uuid;