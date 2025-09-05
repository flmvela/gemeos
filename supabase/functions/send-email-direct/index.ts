import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface DirectEmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📧 Starting send-email-direct function');
    
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    console.log('📧 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasResendKey: !!resendApiKey
    });
    
    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
      throw new Error('Missing required environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);
    
    // Check authorization
    const authorization = req.headers.get('Authorization');
    console.log('📧 Auth header present:', !!authorization);
    
    if (!authorization) {
      throw new Error('No authorization header');
    }

    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authorization.replace('Bearer ', '')
    );
    
    console.log('📧 Auth check:', {
      hasUser: !!user,
      authError: authError?.message,
      userId: user?.id
    });
    
    if (authError || !user) {
      throw new Error(`Authentication failed: ${authError?.message || 'No user'}`);
    }

    // Parse request body
    const emailData: DirectEmailRequest = await req.json();
    console.log('📧 Email data received:', {
      to: emailData.to,
      subject: emailData.subject,
      hasHtml: !!emailData.html,
      from: emailData.from
    });
    
    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.html) {
      throw new Error('Missing required email fields (to, subject, html)');
    }

    // Send email via Resend
    console.log('📧 Attempting to send via Resend...');
    const { data: resendResponse, error: resendError } = await resend.emails.send({
      from: emailData.from || 'Gemeos <noreply@gemeos.ai>',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    console.log('📧 Resend response:', {
      success: !resendError,
      messageId: resendResponse?.id,
      error: resendError?.message
    });

    if (resendError) {
      throw new Error(`Resend error: ${resendError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: resendResponse?.id,
        message: 'Email sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('📧 Error in send-email-direct:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to send email',
        details: error.stack,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});