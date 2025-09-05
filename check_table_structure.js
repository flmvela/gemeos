import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jfolpnyipoocflcrachg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb2xwbnlpcG9vY2ZsY3JhY2hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM1NDE5NywiZXhwIjoyMDY4OTMwMTk3fQ.ehPKApa5bd-wbnrRKEipZRKM7ZwfYjpN9yiWpdPK-yU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTableStructures() {
  console.log('🔍 Checking table structures...');
  
  // Check domains table structure
  try {
    const { data: domains, error } = await supabase
      .from('domains')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying domains:', error.message);
    } else {
      console.log('✅ Domains table columns:', Object.keys(domains[0] || {}));
      console.log('📊 Sample domain record:', domains[0]);
    }
  } catch (error) {
    console.error('❌ Exception checking domains:', error.message);
  }

  // Check user_roles table structure
  try {
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying user_roles:', error.message);
    } else {
      console.log('✅ User_roles table columns:', Object.keys(roles[0] || {}));
      console.log('📊 Sample role record:', roles[0]);
    }
  } catch (error) {
    console.error('❌ Exception checking user_roles:', error.message);
  }

  // Check tenants table structure  
  try {
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying tenants:', error.message);
    } else {
      console.log('✅ Tenants table columns:', Object.keys(tenants[0] || {}));
    }
  } catch (error) {
    console.error('❌ Exception checking tenants:', error.message);
  }
}

checkTableStructures();