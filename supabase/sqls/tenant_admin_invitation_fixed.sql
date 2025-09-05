-- Add tenant_admin_invitation to the email_template_type enum
ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'tenant_admin_invitation';

-- Insert default tenant admin invitation template
INSERT INTO email_templates (
  template_type,
  name,
  subject,
  description,
  html_template,
  text_template,
  variables_schema,
  is_system_template,
  is_active,
  tenant_id
) VALUES (
  'tenant_admin_invitation',
  'Tenant Admin Invitation',
  'You''re invited to administer {{tenant_name}} on Gemeos',
  'Email template for inviting tenant administrators',
  $HTML$<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tenant Admin Invitation</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .header { 
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
        }
        .content { 
            background: white; 
            padding: 40px; 
            border: 1px solid #e5e7eb; 
            border-top: none; 
        }
        .button { 
            display: inline-block; 
            background: #2563eb; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: bold; 
            margin: 20px 0; 
        }
        .button:hover { 
            background: #1d4ed8; 
        }
        .footer { 
            background: #f9fafb; 
            padding: 20px; 
            text-align: center; 
            border-radius: 0 0 8px 8px; 
            font-size: 14px; 
            color: #6b7280; 
        }
        .highlight { 
            background: #eff6ff; 
            padding: 15px; 
            border-left: 4px solid #2563eb; 
            margin: 20px 0; 
            border-radius: 0 6px 6px 0; 
        }
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
</html>$HTML$,
  $TEXT$Welcome to Gemeos!

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
If you didn't expect this invitation, please ignore this email.$TEXT$,
  '{"type": "object", "properties": {"invite_link": {"type": "string", "description": "The invitation acceptance link"}, "tenant_name": {"type": "string", "description": "The name of the tenant"}, "tenant_slug": {"type": "string", "description": "The URL slug of the tenant"}, "tenant_id": {"type": "string", "description": "The UUID of the tenant"}, "inviter_name": {"type": "string", "description": "The name of the person sending the invitation"}, "expires_at": {"type": "string", "description": "When the invitation expires"}, "support_email": {"type": "string", "description": "Support contact email"}, "login_url": {"type": "string", "description": "URL to sign in"}}, "required": ["invite_link", "tenant_name", "tenant_slug", "inviter_name", "expires_at"]}',
  true,
  true,
  NULL
) ON CONFLICT (template_type, tenant_id) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  description = EXCLUDED.description,
  html_template = EXCLUDED.html_template,
  text_template = EXCLUDED.text_template,
  variables_schema = EXCLUDED.variables_schema,
  is_system_template = EXCLUDED.is_system_template,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;