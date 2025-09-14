/**
 * Test script to create a teacher invitation and verify the URL
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTeacherInvitation() {
  console.log('🧪 Testing teacher invitation creation...');
  console.log('');

  try {
    // First, authenticate as tenant admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'flm.velardi+ta1010@gmail.com',
      password: 'Abc123!@#'
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authenticated as tenant admin');

    // Get tenant ID
    const { data: userTenants } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', authData.user.id)
      .single();

    const tenantId = userTenants?.tenant_id || 'ec2f9323-5798-4d69-a68f-3946150fce43';
    console.log('📍 Using tenant ID:', tenantId);

    // Generate unique email for this test
    const timestamp = Date.now();
    const testEmail = `test.teacher.${timestamp}@example.com`;
    const invitationToken = crypto.randomUUID();
    
    console.log('📧 Creating invitation for:', testEmail);
    console.log('🔑 Invitation token:', invitationToken);

    // Create the invitation
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .insert({
        email: testEmail,
        tenant_id: tenantId,
        role_name: 'teacher',
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        invited_by: authData.user.id,
        invitation_token: invitationToken,
        metadata: {
          firstName: 'Test',
          lastName: 'Teacher',
          phoneNumber: '+1 (555) 000-0000',
          domains: {
            primaryDomain: { id: '1', name: 'Jazz Music' }
          }
        }
      })
      .select()
      .single();

    if (invError) {
      console.error('❌ Failed to create invitation:', invError.message);
      return;
    }

    console.log('✅ Invitation created with ID:', invitation.id);

    // Build the correct URL
    const correctUrl = `http://localhost:8087/teacher-setup?token=${invitationToken}`;
    console.log('');
    console.log('📍 Expected URL in email:', correctUrl);
    console.log('');

    // Now queue the email
    const { data: queueResult, error: queueError } = await supabase.rpc('queue_email', {
      p_tenant_id: tenantId,
      p_template_type: 'teacher_invitation',
      p_to_email: testEmail,
      p_template_variables: {
        tenantName: 'Test Academy',
        teacherName: 'Test Teacher',
        teacherEmail: testEmail,
        invitationUrl: correctUrl,
        domains: 'Jazz Music',
        invitation_id: invitation.id
      },
      p_priority: 'high'
    });

    if (queueError) {
      console.error('❌ Failed to queue email:', queueError.message);
      return;
    }

    console.log('✅ Email queued with ID:', queueResult);
    console.log('');
    console.log('📬 Check the email for:', testEmail);
    console.log('🔗 The link should be:', correctUrl);
    console.log('');
    console.log('⚠️  If the link is still wrong, check the Edge Function logs in Supabase dashboard');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testTeacherInvitation();