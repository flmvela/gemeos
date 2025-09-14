-- Safe version to fix students table (run each statement separately if needed)
-- Run this in Supabase SQL Editor

-- Step 1: Make tenant_id nullable (students don't belong to tenants)
ALTER TABLE public.students 
ALTER COLUMN tenant_id DROP NOT NULL;

-- Step 2: Add INSERT policy for students
CREATE POLICY IF NOT EXISTS "Students can create own record" ON public.students
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Step 3: Add UPDATE policy for students  
CREATE POLICY IF NOT EXISTS "Students can update own record" ON public.students
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Step 4: Ensure SELECT policy exists
CREATE POLICY IF NOT EXISTS "Students can view own record" ON public.students
  FOR SELECT
  USING (user_id = auth.uid());

-- Step 5: Allow teachers to view their students
CREATE POLICY IF NOT EXISTS "Teachers can view enrolled students" ON public.students
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

-- Step 6: Grant permissions
GRANT ALL ON public.students TO authenticated;

-- Verify the change worked
SELECT 
  column_name, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND column_name = 'tenant_id';