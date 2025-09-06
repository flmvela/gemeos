// Test real invitation creation through the frontend service
const { createClient } = require('@supabase/supabase-js');

// Use the public anon key first to authenticate as a user
const supabase = createClient(
  'https://jfolpnyipoocflcrachg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb2xwbnlpcG9vY2ZsY3JhY2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU1NDM4MDAsImV4cCI6MjA0MTExOTgwMH0.Xp9NrtwDJajX_xdEOKIvFPJUmGDsHlCz9SxPt6gUiVs'
);

async function testRealInvitation() {
  try {
    // 1. Sign in as the admin user
    console.log('🔑 Signing in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test-admin@example.com',
      password: 'password123'
    });
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }
    
    console.log('✅ Signed in as:', authData.user.email);
    
    // 2. Get a tenant ID
    console.log('🏢 Getting tenant...');
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .limit(1);
    
    if (tenantError || !tenants || tenants.length === 0) {
      console.error('❌ Tenant error:', tenantError);
      return;
    }
    
    const tenant = tenants[0];
    console.log('✅ Using tenant:', tenant.name, '(' + tenant.id + ')');
    
    // 3. Create invitation using the service (simulating what the frontend does)
    console.log('📧 Creating invitation...');
    
    const invitationData = {
      email: 'test-user-' + Date.now() + '@example.com',
      tenant_id: tenant.id,
      role: 'tenant_admin',
      expires_in_days: 7
    };
    
    // This simulates what the invitation service does
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'tenant_admin')
      .single();
    
    if (roleError || !role) {
      console.error('❌ Role error:', roleError);
      return;
    }
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        email: invitationData.email,
        tenant_id: tenant.id,
        role_id: role.id,
        role_name: 'tenant_admin',
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        invited_by: authData.user.id,
      })
      .select(`
        *,
        tenant:tenants(id, name, slug),
        invited_by_user:profiles!invitations_invited_by_fkey(id, email),
        role:roles(id, name, display_name)
      `)
      .single();
    
    if (invitationError) {
      console.error('❌ Invitation creation error:', invitationError);
      return;
    }
    
    console.log('✅ Created invitation:', invitation.id);
    
    // 4. Now test the email queueing (this is what should generate the URL)
    console.log('📨 Testing email queue...');
    
    const { data: queueData, error: queueError } = await supabase.rpc('queue_email', {
      p_tenant_id: tenant.id,
      p_template_type: 'invitation',
      p_to_email: invitation.email,
      p_template_variables: {
        invitation_id: invitation.id,
        tenant_name: tenant.name,
        tenant_slug: tenant.slug,
        tenant_id: tenant.id,
        inviter_name: authData.user.email,
        role_name: 'Tenant Administrator',
        expires_at: expiresAt.toLocaleDateString(),
        support_email: 'support@gemeos.ai',
      },
      p_priority: 'high',
      p_scheduled_for: null,
      p_related_entity_type: null,
      p_related_entity_id: null,
    });
    
    if (queueError) {
      console.error('❌ Email queue error:', queueError);
      return;
    }
    
    console.log('✅ Email queued:', queueData);
    
    // 5. Generate what the URL should be
    const correctUrl = `http://localhost:8082/accept-invite?tenant=${tenant.id}&token=${invitation.id}`;
    console.log('🎯 Correct URL should be:', correctUrl);
    
    // 6. Test if this invitation can be loaded
    console.log('🔍 Testing invitation loading...');
    const { data: loadTest, error: loadError } = await supabase
      .from('invitations')
      .select(`
        *,
        tenant:tenants(id, name, slug),
        invited_by_user:profiles!invitations_invited_by_fkey(id, email),
        role:roles(id, name, display_name)
      `)
      .eq('id', invitation.id)
      .single();
    
    if (loadError) {
      console.error('❌ Load error:', loadError);
    } else {
      console.log('✅ Invitation can be loaded successfully');
      console.log('📝 Status:', loadTest.status);
      console.log('📅 Expires:', loadTest.expires_at);
      console.log('👤 Role:', loadTest.role?.display_name);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testRealInvitation();