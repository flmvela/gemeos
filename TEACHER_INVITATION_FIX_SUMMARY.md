# Teacher Invitation URL Fix Summary

## Problem
Teacher invitation emails are being sent with the wrong URL:
- **Current (Wrong)**: `/accept-invite?tenant=ec2f9323-5798-4d69-a68f-3946150fce43`
- **Expected (Correct)**: `/teacher-setup?token={invitation_token}`

## Root Cause
The Supabase Edge Function `send-email` is overriding the correct `invitationUrl` that's being passed from the teacher service.

## Files Involved

### 1. `/src/services/teacher.service.ts`
- ✅ Correctly builds URL: `${window.location.origin}/teacher-setup?token=${invitationToken}`
- ✅ Passes it as `invitationUrl` in template variables

### 2. `/supabase/functions/send-email/index.ts`
- ❌ Was overriding the URL for teacher invitations
- ❌ Using `/accept-invite` pattern meant for tenant admins

## Fix Applied
Updated the Edge Function to:
1. Check for `teacher_invitation` template type specifically
2. Use the provided `invitationUrl` for teacher invitations
3. Only build `/accept-invite` URLs for tenant admin invitations

## Deployment Status
- ✅ Edge Function code updated
- ✅ Edge Function deployed via `npx supabase functions deploy send-email --no-verify-jwt`

## Testing Required
1. Create a new teacher invitation
2. Check the email received
3. Verify the URL is `/teacher-setup?token=...`
4. Click the link and verify it goes to the TeacherSetupPassword page

## Known Working Token
For testing, this token exists in the database:
- Token: `a3530f52-85c5-4eb3-826c-32d3f1351274`
- URL: `http://localhost:8087/teacher-setup?token=a3530f52-85c5-4eb3-826c-32d3f1351274`
- Email: `test.teacher.metadata@example.com`

## If Issue Persists
1. Check Edge Function logs in Supabase Dashboard
2. Look for the debug logs:
   - `[TEMPLATE_VARS] Received:` - shows what variables are passed
   - `[TEACHER_INVITATION] Using provided invite URL:` - should show the correct URL
3. Verify the Edge Function deployment actually updated (check timestamp in Supabase Dashboard)
4. May need to clear Supabase Edge Function cache or redeploy