/**
 * Authentication and Authorization Service
 * Handles multi-tenant RBAC operations
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  Tenant, 
  Role, 
  UserTenant, 
  Permission,
  SystemRole,
  UserTenantsWithRoles,
  CreateTenantInput,
  InviteUserInput,
  AssignRoleInput,
  CheckPermissionInput,
  AuthSession,
  UserTenantWithDetails,
  TenantContext,
  PermissionResource,
  PermissionAction,
  AuthorizationError
} from '@/types/auth.types';

export class AuthService {
  private static instance: AuthService;
  private currentTenantId: string | null = null;
  private cachedPermissions: Map<string, Permission[]> = new Map();
  private sessionCache: AuthSession | null = null;
  private sessionCacheTime: number = 0;
  private sessionPromise: Promise<AuthSession | null> | null = null;
  private readonly CACHE_DURATION = 5000; // 5 seconds cache

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // ============================================================
  // USER & SESSION MANAGEMENT
  // ============================================================

  /**
   * Get current user session with tenant information
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    console.log('🔍 getCurrentSession: Starting...');
    
    // Check cache first
    const now = Date.now();
    if (this.sessionCache && (now - this.sessionCacheTime) < this.CACHE_DURATION) {
      console.log('🔍 getCurrentSession: Returning cached session');
      return this.sessionCache;
    }
    
    // If there's an ongoing request, wait for it
    if (this.sessionPromise) {
      console.log('🔍 getCurrentSession: Waiting for existing request...');
      return this.sessionPromise;
    }
    
    // Start new request with deduplication
    this.sessionPromise = this.fetchCurrentSession();
    
    try {
      const result = await this.sessionPromise;
      // Cache the result
      this.sessionCache = result;
      this.sessionCacheTime = Date.now();
      return result;
    } finally {
      // Clear the promise after completion
      this.sessionPromise = null;
    }
  }
  
  // Keep track of last good session to avoid forced logouts on transient errors
  private lastGoodSession: AuthSession | null = null;

  /**
   * Internal method to actually fetch the session
   */
  private async fetchCurrentSession(): Promise<AuthSession | null> {
    try {
      console.log('🔍 fetchCurrentSession: Getting session from Supabase...');
      
      // Single source of truth: Supabase - no aggressive timeouts
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('🔍 fetchCurrentSession: getSession error:', error);
        // Return last good session on transient errors instead of forcing logout
        return this.lastGoodSession;
      }
      
      console.log('🔍 fetchCurrentSession: getSession() completed successfully');
      const sessionResult = { data, error: null };
      
      const { session } = data;
      
      console.log('🔍 fetchCurrentSession: Session call completed, session exists:', !!session);
      
      if (!session?.user) {
        console.log('🔍 fetchCurrentSession: No session found');
        // Don't force null - return last good session if available
        return this.lastGoodSession;
      }
      
      const user = session.user;
      console.log('🔍 fetchCurrentSession: User received:', user?.email);
      
      // Fetch actual user tenants and roles from database
      console.log('🔍 getCurrentSession: Fetching user tenant associations...');
      
      let userTenants = null;
      let tenantsError = null;
      
      // Use simpler query without foreign key syntax
      const { data: basicTenants, error: basicError } = await supabase
        .from('user_tenants')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (basicError) {
        console.error('🔍 getCurrentSession: Error fetching user tenants:', basicError);
        tenantsError = basicError;
      } else {
        userTenants = basicTenants;
        
        // Fetch related data separately if we have user tenants
        if (userTenants && userTenants.length > 0) {
          for (const ut of userTenants) {
            // Fetch tenant info
            if (ut.tenant_id) {
              const { data: tenant } = await supabase
                .from('tenants')
                .select('*')
                .eq('id', ut.tenant_id)
                .single();
              ut.tenants = tenant;
            }
            
            // Fetch role info
            if (ut.role_id) {
              const { data: role } = await supabase
                .from('user_roles')
                .select('*')
                .eq('id', ut.role_id)
                .single();
              ut.user_roles = role;
            }
          }
        }
      }
      
      // Check if user is a platform admin
      // First check if there's a platform_admin role in user_roles
      let isPlatformAdmin = false;
      
      if (userTenants && userTenants.length > 0) {
        // Check if any of the user's roles is platform_admin
        isPlatformAdmin = userTenants.some(ut => 
          ut.user_roles?.name === 'platform_admin' || 
          ut.user_roles?.name === 'super_admin'
        );
      }
      
      // If no platform admin role found, check email against known admins
      // This is a fallback for the initial admin user
      if (!isPlatformAdmin && user.email === 'admin@gemeos.ai') {
        isPlatformAdmin = true;
      }
      
      // Find the primary tenant or use the first one
      const primaryTenant = userTenants?.find(ut => ut.is_primary) || userTenants?.[0];
      
      console.log('🔍 getCurrentSession: User tenants found:', userTenants?.length || 0);
      console.log('🔍 getCurrentSession: Is platform admin:', isPlatformAdmin);
      console.log('🔍 getCurrentSession: Primary tenant:', primaryTenant?.tenants?.name);
      
      // Build the session object
      const authSession: AuthSession = {
        user_id: user.id,
        email: user.email!,
        tenants: userTenants || [],
        current_tenant: primaryTenant ? {
          tenant_id: primaryTenant.tenant_id,
          role_id: primaryTenant.role_id,
          tenant: primaryTenant.tenants,
          role: primaryTenant.user_roles,
          is_primary: primaryTenant.is_primary
        } : null,
        is_platform_admin: isPlatformAdmin
      };
      
      // Save this as the last good session
      this.lastGoodSession = authSession;
      
      return authSession;
    } catch (error) {
      console.error('🔍 fetchCurrentSession: Error:', error);
      return null;
    }
  }
  
  /**
   * Clear the session cache - ONLY call on explicit logout
   */
  clearSessionCache(): void {
    console.log('🔍 Clearing session cache (logout)');
    this.sessionCache = null;
    this.sessionCacheTime = 0;
    this.sessionPromise = null;
    this.lastGoodSession = null; // Also clear last good session on logout
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    console.log('🔍 Logging out user');
    await supabase.auth.signOut();
    this.clearSessionCache();
  }

  /**
   * Switch to a different tenant
   */
  async switchTenant(tenantId: string): Promise<boolean> {
    const session = await this.getCurrentSession();
    if (!session) return false;

    const hasAccess = session.tenants.some(t => t.tenant_id === tenantId);
    if (!hasAccess) {
      throw new AuthorizationError('You do not have access to this tenant');
    }

    this.currentTenantId = tenantId;
    this.cachedPermissions.clear(); // Clear permission cache on tenant switch
    
    // Update localStorage or state management
    localStorage.setItem('current_tenant_id', tenantId);
    
    return true;
  }

  /**
   * Get current tenant ID
   */
  getCurrentTenantId(): string | null {
    return this.currentTenantId || localStorage.getItem('current_tenant_id');
  }

  // ============================================================
  // TENANT MANAGEMENT
  // ============================================================

  /**
   * Create a new tenant
   */
  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    const { data, error } = await supabase
      .from('tenants')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get tenant by ID
   */
  async getTenant(tenantId: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error) {
      console.error('Error fetching tenant:', error);
      return null;
    }

    return data;
  }

  /**
   * Update tenant settings
   */
  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============================================================
  // USER & ROLE MANAGEMENT
  // ============================================================

  /**
   * Invite user to tenant
   */
  async inviteUser(input: InviteUserInput): Promise<void> {
    // First check if user exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', input.email)
      .single();

    if (existingUser) {
      // User exists, add to tenant
      await this.assignRoleToUser({
        user_id: existingUser.user_id,
        tenant_id: input.tenant_id,
        role: input.role
      });
    } else {
      // Send invitation email (implement with Supabase Auth invite)
      // This would typically involve creating an invitation record
      // and sending an email with a signup link
      const { error } = await supabase.auth.admin.inviteUserByEmail(input.email, {
        data: {
          tenant_id: input.tenant_id,
          role: input.role
        }
      });

      if (error) throw error;
    }
  }

  /**
   * Assign role to user in tenant
   */
  async assignRoleToUser(input: AssignRoleInput): Promise<void> {
    // Get role ID
    const { data: role } = await supabase
      .from('user_roles')
      .select('id')
      .eq('name', input.role)
      .single();

    if (!role) throw new Error(`Role ${input.role} not found`);

    const { error } = await supabase
      .from('user_tenants')
      .upsert({
        user_id: input.user_id,
        tenant_id: input.tenant_id,
        role_id: role.id,
        status: 'active',
        joined_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  /**
   * Remove user from tenant
   */
  async removeUserFromTenant(userId: string, tenantId: string): Promise<void> {
    const { error } = await supabase
      .from('user_tenants')
      .update({ status: 'inactive' })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  }

  // ============================================================
  // PERMISSION MANAGEMENT
  // ============================================================

  /**
   * Check if user has permission
   */
  async hasPermission(
    resource: PermissionResource | string, 
    action: PermissionAction | string
  ): Promise<boolean> {
    const session = await this.getCurrentSession();
    if (!session) return false;

    // Platform admins have all permissions
    if (session.is_platform_admin) return true;

    const tenantId = this.getCurrentTenantId();
    if (!tenantId) return false;

    const { data, error } = await supabase
      .rpc('user_has_permission', {
        p_user_id: session.user_id,
        p_tenant_id: tenantId,
        p_resource: resource,
        p_action: action
      });

    if (error) {
      console.error('Error checking permission:', error);
      return false;
    }

    return data || false;
  }

  /**
   * Get all permissions for current user in current tenant
   */
  async getUserPermissions(): Promise<Permission[]> {
    const session = await this.getCurrentSession();
    if (!session) return [];

    const tenantId = this.getCurrentTenantId();
    if (!tenantId) return [];

    // Check cache first
    const cacheKey = `${session.user_id}:${tenantId}`;
    if (this.cachedPermissions.has(cacheKey)) {
      return this.cachedPermissions.get(cacheKey)!;
    }

    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        permissions (
          id,
          resource,
          action,
          description
        )
      `)
      .eq('role_id', session.current_tenant?.role_id)
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`);

    if (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }

    const permissions = data?.flatMap(rp => rp.permissions).filter(Boolean) as Permission[] || [];
    
    // Cache permissions
    this.cachedPermissions.set(cacheKey, permissions);
    
    return permissions;
  }

  /**
   * Create tenant context for authorization checks
   */
  async getTenantContext(): Promise<TenantContext | null> {
    const session = await this.getCurrentSession();
    if (!session || !session.current_tenant) return null;

    const permissions = await this.getUserPermissions();

    return {
      tenant: session.current_tenant.tenant as Tenant,
      user_role: session.current_tenant.role as Role,
      permissions,
      can: (resource: PermissionResource, action: PermissionAction) => {
        return permissions.some(p => p.resource === resource && p.action === action);
      }
    };
  }

  // ============================================================
  // AUDIT LOGGING
  // ============================================================

  /**
   * Create audit log entry
   */
  async createAuditLog(
    action: string,
    resourceType: string,
    resourceId?: string,
    changes?: Record<string, any>
  ): Promise<void> {
    const tenantId = this.getCurrentTenantId();
    
    const { error } = await supabase
      .rpc('create_audit_log', {
        p_tenant_id: tenantId,
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_changes: changes
      });

    if (error) {
      console.error('Error creating audit log:', error);
    }
  }

  /**
   * Get audit logs for current tenant
   */
  async getAuditLogs(
    filters?: {
      resource_type?: string;
      user_id?: string;
      start_date?: Date;
      end_date?: Date;
    }
  ): Promise<any[]> {
    const tenantId = this.getCurrentTenantId();
    if (!tenantId) return [];

    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (filters?.resource_type) {
      query = query.eq('resource_type', filters.resource_type);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date.toISOString());
    }
    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date.toISOString());
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }

    return data || [];
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cachedPermissions.clear();
  }

  /**
   * Check if current user is platform admin
   */
  async isPlatformAdmin(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session?.is_platform_admin || false;
  }

  /**
   * Check if current user is tenant admin
   */
  async isTenantAdmin(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session?.current_tenant?.role.name === SystemRole.TENANT_ADMIN;
  }

  /**
   * Check if current user is teacher
   */
  async isTeacher(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session?.current_tenant?.role.name === SystemRole.TEACHER;
  }

  /**
   * Check if current user is student
   */
  async isStudent(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session?.current_tenant?.role.name === SystemRole.STUDENT;
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();