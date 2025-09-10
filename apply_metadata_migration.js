/**
 * Script to apply the metadata column migration to the invitations table
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔄 Applying metadata column migration to invitations table...');

  try {
    // Check if metadata column already exists
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', {
        table_name: 'invitations',
        table_schema: 'public'
      });

    if (columnsError) {
      // If the function doesn't exist, try a direct query
      console.log('⚠️  get_table_columns function not found, trying direct approach...');
      
      // Try to add the column - if it already exists, this will fail gracefully
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'invitations' 
              AND column_name = 'metadata'
              AND table_schema = 'public'
            ) THEN
              ALTER TABLE public.invitations 
              ADD COLUMN metadata JSONB DEFAULT '{}';
              
              COMMENT ON COLUMN public.invitations.metadata IS 'Stores additional data for the invitation (e.g., teacher profile data)';
              
              RAISE NOTICE 'Added metadata column to invitations table';
            ELSE
              RAISE NOTICE 'Metadata column already exists';
            END IF;
          END $$;
        `
      });

      if (alterError) {
        // Try a simpler approach - just add the column and handle the error
        console.log('⚠️  exec_sql function not found, trying direct ALTER TABLE...');
        
        const { data, error } = await supabase
          .from('invitations')
          .select('metadata')
          .limit(1);
        
        if (error && error.message.includes('metadata')) {
          console.log('❌ Column does not exist and cannot be added via API');
          console.log('');
          console.log('Please run the following SQL manually in the Supabase SQL editor:');
          console.log('');
          console.log(`-- Add metadata column to invitations table
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

COMMENT ON COLUMN public.invitations.metadata IS 'Stores additional data for the invitation (e.g., teacher profile data)';`);
          console.log('');
          process.exit(1);
        } else if (!error) {
          console.log('✅ Metadata column already exists in invitations table');
          return;
        }
      }
    } else {
      // Check if metadata column exists
      const hasMetadata = columns.some(col => col.column_name === 'metadata');
      if (hasMetadata) {
        console.log('✅ Metadata column already exists in invitations table');
        return;
      }
    }

    // Test that the column was added successfully
    const { data: testData, error: testError } = await supabase
      .from('invitations')
      .select('id, metadata')
      .limit(1);

    if (testError) {
      console.error('❌ Failed to verify metadata column:', testError.message);
      process.exit(1);
    }

    console.log('✅ Successfully added metadata column to invitations table');
    console.log('');
    console.log('You can now create teacher invitations with metadata.');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();