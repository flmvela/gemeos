/**
 * Enhanced Tenant Management Service
 * Provides high-performance tenant operations with real-time statistics
 * Target: <1.5 second response time for 100+ tenants
 */

import { supabase } from '@/integrations/supabase/client';
import { QueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface TenantWithStats {
  tenant_id: string;
  name: string;
  slug: string;
  description?: string;
  status: string;
  subscription_tier: string;
  settings: Record<string, any>;
  domain_count: number;
  teacher_count: number;
  student_count: number;
  admin_count: number;
  total_users: number;
  last_activity: string;
  created_at: string;
}

export interface TenantGridOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: 'name' | 'created_at' | 'domain_count' | 'teacher_count' | 'student_count' | 'last_activity';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TenantStatUpdate {
  tenant_id: string;
  domain_count?: number;
  teacher_count?: number;
  student_count?: number;
}

/**
 * Cache manager for tenant statistics
 */
class TenantStatsCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 30000; // 30 seconds

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
    } else {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    }
  }
}

export class EnhancedTenantService {
  private queryClient: QueryClient;
  private statsCache: TenantStatsCache;
  private realtimeChannel: RealtimeChannel | null = null;
  private statsUpdateQueue: Map<string, NodeJS.Timeout>;
  private updateCallbacks: Set<(update: TenantStatUpdate) => void>;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.statsCache = new TenantStatsCache();
    this.statsUpdateQueue = new Map();
    this.updateCallbacks = new Set();
    this.initializeRealtimeSubscription();
  }

  /**
   * Get paginated tenants with statistics
   * Optimized for <1.5s response time using materialized views
   */
  async getTenantsWithStats(
    options: TenantGridOptions = {}
  ): Promise<PaginatedResponse<TenantWithStats>> {
    const { 
      page = 1, 
      pageSize = 20, 
      search, 
      status,
      sortBy = 'name',
      sortOrder = 'asc' 
    } = options;

    // Check cache first
    const cacheKey = JSON.stringify(options);
    const cached = this.statsCache.get(cacheKey);
    if (cached) {
      console.log('Returning cached tenant stats');
      return cached;
    }

    try {
      // Use the optimized database function
      const { data, error } = await supabase.rpc('get_tenants_with_stats', {
        p_page: page,
        p_page_size: pageSize,
        p_search: search || null,
        p_status: status || null,
        p_sort_by: sortBy,
        p_sort_order: sortOrder
      });

      if (error) throw error;

      // Extract total count from first row (if exists)
      const total = data?.[0]?.total_count || 0;
      
      // Remove total_count from each row for cleaner data
      const cleanedData = (data || []).map(({ total_count, ...rest }) => rest);

      // If materialized view returns no results but we're on page 1, try fallback
      if (total === 0 && page === 1) {
        console.log('🔄 [TENANT-SERVICE] Materialized view returned 0 results, trying fallback query...');
        return this.getFallbackTenantList(options);
      }

      const result: PaginatedResponse<TenantWithStats> = {
        data: cleanedData as TenantWithStats[],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };

      // Cache the result
      this.statsCache.set(cacheKey, result);

      // Prefetch next page in background
      if (page * pageSize < total) {
        this.prefetchNextPage({ ...options, page: page + 1 });
      }

      return result;
    } catch (error) {
      console.error('❌ [TENANT-SERVICE] Error fetching tenants with stats:', error);
      
      // Fallback to basic tenant list if stats fail
      console.log('🔄 [TENANT-SERVICE] Using fallback query due to error...');
      return this.getFallbackTenantList(options);
    }
  }

  /**
   * Get single tenant with statistics
   */
  async getTenantWithStats(tenantId: string): Promise<TenantWithStats | null> {
    const cached = this.statsCache.get(`tenant-${tenantId}`);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('tenant_statistics')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      console.error('Error fetching tenant stats:', error);
      return null;
    }

    this.statsCache.set(`tenant-${tenantId}`, data);
    return data as TenantWithStats;
  }

  /**
   * Batch fetch statistics for multiple tenants
   * Used for real-time updates without full grid refresh
   */
  async batchFetchStatistics(
    tenantIds: string[]
  ): Promise<Map<string, TenantStatUpdate>> {
    if (tenantIds.length === 0) return new Map();

    const { data, error } = await supabase.rpc('batch_get_tenant_stats', {
      tenant_ids: tenantIds
    });

    if (error) {
      console.error('Error batch fetching stats:', error);
      return new Map();
    }

    return new Map(
      (data || []).map((stat: any) => [
        stat.tenant_id,
        {
          tenant_id: stat.tenant_id,
          domain_count: stat.domain_count,
          teacher_count: stat.teacher_count,
          student_count: stat.student_count
        }
      ])
    );
  }

  /**
   * Create tenant with wizard data
   */
  async createTenantWithWizardData(wizardData: {
    basic: {
      name: string;
      slug: string;
      description?: string;
      status: string;
      subscription_tier: string;
    };
    domains: {
      selectedDomainIds: string[];
      domainSettings: Map<string, { max_teachers: number; max_students: number }>;
    };
    limits: {
      global_max_teachers: number;
      global_max_students: number;
      enforce_limits: boolean;
    };
    admins: {
      invitations: Array<{
        email: string;
        role: string;
        sendImmediately: boolean;
      }>;
    };
    settings: {
      features: Record<string, boolean>;
      customization: Record<string, any>;
    };
  }) {
    console.log('🏗️ [QA-DB] Starting enhanced tenant creation service');
    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🏗️ [QA-DB] Current session:', session ? 'authenticated' : 'not authenticated');
      
      // Start a Supabase transaction
      console.log('🏗️ [QA-DB] Step 1: Creating tenant record');
      const tenantData = {
        name: wizardData.basic.name,
        slug: wizardData.basic.slug,
        description: wizardData.basic.description,
        status: wizardData.basic.status,
        subscription_tier: wizardData.basic.subscription_tier,
        max_users: wizardData.limits.global_max_teachers + wizardData.limits.global_max_students,
        settings: {
          ...wizardData.settings,
          limits: {
            max_teachers: wizardData.limits.global_max_teachers,
            max_students: wizardData.limits.global_max_students,
            enforce_limits: wizardData.limits.enforce_limits
          }
        }
      };
      
      console.log('🏗️ [QA-DB] Inserting tenant data:', tenantData);
      
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert(tenantData)
        .select()
        .single();
        
      console.log('🏗️ [QA-DB] Raw tenant creation result:', { tenant, tenantError });

      if (tenantError) throw tenantError;
      if (!tenant) throw new Error('Tenant creation succeeded but no tenant data returned');
      
      console.log('✅ [QA-DB] Step 1 completed: Tenant created', {
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug
      });

      // ✅ Grant the creator access to the new tenant via secure RPC (bypasses RLS safely)
      const { error: addCreatorErr } = await supabase.rpc('add_creator_to_tenant', {
        p_tenant_id: tenant.id,
        p_role_name: 'tenant_admin'
      });

      if (addCreatorErr) {
        console.error('⚠️ [QA-DB] add_creator_to_tenant failed:', addCreatorErr);
      } else {
        console.log('✅ [QA-DB] Creator added to tenant via RPC');
      }

      console.log('🏗️ [QA-DB] Step 2: Creating domain assignments');
      // Assign domains if any selected
      if (wizardData.domains.selectedDomainIds.length > 0) {
        const domainAssignments = wizardData.domains.selectedDomainIds.map(domainId => {
          const settings = wizardData.domains.domainSettings.get(domainId) || {
            max_teachers: 5,
            max_students: 100
          };
          
          return {
            tenant_id: tenant.id,
            domain_id: domainId,
            is_active: true,
            max_teachers: settings.max_teachers,
            max_students: settings.max_students
          };
        });

        const { error: domainError } = await supabase
          .from('tenant_domains')
          .insert(domainAssignments);

        if (domainError) throw domainError;
        
        console.log('✅ [QA-DB] Step 2 completed: Domain assignments created', {
          domainsAssigned: wizardData.domains.selectedDomainIds.length,
          domainIds: wizardData.domains.selectedDomainIds
        });
      }

      console.log('🏗️ [QA-DB] Step 3: Creating admin invitations');
      // Send admin invitations
      if (wizardData.admins.invitations.length > 0) {
        // First, look up role IDs
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('id, name')
          .in('name', wizardData.admins.invitations.map(inv => inv.role));

        if (rolesError) throw rolesError;

        const roleMap = new Map(roles?.map(role => [role.name, role.id]) || []);
        
        const invitations = wizardData.admins.invitations.map(inv => {
          const roleId = roleMap.get(inv.role);
          if (!roleId) {
            throw new Error(`Role '${inv.role}' not found in database`);
          }
          
          return {
            tenant_id: tenant.id,
            email: inv.email,
            role_id: roleId,
            role_name: inv.role,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            invited_by: session?.user.id || tenant.created_by
          };
        });

        const { data: createdInvitations, error: inviteError } = await supabase
          .from('invitations')
          .insert(invitations)
          .select('*');

        if (inviteError) throw inviteError;
        
        console.log('✅ [QA-DB] Step 3 completed: Admin invitations created', {
          invitationsCreated: wizardData.admins.invitations.length,
          emails: wizardData.admins.invitations.map(inv => inv.email)
        });

        // Step 3.5: Creator access already granted via secure RPC in Step 1
        // (Removed direct user_tenants manipulation for security)

        console.log('🏗️ [QA-DB] Step 4: Sending invitation emails');
        // Send emails if requested
        const invitationsToSend = wizardData.admins.invitations.filter(i => i.sendImmediately);
        for (const invitationRequest of invitationsToSend) {
          // Find the corresponding created invitation by email
          const createdInvitation = createdInvitations?.find(ci => ci.email === invitationRequest.email);
          if (createdInvitation) {
            await this.sendInvitationEmail(tenant.id, createdInvitation);
          }
        }
        
        console.log('✅ [QA-DB] Step 4 completed: Invitation emails sent');
      }

      console.log('🏗️ [QA-DB] Step 5: Refreshing materialized view and invalidating cache');
      
      // Refresh the tenant statistics materialized view to include the new tenant
      try {
        const { error } = await supabase.rpc('refresh_tenant_statistics');
        if (error) {
          console.error('⚠️ [QA-DB] Warning: Could not refresh materialized view:', error);
          // Don't fail the entire operation if view refresh fails
        } else {
          console.log('✅ [QA-DB] Materialized view refreshed successfully');
        }
      } catch (refreshError) {
        console.error('⚠️ [QA-DB] Warning: Could not refresh materialized view:', refreshError);
        // Don't fail the entire operation if view refresh fails
      }
      
      // Invalidate cache
      this.statsCache.invalidate();
      
      // Invalidate React Query cache
      this.queryClient.invalidateQueries({ queryKey: ['tenants-grid'] });
      // Also invalidate all tenants-grid queries with different filters
      this.queryClient.invalidateQueries({ queryKey: ['tenants-grid'], exact: false });

      const result = {
        tenant,
        domainsAssigned: wizardData.domains.selectedDomainIds.length,
        invitationsSent: wizardData.admins.invitations.length
      };
      
      console.log('✅ [QA-DB] All database operations completed successfully:', result);
      
      return result;
    } catch (error) {
      console.error('❌ [QA-DB] Enhanced tenant service failed:', error);
      throw error;
    }
  }

  /**
   * Update tenant with optimistic updates
   */
  async updateTenant(
    tenantId: string,
    updates: Partial<{
      name: string;
      description: string;
      status: string;
      subscription_tier: string;
      settings: Record<string, any>;
    }>
  ) {
    // Optimistic update in React Query cache
    this.queryClient.setQueryData(
      ['tenant', tenantId],
      (old: any) => ({ ...old, ...updates })
    );

    try {
      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenantId)
        .select()
        .single();

      if (error) throw error;

      // Invalidate stats cache for this tenant
      this.statsCache.invalidate(`tenant-${tenantId}`);

      return data;
    } catch (error) {
      // Revert optimistic update on error
      this.queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
      throw error;
    }
  }

  /**
   * Initialize real-time subscription for stats updates
   */
  private initializeRealtimeSubscription() {
    // Subscribe to tenant stats refresh notifications
    this.realtimeChannel = supabase
      .channel('tenant-stats-updates')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_tenants' 
        },
        (payload) => this.handleStatsUpdate(payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenant_domains'
        },
        (payload) => this.handleStatsUpdate(payload)
      )
      .subscribe();
  }

  /**
   * Handle real-time stats updates with debouncing
   */
  private handleStatsUpdate(payload: any) {
    const tenantId = payload.new?.tenant_id || payload.old?.tenant_id;
    
    if (!tenantId) return;

    // Clear existing timeout for this tenant
    if (this.statsUpdateQueue.has(tenantId)) {
      clearTimeout(this.statsUpdateQueue.get(tenantId));
    }

    // Debounce updates by 500ms
    const timeout = setTimeout(async () => {
      await this.refreshTenantStats(tenantId);
      this.statsUpdateQueue.delete(tenantId);
    }, 500);

    this.statsUpdateQueue.set(tenantId, timeout);
  }

  /**
   * Refresh statistics for a specific tenant
   */
  private async refreshTenantStats(tenantId: string) {
    try {
      // Fetch updated stats
      const stats = await this.getTenantWithStats(tenantId);
      
      if (stats) {
        // Notify subscribers
        this.updateCallbacks.forEach(callback => {
          callback({
            tenant_id: tenantId,
            domain_count: stats.domain_count,
            teacher_count: stats.teacher_count,
            student_count: stats.student_count
          });
        });

        // Invalidate React Query cache for this tenant
        this.queryClient.invalidateQueries({ 
          queryKey: ['tenant-stats', tenantId] 
        });
      }

      // Trigger materialized view refresh for this tenant
      await supabase.rpc('refresh_single_tenant_stats', { 
        p_tenant_id: tenantId 
      });
    } catch (error) {
      console.error('Error refreshing tenant stats:', error);
    }
  }

  /**
   * Subscribe to real-time stat updates
   */
  onStatsUpdate(callback: (update: TenantStatUpdate) => void): () => void {
    this.updateCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Prefetch next page for improved perceived performance
   */
  private async prefetchNextPage(options: TenantGridOptions) {
    this.queryClient.prefetchQuery({
      queryKey: ['tenants-grid', options],
      queryFn: () => this.getTenantsWithStats(options),
      staleTime: 60000 // Keep prefetched data fresh for 1 minute
    });
  }

  /**
   * Fallback to basic tenant list if stats fail
   */
  private async getFallbackTenantList(
    options: TenantGridOptions
  ): Promise<PaginatedResponse<TenantWithStats>> {
    console.log('✅ [TENANT-SERVICE] Using fallback tenant query from base table');
    const { page = 1, pageSize = 20, search, status } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('tenants')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('name');

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Map to TenantWithStats format with zero counts
    const tenantsWithEmptyStats = (data || []).map(tenant => ({
      tenant_id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      description: tenant.description,
      status: tenant.status,
      subscription_tier: tenant.subscription_tier,
      settings: tenant.settings,
      domain_count: 0,
      teacher_count: 0,
      student_count: 0,
      admin_count: 0,
      total_users: 0,
      last_activity: tenant.updated_at,
      created_at: tenant.created_at
    }));

    return {
      data: tenantsWithEmptyStats,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  }

  /**
   * Send invitation email using the email service
   */
  private async sendInvitationEmail(
    tenantId: string,
    invitation: any // Invitation record from database
  ) {
    console.log(`📧 [QA-EMAIL] Preparing to send invitation email:`, {
      email: invitation.email,
      role: invitation.role_name,
      tenantId,
      invitationId: invitation.id
    });

    try {
      // Get tenant information for the email
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('name, slug')
        .eq('id', tenantId)
        .single();

      if (error || !tenant) {
        console.error('❌ [QA-EMAIL] Failed to fetch tenant info:', error);
        throw new Error('Failed to fetch tenant information for email');
      }

      // Import email service
      const { emailService } = await import('@/services/email.service');
      
      // Use the invitation template with proper template variables
      const queueId = await emailService.queueEmailForTenant(tenantId, {
        templateType: 'invitation',
        to: invitation.email,
        templateVariables: {
          invitation_id: invitation.id,
          tenant_name: tenant.name,
          tenant_slug: tenant.slug,
          tenant_id: tenantId,
          inviter_name: 'Platform Administrator',
          role_name: invitation.role_name,
          expires_at: new Date(invitation.expires_at).toLocaleDateString(),
          support_email: 'support@gemeos.ai',
        },
        priority: 'high',
        relatedEntityType: 'tenant',
        relatedEntityId: tenantId,
      });

      if (queueId) {
        // Process the queued email immediately using private method access
        const processMethod = (emailService as any)['processQueueItemForTenant'];
        if (processMethod) {
          await processMethod.call(emailService, queueId, tenantId);
        }
        
        console.log('✅ [QA-EMAIL] Invitation email sent successfully:', {
          email: invitation.email,
          tenantName: tenant.name,
          queueId: queueId,
          invitationId: invitation.id
        });
      } else {
        throw new Error('Failed to queue invitation email');
      }

    } catch (error) {
      console.error('❌ [QA-EMAIL] Error in sendInvitationEmail:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        tenantId,
        email: invitation.email,
        invitationId: invitation.id
      });
      // Don't throw the error to prevent tenant creation failure
      // Log the error but continue with tenant creation
      console.warn('⚠️ [QA-EMAIL] Email sending failed but tenant creation will continue');
    }
  }

  /**
   * Force refresh of materialized view
   */
  async forceRefreshStatistics() {
    const { error } = await supabase.rpc('refresh_tenant_statistics');
    if (error) {
      console.error('Error refreshing statistics:', error);
      throw error;
    }
    
    // Clear all caches
    this.statsCache.invalidate();
    this.queryClient.invalidateQueries({ queryKey: ['tenants-grid'] });
  }

  /**
   * Clean up subscriptions
   */
  destroy() {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
    }
    
    // Clear all pending updates
    this.statsUpdateQueue.forEach(timeout => clearTimeout(timeout));
    this.statsUpdateQueue.clear();
    
    // Clear callbacks
    this.updateCallbacks.clear();
    
    // Clear cache
    this.statsCache.invalidate();
  }
}

// Export singleton instance
let serviceInstance: EnhancedTenantService | null = null;

export function getEnhancedTenantService(queryClient: QueryClient): EnhancedTenantService {
  if (!serviceInstance) {
    serviceInstance = new EnhancedTenantService(queryClient);
  }
  return serviceInstance;
}