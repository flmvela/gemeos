import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { Resend } from 'https://esm.sh/resend@2.0.0';

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

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);
    
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

    // Track why we're allowing/denying (great for logs)
    let allowed = false;
    const reasons: string[] = [];

    // 1) Platform admin list (use env, lowercase-safe)
    const platformAdmins = (Deno.env.get('PLATFORM_ADMIN_EMAILS') || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const isPlatformAdmin =
      user.app_metadata?.role === 'platform_admin' ||
      user.app_metadata?.is_platform_admin === true ||
      platformAdmins.includes((user.email || '').toLowerCase()) ||
      ['platform-admin@gemeos.ai','admin@gemeos.ai','test-admin@example.com']
        .includes((user.email || '').toLowerCase());

    if (isPlatformAdmin) { allowed = true; reasons.push('platform_admin'); }

    // 2) Tenant creator can send
    if (!allowed) {
      const { data: tenantRow, error: tenantRowErr } = await supabase
        .from('tenants')
        .select('created_by')
        .eq('id', emailToSend.tenantId)
        .maybeSingle();

      if (!tenantRowErr && tenantRow?.created_by === user.id) {
        allowed = true;
        reasons.push('tenant_creator');
      }
    }

    // 3) Queue owner can process their own queued item
    if (!allowed && emailToSend.queueId) {
      const { data: q, error: qErr } = await supabase
        .from('email_queue')
        .select('created_by')
        .eq('id', emailToSend.queueId)
        .maybeSingle();

      if (!qErr && q?.created_by === user.id) {
        allowed = true;
        reasons.push('queue_creator');
      }
    }

    // 4) Membership-based allow (active/pending/invited)
    if (!allowed) {
      const { data: membership, error: memErr } = await supabase
        .from('user_tenants')
        .select('id,status')
        .eq('user_id', user.id)
        .eq('tenant_id', emailToSend.tenantId)
        .in('status', ['active','pending','invited'])
        .maybeSingle();

      if (!memErr && membership) {
        allowed = true;
        reasons.push(`membership_${membership.status}`);
      }
    }

    console.log('🔐 [AUTH] allow?', { allowed, reasons, caller: user.email, tenantId: emailToSend.tenantId });

    if (!allowed) {
      if (emailToSend.queueId) {
        await supabase.from('email_queue').update({
          status: 'failed',
          error_message: 'Sender not authorized for tenant',
        }).eq('id', emailToSend.queueId);
      }
      throw new Error('User does not have access to this tenant');
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

    // Process template variables
    const DEFAULT_SUPPORT_EMAIL = 'support@gemeos.ai';
    const DEFAULT_REPLY_TO = DEFAULT_SUPPORT_EMAIL;
    
    // Pull template vars safely
    const tv = emailToSend.templateVariables || {};
    
    // Determine base URL based on environment
    const environment = Deno.env.get('ENVIRONMENT');
    const nodeEnv = Deno.env.get('NODE_ENV');
    const useLocalhost = Deno.env.get('USE_LOCALHOST');
    const isDevelopment = environment === 'development' || nodeEnv === 'development' || useLocalhost === 'true';
    
    console.log('🔍 [ENV] Environment detection:', {
      ENVIRONMENT: environment,
      NODE_ENV: nodeEnv,
      USE_LOCALHOST: useLocalhost,
      isDevelopment,
      supabaseUrl: supabaseUrl.substring(0, 30) + '...'
    });
    
    const baseUrl = isDevelopment ? 'http://localhost:8080' : 'https://app.gemeos.ai';
    console.log('🔍 [ENV] Using baseUrl:', baseUrl);
    
    // Create template variables with defaults
    // Build invite link - ensure we have invitation_id for invitation emails
    let inviteLink = tv.invite_link || emailToSend.invite_link;
    
    // For invitation emails, always build the URL with invitation_id
    if (!inviteLink && emailToSend.templateType === 'invitation') {
      if (tv.invitation_id) {
        inviteLink = `${baseUrl}/accept-invite?tenant=${emailToSend.tenantId}&token=${tv.invitation_id}`;
        console.log('📧 [INVITATION] Built invite URL:', inviteLink);
      } else {
        console.error('❌ [INVITATION] Missing invitation_id for invitation email!', {
          templateType: emailToSend.templateType,
          templateVars: Object.keys(tv)
        });
        inviteLink = `${baseUrl}/accept-invite?tenant=${emailToSend.tenantId}`;
      }
    }
    
    const templateVars = {
      // Basic template variables
      tenant_name: tv.tenant_name || 'Your organization',
      tenant_slug: tv.tenant_slug || 'org', 
      tenant_id: emailToSend.tenantId,
      inviter_name: tv.inviter_name || 'Platform Admin',
      support_email: tv.support_email || DEFAULT_SUPPORT_EMAIL,
      expires_at: tv.expires_at || new Date(Date.now() + 7*24*60*60*1000).toISOString(),
      login_url: tv.login_url || `${baseUrl}/login`,
      invite_link: inviteLink,
      
      // Include any additional vars passed from client
      ...tv,
    };

    // Function to replace template variables in text
    const processTemplate = (text: string, variables: Record<string, any>): string => {
      let processedText = text;
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        processedText = processedText.replace(regex, String(value || ''));
      }
      return processedText;
    };

    // Process subject, HTML, and text with template variables
    const processedSubject = processTemplate(emailToSend.subject, templateVars);
    const processedHtml = processTemplate(emailToSend.html, templateVars);
    const processedText = emailToSend.text ? processTemplate(emailToSend.text, templateVars) : undefined;

    // Send email via Resend
    let resendResponse;
    let resendError;
    
    try {
      console.log('📧 Sending email via Resend...');
      console.log('📧 Template variables:', {
        ...templateVars,
        invite_link: templateVars.invite_link,
        login_url: templateVars.login_url,
        baseUrl
      });
      
      const { data, error } = await resend.emails.send({
        from: emailToSend.from || 'Gemeos <noreply@gemeos.ai>',
        to: emailToSend.to,
        subject: processedSubject,
        html: processedHtml,
        text: processedText,
        reply_to: emailToSend.replyTo || templateVars.support_email,
      });

      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }

      resendResponse = { id: data?.id };
      console.log('✅ Email sent via Resend:', resendResponse);
    } catch (error) {
      resendError = error;
    }

    if (resendError) {
      // Update queue status to failed
      if (emailToSend.queueId) {
        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            error_message: resendError.message,
            error_details: resendError
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
          error_message: resendError.message,
          error_details: resendError,
          created_by: user.id
        });

      throw resendError;
    }

    // Update queue status to sent
    if (emailToSend.queueId) {
      await supabase
        .from('email_queue')
        .update({
          status: 'sent',
          processed_at: new Date().toISOString(),
          provider_message_id: resendResponse?.id,
          provider_response: resendResponse
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
        provider_message_id: resendResponse?.id,
        provider_response: resendResponse,
        sent_at: new Date().toISOString(),
        created_by: user.id
      });

    return new Response(
      JSON.stringify({
        success: true,
        messageId: resendResponse?.id,
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