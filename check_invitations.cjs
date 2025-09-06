// Check recent invitations using service key
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkInvitations() {
  try {
    console.log('📧 Checking recent invitations...');
    
    // Get the most recent invitations
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select(`
        id,
        email,
        tenant_id,
        status,
        expires_at,
        created_at,
        tenant:tenants(name, slug)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log(`Found ${invitations.length} recent invitations:`);
    
    invitations.forEach((inv, index) => {
      console.log(`\n${index + 1}. Invitation ID: ${inv.id}`);
      console.log(`   Email: ${inv.email}`);
      console.log(`   Tenant: ${inv.tenant?.name} (${inv.tenant_id})`);
      console.log(`   Status: ${inv.status}`);
      console.log(`   Created: ${inv.created_at}`);
      console.log(`   Expires: ${inv.expires_at}`);
      
      // Generate test URL
      const testUrl = `http://localhost:8082/accept-invite?tenant=${inv.tenant_id}&token=${inv.id}`;
      console.log(`   🎯 Test URL: ${testUrl}`);
    });
    
    if (invitations.length > 0) {
      const latest = invitations[0];
      console.log(`\n🚀 Testing with most recent invitation: ${latest.email}`);
      return {
        invitationId: latest.id,
        tenantId: latest.tenant_id,
        email: latest.email,
        testUrl: `http://localhost:8082/accept-invite?tenant=${latest.tenant_id}&token=${latest.id}`
      };
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkInvitations();