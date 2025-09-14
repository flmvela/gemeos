-- URGENT: Fix students table to allow student record creation
-- Run this in Supabase SQL Editor immediately

-- 1. Make tenant_id nullable (students don't belong to tenants)
ALTER TABLE public.students 
ALTER COLUMN tenant_id DROP NOT NULL;

-- 2. Add RLS policy to allow students to create their own record
DROP POLICY IF EXISTS "Students can create own record" ON public.students;
CREATE POLICY "Students can create own record" ON public.students
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 3. Add policy to allow students to update their own record
DROP POLICY IF EXISTS "Students can update own record" ON public.students;
CREATE POLICY "Students can update own record" ON public.students
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Ensure the SELECT policy exists
DROP POLICY IF EXISTS "Students can view own record" ON public.students;
CREATE POLICY "Students can view own record" ON public.students
  FOR SELECT
  USING (user_id = auth.uid());

-- 5. Allow teachers to view students in their classes
DROP POLICY IF EXISTS "Teachers can view enrolled students" ON public.students;
CREATE POLICY "Teachers can view enrolled students" ON public.students
  FOR SELECT
  USING (
    id IN (
      SELECT student_id 
      FROM public.class_student_enrollments cse
      JOIN public.classes c ON cse.class_id = c.id
      JOIN public.teachers t ON c.teacher_id = t.id
      WHERE t.user_id = auth.uid()
    )
  );

-- 6. Grant necessary permissions
GRANT ALL ON public.students TO authenticated;

-- 7. Verify the changes
SELECT 
  column_name, 
  is_nullable,
  data_type 
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND column_name = 'tenant_id';

-- Check policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'students'
ORDER BY policyname;