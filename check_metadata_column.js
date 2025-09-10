/**
 * Check if metadata column exists in invitations table
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

async function checkMetadataColumn() {
  console.log('🔍 Checking if metadata column exists in invitations table...');
  console.log('');

  try {
    // Try to select the metadata column
    const { data, error } = await supabase
      .from('invitations')
      .select('id, email, metadata')
      .limit(1);

    if (error) {
      if (error.message.includes('metadata')) {
        console.log('❌ Metadata column does NOT exist in invitations table');
        console.log('');
        console.log('📋 Please run the following SQL in the Supabase Dashboard SQL Editor:');
        console.log('   (Go to: https://supabase.com/dashboard/project/jfolpnyipoocflcrachg/sql/new)');
        console.log('');
        console.log('----------------------------------------');
        console.log(`-- Add metadata column to invitations table
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

COMMENT ON COLUMN public.invitations.metadata IS 'Stores additional data for the invitation (e.g., teacher profile data)';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invitations' 
AND column_name = 'metadata';`);
        console.log('----------------------------------------');
        console.log('');
        console.log('After running this SQL, the teacher creation feature will work correctly.');
      } else {
        console.error('❌ Error checking invitations table:', error.message);
      }
    } else {
      console.log('✅ Metadata column EXISTS in invitations table');
      console.log('');
      console.log('The teacher creation feature should work correctly.');
      
      if (data && data.length > 0) {
        console.log('');
        console.log('Sample data structure:');
        console.log(JSON.stringify(data[0], null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkMetadataColumn();