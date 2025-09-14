-- URGENT: Fix infinite recursion in students table policies
-- Run this immediately in Supabase SQL Editor

-- 1. Drop the problematic policy that's causing recursion
DROP POLICY IF EXISTS "Teachers can view enrolled students" ON public.students;

-- 2. Drop any other policies that might be conflicting
DROP POLICY IF EXISTS "Students can view own record" ON public.students;
DROP POLICY IF EXISTS "Students can create own record" ON public.students;
DROP POLICY IF EXISTS "Students can update own record" ON public.students;

-- 3. Recreate policies WITHOUT circular references

-- Allow students to manage their own record
CREATE POLICY "Students can view own record" ON public.students
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Students can create own record" ON public.students
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update own record" ON public.students
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Simpler policy for teachers - avoid complex joins
CREATE POLICY "Teachers can view students" ON public.students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.class_student_enrollments cse
      INNER JOIN public.classes c ON c.id = cse.class_id
      INNER JOIN public.teachers t ON t.id = c.teacher_id
      WHERE cse.student_id = students.id
        AND t.user_id = auth.uid()
    )
  );

-- 5. Add policy for platform/tenant admins
CREATE POLICY "Admins can view all students" ON public.students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      INNER JOIN public.user_roles ur ON ur.id = ut.role_id
      WHERE ut.user_id = auth.uid()
        AND ur.name IN ('platform_admin', 'tenant_admin')
        AND ut.status = 'active'
    )
  );

-- 6. Fix classes table policies (if they're also affected)
-- Drop existing policies that might be problematic
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Tenant admins can manage tenant classes" ON public.classes;

-- Recreate clean policies for classes
CREATE POLICY "Teachers can manage their own classes" ON public.classes
  FOR ALL
  USING (
    teacher_id IN (
      SELECT id FROM public.teachers 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can view enrolled classes" ON public.classes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_student_enrollments cse
      INNER JOIN public.students s ON s.id = cse.student_id
      WHERE cse.class_id = classes.id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all classes" ON public.classes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      INNER JOIN public.user_roles ur ON ur.id = ut.role_id
      WHERE ut.user_id = auth.uid()
        AND ur.name IN ('platform_admin', 'tenant_admin')
        AND ut.status = 'active'
    )
  );

-- 7. Verify the policies
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('students', 'classes')
ORDER BY tablename, policyname;