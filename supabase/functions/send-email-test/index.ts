import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EmailRequest {
  queueId?: string;
  tenantId: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      throw new Error('No authorization header');
    }

    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authorization.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const emailData: EmailRequest = await req.json();
    
    // Validate required fields
    if (!emailData.tenantId) {
      throw new Error('Missing tenant ID');
    }

    console.log('📧 [TEST] Email sending requested for:', {
      queueId: emailData.queueId,
      tenantId: emailData.tenantId,
      userId: user.id
    });

    // For testing: just update the queue status without actually sending
    if (emailData.queueId) {
      // Update queue status to "sent" (simulated)
      await supabase
        .from('email_queue')
        .update({
          status: 'sent',
          processed_at: new Date().toISOString(),
          provider_message_id: `test-${Date.now()}`,
        })
        .eq('id', emailData.queueId);

      // Log successful "send"
      await supabase
        .from('email_logs')
        .insert({
          tenant_id: emailData.tenantId,
          queue_id: emailData.queueId,
          template_type: 'tenant_admin_invitation',
          to_email: 'test@example.com',
          subject: 'Test Email',
          status: 'sent',
          provider_message_id: `test-${Date.now()}`,
          sent_at: new Date().toISOString(),
          created_by: user.id
        });

      console.log('✅ [TEST] Email queue updated successfully');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email simulated successfully',
        messageId: `test-${Date.now()}`,
        queueId: emailData.queueId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Email test error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to process email',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});