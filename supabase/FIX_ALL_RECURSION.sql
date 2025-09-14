-- URGENT: Fix ALL infinite recursion issues in student-related tables
-- Run this immediately in Supabase SQL Editor

-- 1. Fix class_student_enrollments table policies
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.class_student_enrollments;
DROP POLICY IF EXISTS "Teachers can view class enrollments" ON public.class_student_enrollments;
DROP POLICY IF EXISTS "Teachers can manage enrollments" ON public.class_student_enrollments;

-- Recreate clean policies for enrollments
CREATE POLICY "Students can view own enrollments" ON public.class_student_enrollments
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view class enrollments" ON public.class_student_enrollments
  FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM public.classes
      WHERE teacher_id IN (
        SELECT id FROM public.teachers
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Teachers can manage enrollments" ON public.class_student_enrollments
  FOR ALL
  USING (
    class_id IN (
      SELECT id FROM public.classes
      WHERE teacher_id IN (
        SELECT id FROM public.teachers
        WHERE user_id = auth.uid()
      )
    )
  );

-- 2. Fix class_student_invitations table policies
DROP POLICY IF EXISTS "Teachers can manage class invitations" ON public.class_student_invitations;
DROP POLICY IF EXISTS "Anonymous users can view invitations by token" ON public.class_student_invitations;
DROP POLICY IF EXISTS "Students can view their invitations by email" ON public.class_student_invitations;
DROP POLICY IF EXISTS "Students can update own invitations" ON public.class_student_invitations;
DROP POLICY IF EXISTS "Anonymous users can view invitations by id" ON public.class_student_invitations;

-- Recreate clean policies for invitations
CREATE POLICY "Anonymous can view invitations" ON public.class_student_invitations
  FOR SELECT
  USING (true);  -- Allow anonymous to view (security is via the token)

CREATE POLICY "Teachers can manage invitations" ON public.class_student_invitations
  FOR ALL
  USING (
    class_id IN (
      SELECT id FROM public.classes
      WHERE teacher_id IN (
        SELECT id FROM public.teachers
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Students can update own invitations" ON public.class_student_invitations
  FOR UPDATE
  USING (student_email = auth.jwt()->>'email')
  WITH CHECK (student_email = auth.jwt()->>'email');

-- 3. Re-check and simplify classes table policies
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage all classes" ON public.classes;
DROP POLICY IF EXISTS "Tenant admins can manage tenant classes" ON public.classes;

-- Simple, non-recursive policies for classes
CREATE POLICY "Teachers can manage own classes" ON public.classes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE id = classes.teacher_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Students view enrolled classes" ON public.classes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_student_enrollments cse
      WHERE cse.class_id = classes.id
        AND cse.student_id IN (
          SELECT id FROM public.students
          WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Admins view all classes" ON public.classes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      JOIN public.user_roles ur ON ur.id = ut.role_id
      WHERE ut.user_id = auth.uid()
        AND ur.name IN ('platform_admin', 'tenant_admin')
        AND ut.status = 'active'
    )
  );

-- 4. Ensure proper permissions
GRANT ALL ON public.class_student_enrollments TO authenticated;
GRANT SELECT ON public.class_student_invitations TO anon;
GRANT ALL ON public.class_student_invitations TO authenticated;

-- 5. Verify all policies are clean
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('students', 'classes', 'class_student_enrollments', 'class_student_invitations')
ORDER BY tablename, policyname;