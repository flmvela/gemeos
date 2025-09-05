# Email Provider Configuration

## Current Setup (Resend Active)

The email system has been configured to use **Resend** as the primary email provider while preserving Novu code for future multi-provider support.

### Active Function
- **`send-email/`** - Primary email function using Resend API
- Full compatibility with existing email service API
- Supports all features: queue processing, rate limits, logging, etc.

### Preserved Functions
- **`send-email-novu/`** - Complete Novu implementation (preserved)
- **`send-email-direct/`** - Simple Resend implementation  
- **`send-email-test/`** - Testing function

## Environment Variables

```bash
# Active Provider
RESEND_API_KEY=your_production_resend_api_key

# Preserved for future use
NOVU_API_KEY=479e0ec4656024f02d1f8b0904256210
NOVU_APPLICATION_IDENTIFIER=etWF18_oT_FR
```

## Future Multi-Provider Support

To implement environment-based provider switching:

1. Add `EMAIL_PROVIDER=resend|novu` environment variable
2. Update `send-email/index.ts` to include conditional logic:
   ```typescript
   const emailProvider = Deno.env.get('EMAIL_PROVIDER') || 'resend';
   
   if (emailProvider === 'novu') {
     // Use Novu logic from send-email-novu/
   } else {
     // Use current Resend logic
   }
   ```

## Benefits of Current Setup

✅ **Immediate email delivery** (no workflow configuration needed)  
✅ **Simple debugging** (direct API responses)  
✅ **Lower maintenance** (no external dashboard)  
✅ **Future flexibility** (all provider code preserved)  
✅ **Zero downtime switching** (functions ready to deploy)

## Switching Back to Novu

If needed, simply:
```bash
mv supabase/functions/send-email supabase/functions/send-email-resend
mv supabase/functions/send-email-novu supabase/functions/send-email
npx supabase functions deploy send-email
```

## Testing

Use the existing email service methods - they work transparently with any provider:

```typescript
// This works with both Resend and Novu
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Test',
  html: '<p>Hello</p>',
  tenantId: 'tenant-id'
});
```