import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EmailRequest {
  queueId?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tenantId: string;
  templateType?: string;
  templateVariables?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  scheduledFor?: string;
}

// Helper function to map template types to Novu workflow identifiers
function getNovuWorkflowId(templateType?: string): string {
  switch (templateType) {
    case 'tenant_admin_invitation':
      return 'tenant-admin-invitation';
    case 'password_reset':
      return 'password-reset';
    case 'welcome':
      return 'welcome-email';
    default:
      // For generic emails, use a generic workflow
      return 'generic-email';
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const novuApiKey = Deno.env.get('NOVU_API_KEY')!;
    const novuApplicationIdentifier = Deno.env.get('NOVU_APPLICATION_IDENTIFIER')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 [AUTH] Checking authorization header...');
    const authorization = req.headers.get('Authorization');
    console.log('🔍 [AUTH] Authorization header present:', !!authorization);
    console.log('🔍 [AUTH] Authorization header value (first 20 chars):', authorization?.substring(0, 20));
    
    if (!authorization) {
      console.error('❌ [AUTH] Missing authorization header');
      throw new Error('Missing authorization header');
    }

    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authorization.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const emailData: EmailRequest = await req.json();
    
    // If queueId is provided, fetch from queue first
    let emailToSend = emailData;
    if (emailData.queueId && emailData.tenantId) {
      const { data: queuedEmail, error: queueError } = await supabase
        .from('email_queue')
        .select('*')
        .eq('id', emailData.queueId)
        .eq('tenant_id', emailData.tenantId)
        .single();

      if (queueError || !queuedEmail) {
        throw new Error('Email not found in queue');
      }

      emailToSend = {
        queueId: emailData.queueId,
        to: queuedEmail.to_email,
        subject: queuedEmail.subject,
        html: queuedEmail.html_content,
        text: queuedEmail.text_content,
        from: queuedEmail.from_email || emailData.from,
        replyTo: queuedEmail.reply_to || emailData.replyTo,
        tenantId: queuedEmail.tenant_id,
        templateType: queuedEmail.template_type,
      };

      // Update queue status to sending
      await supabase
        .from('email_queue')
        .update({
          status: 'sending',
          last_attempt_at: new Date().toISOString(),
          attempts: queuedEmail.attempts + 1
        })
        .eq('id', emailData.queueId);
    }

    // Now validate required fields after potential queue processing
    if (!emailToSend.to || !emailToSend.subject || !emailToSend.html || !emailToSend.tenantId) {
      throw new Error('Missing required email fields');
    }

    // Check if user is platform admin (bypass tenant checks)
    const isPlatformAdmin = 
      user.app_metadata?.is_platform_admin === true ||
      user.email === 'platform-admin@gemeos.ai' ||
      user.email === 'admin@gemeos.ai';

    if (!isPlatformAdmin) {
      // Check if user has permission to send emails for this tenant
      const { data: userTenant, error: tenantError } = await supabase
        .from('user_tenants')
        .select('role_id, roles(name)')
        .eq('user_id', user.id)
        .eq('tenant_id', emailToSend.tenantId)
        .eq('status', 'active')
        .single();

      if (tenantError || !userTenant) {
        throw new Error('User does not have access to this tenant');
      }
    }

    // Check if email is blacklisted
    const { data: blacklisted } = await supabase
      .rpc('is_email_blacklisted', {
        p_tenant_id: emailToSend.tenantId,
        p_email: emailToSend.to
      });

    if (blacklisted) {
      throw new Error('Email address is blacklisted');
    }

    // Check rate limits
    const { data: rateLimitOk } = await supabase
      .rpc('check_email_rate_limit', {
        p_tenant_id: emailToSend.tenantId
      });

    if (!rateLimitOk) {
      throw new Error('Email rate limit exceeded');
    }

    // Send email via Novu using direct HTTP API call
    let novuResponse;
    let novuError;
    
    try {
      // Map template type to Novu workflow identifier
      const workflowId = getNovuWorkflowId(emailToSend.templateType);
      
      // Define default values
      const DEFAULT_SUPPORT_EMAIL = 'support@gemeos.ai';
      const DEFAULT_REPLY_TO = DEFAULT_SUPPORT_EMAIL;
      
      // Pull template vars safely
      const tv = emailToSend.templateVariables || {};
      
      const payload = {
        // Basic email fields
        subject: emailToSend.subject,
        html: emailToSend.html,
        text: emailToSend.text,
        from: emailToSend.from || 'Gemeos <noreply@gemeos.ai>',
        
        // ✅ Required fields with defaults
        replyTo: emailToSend.replyTo || tv.replyTo || DEFAULT_REPLY_TO,
        invite_link: 
          tv.invite_link ||
          emailToSend.invite_link ||
          `https://app.gemeos.ai/accept-invite?tenant=${emailToSend.tenantId}`,
        
        // Other common variables with useful defaults
        support_email: tv.support_email || DEFAULT_SUPPORT_EMAIL,
        tenant_name: tv.tenant_name || 'Your organization',
        tenant_slug: tv.tenant_slug || 'org',
        tenant_id: emailToSend.tenantId, // ✅ Required by Novu workflow
        inviter_name: tv.inviter_name || 'Platform Admin', // ✅ Required by Novu workflow
        expires_at: tv.expires_at || new Date(Date.now() + 7*24*60*60*1000).toISOString(),
        login_url: tv.login_url || 'https://app.gemeos.ai/login',
        
        // Include any remaining vars passed from client
        ...tv,
      };
      
      const novuPayload = {
        name: workflowId,
        to: {
          subscriberId: emailToSend.to,
          email: emailToSend.to,
          // Include subscriber details for "just in time" creation
          firstName: tv.firstName || 'Admin',
          lastName: tv.lastName || 'User',
        },
        payload
      };

      const response = await fetch('https://api.novu.co/v1/events/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `ApiKey ${novuApiKey}`,
        },
        body: JSON.stringify(novuPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Novu API error: ${response.status} - ${errorText}`);
      }

      novuResponse = await response.json();
    } catch (error) {
      novuError = error;
    }

    if (novuError) {
      // Update queue status to failed
      if (emailToSend.queueId) {
        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            error_message: novuError.message,
            error_details: novuError
          })
          .eq('id', emailToSend.queueId);
      }

      // Log to email_logs
      await supabase
        .from('email_logs')
        .insert({
          tenant_id: emailToSend.tenantId,
          queue_id: emailToSend.queueId,
          template_type: emailToSend.templateType,
          to_email: emailToSend.to,
          subject: emailToSend.subject,
          status: 'failed',
          error_message: novuError.message,
          error_details: novuError,
          created_by: user.id
        });

      throw novuError;
    }

    // Update queue status to sent
    if (emailToSend.queueId) {
      await supabase
        .from('email_queue')
        .update({
          status: 'sent',
          processed_at: new Date().toISOString(),
          provider_message_id: novuResponse?.transactionId,
          provider_response: novuResponse
        })
        .eq('id', emailToSend.queueId);
    }

    // Log successful send
    await supabase
      .from('email_logs')
      .insert({
        tenant_id: emailToSend.tenantId,
        queue_id: emailToSend.queueId,
        template_type: emailToSend.templateType,
        to_email: emailToSend.to,
        subject: emailToSend.subject,
        status: 'sent',
        provider_message_id: novuResponse?.transactionId,
        provider_response: novuResponse,
        sent_at: new Date().toISOString(),
        created_by: user.id
      });

    return new Response(
      JSON.stringify({
        success: true,
        messageId: novuResponse?.transactionId,
        queueId: emailToSend.queueId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Email sending error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to send email',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});