// Create a test invitation manually
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jfolpnyipoocflcrachg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb2xwbnlpcG9vY2ZsY3JhY2hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTU0MzgwMCwiZXhwIjoyMDQxMTE5ODAwfQ.pTlCDfEhHVKKg0LLUfojqhE5VWKdBAr3hKtLd3E7dKY'
);

async function createTestInvitation() {
  try {
    // 1. Get a tenant
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .limit(1);
      
    if (tenantError || !tenants.length) {
      console.error('❌ No tenants found:', tenantError);
      return;
    }
    
    const tenant = tenants[0];
    console.log('🏢 Using tenant:', tenant.name, '(' + tenant.id + ')');
    
    // 2. Get tenant_admin role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id, name, display_name')
      .eq('name', 'tenant_admin')
      .single();
      
    if (roleError || !role) {
      console.error('❌ Role not found:', roleError);
      return;
    }
    
    console.log('👤 Using role:', role.display_name, '(' + role.id + ')');
    
    // 3. Create invitation
    const email = 'manual-test-' + Date.now() + '@example.com';
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        email: email,
        tenant_id: tenant.id,
        role_id: role.id,
        role_name: 'tenant_admin',
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        invited_by: '01234567-0123-4567-8901-012345678901', // Dummy UUID
      })
      .select('*')
      .single();
      
    if (invitationError) {
      console.error('❌ Invitation creation error:', invitationError);
      return;
    }
    
    console.log('✅ Created invitation:', invitation.id);
    console.log('📧 Email:', invitation.email);
    console.log('📅 Expires:', invitation.expires_at);
    
    // 4. Generate test URL
    const testUrl = `http://localhost:8082/accept-invite?tenant=${tenant.id}&token=${invitation.id}`;
    console.log('\\n🎯 Test URL:', testUrl);
    
    return {
      invitationId: invitation.id,
      tenantId: tenant.id,
      email: invitation.email,
      testUrl: testUrl
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestInvitation();