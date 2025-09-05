-- Test if we can manually update metadata_json
UPDATE concepts 
SET metadata_json = '{"test": "value", "mindmap_position": {"x": 100, "y": 200}}'::jsonb
WHERE id = '220a21c1-c7d9-4d5b-b3eb-a280b29d7539';

-- Check if the update persisted
SELECT id, name, metadata_json 
FROM concepts 
WHERE id = '220a21c1-c7d9-4d5b-b3eb-a280b29d7539';