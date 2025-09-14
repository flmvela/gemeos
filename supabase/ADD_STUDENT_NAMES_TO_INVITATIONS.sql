-- URGENT: Run this in Supabase SQL Editor to add student names to invitations
-- This allows teachers to save student names when creating invitations

-- Add student first and last names to invitations table
ALTER TABLE public.class_student_invitations 
ADD COLUMN IF NOT EXISTS student_first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS student_last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS parent_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS parent_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(50);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_class_invitations_student_name 
ON public.class_student_invitations(student_first_name, student_last_name);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'class_student_invitations' 
AND column_name IN ('student_first_name', 'student_last_name', 'parent_name', 'parent_email', 'parent_phone')
ORDER BY column_name;