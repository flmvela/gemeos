import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jfolpnyipoocflcrachg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb2xwbnlpcG9vY2ZsY3JhY2hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM1NDE5NywiZXhwIjoyMDY4OTMwMTk3fQ.ehPKApa5bd-wbnrRKEipZRKM7ZwfYjpN9yiWpdPK-yU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminWithPassword() {
  try {
    console.log('Creating platform admin user with password...');
    
    // 1. Create or update the user with a password
    let { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: 'platform-admin@gemeos.ai',
      password: 'admin123456',
      email_confirm: true,
      user_metadata: {
        name: 'Platform Administrator',
        role: 'platform_admin'
      }
    });

    if (createError) {
      // User might already exist, try to update password
      console.log('User already exists, updating password...');
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('Error listing users:', listError);
        return;
      }
      
      const existingUser = users.users.find(u => u.email === 'platform-admin@gemeos.ai');
      
      if (existingUser) {
        const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            password: 'admin123456'
          }
        );
        
        if (updateError) {
          console.error('Error updating user password:', updateError);
          return;
        }
        
        console.log('✅ Password updated for existing user');
        user = updatedUser;
      } else {
        console.error('Could not find or create user');
        return;
      }
    } else {
      console.log('✅ New user created successfully');
    }

    console.log('User details:', user.user ? user.user.email : user.email);
    
    // 2. Get the platform_admin role
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('name', 'platform_admin')
      .single();
    
    if (rolesError) {
      console.error('Error fetching platform_admin role:', rolesError);
      return;
    }
    
    // 3. Get the default tenant
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .limit(1);
    
    if (tenantsError || tenants.length === 0) {
      console.error('Error fetching tenants:', tenantsError);
      return;
    }
    
    const userId = user.user ? user.user.id : user.id;
    const defaultTenant = tenants[0];
    
    // 4. Create or update user_tenant relationship
    const { data: existingRelation, error: checkError } = await supabase
      .from('user_tenants')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', defaultTenant.id)
      .single();
    
    if (!existingRelation) {
      const { data: userTenant, error: userTenantError } = await supabase
        .from('user_tenants')
        .insert([
          {
            user_id: userId,
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
      
      console.log('✅ User-tenant relationship created');
    } else {
      console.log('✅ User-tenant relationship already exists');
    }
    
    console.log('🎉 Platform admin setup complete!');
    console.log('Email: platform-admin@gemeos.ai');
    console.log('Password: admin123456');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminWithPassword();