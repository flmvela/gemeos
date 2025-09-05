-- Check current policies on concepts table
SELECT policyname, cmd, permissive, qual, with_check 
FROM pg_policies 
WHERE tablename = 'concepts' AND cmd = 'UPDATE';

-- Drop the conflicting teacher policy and recreate with proper admin override
DROP POLICY IF EXISTS "Teachers can update their own concepts" ON public.concepts;
DROP POLICY IF EXISTS "Admins can update all concepts" ON public.concepts;

-- Create new comprehensive update policy that allows both teachers and admins
CREATE POLICY "Concept update access" ON public.concepts
FOR UPDATE 
USING (
  (auth.jwt() ->> 'role'::text) = 'admin'::text 
  OR auth.uid() = teacher_id
);