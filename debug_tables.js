import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jfolpnyipoocflcrachg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb2xwbnlpcG9vY2ZsY3JhY2hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM1NDE5NywiZXhwIjoyMDY4OTMwMTk3fQ.ehPKApa5bd-wbnrRKEipZRKM7ZwfYjpN9yiWpdPK-yU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugTables() {
  try {
    console.log('=== CHECKING TABLE STRUCTURE ===');
    
    // Check if roles table exists and has data
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*');
    
    console.log('Roles table:', roles?.length ? roles : 'No data or error:', rolesError);
    
    // Check if user_tenants table exists
    const { data: userTenantsStructure, error: userTenantsError } = await supabase
      .from('user_tenants')
      .select('*')
      .limit(1);
    
    console.log('User tenants table structure check:', userTenantsError ? `Error: ${userTenantsError.message}` : 'Table exists');
    
    // Check what foreign key constraints exist
    console.log('=== CHECKING CONSTRAINTS ===');
    
    // Let's also check if there's a user_roles table instead
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1);
    
    console.log('User roles table check:', userRolesError ? `Error: ${userRolesError.message}` : 'Table exists with data:', userRoles);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

debugTables();