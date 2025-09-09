const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jfolpnyipoocflcrachg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('Please set SUPABASE_SERVICE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupPlatformAdmin() {
  console.log('Setting up platform admin user admin@gemeos.ai...');
  
  try {
    // 1. Check if user exists in auth.users
    const { data: authUsers, error: authListError } = await supabase.auth.admin.listUsers();
    
    if (authListError) {
      console.error('Error listing users:', authListError);
      throw authListError;
    }
    
    let userId;
    const existingUser = authUsers.users.find(u => u.email === 'admin@gemeos.ai');
    
    if (existingUser) {
      console.log('User already exists in auth.users:', existingUser.id);
      userId = existingUser.id;
      
      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: 'Admin2025!' }
      );
      
      if (updateError) {
        console.error('Error updating password:', updateError);
      } else {
        console.log('Password updated successfully');
      }
    } else {
      // Create new user
      console.log('Creating new user in auth.users...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'admin@gemeos.ai',
        password: 'Admin2025!',
        email_confirm: true,
        user_metadata: {
          role: 'platform_admin'
        }
      });
      
      if (createError) {
        console.error('Error creating user:', createError);
        throw createError;
      }
      
      userId = newUser.user.id;
      console.log('Created new user:', userId);
    }
    
    // 2. Check/create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (!profile) {
      console.log('Creating profile...');
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          email: 'admin@gemeos.ai',
          full_name: 'Platform Administrator',
          user_type: 'admin',
          role: 'platform_admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error creating profile:', insertError);
      } else {
        console.log('Profile created successfully');
      }
    } else {
      console.log('Profile already exists');
      
      // Update profile to ensure correct role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'platform_admin',
          user_type: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
        
      if (updateError) {
        console.error('Error updating profile:', updateError);
      } else {
        console.log('Profile updated successfully');
      }
    }
    
    // 3. Get or create platform_admin role
    const { data: platformRole, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('name', 'platform_admin')
      .single();
      
    let roleId;
    if (!platformRole) {
      console.log('Creating platform_admin role...');
      const { data: newRole, error: createRoleError } = await supabase
        .from('user_roles')
        .insert({
          name: 'platform_admin',
          description: 'Platform administrator with full system access',
          display_name: 'Platform Admin',
          level: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createRoleError) {
        console.error('Error creating role:', createRoleError);
        throw createRoleError;
      }
      roleId = newRole.id;
    } else {
      roleId = platformRole.id;
      console.log('Platform admin role exists:', roleId);
    }
    
    // 4. Create a system tenant if needed
    const { data: systemTenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', 'system')
      .single();
      
    let tenantId;
    if (!systemTenant) {
      console.log('Creating system tenant...');
      const { data: newTenant, error: createTenantError } = await supabase
        .from('tenants')
        .insert({
          name: 'System',
          subdomain: 'system',
          settings: {},
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createTenantError) {
        console.error('Error creating system tenant:', createTenantError);
        throw createTenantError;
      }
      tenantId = newTenant.id;
    } else {
      tenantId = systemTenant.id;
      console.log('System tenant exists:', tenantId);
    }
    
    // 5. Create user_tenant association
    const { data: existingUT, error: checkError } = await supabase
      .from('user_tenants')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();
      
    if (!existingUT) {
      console.log('Creating user_tenant association...');
      const { error: insertError } = await supabase
        .from('user_tenants')
        .insert({
          user_id: userId,
          tenant_id: tenantId,
          role_id: roleId,
          status: 'active',
          is_primary: true,
          joined_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error creating user_tenant:', insertError);
      } else {
        console.log('User_tenant association created');
      }
    } else {
      // Update existing
      const { error: updateError } = await supabase
        .from('user_tenants')
        .update({
          role_id: roleId,
          status: 'active',
          is_primary: true
        })
        .eq('user_id', userId)
        .eq('tenant_id', tenantId);
        
      if (updateError) {
        console.error('Error updating user_tenant:', updateError);
      } else {
        console.log('User_tenant association updated');
      }
    }
    
    console.log('\n✅ Platform admin setup complete!');
    console.log('User can now login with:');
    console.log('Email: admin@gemeos.ai');
    console.log('Password: Admin2025!');
    console.log('Dashboard: /admin/dashboard');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

setupPlatformAdmin();