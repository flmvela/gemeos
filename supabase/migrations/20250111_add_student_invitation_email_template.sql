-- Add student_invitation email template type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'student_invitation' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'email_template_type')
    ) THEN
        ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'student_invitation';
    END IF;
END$$;

-- Insert default student invitation email template
INSERT INTO email_templates (
    template_type,
    template_name,
    subject,
    html_content,
    text_content,
    variables,
    is_active,
    tenant_id
) VALUES (
    'student_invitation',
    'Student Class Invitation',
    'You''ve been invited to join {{class_name}}',
    E'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Class Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Gemeos!</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-bottom: 20px;">You''ve been invited to join a class!</h2>
        
        <p style="font-size: 16px; margin-bottom: 15px;">
            <strong>{{teacher_name}}</strong> has invited you to join their class:
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #06b6d4;">
            <h3 style="margin-top: 0; color: #06b6d4;">{{class_name}}</h3>
            {{#if custom_message}}
            <div style="margin-top: 15px; padding: 15px; background: #e0f2fe; border-radius: 6px;">
                <p style="margin: 0; font-style: italic; color: #0369a1;">
                    <strong>Message from your teacher:</strong><br>
                    {{custom_message}}
                </p>
            </div>
            {{/if}}
        </div>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
            To get started with your learning journey, click the button below to set up your student account:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{invite_link}}" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Accept Invitation & Set Up Account
            </a>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 20px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Note:</strong> This invitation expires on {{expires_at}}. Please set up your account before then.
            </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
        
        <div style="text-align: center; color: #666; font-size: 14px;">
            <p>If you have any questions, please contact your teacher or our support team at <a href="mailto:{{support_email}}" style="color: #06b6d4;">{{support_email}}</a></p>
            <p style="margin-top: 20px;">© 2024 Gemeos. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    E'You''ve been invited to join {{class_name}}!

{{teacher_name}} has invited you to join their class.

{{#if custom_message}}
Message from your teacher:
{{custom_message}}
{{/if}}

To get started with your learning journey, click the link below to set up your student account:

{{invite_link}}

Note: This invitation expires on {{expires_at}}. Please set up your account before then.

If you have any questions, please contact your teacher or our support team at {{support_email}}

© 2024 Gemeos. All rights reserved.',
    ARRAY[
        'invite_link',
        'class_name',
        'teacher_name',
        'custom_message',
        'expires_at',
        'support_email'
    ],
    true,
    NULL -- Global template
) ON CONFLICT (template_type, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000')) 
DO UPDATE SET
    subject = EXCLUDED.subject,
    html_content = EXCLUDED.html_content,
    text_content = EXCLUDED.text_content,
    variables = EXCLUDED.variables;