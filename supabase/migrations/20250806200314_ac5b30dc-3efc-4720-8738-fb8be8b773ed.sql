-- Fix RLS policy to allow admins to see all concepts including AI-generated ones
DROP POLICY IF EXISTS "Users can view concepts" ON public.concepts;

CREATE POLICY "Users can view concepts" 
ON public.concepts 
FOR SELECT 
USING (
  (auth.jwt() ->> 'role'::text) = 'admin'::text 
  OR auth.uid() = teacher_id
);