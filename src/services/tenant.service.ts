/**
 * Tenant Management Service
 * Handles tenant creation, management, and domain assignments
 */

import { supabase } from '@/integrations/supabase/client';
import type { Tenant, TenantStatus, SubscriptionTier } from '@/types/auth.types';

export interface CreateTenantData {
  name: string;
  slug: string;
  description?: string;
  subscription_tier?: SubscriptionTier;
  max_users?: number;
  max_domains?: number;
  status?: TenantStatus;
  settings?: Record<string, unknown>;
}

export interface UpdateTenantData {
  name?: string;
  description?: string;
  subscription_tier?: SubscriptionTier;
  max_users?: number;
  max_domains?: number;
  status?: TenantStatus;
  settings?: Record<string, unknown>;
}

export interface TenantFilters {
  status?: TenantStatus;
  subscription_tier?: SubscriptionTier;
  search?: string;
}

class TenantService {
  /**
   * Create a new tenant
   */
  async createTenant(data: CreateTenantData): Promise<Tenant> {
    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(data.slug)) {
      throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
    }

    // Check if slug is already taken
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', data.slug)
      .maybeSingle();

    if (existingTenant) {
      throw new Error('Tenant slug is already taken');
    }

    // Create tenant
    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        subscription_tier: data.subscription_tier || 'free',
        max_users: data.max_users || 10,
        max_domains: data.max_domains || 2,
        status: data.status || 'active',
        settings: data.settings || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tenant:', error);
      throw new Error(`Failed to create tenant: ${error.message}`);
    }

    return tenant as Tenant;
  }

  /**
   * Get tenant by ID with complete data for editing
   */
  async getTenantById(tenantId: string): Promise<{
    basic: Tenant;
    domains: Array<{ id: string; name: string; slug: string; assigned: boolean; settings?: Record<string, unknown> }>;
    admins: Array<{ id: string; email: string; role: string; status: string; created_at: string }>;
    limits: { global_max_teachers: number; global_max_students: number; enforce_limits: boolean };
    settings: Record<string, unknown>;
  } | null> {
    console.log('🔍 [TENANT-SERVICE] Loading complete tenant data for:', tenantId);

    try {
      // Load basic tenant info
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (tenantError) {
        console.error('❌ [TENANT-SERVICE] Error loading tenant:', tenantError);
        return null;
      }

      if (!tenant) {
        console.error('❌ [TENANT-SERVICE] Tenant not found:', tenantId);
        return null;
      }

      // Load all available domains
      const { data: allDomains, error: domainsError } = await supabase
        .from('domains')
        .select('id, name, slug')
        .order('name');

      const { data: tenantDomains, error: tenantDomainsError } = await supabase
        .from('tenant_domains')
        .select('domain_id, settings')
        .eq('tenant_id', tenantId);

      if (domainsError) {
        console.error('❌ [TENANT-SERVICE] Error loading domains:', domainsError);
      }

      const tenantDomainMap = new Map(
        (tenantDomains || []).map(td => [td.domain_id, td])
      );

      const domains = (allDomains || []).map(domain => ({
        id: domain.id,
        name: domain.name,
        slug: domain.slug,
        assigned: tenantDomainMap.has(domain.id),
        settings: tenantDomainMap.get(domain.id)?.settings || {}
      }));

      // Load tenant admins - simplified for now, we'll enhance this later
      const { data: admins, error: adminsError } = await supabase
        .from('user_tenants')
        .select(`
          id,
          user_id,
          status,
          created_at
        `)
        .eq('tenant_id', tenantId);

      if (adminsError) {
        console.error('❌ [TENANT-SERVICE] Error loading admins:', adminsError);
      }

      const adminList = (admins || []).map(admin => ({
        id: admin.id,
        email: `user-${admin.user_id.substring(0, 8)}@tenant.com`, // Placeholder for now
        role: 'tenant_admin',
        status: admin.status,
        created_at: admin.created_at
      }));

      // Extract limits from tenant settings or use defaults
      const limits = {
        global_max_teachers: tenant.max_users || 50,
        global_max_students: tenant.max_users ? tenant.max_users * 10 : 500,
        enforce_limits: true
      };

      const result = {
        basic: tenant,
        domains,
        admins: adminList,
        limits,
        settings: tenant.settings || {}
      };

      console.log('✅ [TENANT-SERVICE] Loaded complete tenant data:', {
        tenantId,
        domainsCount: domains.length,
        assignedDomains: domains.filter(d => d.assigned).length,
        adminsCount: adminList.length
      });

      return result;
    } catch (error) {
      console.error('❌ [TENANT-SERVICE] Error loading tenant data:', error);
      return null;
    }
  }

  /**
   * Get all tenants with optional filtering
   */
  async getTenants(filters: TenantFilters = {}): Promise<Tenant[]> {
    let query = supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.subscription_tier) {
      query = query.eq('subscription_tier', filters.subscription_tier);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%, slug.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tenants:', error);
      throw new Error(`Failed to fetch tenants: ${error.message}`);
    }

    return (data || []) as Tenant[];
  }

  /**
   * Get tenant by ID
   */
  async getTenant(tenantId: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching tenant:', error);
      throw new Error(`Failed to fetch tenant: ${error.message}`);
    }

    return data as Tenant;
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error fetching tenant by slug:', error);
      throw new Error(`Failed to fetch tenant: ${error.message}`);
    }

    return data as Tenant;
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, data: UpdateTenantData): Promise<Tenant> {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating tenant:', error);
      throw new Error(`Failed to update tenant: ${error.message}`);
    }

    return tenant as Tenant;
  }

  /**
   * Delete tenant (soft delete by setting status to inactive)
   */
  async deleteTenant(tenantId: string): Promise<void> {
    const { error } = await supabase
      .from('tenants')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId);

    if (error) {
      console.error('Error deleting tenant:', error);
      throw new Error(`Failed to delete tenant: ${error.message}`);
    }
  }

  /**
   * Get tenant statistics
   */
  async getTenantStats(tenantId: string) {
    // Get user count
    const { count: userCount } = await supabase
      .from('user_tenants')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    // Get domain assignments (if table exists)
    const { count: domainCount } = await supabase
      .from('tenant_domains')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    return {
      active_users: userCount || 0,
      assigned_domains: domainCount || 0,
    };
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    const { data } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    return !data; // Available if no data found
  }

  /**
   * Generate suggested slug from name
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }
}

export const tenantService = new TenantService();