-- Fix RLS policies for class_sessions to allow INSERT operations
BEGIN;

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view sessions for accessible classes" ON public.class_sessions;

-- Create separate policies for different operations
-- Policy for teachers to manage sessions for their classes
CREATE POLICY "Teachers can manage sessions for their classes" ON public.class_sessions
  FOR ALL
  USING (
    class_id IN (
      SELECT id FROM public.classes
      WHERE teacher_id IN (
        SELECT id FROM public.teachers 
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    class_id IN (
      SELECT id FROM public.classes
      WHERE teacher_id IN (
        SELECT id FROM public.teachers 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy for students to view sessions
CREATE POLICY "Students can view sessions for enrolled classes" ON public.class_sessions
  FOR SELECT
  USING (
    class_id IN (
      SELECT class_id FROM public.class_student_enrollments
      WHERE student_id IN (
        SELECT id FROM public.students
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy for tenant admins
CREATE POLICY "Tenant admins can manage all sessions" ON public.class_sessions
  FOR ALL
  USING (
    class_id IN (
      SELECT id FROM public.classes
      WHERE tenant_id IN (
        SELECT tenant_id FROM public.user_tenants
        WHERE user_id = auth.uid()
          AND role_id IN (
            SELECT id FROM public.user_roles 
            WHERE name IN ('tenant_admin', 'platform_admin')
          )
          AND status = 'active'
      )
    )
  )
  WITH CHECK (
    class_id IN (
      SELECT id FROM public.classes
      WHERE tenant_id IN (
        SELECT tenant_id FROM public.user_tenants
        WHERE user_id = auth.uid()
          AND role_id IN (
            SELECT id FROM public.user_roles 
            WHERE name IN ('tenant_admin', 'platform_admin')
          )
          AND status = 'active'
      )
    )
  );

-- Similar fix for class_difficulty_levels
DROP POLICY IF EXISTS "Users can view class difficulty levels" ON public.class_difficulty_levels;

CREATE POLICY "Teachers can manage difficulty levels for their classes" ON public.class_difficulty_levels
  FOR ALL
  USING (
    class_id IN (
      SELECT id FROM public.classes
      WHERE teacher_id IN (
        SELECT id FROM public.teachers 
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    class_id IN (
      SELECT id FROM public.classes
      WHERE teacher_id IN (
        SELECT id FROM public.teachers 
        WHERE user_id = auth.uid()
      )
    )
  );

COMMIT;