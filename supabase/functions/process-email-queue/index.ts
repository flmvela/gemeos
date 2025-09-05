import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const functionUrl = Deno.env.get('SUPABASE_URL')! + '/functions/v1';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // This function should be called by a scheduled job or webhook
    // Verify the request is authorized (e.g., from a cron job with a secret)
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      throw new Error('Unauthorized');
    }

    // Fetch pending emails from the queue
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .in('status', ['pending', 'queued'])
      .or('scheduled_for.is.null,scheduled_for.lte.now()')
      .lt('attempts', 3)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(10); // Process 10 emails at a time

    if (fetchError) {
      throw fetchError;
    }

    const results = [];
    
    for (const email of pendingEmails || []) {
      try {
        // Update status to queued
        await supabase
          .from('email_queue')
          .update({ status: 'queued' })
          .eq('id', email.id);

        // Call send-email function
        const response = await fetch(`${functionUrl}/send-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            queueId: email.id,
            to: email.to_email,
            subject: email.subject,
            html: email.html_content,
            text: email.text_content,
            from: email.from_email,
            replyTo: email.reply_to,
            tenantId: email.tenant_id,
            templateType: email.template_type,
          }),
        });

        const result = await response.json();
        results.push({
          emailId: email.id,
          success: response.ok,
          result,
        });

        // If max attempts reached and still failing, mark as failed permanently
        if (!response.ok && email.attempts >= 2) {
          await supabase
            .from('email_queue')
            .update({
              status: 'failed',
              error_message: 'Max attempts reached',
              error_details: result,
            })
            .eq('id', email.id);
        }
      } catch (error: any) {
        console.error(`Error processing email ${email.id}:`, error);
        results.push({
          emailId: email.id,
          success: false,
          error: error.message,
        });

        // Update email status
        await supabase
          .from('email_queue')
          .update({
            status: email.attempts >= 2 ? 'failed' : 'pending',
            error_message: error.message,
            last_attempt_at: new Date().toISOString(),
          })
          .eq('id', email.id);
      }
    }

    // Clean up old processed emails (older than 30 days)
    await supabase
      .from('email_queue')
      .delete()
      .in('status', ['sent', 'delivered', 'cancelled'])
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    return new Response(
      JSON.stringify({
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Queue processing error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to process email queue',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});