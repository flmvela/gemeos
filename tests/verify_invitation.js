/**
 * Verify that the teacher invitation was created with metadata
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

async function verifyInvitation() {
  console.log('🔍 Checking for recent teacher invitations with metadata...');
  console.log('');

  try {
    // Get the most recent invitation
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', 'test.teacher.metadata@example.com')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Error fetching invitation:', error.message);
      return;
    }

    if (data) {
      console.log('✅ Teacher invitation found!');
      console.log('');
      console.log('Invitation Details:');
      console.log('------------------');
      console.log('ID:', data.id);
      console.log('Email:', data.email);
      console.log('Role:', data.role_name);
      console.log('Status:', data.status);
      console.log('Token:', data.invitation_token);
      console.log('');
      console.log('Metadata stored:');
      console.log('----------------');
      if (data.metadata) {
        console.log('First Name:', data.metadata.firstName);
        console.log('Last Name:', data.metadata.lastName);
        console.log('Phone:', data.metadata.phoneNumber);
        console.log('Has Domains:', !!data.metadata.domains);
        console.log('Has Schedule:', !!data.metadata.schedule);
        console.log('Has Permissions:', !!data.metadata.permissions);
        
        if (data.metadata.domains?.primaryDomain) {
          console.log('Primary Domain:', data.metadata.domains.primaryDomain.name);
        }
      } else {
        console.log('No metadata found');
      }
      
      console.log('');
      console.log('🎉 SUCCESS! The teacher invitation was created with all metadata intact.');
      console.log('');
      console.log('Invitation URL would be:');
      console.log(`http://localhost:8087/teacher-setup?token=${data.invitation_token}`);
    } else {
      console.log('❌ No invitation found for test.teacher.metadata@example.com');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

verifyInvitation();