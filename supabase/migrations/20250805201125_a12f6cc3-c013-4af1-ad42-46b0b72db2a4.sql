-- Allow admins to view all concepts regardless of teacher_id
DROP POLICY IF EXISTS "Teachers can view their own concepts" ON concepts;

CREATE POLICY "Users can view concepts" ON concepts
FOR SELECT 
USING (
  -- Admins can see all concepts
  ((auth.jwt() ->> 'role'::text) = 'admin'::text) 
  OR 
  -- Teachers can see their own concepts
  (auth.uid() = teacher_id)
);