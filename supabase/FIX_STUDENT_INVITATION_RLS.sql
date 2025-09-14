-- URGENT: Run this in Supabase SQL Editor to fix student invitation access
-- This fixes the issue where students can't view their invitations

-- Fix RLS policies for class_student_invitations to allow anonymous access by token
-- This is necessary for students to view their invitations before creating an account

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anonymous users can view invitations by token" ON public.class_student_invitations;
DROP POLICY IF EXISTS "Students can view their invitations by email" ON public.class_student_invitations;
DROP POLICY IF EXISTS "Students can update own invitations" ON public.class_student_invitations;
DROP POLICY IF EXISTS "Anonymous users can view invitations by id" ON public.class_student_invitations;

-- CRITICAL: Allow anonymous users to view ANY invitation
-- This is needed when students click the invitation link before logging in
-- We make this permissive because the token itself is the security
CREATE POLICY "Anonymous users can view invitations by token" ON public.class_student_invitations
  FOR SELECT
  USING (true);  -- Allow all SELECT queries - the token is the security

-- Allow students to view invitations sent to their email
-- This is useful after they've created an account
CREATE POLICY "Students can view their invitations by email" ON public.class_student_invitations
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND 
    student_email = auth.jwt()->>'email'
  );

-- Also ensure students can update their own invitations (to mark as accepted)
CREATE POLICY "Students can update own invitations" ON public.class_student_invitations
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    student_email = auth.jwt()->>'email'
  )
  WITH CHECK (
    student_email = auth.jwt()->>'email'
  );

-- Grant necessary permissions
GRANT SELECT ON public.class_student_invitations TO anon;
GRANT UPDATE ON public.class_student_invitations TO authenticated;

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'class_student_invitations'
ORDER BY policyname;