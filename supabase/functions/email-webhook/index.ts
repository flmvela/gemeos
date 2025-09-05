import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Event-specific fields
    delivered_at?: string;
    opened_at?: string;
    clicked_at?: string;
    bounced_at?: string;
    bounce?: {
      type: string;
      message: string;
    };
    complaint?: {
      type: string;
      message: string;
    };
  };
}

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  return signature === `v0=${expectedSignature}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('resend-signature');

    if (!signature) {
      throw new Error('Missing webhook signature');
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      throw new Error('Invalid webhook signature');
    }

    const event: ResendWebhookEvent = JSON.parse(rawBody);

    // Map Resend event types to our system
    const eventTypeMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.delivery_delayed': 'delayed',
      'email.complained': 'complained',
      'email.bounced': 'bounced',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
    };

    const mappedEventType = eventTypeMap[event.type] || event.type;

    // Store webhook event
    const { error: webhookError } = await supabase
      .from('email_webhooks')
      .insert({
        provider: 'resend',
        event_type: mappedEventType,
        message_id: event.data.email_id,
        payload: event,
        received_at: new Date().toISOString(),
      });

    if (webhookError) {
      console.error('Error storing webhook:', webhookError);
    }

    // Update email log based on event
    const { data: emailLog, error: logFetchError } = await supabase
      .from('email_logs')
      .select('id')
      .eq('provider_message_id', event.data.email_id)
      .single();

    if (!logFetchError && emailLog) {
      const updates: any = {
        provider_response: event,
      };

      switch (mappedEventType) {
        case 'delivered':
          updates.status = 'delivered';
          updates.delivered_at = event.data.delivered_at || new Date().toISOString();
          break;
        case 'bounced':
          updates.status = 'bounced';
          updates.bounced_at = event.data.bounced_at || new Date().toISOString();
          updates.error_message = event.data.bounce?.message;
          updates.error_details = event.data.bounce;
          break;
        case 'opened':
          updates.opened_at = event.data.opened_at || new Date().toISOString();
          break;
        case 'clicked':
          updates.clicked_at = event.data.clicked_at || new Date().toISOString();
          break;
        case 'complained':
          updates.error_message = 'Recipient marked email as spam';
          updates.error_details = event.data.complaint;
          break;
      }

      const { error: updateError } = await supabase
        .from('email_logs')
        .update(updates)
        .eq('id', emailLog.id);

      if (updateError) {
        console.error('Error updating email log:', updateError);
      }

      // Also update the queue if it exists
      const { data: queueItem } = await supabase
        .from('email_queue')
        .select('id')
        .eq('provider_message_id', event.data.email_id)
        .single();

      if (queueItem) {
        const queueUpdates: any = {};
        
        if (mappedEventType === 'delivered') {
          queueUpdates.status = 'delivered';
        } else if (mappedEventType === 'bounced') {
          queueUpdates.status = 'bounced';
          queueUpdates.error_message = event.data.bounce?.message;
          queueUpdates.error_details = event.data.bounce;
        }

        if (Object.keys(queueUpdates).length > 0) {
          await supabase
            .from('email_queue')
            .update(queueUpdates)
            .eq('id', queueItem.id);
        }
      }
    }

    // Handle bounce by adding to blacklist if hard bounce
    if (mappedEventType === 'bounced' && event.data.bounce?.type === 'hard') {
      // Extract tenant_id from email log
      const { data: logWithTenant } = await supabase
        .from('email_logs')
        .select('tenant_id, to_email')
        .eq('provider_message_id', event.data.email_id)
        .single();

      if (logWithTenant) {
        await supabase
          .from('email_blacklist')
          .insert({
            tenant_id: logWithTenant.tenant_id,
            email: logWithTenant.to_email,
            reason: `Hard bounce: ${event.data.bounce.message}`,
            blacklisted_at: new Date().toISOString(),
          })
          .on_conflict('tenant_id,email')
          .do_nothing();
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        event_type: mappedEventType,
        message_id: event.data.email_id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to process webhook',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});