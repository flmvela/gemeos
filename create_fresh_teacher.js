/**
 * Create a fresh teacher invitation with a new email
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createFreshTeacher() {
  console.log('🧪 Creating fresh teacher invitation...\n');

  try {
    const timestamp = Date.now();
    const testEmail = `teacher.${timestamp}@example.com`;
    const invitationToken = crypto.randomUUID();
    const tenantId = 'ec2f9323-5798-4d69-a68f-3946150fce43';

    console.log('📧 Email:', testEmail);
    console.log('🔑 Token:', invitationToken);
    console.log('🏢 Tenant:', tenantId);
    
    // The correct URL that should be in the email
    const correctUrl = `http://localhost:8087/teacher-setup?token=${invitationToken}`;
    console.log('✅ Expected URL:', correctUrl);
    console.log('');

    // Get teacher role ID
    const { data: teacherRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('name', 'teacher')
      .single();

    const roleId = teacherRole?.id || '3c5e8f92-1234-5678-9abc-def012345678';

    // Use a known admin user ID
    const invitedBy = '506750cf-72fc-4ac7-aee1-184a5ae5d52b';

    // Create invitation with metadata
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
            primaryDomain: { id: '1', name: 'Music' },
            maxStudents: 30,
            preferredClassSize: 15
          },
          schedule: {
            weeklyAvailability: {
              monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
              tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
              wednesday: { enabled: false },
              thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
              friday: { enabled: true, startTime: '09:00', endTime: '17:00' }
            }
          },
          createdBy: invitedBy
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
    console.log('1. Navigate to:', correctUrl);
    console.log('2. Set a password for the teacher account');
    console.log('3. Check if you\'re redirected to the correct page after setup');
    console.log('');
    console.log('🔗 Click here to test:');
    console.log(correctUrl);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createFreshTeacher();