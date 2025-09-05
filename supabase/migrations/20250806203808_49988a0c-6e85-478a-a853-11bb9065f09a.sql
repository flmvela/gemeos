-- Force update concepts with explicit casting
UPDATE concepts 
SET teacher_id = CASE 
  WHEN teacher_id::text = '00000000-0000-0000-0000-000000000000' THEN NULL 
  ELSE teacher_id 
END
WHERE domain_id = 'jazz';