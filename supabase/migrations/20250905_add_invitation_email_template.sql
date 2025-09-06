-- Insert general invitation email template (run this after the enum value has been added)
INSERT INTO email_templates (
  tenant_id,
  template_type,
  name,
  subject,
  description,
  html_template,
  text_template,
  variables_schema,
  is_system_template,
  from_name,
  from_email,
  is_active
) VALUES (
  NULL,
  'invitation',
  'General Invitation',
  'You''re invited to join {{tenant_name}} on Gemeos',
  'Default template for inviting users to join a tenant',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to {{tenant_name}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #0B5FAE 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">You''re Invited!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Join {{tenant_name}} on Gemeos</p>
    </div>
    
    <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <div style="background: #F8F9FD; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 10px 0; color: #0B5FAE;">🏢 {{tenant_name}}</h3>
            <p style="margin: 0; color: #666; font-size: 14px;">Role: <strong>{{role_name}}</strong></p>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Invited by: {{inviter_name}}</p>
        </div>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
            Hello! You''ve been invited to join <strong>{{tenant_name}}</strong> as a <strong>{{role_name}}</strong>.
        </p>
        
        <p style="font-size: 16px; margin-bottom: 30px;">
            Click the button below to accept your invitation and set up your account:
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
            <a href="{{invite_link}}" 
               style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); 
                      color: white; 
                      padding: 16px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: 600; 
                      font-size: 16px; 
                      display: inline-block;">
                Accept Invitation
            </a>
        </div>
        
        <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 6px; padding: 15px; margin: 30px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400E;">
                ⏰ <strong>Important:</strong> This invitation expires on {{expires_at}}. 
                Please accept it before then to maintain access.
            </p>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; font-size: 14px; color: #666;">
            <p style="margin: 0;">
                Need help? Contact your administrator or reach out to our support team at 
                <a href="mailto:{{support_email}}" style="color: #0B5FAE;">{{support_email}}</a>
            </p>
        </div>
    </div>
</body>
</html>',
  'You''re invited to join {{tenant_name}} on Gemeos!

Hello! You''ve been invited to join {{tenant_name}} as a {{role_name}}.

Organization: {{tenant_name}}
Role: {{role_name}}
Invited by: {{inviter_name}}

Click here to accept your invitation and set up your account:
{{invite_link}}

Important: This invitation expires on {{expires_at}}. Please accept it before then to maintain access.

Need help? Contact your administrator or reach out to our support team at {{support_email}}

Best regards,
The Gemeos Team',
  '{"tenant_name": "string", "tenant_id": "string", "invitation_id": "string", "invite_link": "string", "inviter_name": "string", "role_name": "string", "expires_at": "string", "support_email": "string"}',
  true,
  'Gemeos',
  'noreply@gemeos.ai',
  true
) ON CONFLICT (template_type, tenant_id) WHERE tenant_id IS NULL DO NOTHING;