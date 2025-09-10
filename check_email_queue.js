/**
 * Check what's in the email queue for teacher invitations
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

async function checkEmailQueue() {
  console.log('🔍 Checking email queue for teacher invitations...');
  console.log('');

  try {
    // Get recent emails (any type) to see what's there
    const { data: emails, error } = await supabase
      .from('email_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching email queue:', error.message);
      return;
    }

    if (!emails || emails.length === 0) {
      console.log('No teacher invitation emails found in queue');
      return;
    }

    emails.forEach((email, index) => {
      console.log(`\n📧 Email #${index + 1}:`);
      console.log('------------------');
      console.log('ID:', email.id);
      console.log('To:', email.to_email);
      console.log('Status:', email.status);
      console.log('Created:', new Date(email.created_at).toLocaleString());
      console.log('Template Type:', email.template_type);
      
      if (email.template_variables) {
        console.log('\nTemplate Variables:');
        console.log('-------------------');
        const vars = email.template_variables;
        console.log('tenantName:', vars.tenantName);
        console.log('teacherName:', vars.teacherName);
        console.log('teacherEmail:', vars.teacherEmail);
        console.log('invitationUrl:', vars.invitationUrl);
        console.log('domains:', vars.domains);
        console.log('invitation_id:', vars.invitation_id);
        
        if (vars.invitationUrl) {
          console.log('\n✅ invitationUrl is present:', vars.invitationUrl);
        } else {
          console.log('\n❌ invitationUrl is MISSING!');
        }
      } else {
        console.log('\n❌ No template_variables found!');
      }
      
      console.log('\n' + '='.repeat(50));
    });

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkEmailQueue();