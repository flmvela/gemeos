-- Temporarily update RLS policy to allow admin to see concepts with zero UUID
DROP POLICY IF EXISTS "Users can view concepts" ON concepts;

CREATE POLICY "Users can view concepts" ON concepts 
FOR SELECT USING (
  ((auth.jwt() ->> 'role'::text) = 'admin'::text) OR 
  (auth.uid() = teacher_id) OR 
  (teacher_id IS NULL) OR
  (teacher_id = '00000000-0000-0000-0000-000000000000'::uuid)
);