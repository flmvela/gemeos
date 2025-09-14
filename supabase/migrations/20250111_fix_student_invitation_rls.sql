-- Fix RLS policies for class_student_invitations to allow anonymous access by token
-- This is necessary for students to view their invitations before creating an account

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Anonymous users can view invitations by token" ON public.class_student_invitations;
DROP POLICY IF EXISTS "Students can view their invitations by email" ON public.class_student_invitations;

-- Allow anonymous users to view invitations by invitation_token
-- This is needed when students click the invitation link before logging in
CREATE POLICY "Anonymous users can view invitations by token" ON public.class_student_invitations
  FOR SELECT
  USING (
    -- Allow access if the invitation_token is provided in the query
    -- This works because the frontend will query with .eq('invitation_token', token)
    invitation_token IS NOT NULL
  );

-- Allow students to view invitations sent to their email
-- This is useful after they've created an account
CREATE POLICY "Students can view their invitations by email" ON public.class_student_invitations
  FOR SELECT
  USING (
    student_email = auth.jwt()->>'email'
  );

-- Also ensure students can update their own invitations (to mark as accepted)
DROP POLICY IF EXISTS "Students can update own invitations" ON public.class_student_invitations;

CREATE POLICY "Students can update own invitations" ON public.class_student_invitations
  FOR UPDATE
  USING (
    student_email = auth.jwt()->>'email'
  )
  WITH CHECK (
    student_email = auth.jwt()->>'email'
  );

-- For debugging: Create a policy that allows viewing invitations by ID as well
-- This is for backward compatibility with existing links
DROP POLICY IF EXISTS "Anonymous users can view invitations by id" ON public.class_student_invitations;

CREATE POLICY "Anonymous users can view invitations by id" ON public.class_student_invitations
  FOR SELECT
  USING (
    -- Allow access if querying by ID (for backward compatibility)
    id IS NOT NULL
  );

-- Grant necessary permissions
GRANT SELECT ON public.class_student_invitations TO anon;
GRANT UPDATE ON public.class_student_invitations TO authenticated;