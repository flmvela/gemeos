// Test invitation creation and email sending
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jfolpnyipoocflcrachg.supabase.co',
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: { persistSession: false }
  }
);

async function createTestInvitation() {
  try {
    console.log('🔍 Testing invitation creation...');
    
    // Get a tenant ID
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .limit(1);
    
    if (tenantError || !tenants || tenants.length === 0) {
      console.error('❌ Error getting tenant:', tenantError);
      return;
    }
    
    const tenant = tenants[0];
    console.log('✅ Found tenant:', tenant.name, '(', tenant.id, ')');
    
    // Get a platform admin user
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);
      
    if (userError || !users || users.length === 0) {
      console.error('❌ Error getting user:', userError);
      return;
    }
    
    const user = users[0];
    console.log('✅ Found user:', user.email);
    
    // Get role ID for tenant_admin
    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('name', 'tenant_admin')
      .single();
      
    if (roleError || !role) {
      console.error('❌ Error getting role:', roleError);
      return;
    }
    
    console.log('✅ Found tenant_admin role:', role.id);
    
    // Create invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        email: 'test-invitation@example.com',
        tenant_id: tenant.id,
        role_id: role.id,
        role_name: 'tenant_admin',
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        invited_by: user.id,
      })
      .select(`
        *,
        tenant:tenants(id, name, slug),
        invited_by_user:profiles!invitations_invited_by_fkey(id, email),
        role:user_roles(id, name, display_name)
      `)
      .single();
    
    if (invitationError) {
      console.error('❌ Error creating invitation:', invitationError);
      return;
    }
    
    console.log('✅ Created invitation:', invitation.id);
    console.log('📧 Invitation details:');
    console.log('  - Email:', invitation.email);
    console.log('  - Tenant:', invitation.tenant?.name);
    console.log('  - Role:', invitation.role?.display_name);
    console.log('  - Expires:', invitation.expires_at);
    
    // Generate the accept-invite URL
    const baseUrl = 'http://localhost:8080';
    const inviteUrl = `${baseUrl}/accept-invite?tenant=${tenant.id}&token=${invitation.id}`;
    
    console.log('🔗 Accept invitation URL:');
    console.log('  ', inviteUrl);
    
    return inviteUrl;
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
if (process.env.SUPABASE_SERVICE_KEY) {
  createTestInvitation();
} else {
  console.error('❌ SUPABASE_SERVICE_KEY not found in environment');
}