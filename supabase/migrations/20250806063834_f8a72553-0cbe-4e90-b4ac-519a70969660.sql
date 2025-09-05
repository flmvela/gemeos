-- Add a column to the domain_extracted_files table to track the teacher_id
-- This will help us pass the teacher information to the concepts-chunker service

-- First, check if we can get teacher_id from uploaded_by (which is already stored)
-- Since uploaded_by contains the user_id, we can use this directly as teacher_id

-- For now, let's create a view or update the concepts-chunker to use uploaded_by as teacher_id
-- But first, let's add a trigger to ensure concepts are created with the correct teacher_id

-- Create a function that automatically sets teacher_id based on the file uploader
CREATE OR REPLACE FUNCTION public.get_teacher_id_from_file(file_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT uploaded_by 
  FROM domain_extracted_files 
  WHERE id = file_id;
$$;

-- Create a function to auto-set teacher_id when concepts are inserted without one
CREATE OR REPLACE FUNCTION public.auto_set_teacher_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If teacher_id is null but source_file_id is provided, get teacher_id from the file
  IF NEW.teacher_id IS NULL AND NEW.source_file_id IS NOT NULL THEN
    NEW.teacher_id = public.get_teacher_id_from_file(NEW.source_file_id);
  END IF;
  
  -- If teacher_id is still null, this will cause the NOT NULL constraint to fail
  -- which is what we want to prevent orphaned concepts
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_set_teacher_id_trigger ON public.concepts;
CREATE TRIGGER auto_set_teacher_id_trigger
  BEFORE INSERT OR UPDATE ON public.concepts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_teacher_id();