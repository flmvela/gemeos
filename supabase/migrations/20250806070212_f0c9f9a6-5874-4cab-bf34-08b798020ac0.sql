-- Fix concepts that still have the default teacher_id but don't have source_file_id
-- Set them to the current admin user (ba1a365e-161d-4f76-b572-850443aa3d2c)
UPDATE concepts 
SET teacher_id = 'ba1a365e-161d-4f76-b572-850443aa3d2c'
WHERE teacher_id = '00000000-0000-0000-0000-000000000000'
  AND domain_id = 'jazz';