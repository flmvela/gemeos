import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create default tenant admin invitation template
    const tenantAdminTemplate = {
      template_type: 'tenant_admin_invitation',
      name: 'Tenant Admin Invitation',
      subject: 'You\'re invited to administer {{tenant_name}} on Gemeos',
      html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tenant Admin Invitation</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .button:hover { background: #1d4ed8; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6b7280; }
        .highlight { background: #eff6ff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; border-radius: 0 6px 6px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Welcome to Gemeos!</h1>
            <p>You've been invited to administer a learning tenant</p>
        </div>
        
        <div class="content">
            <h2>Hello!</h2>
            
            <p>{{inviter_name}} has invited you to become an administrator for <strong>{{tenant_name}}</strong> on the Gemeos learning platform.</p>
            
            <div class="highlight">
                <p><strong>Tenant:</strong> {{tenant_name}} ({{tenant_slug}})</p>
                <p><strong>Your Role:</strong> Tenant Administrator</p>
                <p><strong>Expires:</strong> {{expires_at}}</p>
            </div>
            
            <p>As a tenant administrator, you'll have access to:</p>
            <ul>
                <li>📚 Manage learning domains and concepts</li>
                <li>👥 Invite and manage teachers</li>
                <li>📊 View analytics and reports</li>
                <li>⚙️ Configure tenant settings</li>
            </ul>
            
            <p style="text-align: center;">
                <a href="{{invite_link}}" class="button">Accept Invitation</a>
            </p>
            
            <p><small>If you already have an account, you can <a href="{{login_url}}">sign in here</a> and the admin access will be automatically granted.</small></p>
            
            <p>This invitation will expire on {{expires_at}}. If you have any questions, please contact us at <a href="mailto:{{support_email}}">{{support_email}}</a>.</p>
        </div>
        
        <div class="footer">
            <p>© 2024 Gemeos - Personalized Learning Platform</p>
            <p>If you didn't expect this invitation, please ignore this email.</p>
        </div>
    </div>
</body>
</html>
      `,
      text_content: `
Welcome to Gemeos!

{{inviter_name}} has invited you to become an administrator for {{tenant_name}} on the Gemeos learning platform.

Tenant: {{tenant_name}} ({{tenant_slug}})
Your Role: Tenant Administrator
Expires: {{expires_at}}

As a tenant administrator, you'll have access to:
- Manage learning domains and concepts
- Invite and manage teachers
- View analytics and reports
- Configure tenant settings

Accept your invitation: {{invite_link}}

If you already have an account, you can sign in at {{login_url}} and the admin access will be automatically granted.

This invitation will expire on {{expires_at}}. If you have any questions, please contact us at {{support_email}}.

© 2024 Gemeos - Personalized Learning Platform
If you didn't expect this invitation, please ignore this email.
      `,
      is_system: true,
      is_active: true
    };

    // Check if template already exists
    const { data: existingTemplate } = await supabase
      .from('email_templates')
      .select('id')
      .eq('template_type', 'tenant_admin_invitation')
      .is('tenant_id', null)
      .single();

    if (existingTemplate) {
      // Update existing template
      const { error } = await supabase
        .from('email_templates')
        .update(tenantAdminTemplate)
        .eq('id', existingTemplate.id);

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Default tenant admin invitation template updated',
          templateId: existingTemplate.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Create new template
      const { data, error } = await supabase
        .from('email_templates')
        .insert(tenantAdminTemplate)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Default tenant admin invitation template created',
          templateId: data.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Error creating default email templates:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});