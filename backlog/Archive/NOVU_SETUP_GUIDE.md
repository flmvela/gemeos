# Novu Setup Guide

## Getting Your Novu Credentials

Since you already have a Novu account at novu.co, follow these steps to get your credentials:

### 1. Get Your API Key
1. Log in to your Novu dashboard at https://web.novu.co
2. Navigate to **Settings** → **API Keys**
3. Copy your **API Key** (starts with `novu_`)

### 2. Get Your Application Identifier
1. In the Novu dashboard, go to **Settings** → **Environment**
2. Copy your **Application Identifier** (usually starts with your app name)

### 3. Update Environment Variables
Replace the placeholder values in your `.env` file:

```bash
# Replace these with your actual values
NOVU_API_KEY=novu_your_actual_api_key_here
NOVU_APPLICATION_IDENTIFIER=your_actual_app_identifier_here
```

### 4. Configure Supabase Edge Functions
You'll also need to add these environment variables to your Supabase project:
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the same `NOVU_API_KEY` and `NOVU_APPLICATION_IDENTIFIER` values

## Next Steps
Once you've configured the credentials, we can:
1. ✅ Create email templates in Novu dashboard
2. ✅ Update the email service to use Novu
3. ✅ Test the tenant invitation flow

## Template Structure
The system will use these Novu workflow templates:
- `tenant-admin-invitation` - For inviting tenant administrators
- `password-reset` - For password reset emails
- `welcome-email` - For welcome messages

## Configuration Validation
The system includes automatic validation that will warn you if credentials are missing or invalid.