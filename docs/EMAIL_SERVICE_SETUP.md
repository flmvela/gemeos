# Email Notification Service Setup Guide

## Overview

The Gemeos Email Notification Service is a comprehensive solution for handling all email communications within the platform. It provides multi-tenant support, template management, queue processing, and detailed tracking.

## Architecture

### Components

1. **Database Layer**: PostgreSQL tables for templates, queue, logs, and tracking
2. **Supabase Edge Functions**: Serverless functions for email processing
3. **Email Provider**: Resend API for reliable email delivery
4. **React Integration**: Hooks and components for email management
5. **Monitoring**: Built-in tracking and webhook processing

## Setup Instructions

### 1. Database Migration

Run the email system migration to create all required tables:

```bash
supabase migration up 20250903_email_notification_system.sql
```

### 2. Configure Resend

1. Sign up for a [Resend account](https://resend.com)
2. Verify your domain
3. Create an API key
4. Set up webhook endpoint (optional but recommended)

### 3. Environment Variables

Set the following environment variables in your Supabase project:

```bash
# In Supabase Dashboard > Settings > Edge Functions
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxx
CRON_SECRET=your_secure_cron_secret
```

### 4. Deploy Edge Functions

Deploy the email edge functions:

```bash
# Send email function
supabase functions deploy send-email

# Queue processor function
supabase functions deploy process-email-queue

# Webhook handler function
supabase functions deploy email-webhook
```

### 5. Set Up Cron Job

Configure a cron job to process the email queue every 5 minutes:

```bash
# Using Supabase's pg_cron extension or external service
*/5 * * * * curl -X POST https://your-project.supabase.co/functions/v1/process-email-queue \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### 6. Configure Webhook

In your Resend dashboard, set up the webhook endpoint:

```
Webhook URL: https://your-project.supabase.co/functions/v1/email-webhook
Events: All events
```

## Usage

### Sending Emails in React Components

```typescript
import { useEmail } from '@/hooks/useEmail';

function MyComponent() {
  const { sendTeacherInvitation, loading } = useEmail();

  const handleInvite = async () => {
    const result = await sendTeacherInvitation(
      'teacher@example.com',
      'https://app.gemeos.com/invite/abc123',
      'Admin Name',
      'School Name'
    );
    
    if (result.success) {
      console.log('Invitation sent!');
    }
  };
  
  return (
    <button onClick={handleInvite} disabled={loading}>
      Send Invitation
    </button>
  );
}
```

### Managing Email Templates

```typescript
import { useEmailTemplates } from '@/hooks/useEmail';

function TemplateManager() {
  const { templates, saveTemplate, loading } = useEmailTemplates();

  const createTemplate = async () => {
    await saveTemplate({
      template_type: 'custom',
      name: 'Custom Welcome',
      subject: 'Welcome to {{tenant_name}}',
      html_template: '<h1>Welcome!</h1>',
      text_template: 'Welcome!',
    });
  };
  
  // ... render templates
}
```

### Viewing Email Dashboard

```tsx
import { EmailDashboard } from '@/components/email/EmailDashboard';

function AdminPanel() {
  return (
    <div>
      <h1>Email Management</h1>
      <EmailDashboard />
    </div>
  );
}
```

## Email Types

### Pre-configured Templates

1. **Teacher Invitation** (`teacher_invitation`)
   - Sent when inviting teachers to join a tenant
   - Variables: `tenant_name`, `inviter_name`, `invite_link`, `expires_at`

2. **Password Reset** (`password_reset`)
   - Sent for password recovery
   - Variables: `reset_link`, `user_name`

3. **Welcome Email** (`welcome`)
   - Sent to new users after registration
   - Variables: `user_name`, `tenant_name`, `login_link`

4. **Account Status** (`account_suspended`, `account_reactivated`)
   - Sent when account status changes
   - Variables: `status_reason`, `action_required`

5. **System Notifications** (`system_maintenance`, `system_update`)
   - Sent for platform-wide announcements
   - Variables: `maintenance_start`, `maintenance_end`, `update_features`

## Features

### Multi-Tenant Support
- Each tenant can have custom email templates
- Tenant-specific branding and content
- Isolated email logs and statistics

### Queue Management
- Priority-based processing (critical, high, normal, low)
- Scheduled email delivery
- Automatic retry with exponential backoff
- Failed email handling

### Rate Limiting
- Hourly, daily, and monthly limits per tenant
- Automatic counter resets
- Prevention of email abuse

### Blacklisting
- Email-level blocking
- Tenant-specific blacklists
- Automatic blacklisting for hard bounces

### Tracking & Analytics
- Delivery confirmation
- Open tracking
- Click tracking
- Bounce handling
- Comprehensive email statistics

### Security
- Row-level security for all tables
- Webhook signature verification
- Audit logging
- Permission-based access control

## Monitoring

### Email Statistics

The dashboard provides real-time statistics:
- Total emails sent
- Delivery rate
- Open rate
- Click rate
- Bounce rate
- Failed emails

### Queue Monitoring

Monitor the email queue for:
- Pending emails
- Failed deliveries
- Processing delays
- Rate limit status

### Error Handling

The system handles various error scenarios:
- Provider failures (automatic retry)
- Invalid email addresses (validation)
- Rate limit exceeded (queuing)
- Template errors (fallback to system templates)

## Best Practices

1. **Template Management**
   - Always test templates before activating
   - Use system templates as fallbacks
   - Version your template changes

2. **Queue Processing**
   - Monitor queue size regularly
   - Set appropriate retry limits
   - Clear old processed emails periodically

3. **Rate Limiting**
   - Set conservative initial limits
   - Increase gradually based on usage
   - Monitor for unusual spikes

4. **Error Handling**
   - Log all errors for debugging
   - Set up alerts for critical failures
   - Implement graceful degradation

5. **Security**
   - Regularly rotate API keys
   - Verify webhook signatures
   - Audit email sending activities

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check Resend API key configuration
   - Verify rate limits haven't been exceeded
   - Check email blacklist

2. **Queue not processing**
   - Verify cron job is running
   - Check Edge Function logs
   - Ensure CRON_SECRET is correct

3. **Webhooks not received**
   - Verify webhook URL in Resend dashboard
   - Check webhook secret configuration
   - Review Edge Function logs

### Debug Commands

```sql
-- Check queue status
SELECT status, COUNT(*) 
FROM email_queue 
WHERE tenant_id = 'your-tenant-id'
GROUP BY status;

-- View recent failures
SELECT * FROM email_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check rate limit status
SELECT * FROM email_rate_limits 
WHERE tenant_id = 'your-tenant-id';
```

## API Reference

### Email Service Methods

```typescript
// Send email immediately
emailService.sendEmail(request: SendEmailRequest)

// Queue email for processing
emailService.queueEmail(request: QueueEmailRequest)

// Send specific email types
emailService.sendTeacherInvitation(email, link, inviter, tenant)
emailService.sendPasswordReset(email, link, userName?)
emailService.sendWelcomeEmail(email, userName, tenantName)

// Template management
emailService.getTemplates()
emailService.saveTemplate(template)
emailService.deleteTemplate(id)

// Queue management
emailService.getQueueItems(filters?)
emailService.cancelQueueItem(id)
emailService.retryQueueItem(id)

// Logs and statistics
emailService.getEmailLogs(filters?)
emailService.getEmailStats(startDate?, endDate?)

// Blacklist management
emailService.getBlacklistedEmails()
emailService.addToBlacklist(email, reason?)
emailService.removeFromBlacklist(email)
```

## Support

For issues or questions about the email service:
- Check the logs in Supabase Dashboard
- Review the troubleshooting section
- Contact the development team