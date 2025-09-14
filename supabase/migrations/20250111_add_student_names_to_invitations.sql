-- Add student first and last names to invitations table
-- This allows teachers to specify student names when creating invitations

-- Add first_name and last_name columns to class_student_invitations
ALTER TABLE public.class_student_invitations 
ADD COLUMN IF NOT EXISTS student_first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS student_last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS parent_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS parent_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(50);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_class_invitations_student_name 
ON public.class_student_invitations(student_first_name, student_last_name);

-- Update RLS policies to ensure they still work
-- (The existing policies should still work since we're just adding columns)