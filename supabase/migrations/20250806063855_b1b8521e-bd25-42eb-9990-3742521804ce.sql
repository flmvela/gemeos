-- Fix the search path security warnings for the new functions

-- Update the get_teacher_id_from_file function with secure search_path
CREATE OR REPLACE FUNCTION public.get_teacher_id_from_file(file_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT uploaded_by 
  FROM domain_extracted_files 
  WHERE id = file_id;
$$;

-- Update the auto_set_teacher_id function with secure search_path
CREATE OR REPLACE FUNCTION public.auto_set_teacher_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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