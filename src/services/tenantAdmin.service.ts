/**
 * Tenant Admin Service
 * Handles all tenant administration operations including teacher management,
 * tenant settings, domain assignments, and user invitations
 */

import { supabase } from '@/integrations/supabase/client';
import { authService } from './auth.service';
import type {
  Tenant,
  UserTenantStatus,
  SubscriptionTier,
  AuthorizationError,
} from '@/types/auth.types';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface TeacherData {
  email: string;
  firstName: string;
  lastName: string;
  domains?: string[];
}

export interface Teacher {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: UserTenantStatus;
  domains: string[];
  created_at?: string;
  updated_at?: string;
}

export interface TeacherFilters {
  status?: UserTenantStatus;
  domainId?: string;
}

export interface TeacherStatistics {
  total_students: number;
  active_courses: number;
  completed_lessons: number;
  average_student_progress: number;
  last_active: string;
}

export interface TenantSettingsUpdate {
  name?: string;
  description?: string;
  settings?: Record<string, any>;
  max_users?: number;
  max_domains?: number;
}

export interface TenantUsageStatistics {
  total_users: number;
  max_users: number;
  total_domains: number;
  max_domains: number;
  active_teachers: number;
  active_students: number;
  storage_used_gb: number;
  storage_limit_gb: number;
}

export interface SubscriptionLimits {
  tier: SubscriptionTier;
  max_users: number;
  max_domains: number;
  max_storage_gb: number;
  features: string[];
}

export interface TenantDomain {
  domain_id: string;
  domain_name: string;
  is_active: boolean;
  teacher_count: number;
  student_count: number;
  max_teachers?: number;
  max_students?: number;
}

export interface DomainFilters {
  activeOnly?: boolean;
}

export interface DomainUsageStatistics {
  total_teachers: number;
  total_students: number;
  active_courses: number;
  completed_lessons: number;
  average_progress: number;
}

export interface InvitationData {
  email: string;
  firstName: string;
  lastName: string;
  domains?: string[];
  message?: string;
}

export interface Invitation {
  id: string;
  email: string;
  tenant_id: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  expires_at: string;
  created_at: string;
  updated_at?: string;
}

export interface InvitationStatistics {
  total_sent: number;
  pending: number;
  accepted: number;
  expired: number;
  cancelled: number;
  acceptance_rate: number;
}

export interface BulkAssignment {
  teacherId: string;
  domains: string[];
}

// Subscription tier limits
const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    tier: 'free',
    max_users: 10,
    max_domains: 1,
    max_storage_gb: 1,
    features: ['basic_features'],
  },
  basic: {
    tier: 'basic',
    max_users: 50,
    max_domains: 5,
    max_storage_gb: 10,
    features: ['basic_features', 'email_support'],
  },
  premium: {
    tier: 'premium',
    max_users: 500,
    max_domains: 20,
    max_storage_gb: 100,
    features: ['advanced_analytics', 'custom_branding', 'api_access', 'priority_support'],
  },
  enterprise: {
    tier: 'enterprise',
    max_users: -1, // Unlimited
    max_domains: -1, // Unlimited
    max_storage_gb: -1, // Unlimited
    features: ['all_features', 'dedicated_support', 'sla', 'custom_integrations'],
  },
};

// ============================================================
// SERVICE CLASS
// ============================================================

