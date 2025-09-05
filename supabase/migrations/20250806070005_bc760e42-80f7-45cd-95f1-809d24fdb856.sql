-- Fix teacher_id for existing concepts that have '00000000-0000-0000-0000-000000000000'
-- Link them to the actual teacher who uploaded the source file
UPDATE concepts 
SET teacher_id = (
  SELECT uploaded_by 
  FROM domain_extracted_files 
  WHERE id = concepts.source_file_id
)
WHERE teacher_id = '00000000-0000-0000-0000-000000000000'
  AND source_file_id IS NOT NULL;

-- For concepts without source_file_id, we need to handle them differently
-- Let's also check if there are any concepts without proper teacher_id after the update
-- and log them for review