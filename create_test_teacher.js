/**
 * Create a test teacher invitation and monitor the URL
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestTeacher() {
  console.log('🧪 Creating test teacher invitation...\n');

  try {
    // Sign in as tenant admin first
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'flm.velardi+ta1010@gmail.com',
      password: 'Test123!@#'
    });

    if (authError) {
      // Try another password
      const { error: authError2 } = await supabase.auth.signInWithPassword({
        email: 'flm.velardi+ta1010@gmail.com',
        password: 'test123'
      });
      
      if (authError2) {
        console.log('⚠️  Could not authenticate. Creating invitation anyway...');
      }
    }

    const timestamp = Date.now();
    const testEmail = `teacher.test.${timestamp}@example.com`;
    const invitationToken = crypto.randomUUID();
    const tenantId = 'ec2f9323-5798-4d69-a68f-3946150fce43';

    console.log('📧 Email:', testEmail);
    console.log('🔑 Token:', invitationToken);
    console.log('🏢 Tenant:', tenantId);
    
    // The correct URL that should be in the email
    const correctUrl = `http://localhost:8087/teacher-setup?token=${invitationToken}`;
    console.log('✅ Expected URL:', correctUrl);
    console.log('');

    // Get teacher role ID first
    const { data: teacherRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('name', 'teacher')
      .single();

    const roleId = teacherRole?.id || '3c5e8f92-1234-5678-9abc-def012345678'; // fallback ID

    // Get a user ID for invited_by (using a known admin user)
    const { data: adminUser } = await supabase
      .from('user_tenants')
      .select('user_id')
      .eq('tenant_id', tenantId)
      .limit(1)
      .single();

    const invitedBy = adminUser?.user_id || '506750cf-72fc-4ac7-aee1-184a5ae5d52b';

    // Create invitation
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .insert({
        email: testEmail,
        tenant_id: tenantId,
        role_id: roleId,
        role_name: 'teacher',
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        invitation_token: invitationToken,
        invited_by: invitedBy,
        metadata: {
          firstName: 'Test',
          lastName: 'Teacher',
          phoneNumber: '+1 (555) 000-1111',
          domains: {
            primaryDomain: { id: '1', name: 'Music' }
          }
        }
      })
      .select()
      .single();

    if (invError) {
      console.error('❌ Failed to create invitation:', invError.message);
      return;
    }

    console.log('✅ Invitation created:', invitation.id);
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Check Supabase Edge Function logs for [TEACHER_DEBUG] entries');
    console.log('2. Look for the email in your inbox');
    console.log('3. Check if the URL in the email is:', correctUrl);
    console.log('');
    console.log('🔗 Manual test URL (copy this):');
    console.log(correctUrl);
    console.log('');
    console.log('If the email has the wrong URL, check the Edge Function logs at:');
    console.log('https://supabase.com/dashboard/project/jfolpnyipoocflcrachg/functions/send-email/logs');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestTeacher();