import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jfolpnyipoocflcrachg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb2xwbnlpcG9vY2ZsY3JhY2hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM1NDE5NywiZXhwIjoyMDY4OTMwMTk3fQ.ehPKApa5bd-wbnrRKEipZRKM7ZwfYjpN9yiWpdPK-yU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupPlatformAdmin() {
  try {
    // 1. First, get all users to find the admin
    console.log('Fetching all users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log(`Found ${users.users.length} users`);
    users.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.id})`);
    });
    
    // 2. Get the platform_admin role from user_roles table
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('name', 'platform_admin')
      .single();
    
    if (rolesError) {
      console.error('Error fetching platform_admin role:', rolesError);
      return;
    }
    
    console.log('Platform admin role:', roles);
    
    // 3. Get the default tenant (assuming first tenant)
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .limit(1);
    
    if (tenantsError) {
      console.error('Error fetching tenants:', tenantsError);
      return;
    }
    
    if (tenants.length === 0) {
      console.error('No tenants found! Please create a tenant first.');
      return;
    }
    
    const defaultTenant = tenants[0];
    console.log('Default tenant:', defaultTenant);
    
    // Find the platform-admin@gemeos.ai user
    const adminUser = users.users.find(user => user.email === 'platform-admin@gemeos.ai');
    
    if (!adminUser) {
      console.error('User platform-admin@gemeos.ai not found!');
      return;
    }
    
    console.log(`Setting up ${adminUser.email} as platform admin...`);
    
    // 4. Create user_tenant relationship
    const { data: userTenant, error: userTenantError } = await supabase
      .from('user_tenants')
      .insert([
        {
          user_id: adminUser.id,
          tenant_id: defaultTenant.id,
          role_id: roles.id,
          is_primary: true,
          status: 'active',
          joined_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (userTenantError) {
      console.error('Error creating user_tenant relationship:', userTenantError);
      return;
    }
    
    console.log('✅ Platform admin setup complete!');
    console.log('User-Tenant relationship:', userTenant);
    
    // 5. Verify the setup
    const { data: verification, error: verifyError } = await supabase
      .from('user_tenants')
      .select(`
        *,
        user_roles:role_id(*),
        tenants:tenant_id(*)
      `)
      .eq('user_id', adminUser.id);
    
    if (verifyError) {
      console.error('Error verifying setup:', verifyError);
      return;
    }
    
    console.log('✅ Verification successful:');
    console.log(JSON.stringify(verification, null, 2));
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

setupPlatformAdmin();