/**
 * Reset a teacher invitation to pending status for testing
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

async function resetInvitation(email) {
  console.log(`🔄 Resetting teacher invitation for: ${email}\n`);

  try {
    // Sign in as admin first (you may need to update these credentials)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'flm.velardi+ta1010@gmail.com',
      password: 'Test123!@#'
    });

    if (authError) {
      console.log('⚠️  Could not authenticate as admin:', authError.message);
    }

    // Reset invitation to pending
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .update({ 
        status: 'pending',
        accepted_at: null
      })
      .eq('email', email)
      .eq('status', 'accepted')
      .select()
      .single();

    if (invError) {
      console.log('⚠️  Could not reset invitation:', invError.message);
      
      // Try to find the invitation anyway
      const { data: anyInvitation } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', email)
        .single();
        
      if (anyInvitation) {
        console.log('Found invitation with status:', anyInvitation.status);
        console.log('Token:', anyInvitation.invitation_token);
        console.log('\nTest URL:');
        console.log(`http://localhost:8087/teacher-setup?token=${anyInvitation.invitation_token}`);
      }
    } else if (invitation) {
      console.log('✅ Reset invitation to pending');
      console.log('Token:', invitation.invitation_token);
      console.log('\nTest URL:');
      console.log(`http://localhost:8087/teacher-setup?token=${invitation.invitation_token}`);
    } else {
      console.log('No accepted invitation found for this email');
      
      // Look for any invitation
      const { data: anyInvitation } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', email)
        .single();
        
      if (anyInvitation) {
        console.log('Found invitation with status:', anyInvitation.status);
        console.log('Token:', anyInvitation.invitation_token);
        console.log('\nTest URL:');
        console.log(`http://localhost:8087/teacher-setup?token=${anyInvitation.invitation_token}`);
      }
    }

    console.log('\n💡 Note: If a user already exists for this email, you\'ll need to:');
    console.log('1. Delete the user from Supabase Dashboard (Authentication > Users)');
    console.log('2. Or use a different email address for testing');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'flm.velardi+teach5@gmail.com';
resetInvitation(email);