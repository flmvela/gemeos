// Debug the invitation flow to see what's actually happening
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jfolpnyipoocflcrachg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb2xwbnlpcG9vY2ZsY3JhY2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU1NDM4MDAsImV4cCI6MjA0MTExOTgwMH0.Xp9NrtwDJajX_xdEOKIvFPJUmGDsHlCz9SxPt6gUiVs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugInvitationFlow() {
  try {
    console.log('🔍 [DEBUG] Testing invitation flow...');
    
    // 1. Check what happens when we try to get invitation templates
    console.log('\n1️⃣ Checking email templates...');
    const { data: templates, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_type', 'invitation');
    
    if (templateError) {
      console.error('❌ Template error:', templateError);
    } else {
      console.log('✅ Found invitation templates:', templates?.length || 0);
      if (templates && templates.length > 0) {
        console.log('📧 Template details:', {
          name: templates[0].name,
          variables: templates[0].variables_schema,
          html_preview: templates[0].html_template?.substring(0, 200) + '...'
        });
      }
    }
    
    // 2. Check existing invitations to understand the data structure
    console.log('\n2️⃣ Checking existing invitations...');
    const { data: invitations, error: invError } = await supabase
      .from('invitations')
      .select(`
        *,
        tenant:tenants(id, name, slug),
        invited_by_user:profiles!invitations_invited_by_fkey(id, email),
        role:user_roles(id, name, display_name)
      `)
      .limit(3);
    
    if (invError) {
      console.error('❌ Invitations error:', invError);
    } else {
      console.log('✅ Found invitations:', invitations?.length || 0);
      if (invitations && invitations.length > 0) {
        console.log('📋 Sample invitation structure:', {
          id: invitations[0].id,
          email: invitations[0].email,
          status: invitations[0].status,
          tenant_id: invitations[0].tenant_id,
          tenant_name: invitations[0].tenant?.name,
          role_name: invitations[0].role_name,
          expires_at: invitations[0].expires_at
        });
      }
    }
    
    // 3. Test the invitation service URL generation logic manually
    console.log('\n3️⃣ Testing URL generation logic...');
    if (invitations && invitations.length > 0) {
      const testInvitation = invitations[0];
      const baseUrl = 'http://localhost:8080';
      
      // Simulate what the email template should generate
      const templateVars = {
        invitation_id: testInvitation.id,
        tenant_id: testInvitation.tenant_id,
        tenant_name: testInvitation.tenant?.name || 'Organization',
        inviter_name: testInvitation.invited_by_user?.email || 'Admin',
        role_name: testInvitation.role_name,
        expires_at: new Date(testInvitation.expires_at).toLocaleDateString(),
      };
      
      // What the URL SHOULD be
      const correctUrl = `${baseUrl}/accept-invite?tenant=${testInvitation.tenant_id}&token=${testInvitation.id}`;
      
      console.log('🔗 Template variables:', templateVars);
      console.log('🎯 Correct URL should be:', correctUrl);
      
      // Test if we can load this invitation
      console.log('\n4️⃣ Testing invitation loading with correct token...');
      const { data: loadedInvitation, error: loadError } = await supabase
        .from('invitations')
        .select(`
          *,
          tenant:tenants(id, name, slug),
          invited_by_user:profiles!invitations_invited_by_fkey(id, email),
          role:user_roles(id, name, display_name)
        `)
        .eq('id', testInvitation.id)
        .single();
      
      if (loadError) {
        console.error('❌ Load error:', loadError);
      } else {
        console.log('✅ Successfully loaded invitation by ID');
        console.log('📝 Invitation is valid:', {
          status: loadedInvitation.status,
          expired: new Date(loadedInvitation.expires_at) < new Date(),
          can_be_accepted: loadedInvitation.status === 'pending' && new Date(loadedInvitation.expires_at) >= new Date()
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugInvitationFlow();