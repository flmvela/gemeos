-- Check current table structure
\d concepts

-- Force update teacher_id to NULL with proper casting
UPDATE concepts 
SET teacher_id = NULL 
WHERE teacher_id::text = '00000000-0000-0000-0000-000000000000';

-- Also make teacher_id nullable if it isn't already
ALTER TABLE concepts ALTER COLUMN teacher_id DROP NOT NULL;