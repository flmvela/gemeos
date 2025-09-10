/**
 * Enhanced Authorization Service
 * Advanced permission checking with attribute-based access control
 */

import { supabase } from '@/integrations/supabase/client';

// Types
export interface AuthorizationContext {
  userId: string;
  tenantId?: string;
  role?: string;
  attributes?: Record<string, any>;
}

export interface ResourceContext {
  resourceType: string;
  resourceId?: string;
  ownerId?: string;
  tenantId?: string;
  status?: string;
  attributes?: Record<string, any>;
}

export interface PolicyRule {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  conditions: PolicyCondition[];
  effect: 'allow' | 'deny';
  priority: number;
}

export interface PolicyCondition {
  type: 'user' | 'role' | 'attribute' | 'time' | 'resource';
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  field: string;
  value: any;
}

export interface EvaluationResult {
  allowed: boolean;
  reason?: string;
  appliedPolicies?: string[];
  deniedBy?: string;
  context?: Record<string, any>;
}

/**
 * Enhanced Authorization Service
 */
export class EnhancedAuthorizationService {
  private static instance: EnhancedAuthorizationService;
  private policyCache: Map<string, PolicyRule[]> = new Map();
  private evaluationCache: Map<string, EvaluationResult> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): EnhancedAuthorizationService {
    if (!EnhancedAuthorizationService.instance) {
      EnhancedAuthorizationService.instance = new EnhancedAuthorizationService();
    }
    return EnhancedAuthorizationService.instance;
  }

  /**
   * Evaluate authorization with advanced policy engine
   */
  async evaluate(
    authContext: AuthorizationContext,
    resourceContext: ResourceContext,
    action: string
  ): Promise<EvaluationResult> {
    // Check platform admin bypass
    if (await this.isPlatformAdmin(authContext.userId)) {
      return {
        allowed: true,
        reason: 'Platform administrator has universal access',
        appliedPolicies: ['platform_admin_bypass'],
      };
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(authContext, resourceContext, action);
    
    // Check cache
    const cached = this.evaluationCache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    // Get applicable policies
    const policies = await this.getApplicablePolicies(
      resourceContext.resourceType,
      action,
      authContext.role
    );

    // Sort policies by priority (lower number = higher priority)
    policies.sort((a, b) => a.priority - b.priority);

    // Evaluate policies
    const result = await this.evaluatePolicies(
      policies,
      authContext,
      resourceContext
    );

    // Cache the result
    this.evaluationCache.set(cacheKey, {
      ...result,
      timestamp: Date.now(),
    } as any);

    return result;
  }

  /**
   * Evaluate multiple policies
   */
  private async evaluatePolicies(
    policies: PolicyRule[],
    authContext: AuthorizationContext,
    resourceContext: ResourceContext
  ): Promise<EvaluationResult> {
    const appliedPolicies: string[] = [];
    let finalResult = false;
    let deniedBy: string | undefined;
    let reason = 'No applicable policies found';

    for (const policy of policies) {
      const policyResult = await this.evaluatePolicy(
        policy,
        authContext,
        resourceContext
      );

      if (policyResult) {
        appliedPolicies.push(policy.name);

        if (policy.effect === 'deny') {
          // Explicit deny overrides everything
          return {
            allowed: false,
            reason: `Explicitly denied by policy: ${policy.name}`,
            deniedBy: policy.name,
            appliedPolicies,
          };
        } else if (policy.effect === 'allow') {
          finalResult = true;
          reason = `Allowed by policy: ${policy.name}`;
        }
      }
    }

    return {
      allowed: finalResult,
      reason,
      appliedPolicies,
      deniedBy,
    };
  }

  /**
   * Evaluate a single policy
   */
  private async evaluatePolicy(
    policy: PolicyRule,
    authContext: AuthorizationContext,
    resourceContext: ResourceContext
  ): Promise<boolean> {
    // All conditions must be met for the policy to apply
    for (const condition of policy.conditions) {
      const conditionMet = await this.evaluateCondition(
        condition,
        authContext,
        resourceContext
      );

      if (!conditionMet) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    condition: PolicyCondition,
    authContext: AuthorizationContext,
    resourceContext: ResourceContext
  ): Promise<boolean> {
    let actualValue: any;
    let targetValue = condition.value;

    // Get the actual value based on condition type
    switch (condition.type) {
      case 'user':
        actualValue = authContext.userId;
        break;
      
      case 'role':
        actualValue = authContext.role;
        break;
      
      case 'attribute':
        if (condition.field.startsWith('user.')) {
          const field = condition.field.substring(5);
          actualValue = authContext.attributes?.[field];
        } else if (condition.field.startsWith('resource.')) {
          const field = condition.field.substring(9);
          actualValue = resourceContext.attributes?.[field];
        }
        break;
      
      case 'resource':
        switch (condition.field) {
          case 'owner':
            actualValue = resourceContext.ownerId;
            break;
          case 'tenant':
            actualValue = resourceContext.tenantId;
            break;
          case 'status':
            actualValue = resourceContext.status;
            break;
          default:
            actualValue = resourceContext.attributes?.[condition.field];
        }
        break;
      
      case 'time':
        actualValue = new Date();
        targetValue = new Date(targetValue);
        break;
    }

    // Evaluate based on operator
    switch (condition.operator) {
      case 'equals':
        return actualValue === targetValue;
      
      case 'not_equals':
        return actualValue !== targetValue;
      
      case 'contains':
        return String(actualValue).includes(String(targetValue));
      
      case 'in':
        return Array.isArray(targetValue) && targetValue.includes(actualValue);
      
      case 'not_in':
        return Array.isArray(targetValue) && !targetValue.includes(actualValue);
      
      case 'greater_than':
        return actualValue > targetValue;
      
      case 'less_than':
        return actualValue < targetValue;
      
      default:
        return false;
    }
  }

  /**
   * Get applicable policies for a resource and action
   */
  private async getApplicablePolicies(
    resourceType: string,
    action: string,
    role?: string
  ): Promise<PolicyRule[]> {
    const cacheKey = `policies:${resourceType}:${action}:${role || 'any'}`;
    
    // Check cache
    const cached = this.policyCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const { data: dynamicPermissions } = await supabase
      .from('dynamic_permissions')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('action_code', action)
      .eq('is_active', true);

    // Convert to PolicyRule format
    const policies: PolicyRule[] = dynamicPermissions?.map(dp => ({
      id: dp.id,
      name: `${dp.resource_type}_${dp.action_code}_${dp.role_id}`,
      resource: dp.resource_type,
      action: dp.action_code,
      conditions: this.parseConditions(dp.conditions),
      effect: 'allow' as const,
      priority: dp.priority || 100,
    })) || [];

    // Cache the policies
    this.policyCache.set(cacheKey, policies);

    return policies;
  }

  /**
   * Parse conditions from JSONB
   */
  private parseConditions(conditions: any): PolicyCondition[] {
    if (!conditions) return [];

    const parsed: PolicyCondition[] = [];

    for (const [key, value] of Object.entries(conditions)) {
      if (key === 'tenant_id') {
        parsed.push({
          type: 'attribute',
          operator: 'equals',
          field: 'user.tenant_id',
          value,
        });
      } else if (key === 'owner_id') {
        if (value === '$current_user') {
          parsed.push({
            type: 'resource',
            operator: 'equals',
            field: 'owner',
            value: '$user_id', // Will be replaced with actual user ID
          });
        } else {
          parsed.push({
            type: 'resource',
            operator: 'equals',
            field: 'owner',
            value,
          });
        }
      } else if (key === 'status' && Array.isArray(value)) {
        parsed.push({
          type: 'resource',
          operator: 'in',
          field: 'status',
          value,
        });
      }
    }

    return parsed;
  }

  /**
   * Check if user is platform admin
   */
  private async isPlatformAdmin(userId: string): Promise<boolean> {
    const { data } = await supabase
      .rpc('auth_is_platform_admin');
    
    return data === true;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(
    authContext: AuthorizationContext,
    resourceContext: ResourceContext,
    action: string
  ): string {
    return `${authContext.userId}:${authContext.tenantId || 'none'}:${resourceContext.resourceType}:${resourceContext.resourceId || 'any'}:${action}`;
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(entry: any): boolean {
    return entry.timestamp && (Date.now() - entry.timestamp) < this.CACHE_TTL;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.policyCache.clear();
    this.evaluationCache.clear();
  }

  /**
   * Attribute-based access control helpers
   */
  
  /**
   * Check time-based access
   */
  async checkTimeBasedAccess(
    startTime?: string,
    endTime?: string
  ): Promise<boolean> {
    if (!startTime || !endTime) return true;

    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    return now >= start && now <= end;
  }

  /**
   * Check IP-based access
   */
  async checkIPBasedAccess(
    allowedIPs?: string[],
    currentIP?: string
  ): Promise<boolean> {
    if (!allowedIPs || allowedIPs.length === 0) return true;
    if (!currentIP) return false;

    return allowedIPs.includes(currentIP);
  }

  /**
   * Check location-based access
   */
  async checkLocationBasedAccess(
    allowedCountries?: string[],
    currentCountry?: string
  ): Promise<boolean> {
    if (!allowedCountries || allowedCountries.length === 0) return true;
    if (!currentCountry) return false;

    return allowedCountries.includes(currentCountry);
  }

  /**
   * Check quota-based access
   */
  async checkQuotaBasedAccess(
    userId: string,
    resourceType: string,
    limit?: number
  ): Promise<boolean> {
    if (!limit) return true;

    // Count user's current resources
    const { count } = await supabase
      .from('resource_instances')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('resource_type', resourceType);

    return (count || 0) < limit;
  }

  /**
   * Delegated access check
   */
  async checkDelegatedAccess(
    delegatorId: string,
    delegateeId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    // Check if delegator has granted access to delegatee
    const { data } = await supabase
      .from('delegated_permissions')
      .select('*')
      .eq('delegator_id', delegatorId)
      .eq('delegatee_id', delegateeId)
      .eq('resource', resource)
      .eq('action', action)
      .single();

    return !!data;
  }
}

// Export singleton instance
export const enhancedAuthService = EnhancedAuthorizationService.getInstance();