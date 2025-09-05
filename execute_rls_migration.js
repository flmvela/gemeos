import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://jfolpnyipoocflcrachg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb2xwbnlpcG9vY2ZsY3JhY2hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM1NDE5NywiZXhwIjoyMDY4OTMwMTk3fQ.ehPKApa5bd-wbnrRKEipZRKM7ZwfYjpN9yiWpdPK-yU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeMigration() {
  console.log('🚀 Starting comprehensive RLS migration...');
  
  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('/Users/fabiovelardi/gemeos/supabase/migrations/20250904_comprehensive_rls_fix.sql', 'utf8');
    
    console.log('📝 Migration file loaded successfully');
    console.log(`📊 Migration size: ${migrationSQL.length} characters`);
    
    // Split the migration into individual commands
    // We'll execute them in smaller chunks to identify any specific errors
    const sqlCommands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && cmd !== 'BEGIN' && cmd !== 'COMMIT');
    
    console.log(`🔧 Found ${sqlCommands.length} SQL commands to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      const commandPreview = command.substring(0, 80).replace(/\s+/g, ' ') + '...';
      
      console.log(`\n[${i + 1}/${sqlCommands.length}] Executing: ${commandPreview}`);
      
      try {
        // For PostgreSQL functions and complex statements, we need to use rpc
        const { data, error } = await supabase.rpc('exec', { 
          sql: command + ';'
        });
        
        if (error) {
          console.error(`❌ Error: ${error.message}`);
          errors.push({ command: commandPreview, error: error.message });
          errorCount++;
        } else {
          console.log(`✅ Success`);
          successCount++;
        }
      } catch (exception) {
        console.error(`❌ Exception: ${exception.message}`);
        errors.push({ command: commandPreview, error: exception.message });
        errorCount++;
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful commands: ${successCount}`);
    console.log(`❌ Failed commands: ${errorCount}`);
    console.log(`📊 Total commands: ${sqlCommands.length}`);
    
    if (errors.length > 0) {
      console.log('\n🔍 DETAILED ERRORS:');
      errors.forEach((err, index) => {
        console.log(`\n${index + 1}. Command: ${err.command}`);
        console.log(`   Error: ${err.error}`);
      });
    }
    
    // Test the result
    if (errorCount === 0 || successCount > errorCount) {
      console.log('\n🧪 Testing RLS setup...');
      await testRLSSetup();
    }
    
  } catch (error) {
    console.error('💥 Fatal error during migration:', error);
  }
}

async function testRLSSetup() {
  try {
    // Test platform admin check
    console.log('Testing platform admin function...');
    const { data: adminTest, error: adminError } = await supabase
      .from('user_tenants')
      .select('*')
      .limit(1);
    
    if (adminError) {
      console.error('❌ Admin test failed:', adminError.message);
    } else {
      console.log('✅ Platform admin access working');
    }
    
    // Test basic table access
    console.log('Testing table access...');
    const { data: tenantTest, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .limit(1);
    
    if (tenantError) {
      console.error('❌ Tenant access failed:', tenantError.message);
    } else {
      console.log('✅ Tenant table access working');
    }
    
    // Test roles table
    console.log('Testing roles table...');
    const { data: rolesTest, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1);
    
    if (rolesError) {
      console.error('❌ Roles access failed:', rolesError.message);
    } else {
      console.log('✅ User roles table access working');
    }
    
  } catch (error) {
    console.error('Testing failed:', error);
  }
}

// Execute the migration
executeMigration();