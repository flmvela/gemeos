/**
 * Security Configuration for Access Control
 * Defines security policies and constraints for the Gemeos platform
 */

export interface SecurityPolicy {
  enabled: boolean;
  config: Record<string, any>;
}

export const SECURITY_POLICIES = {
  /**
   * Platform Admin Security Policies
   */
  platformAdmin: {
    // Require two-factor authentication
    require2FA: {
      enabled: true,
      config: {
        methods: ['totp', 'sms'],
        gracePeriodDays: 7
      }
    },
    
    // Session timeout configuration
    sessionTimeout: {
      enabled: true,
      config: {
        inactivityMinutes: 30,
        absoluteHours: 8,
        warningMinutes: 5
      }
    },
    
    // IP restriction policies
    ipRestrictions: {
      enabled: false, // Enable in production
      config: {
        allowedIPs: [],
        allowedCIDRs: [],
        blockVPN: true,
        blockTor: true
      }
    },
    
    // Audit all actions
    auditLogging: {
      enabled: true,
      config: {
        logLevel: 'verbose',
        includeRequestBody: true,
        includeResponseBody: false,
        sensitiveFieldMasking: true
      }
    },
    
    // Rate limiting for admin actions
    rateLimiting: {
      enabled: true,
      config: {
        maxRequestsPerMinute: 60,
        maxWriteOperationsPerMinute: 20,
        maxBulkOperationsPerHour: 100
      }
    }
  },

  /**
   * General User Security Policies
   */
  generalUsers: {
    // Password policies
    passwordPolicy: {
      enabled: true,
      config: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventReuse: 5,
        expiryDays: 90
      }
    },
    
    // Session management
    sessionTimeout: {
      enabled: true,
      config: {
        inactivityMinutes: 120,
        absoluteHours: 24,
        warningMinutes: 10
      }
    },
    
    // Failed login attempts
    loginAttempts: {
      enabled: true,
      config: {
        maxAttempts: 5,
        lockoutMinutes: 30,
        resetAfterHours: 24
      }
    },
    
    // Basic audit logging
    auditLogging: {
      enabled: true,
      config: {
        logLevel: 'standard',
        includeRequestBody: false,
        includeResponseBody: false,
        sensitiveFieldMasking: true
      }
    }
  },

  /**
   * API Security Policies
   */
  api: {
    // CORS configuration
    cors: {
      enabled: true,
      config: {
        allowedOrigins: process.env.NODE_ENV === 'production' 
          ? ['https://gemeos.com', 'https://app.gemeos.com']
          : ['http://localhost:3000', 'http://localhost:5173'],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        maxAge: 86400
      }
    },
    
    // API rate limiting
    rateLimiting: {
      enabled: true,
      config: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Max requests per window
        standardHeaders: true,
        legacyHeaders: false
      }
    },
    
    // Request validation
    requestValidation: {
      enabled: true,
      config: {
        maxBodySize: '10mb',
        maxUrlLength: 2048,
        rejectUnknownParams: true,
        sanitizeInput: true
      }
    }
  },

  /**
   * Data Security Policies
   */
  data: {
    // Encryption at rest
    encryptionAtRest: {
      enabled: true,
      config: {
        algorithm: 'AES-256-GCM',
        keyRotationDays: 90
      }
    },
    
    // Data masking for sensitive fields
    dataMasking: {
      enabled: true,
      config: {
        fields: ['ssn', 'credit_card', 'bank_account', 'api_key', 'password'],
        maskPattern: '****',
        showLastChars: 4
      }
    },
    
    // PII handling
    piiProtection: {
      enabled: true,
      config: {
        anonymizeAfterDays: 365,
        requireConsent: true,
        allowExport: false,
        auditAccess: true
      }
    }
  },

  /**
   * Tenant Isolation Policies
   */
  tenantIsolation: {
    // Strict tenant boundary enforcement
    strictIsolation: {
      enabled: true,
      config: {
        validateAllQueries: true,
        preventCrossTenantReferences: true,
        isolateCache: true,
        isolateStorage: true
      }
    },
    
    // Tenant-specific rate limiting
    tenantRateLimiting: {
      enabled: true,
      config: {
        free: {
          requestsPerMinute: 60,
          storageGB: 1,
          usersMax: 10
        },
        basic: {
          requestsPerMinute: 120,
          storageGB: 10,
          usersMax: 50
        },
        premium: {
          requestsPerMinute: 300,
          storageGB: 100,
          usersMax: 200
        },
        enterprise: {
          requestsPerMinute: 1000,
          storageGB: 1000,
          usersMax: -1 // Unlimited
        }
      }
    }
  }
};

/**
 * Security Headers Configuration
 */
export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.gemeos.com wss://api.gemeos.com",
    "frame-ancestors 'none'"
  ].join('; ')
};

/**
 * Sensitive Operations requiring additional verification
 */
export const SENSITIVE_OPERATIONS = [
  'user.delete',
  'tenant.delete',
  'permission.grant',
  'permission.revoke',
  'domain.delete',
  'ai_training.execute',
  'data.export',
  'data.bulk_delete'
];

/**
 * Helper function to check if an operation is sensitive
 */
export function isSensitiveOperation(resource: string, action: string): boolean {
  const operation = `${resource}.${action}`;
  return SENSITIVE_OPERATIONS.includes(operation);
}

/**
 * Helper function to get security policy for a user role
 */
export function getSecurityPolicyForRole(role: string): Record<string, SecurityPolicy> {
  if (role === 'platform_admin') {
    return SECURITY_POLICIES.platformAdmin;
  }
  return SECURITY_POLICIES.generalUsers;
}

/**
 * Helper function to validate security requirements
 */
export function validateSecurityRequirements(
  user: { role: string; has2FA?: boolean },
  resource: string,
  action: string
): { valid: boolean; reason?: string } {
  // Check if operation is sensitive
  if (isSensitiveOperation(resource, action)) {
    // Require 2FA for sensitive operations
    if (!user.has2FA) {
      return { 
        valid: false, 
        reason: 'Two-factor authentication required for this operation' 
      };
    }
  }

  // Platform admin specific checks
  if (user.role === 'platform_admin') {
    const policies = SECURITY_POLICIES.platformAdmin;
    
    if (policies.require2FA.enabled && !user.has2FA) {
      return { 
        valid: false, 
        reason: 'Platform administrators must enable two-factor authentication' 
      };
    }
  }

  return { valid: true };
}

export default {
  SECURITY_POLICIES,
  SECURITY_HEADERS,
  SENSITIVE_OPERATIONS,
  isSensitiveOperation,
  getSecurityPolicyForRole,
  validateSecurityRequirements
};