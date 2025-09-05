-- Reset some key jazz concepts back to approved status
-- These are commonly approved fundamental concepts
UPDATE concepts 
SET status = 'approved', updated_at = now()
WHERE domain_id = 'jazz' 
AND name IN (
  'harmony', 
  'scales', 
  'technique', 
  'improvisation', 
  'jazz piano', 
  'rhythm'
);