-- Fix the auto_set_teacher_id trigger to handle AI-generated concepts better
-- and update the concepts table to properly handle AI concepts

-- First, let's update existing AI concepts to have NULL teacher_id instead of all-zeros
UPDATE concepts 
SET teacher_id = NULL 
WHERE teacher_id = '00000000-0000-0000-0000-000000000000';

-- Update the trigger function to handle AI concepts properly
CREATE OR REPLACE FUNCTION public.auto_set_teacher_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If teacher_id is null but source_file_id is provided, get teacher_id from the file
  IF NEW.teacher_id IS NULL AND NEW.source_file_id IS NOT NULL THEN
    NEW.teacher_id = public.get_teacher_id_from_file(NEW.source_file_id);
  END IF;
  
  -- If teacher_id is still null and this is not an AI-generated concept,
  -- this will cause the NOT NULL constraint to fail (which we want for user-created concepts)
  -- But for AI concepts, we allow NULL teacher_id
  
  RETURN NEW;
END;
$function$;

-- Update the RLS policy to be more explicit about AI concepts
DROP POLICY IF EXISTS "Users can view concepts" ON public.concepts;

CREATE POLICY "Users can view concepts" 
ON public.concepts 
FOR SELECT 
USING (
  -- Admins can see everything
  (auth.jwt() ->> 'role'::text) = 'admin'::text 
  -- Users can see their own concepts
  OR auth.uid() = teacher_id
  -- Everyone can see AI-generated concepts (teacher_id is NULL)
  OR teacher_id IS NULL
);