const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jfolpnyipoocflcrachg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('Please set SUPABASE_SERVICE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTenantAdmin() {
  console.log('Setting up tenant admin for flm.velardi+ta1010@gmail.com...');
  
  try {
    // 1. Get the user
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'flm.velardi+ta1010@gmail.com')
      .single();
      
    if (userError) throw userError;
    
    const userId = users.user_id;
    console.log('Found user:', userId);
    
    // 2. Get the default tenant
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('name', 'Default Tenant')
      .single();
      
    if (tenantError) {
      console.log('No default tenant found, creating one...');
      const { data: newTenant, error: createError } = await supabase
        .from('tenants')
        .insert({
          name: 'Default Tenant',
          subdomain: 'default',
          settings: {},
          status: 'active'
        })
        .select()
        .single();
        
      if (createError) throw createError;
      tenants = newTenant;
    }
    
    console.log('Tenant:', tenants.id);
    
    // 3. Get the tenant_admin role
    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('name', 'tenant_admin')
      .single();
      
    if (roleError) throw roleError;
    console.log('Role:', role.id);
    
    // 4. Create user_tenant association
    const { data: existingUT, error: checkError } = await supabase
      .from('user_tenants')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenants.id)
      .single();
      
    if (existingUT) {
      // Update existing
      const { error: updateError } = await supabase
        .from('user_tenants')
        .update({
          role_id: role.id,
          status: 'active',
          is_primary: true
        })
        .eq('user_id', userId)
        .eq('tenant_id', tenants.id);
        
      if (updateError) throw updateError;
      console.log('Updated existing user_tenant association');
    } else {
      // Create new
      const { error: insertError } = await supabase
        .from('user_tenants')
        .insert({
          user_id: userId,
          tenant_id: tenants.id,
          role_id: role.id,
          status: 'active',
          is_primary: true,
          joined_at: new Date().toISOString()
        });
        
      if (insertError) throw insertError;
      console.log('Created new user_tenant association');
    }
    
    // 5. Update profile user_type
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ user_type: 'teacher' })
      .eq('user_id', userId);
      
    if (profileError) throw profileError;
    console.log('Updated profile user_type to teacher');
    
    console.log('\n✅ Tenant admin setup complete!');
    console.log('User can now login with:');
    console.log('Email: flm.velardi+ta1010@gmail.com');
    console.log('Password: Tenant2025!');
    console.log('Dashboard: /tenant/dashboard');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

setupTenantAdmin();