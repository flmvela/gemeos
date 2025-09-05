/**
 * Novu Configuration
 * Handles Novu API credentials and configuration for email notifications
 */

// Helper to get environment variables from both Node.js and Vite contexts
function getEnvVar(key: string): string | undefined {
  // Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  
  // Vite environment (browser/dev)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  
  return undefined;
}

export const novuConfig = {
  // API Key from environment variables
  apiKey: getEnvVar('NOVU_API_KEY'),
  
  // Application Identifier from environment variables
  applicationIdentifier: getEnvVar('NOVU_APPLICATION_IDENTIFIER'),
  
  // Base URL for Novu API (usually not needed to change)
  baseURL: getEnvVar('NOVU_BASE_URL') || 'https://api.novu.co',
  
  // Template identifiers - these will be created in Novu dashboard
  templates: {
    tenantAdminInvitation: 'tenant-admin-invitation',
    passwordReset: 'password-reset',
    welcome: 'welcome-email',
  },
  
  // Default configuration
  defaults: {
    from: {
      name: getEnvVar('DEFAULT_FROM_NAME') || 'Gemeos',
      email: getEnvVar('DEFAULT_FROM_EMAIL') || 'noreply@gemeos.ai',
    },
  },
};

/**
 * Validates that all required Novu configuration is present
 */
export function validateNovuConfig(): { isValid: boolean; missingFields: string[] } {
  const requiredFields = [
    { key: 'apiKey', value: novuConfig.apiKey },
    { key: 'applicationIdentifier', value: novuConfig.applicationIdentifier },
  ];
  
  const missingFields = requiredFields
    .filter(field => !field.value || field.value.includes('your_'))
    .map(field => field.key);
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Gets Novu configuration with error handling
 */
export function getNovuConfig() {
  const validation = validateNovuConfig();
  
  if (!validation.isValid) {
    console.warn('⚠️ Novu configuration incomplete. Missing fields:', validation.missingFields);
    console.warn('Please check your environment variables: NOVU_API_KEY, NOVU_APPLICATION_IDENTIFIER');
  }
  
  return {
    ...novuConfig,
    isConfigured: validation.isValid,
    validation,
  };
}