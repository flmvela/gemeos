-- ============================================================
-- Teacher Invitation Email Template
-- ============================================================

BEGIN;

-- Insert teacher invitation email template
INSERT INTO public.email_templates (
  template_type,
  name,
  subject,
  description,
  html_template,
  text_template,
  variables_schema,
  from_name,
  is_active,
  is_system_template
) VALUES (
  'teacher_invitation',
  'Teacher Invitation',
  'Welcome to {{tenantName}} - Set Up Your Teacher Account',
  'Email sent to newly created teachers with instructions to set up their password',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to {{tenantName}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Welcome to {{tenantName}}!</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Your teacher account has been created</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Dear {{teacherName}},
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        You have been invited to join <strong>{{tenantName}}</strong> as a teacher. We''re excited to have you as part of our educational community!
      </p>
      
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Your Account Details:</h3>
        <p style="color: #4b5563; margin: 5px 0; font-size: 14px;">
          <strong>Email:</strong> {{teacherEmail}}
        </p>
        <p style="color: #4b5563; margin: 5px 0; font-size: 14px;">
          <strong>Role:</strong> Teacher
        </p>
        {{#if domains}}
        <p style="color: #4b5563; margin: 5px 0; font-size: 14px;">
          <strong>Teaching Domains:</strong> {{domains}}
        </p>
        {{/if}}
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
        To get started, please click the button below to set up your password and complete your account setup:
      </p>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{invitationUrl}}" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          Accept Invitation & Set Password
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
        If the button doesn''t work, you can copy and paste this link into your browser:
      </p>
      <p style="color: #06b6d4; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; word-break: break-all;">
        {{invitationUrl}}
      </p>
      
      <div style="border-top: 1px solid #e5e7eb; margin: 30px 0; padding-top: 30px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">What happens next?</h3>
        <ol style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Click the link above to access your account setup page</li>
          <li>Create a secure password for your account</li>
          <li>Complete your profile information</li>
          <li>Start managing your classes and students</li>
        </ol>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
        <strong>Note:</strong> This invitation link will expire in 7 days for security reasons. If you need a new invitation, please contact your administrator.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;">
        This email was sent by {{tenantName}} powered by Gemeos
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        If you believe this email was sent in error, please contact your administrator.
      </p>
    </div>
  </div>
</body>
</html>',
  'Welcome to {{tenantName}}!

Dear {{teacherName}},

You have been invited to join {{tenantName}} as a teacher. We''re excited to have you as part of our educational community!

Your Account Details:
- Email: {{teacherEmail}}
- Role: Teacher
{{#if domains}}- Teaching Domains: {{domains}}{{/if}}

To get started, please visit the following link to set up your password and complete your account setup:

{{invitationUrl}}

What happens next?
1. Click the link above to access your account setup page
2. Create a secure password for your account
3. Complete your profile information
4. Start managing your classes and students

Note: This invitation link will expire in 7 days for security reasons. If you need a new invitation, please contact your administrator.

This email was sent by {{tenantName}} powered by Gemeos.
If you believe this email was sent in error, please contact your administrator.',
  '{
    "type": "object",
    "properties": {
      "tenantName": {
        "type": "string",
        "description": "Name of the tenant/academy"
      },
      "teacherName": {
        "type": "string",
        "description": "Full name of the teacher"
      },
      "teacherEmail": {
        "type": "string",
        "description": "Email address of the teacher"
      },
      "invitationUrl": {
        "type": "string",
        "description": "URL for password setup"
      },
      "domains": {
        "type": "string",
        "description": "Comma-separated list of teaching domains"
      }
    },
    "required": ["tenantName", "teacherName", "teacherEmail", "invitationUrl"]
  }'::jsonb,
  'Gemeos Academy',
  true,
  true
)
ON CONFLICT DO NOTHING;

-- If the template already exists, update it
UPDATE public.email_templates
SET 
  html_template = '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to {{tenantName}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Welcome to {{tenantName}}!</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Your teacher account has been created</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Dear {{teacherName}},
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        You have been invited to join <strong>{{tenantName}}</strong> as a teacher. We''re excited to have you as part of our educational community!
      </p>
      
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Your Account Details:</h3>
        <p style="color: #4b5563; margin: 5px 0; font-size: 14px;">
          <strong>Email:</strong> {{teacherEmail}}
        </p>
        <p style="color: #4b5563; margin: 5px 0; font-size: 14px;">
          <strong>Role:</strong> Teacher
        </p>
        {{#if domains}}
        <p style="color: #4b5563; margin: 5px 0; font-size: 14px;">
          <strong>Teaching Domains:</strong> {{domains}}
        </p>
        {{/if}}
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
        To get started, please click the button below to set up your password and complete your account setup:
      </p>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{invitationUrl}}" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          Accept Invitation & Set Password
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
        If the button doesn''t work, you can copy and paste this link into your browser:
      </p>
      <p style="color: #06b6d4; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; word-break: break-all;">
        {{invitationUrl}}
      </p>
      
      <div style="border-top: 1px solid #e5e7eb; margin: 30px 0; padding-top: 30px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">What happens next?</h3>
        <ol style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Click the link above to access your account setup page</li>
          <li>Create a secure password for your account</li>
          <li>Complete your profile information</li>
          <li>Start managing your classes and students</li>
        </ol>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
        <strong>Note:</strong> This invitation link will expire in 7 days for security reasons. If you need a new invitation, please contact your administrator.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;">
        This email was sent by {{tenantName}} powered by Gemeos
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        If you believe this email was sent in error, please contact your administrator.
      </p>
    </div>
  </div>
</body>
</html>',
  text_template = 'Welcome to {{tenantName}}!

Dear {{teacherName}},

You have been invited to join {{tenantName}} as a teacher. We''re excited to have you as part of our educational community!

Your Account Details:
- Email: {{teacherEmail}}
- Role: Teacher
{{#if domains}}- Teaching Domains: {{domains}}{{/if}}

To get started, please visit the following link to set up your password and complete your account setup:

{{invitationUrl}}

What happens next?
1. Click the link above to access your account setup page
2. Create a secure password for your account
3. Complete your profile information
4. Start managing your classes and students

Note: This invitation link will expire in 7 days for security reasons. If you need a new invitation, please contact your administrator.

This email was sent by {{tenantName}} powered by Gemeos.
If you believe this email was sent in error, please contact your administrator.',
  updated_at = NOW()
WHERE template_type = 'teacher_invitation';

COMMIT;