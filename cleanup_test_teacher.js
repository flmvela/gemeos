/**
 * Clean up test teacher data to allow fresh testing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.log('Make sure SUPABASE_SERVICE_KEY is set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupTestTeacher(email) {
  console.log(`🧹 Cleaning up teacher data for: ${email}\n`);

  try {
    // Get user ID from user_tenants
    const { data: userTenant } = await supabase
      .from('user_tenants')
      .select('user_id, tenant_id')
      .eq('email', email)
      .single();

    if (userTenant) {
      const { user_id, tenant_id } = userTenant;
      console.log('Found user:', user_id);

      // Delete from teacher_schedules
      const { error: scheduleError } = await supabase
        .from('teacher_schedules')
        .delete()
        .eq('teacher_id', user_id);
      
      if (scheduleError) console.log('Schedule cleanup:', scheduleError.message);

      // Delete from teacher_domains
      const { error: domainsError } = await supabase
        .from('teacher_domains')
        .delete()
        .match({ teacher_id: user_id });
      
      if (domainsError) console.log('Domains cleanup:', domainsError.message);

      // Delete from teachers
      const { error: teacherError } = await supabase
        .from('teachers')
        .delete()
        .eq('user_id', user_id)
        .eq('tenant_id', tenant_id);
      
      if (teacherError) console.log('Teacher cleanup:', teacherError.message);
      else console.log('✅ Deleted teacher profile');

      // Delete from user_tenants
      const { error: userTenantError } = await supabase
        .from('user_tenants')
        .delete()
        .eq('user_id', user_id)
        .eq('email', email);
      
      if (userTenantError) console.log('User tenant cleanup:', userTenantError.message);
      else console.log('✅ Deleted user_tenants entry');

      // Delete the auth user (requires service key)
      const { error: authError } = await supabase.auth.admin.deleteUser(user_id);
      
      if (authError) {
        console.log('⚠️  Could not delete auth user:', authError.message);
        console.log('You may need to delete the user manually from Supabase Dashboard');
      } else {
        console.log('✅ Deleted auth user');
      }
    } else {
      console.log('No user_tenant found for this email');
    }

    // Reset invitation to pending
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .update({ 
        status: 'pending',
        accepted_at: null
      })
      .eq('email', email)
      .select()
      .single();

    if (invError) {
      console.log('⚠️  Could not reset invitation:', invError.message);
    } else if (invitation) {
      console.log('✅ Reset invitation to pending');
      console.log('Token:', invitation.invitation_token);
    }

    console.log('\n✨ Cleanup complete!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'flm.velardi+teach5@gmail.com';
cleanupTestTeacher(email);