export class TenantAdminService {
  private static instance: TenantAdminService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): TenantAdminService {
    if (!TenantAdminService.instance) {
      TenantAdminService.instance = new TenantAdminService();
    }
    return TenantAdminService.instance;
  }

  // ============================================================
  // AUTHORIZATION HELPERS
  // ============================================================

  private async ensureTenantAdmin(): Promise<void> {
    const isTenantAdmin = await authService.isTenantAdmin();
    const hasPermission = await authService.hasPermission('tenants', 'update');
    
    if (!isTenantAdmin && !hasPermission) {
      throw new Error('Not authorized to perform this operation');
    }
  }

  private async ensureCanManageUsers(): Promise<void> {
    const isTenantAdmin = await authService.isTenantAdmin();
    const hasPermission = await authService.hasPermission('users', 'create');
    
    if (!isTenantAdmin && !hasPermission) {
      throw new Error('Not authorized to manage users');
    }
  }

  private async ensureCanManageDomains(): Promise<void> {
    const isTenantAdmin = await authService.isTenantAdmin();
    const hasPermission = await authService.hasPermission('domains', 'assign');
    
    if (!isTenantAdmin && !hasPermission) {
      throw new Error('Not authorized to manage domains');
    }
  }

  private getCurrentTenantId(): string {
    const tenantId = authService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('No tenant context available');
    }
    return tenantId;
  }

  // ============================================================
  // TEACHER MANAGEMENT
  // ============================================================

  /**
   * Create a new teacher account
   */
  async createTeacher(teacherData: TeacherData): Promise<Teacher> {
    await this.ensureCanManageUsers();
    
    // Validate input
    if (!teacherData.email || !teacherData.email.includes('@')) {
      throw new Error('Invalid teacher data');
    }
    if (!teacherData.firstName || !teacherData.lastName) {
      throw new Error('Invalid teacher data');
    }

    const tenantId = this.getCurrentTenantId();

    try {
      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: teacherData.email,
          first_name: teacherData.firstName,
          last_name: teacherData.lastName,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Get teacher role ID
      const { data: role, error: roleError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('name', 'teacher')
        .single();

      if (roleError) throw new Error('Teacher role not found');

      // Assign teacher to tenant
      const { error: assignError } = await supabase
        .from('user_tenants')
        .upsert({
          user_id: profile.user_id,
          tenant_id: tenantId,
          role_id: role.id,
          status: 'active',
          joined_at: new Date().toISOString(),
        });

      if (assignError) throw assignError;

      // Assign domains if provided
      if (teacherData.domains && teacherData.domains.length > 0) {
        await this.assignTeacherToDomains(profile.user_id, teacherData.domains);
      }

      // Log the action
      await authService.createAuditLog(
        'teacher.create',
        'users',
        profile.user_id,
        { email: teacherData.email, domains: teacherData.domains }
      );

      return {
        user_id: profile.user_id,
        email: teacherData.email,
        first_name: teacherData.firstName,
        last_name: teacherData.lastName,
        status: 'active',
        domains: teacherData.domains || [],
      };
    } catch (error: any) {
      if (error.message?.includes('Duplicate')) {
        throw new Error('Duplicate email');
      }
      throw error;
    }
  }

  /**
   * Assign teacher to domains
   */
  async assignTeacherToDomains(teacherId: string, domainIds: string[]): Promise<boolean> {
    await this.ensureCanManageDomains();
    
    const tenantId = this.getCurrentTenantId();

    // Get current assignments
    const { data: currentAssignments, error: fetchError } = await supabase
      .from('user_domains')
      .select('domain_id')
      .eq('user_id', teacherId)
      .eq('tenant_id', tenantId);

    if (fetchError) throw fetchError;

    const currentDomainIds = currentAssignments?.map(a => a.domain_id) || [];
    
    // Determine domains to add and remove
    const domainsToAdd = domainIds.filter(id => !currentDomainIds.includes(id));
    const domainsToRemove = currentDomainIds.filter(id => !domainIds.includes(id));

    // Remove domains
    if (domainsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('user_domains')
        .delete()
        .eq('user_id', teacherId)
        .in('domain_id', domainsToRemove);

      if (deleteError) throw deleteError;
    }

    // Add new domains
    if (domainsToAdd.length > 0) {
      const assignments = domainsToAdd.map(domainId => ({
        user_id: teacherId,
        domain_id: domainId,
        tenant_id: tenantId,
      }));

      const { error: insertError } = await supabase
        .from('user_domains')
        .insert(assignments);

      if (insertError) throw insertError;
    }

    // Log the action
    await authService.createAuditLog(
      'teacher.assign_domains',
      'users',
      teacherId,
      { domains: domainIds }
    );

    return true;
  }

  /**
   * Suspend a teacher account
   */
  async suspendTeacher(teacherId: string): Promise<boolean> {
    await this.ensureCanManageUsers();
    
    const tenantId = this.getCurrentTenantId();

    const { error } = await supabase
      .from('user_tenants')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', teacherId)
      .eq('tenant_id', tenantId);

    if (error) throw error;

    await authService.createAuditLog(
      'teacher.suspend',
      'users',
      teacherId,
      { status: 'suspended' }
    );

    return true;
  }

  /**
   * Reactivate a suspended teacher account
   */
  async reactivateTeacher(teacherId: string): Promise<boolean> {
    await this.ensureCanManageUsers();
    
    const tenantId = this.getCurrentTenantId();

    const { error } = await supabase
      .from('user_tenants')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', teacherId)
      .eq('tenant_id', tenantId);

    if (error) throw error;

    await authService.createAuditLog(
      'teacher.reactivate',
      'users',
      teacherId,
      { status: 'active' }
    );

    return true;
  }

  /**
   * Get all teachers in the tenant
   */
  async getTeachers(filters?: TeacherFilters): Promise<Teacher[]> {
    const hasPermission = await authService.hasPermission('users', 'read');
    if (!hasPermission) {
      throw new Error('Not authorized to view teachers');
    }

    const tenantId = this.getCurrentTenantId();

    const params: any = { p_tenant_id: tenantId };
    if (filters?.status) params.p_status = filters.status;
    if (filters?.domainId) params.p_domain_id = filters.domainId;

    const { data, error } = await supabase
      .rpc('get_tenant_teachers', params);

    if (error) throw error;

    return data || [];
  }

  /**
   * Get teacher statistics
   */
  async getTeacherStatistics(teacherId: string): Promise<TeacherStatistics> {
    const tenantId = this.getCurrentTenantId();

    const { data, error } = await supabase
      .rpc('get_teacher_statistics', {
        p_teacher_id: teacherId,
        p_tenant_id: tenantId,
      });

    if (error) throw error;

    return data;
  }

  // ============================================================
  // TENANT SETTINGS MANAGEMENT
  // ============================================================

  /**
   * Update tenant settings
   */
  async updateTenantSettings(updates: TenantSettingsUpdate): Promise<Tenant> {
    const isTenantAdmin = await authService.isTenantAdmin();
    if (!isTenantAdmin) {
      throw new Error('Not authorized to update tenant settings');
    }

    const tenantId = this.getCurrentTenantId();

    // Validate subscription limits if updating max_users or max_domains
    if (updates.max_users || updates.max_domains) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('subscription_tier')
        .eq('id', tenantId)
        .single();

      if (tenant) {
        const limits = SUBSCRIPTION_LIMITS[tenant.subscription_tier];
        
        if (updates.max_users && limits.max_users !== -1 && updates.max_users > limits.max_users) {
          throw new Error('Exceeds subscription tier limits');
        }
        
        if (updates.max_domains && limits.max_domains !== -1 && updates.max_domains > limits.max_domains) {
          throw new Error('Exceeds subscription tier limits');
        }
      }
    }

    const { data, error } = await supabase
      .from('tenants')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw error;

    await authService.createAuditLog(
      'tenant.update_settings',
      'tenants',
      tenantId,
      updates
    );

    return data;
  }

  /**
   * Get tenant settings
   */
  async getTenantSettings(): Promise<Tenant> {
    const tenantId = this.getCurrentTenantId();

    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Get tenant usage statistics
   */
  async getTenantUsageStatistics(): Promise<TenantUsageStatistics> {
    const tenantId = this.getCurrentTenantId();

    const { data, error } = await supabase
      .rpc('get_tenant_usage_statistics', {
        p_tenant_id: tenantId,
      });

    if (error) throw error;

    return data;
  }

  /**
   * Get subscription limits
   */
  async getSubscriptionLimits(): Promise<SubscriptionLimits> {
    const tenantId = this.getCurrentTenantId();

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('subscription_tier')
      .eq('id', tenantId)
      .single();

    if (error) throw error;

    return SUBSCRIPTION_LIMITS[tenant.subscription_tier];
  }

  // ============================================================
  // DOMAIN ASSIGNMENT
  // ============================================================

  /**
   * Enable a domain for the tenant
   */
  async enableDomainForTenant(domainId: string): Promise<boolean> {
    await this.ensureCanManageDomains();
    
    const tenantId = this.getCurrentTenantId();

    // Check domain limit
    const usage = await this.getTenantUsageStatistics();
    if (usage.max_domains !== -1 && usage.total_domains >= usage.max_domains) {
      throw new Error('Domain limit reached for tenant');
    }

    // Check if domain already exists
    const { data: existing } = await supabase
      .from('tenant_domains')
      .select('is_active')
      .eq('tenant_id', tenantId)
      .eq('domain_id', domainId)
      .single();

    if (existing) {
      // Reactivate if disabled
      if (!existing.is_active) {
        const { error } = await supabase
          .from('tenant_domains')
          .update({
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('tenant_id', tenantId)
          .eq('domain_id', domainId)
          .select()
          .single();

        if (error) throw error;
      }
    } else {
      // Create new domain assignment
      const { error } = await supabase
        .from('tenant_domains')
        .insert({
          tenant_id: tenantId,
          domain_id: domainId,
          is_active: true,
          max_teachers: 10,
          max_students: 100,
        })
        .select()
        .single();

      if (error) throw error;
    }

    await authService.createAuditLog(
      'domain.enable',
      'domains',
      domainId,
      { tenant_id: tenantId, is_active: true }
    );

    return true;
  }

  /**
   * Disable a domain for the tenant
   */
  async disableDomainForTenant(domainId: string): Promise<boolean> {
    await this.ensureCanManageDomains();
    
    const tenantId = this.getCurrentTenantId();

    const { error } = await supabase
      .from('tenant_domains')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .eq('domain_id', domainId)
      .select()
      .single();

    if (error) throw error;

    await authService.createAuditLog(
      'domain.disable',
      'domains',
      domainId,
      { tenant_id: tenantId, is_active: false }
    );

    return true;
  }

  /**
   * Get all domains for the tenant
   */
  async getTenantDomains(filters?: DomainFilters): Promise<TenantDomain[]> {
    const tenantId = this.getCurrentTenantId();

    const params: any = { p_tenant_id: tenantId };
    if (filters?.activeOnly) params.p_active_only = true;

    const { data, error } = await supabase
      .rpc('get_tenant_domains', params);

    if (error) throw error;

    return data || [];
  }

  /**
   * Get domain usage statistics
   */
  async getDomainUsageStatistics(domainId: string): Promise<DomainUsageStatistics> {
    const tenantId = this.getCurrentTenantId();

    const { data, error } = await supabase
      .rpc('get_domain_usage_statistics', {
        p_domain_id: domainId,
        p_tenant_id: tenantId,
      });

    if (error) throw error;

    return data;
  }

  // ============================================================
  // USER INVITATION SYSTEM
  // ============================================================

  /**
   * Send teacher invitation
   */
  async sendTeacherInvitation(invitationData: InvitationData): Promise<Invitation> {
    await this.ensureCanManageUsers();
    
    const tenantId = this.getCurrentTenantId();

    // Check for existing pending invitation
    const { data: existing } = await supabase
      .from('invitations')
      .select('status')
      .eq('email', invitationData.email)
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .single();

    if (existing) {
      throw new Error('User already has a pending invitation');
    }

    // Create invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        email: invitationData.email,
        tenant_id: tenantId,
        role: 'teacher',
        status: 'pending',
        token: crypto.randomUUID(),
        expires_at: expiresAt.toISOString(),
        metadata: {
          first_name: invitationData.firstName,
          last_name: invitationData.lastName,
          domains: invitationData.domains,
          message: invitationData.message,
        },
      })
      .select()
      .single();

    if (inviteError) throw inviteError;

    // Send email (using RPC function)
    const { error: emailError } = await supabase
      .rpc('send_invitation_email', {
        p_invitation_id: invitation.id,
      });

    if (emailError) {
      console.error('Failed to send invitation email:', emailError);
    }

    await authService.createAuditLog(
      'invitation.send',
      'invitations',
      invitation.id,
      { email: invitationData.email, role: 'teacher' }
    );

    return invitation;
  }

  /**
   * Resend invitation
   */
  async resendInvitation(invitationId: string): Promise<boolean> {
    await this.ensureCanManageUsers();

    // Check invitation status
    const { data: invitation } = await supabase
      .from('invitations')
      .select('status')
      .eq('id', invitationId)
      .single();

    if (!invitation) throw new Error('Invitation not found');
    if (invitation.status === 'accepted') {
      throw new Error('Invitation has already been accepted');
    }

    // Update expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Resend email
    const { error: emailError } = await supabase
      .rpc('send_invitation_email', {
        p_invitation_id: invitationId,
      });

    if (emailError) {
      console.error('Failed to resend invitation email:', emailError);
    }

    await authService.createAuditLog(
      'invitation.resend',
      'invitations',
      invitationId,
      null
    );

    return true;
  }

  /**
   * Cancel invitation
   */
  async cancelInvitation(invitationId: string): Promise<boolean> {
    await this.ensureCanManageUsers();

    const { error } = await supabase
      .from('invitations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId)
      .select()
      .single();

    if (error) throw error;

    await authService.createAuditLog(
      'invitation.cancel',
      'invitations',
      invitationId,
      { status: 'cancelled' }
    );

    return true;
  }

  /**
   * Get pending invitations
   */
  async getPendingInvitations(): Promise<Invitation[]> {
    const tenantId = this.getCurrentTenantId();

    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  }

  /**
   * Get invitation statistics
   */
  async getInvitationStatistics(): Promise<InvitationStatistics> {
    const tenantId = this.getCurrentTenantId();

    const { data, error } = await supabase
      .rpc('get_invitation_statistics', {
        p_tenant_id: tenantId,
      });

    if (error) throw error;

    return data;
  }

  // ============================================================
  // BULK OPERATIONS
  // ============================================================

  /**
   * Bulk suspend teachers
   */
  async bulkSuspendTeachers(teacherIds: string[]): Promise<boolean> {
    await this.ensureCanManageUsers();
    
    const tenantId = this.getCurrentTenantId();

    const { error } = await supabase
      .from('user_tenants')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .in('user_id', teacherIds);

    if (error) throw error;

    await authService.createAuditLog(
      'teacher.bulk_suspend',
      'users',
      null,
      { teacher_ids: teacherIds }
    );

    return true;
  }

  /**
   * Bulk assign domains to teachers
   */
  async bulkAssignDomains(assignments: BulkAssignment[]): Promise<boolean> {
    await this.ensureCanManageDomains();

    for (const assignment of assignments) {
      await this.assignTeacherToDomains(assignment.teacherId, assignment.domains);
    }

    await authService.createAuditLog(
      'teacher.bulk_assign_domains',
      'users',
      null,
      { assignments }
    );

    return true;
  }
}

// Export singleton instance
export const tenantAdminService = TenantAdminService.getInstance();