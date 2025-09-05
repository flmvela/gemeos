-- Fix the RLS policy to check the correct admin role path
DROP POLICY IF EXISTS "Concept update access" ON public.concepts;

-- Create the corrected policy that checks app_metadata.role for admin
CREATE POLICY "Concept update access" ON public.concepts
FOR UPDATE 
USING (
  ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'
  OR auth.uid() = teacher_id
);