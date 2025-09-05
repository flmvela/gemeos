/**
 * Domain Assignment Service
 * Handles tenant-domain assignments for the multi-tenant system
 */

import { supabase } from '@/integrations/supabase/client';

export interface Domain {
  id: string;
  name: string;
  description: string;
  icon_name?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantDomainAssignment {
  id: string;
  tenant_id: string;
  domain_id: string;
  is_active: boolean;
  max_teachers: number;
  max_students: number;
  created_at: string;
  updated_at: string;
  // Joined data
  domain?: Domain;
  tenant_name?: string;
}

export interface CreateTenantDomainData {
  tenant_id: string;
  domain_id: string;
  is_active?: boolean;
  max_teachers?: number;
  max_students?: number;
}

export interface UpdateTenantDomainData {
  is_active?: boolean;
  max_teachers?: number;
  max_students?: number;
}

class DomainAssignmentService {
  /**
   * Get all available domains
   */
  async getAllDomains(): Promise<Domain[]> {
    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching domains:', error);
      throw new Error(`Failed to fetch domains: ${error.message}`);
    }

    return (data || []) as Domain[];
  }

  /**
   * Get domains assigned to a specific tenant
   */
  async getTenantDomains(tenantId: string): Promise<TenantDomainAssignment[]> {
    const { data, error } = await supabase
      .from('tenant_domains')
      .select(`
        *,
        domain:domains(*)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tenant domains:', error);
      throw new Error(`Failed to fetch tenant domains: ${error.message}`);
    }

    return (data || []) as TenantDomainAssignment[];
  }

  /**
   * Get all tenant-domain assignments (for platform admin overview)
   */
  async getAllTenantDomainAssignments(): Promise<TenantDomainAssignment[]> {
    const { data, error } = await supabase
      .from('tenant_domains')
      .select(`
        *,
        domain:domains(*),
        tenant:tenants(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tenant domain assignments:', error);
      throw new Error(`Failed to fetch assignments: ${error.message}`);
    }

    return (data || []).map(item => ({
      ...item,
      tenant_name: item.tenant?.name || 'Unknown Tenant'
    })) as TenantDomainAssignment[];
  }

  /**
   * Assign a domain to a tenant
   */
  async assignDomainToTenant(data: CreateTenantDomainData): Promise<TenantDomainAssignment> {
    // Check if assignment already exists
    const { data: existing } = await supabase
      .from('tenant_domains')
      .select('id')
      .eq('tenant_id', data.tenant_id)
      .eq('domain_id', data.domain_id)
      .single();

    if (existing) {
      throw new Error('Domain is already assigned to this tenant');
    }

    // Create new assignment
    const { data: assignment, error } = await supabase
      .from('tenant_domains')
      .insert({
        tenant_id: data.tenant_id,
        domain_id: data.domain_id,
        is_active: data.is_active ?? true,
        max_teachers: data.max_teachers ?? 5,
        max_students: data.max_students ?? 100,
      })
      .select(`
        *,
        domain:domains(*)
      `)
      .single();

    if (error) {
      console.error('Error assigning domain to tenant:', error);
      throw new Error(`Failed to assign domain: ${error.message}`);
    }

    return assignment as TenantDomainAssignment;
  }

  /**
   * Update tenant-domain assignment
   */
  async updateTenantDomainAssignment(
    assignmentId: string, 
    data: UpdateTenantDomainData
  ): Promise<TenantDomainAssignment> {
    const { data: assignment, error } = await supabase
      .from('tenant_domains')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select(`
        *,
        domain:domains(*)
      `)
      .single();

    if (error) {
      console.error('Error updating tenant domain assignment:', error);
      throw new Error(`Failed to update assignment: ${error.message}`);
    }

    return assignment as TenantDomainAssignment;
  }

  /**
   * Remove domain assignment from tenant
   */
  async removeDomainFromTenant(assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from('tenant_domains')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('Error removing domain assignment:', error);
      throw new Error(`Failed to remove domain assignment: ${error.message}`);
    }
  }

  /**
   * Bulk assign multiple domains to a tenant
   */
  async bulkAssignDomainsToTenant(
    tenantId: string, 
    domainIds: string[],
    options: { max_teachers?: number; max_students?: number } = {}
  ): Promise<TenantDomainAssignment[]> {
    // Check for existing assignments
    const { data: existingAssignments } = await supabase
      .from('tenant_domains')
      .select('domain_id')
      .eq('tenant_id', tenantId)
      .in('domain_id', domainIds);

    const existingDomainIds = existingAssignments?.map(a => a.domain_id) || [];
    const newDomainIds = domainIds.filter(id => !existingDomainIds.includes(id));

    if (newDomainIds.length === 0) {
      throw new Error('All selected domains are already assigned to this tenant');
    }

    // Create new assignments
    const assignmentsToCreate = newDomainIds.map(domainId => ({
      tenant_id: tenantId,
      domain_id: domainId,
      is_active: true,
      max_teachers: options.max_teachers ?? 5,
      max_students: options.max_students ?? 100,
    }));

    const { data: assignments, error } = await supabase
      .from('tenant_domains')
      .insert(assignmentsToCreate)
      .select(`
        *,
        domain:domains(*)
      `);

    if (error) {
      console.error('Error bulk assigning domains:', error);
      throw new Error(`Failed to assign domains: ${error.message}`);
    }

    return (assignments || []) as TenantDomainAssignment[];
  }

  /**
   * Get unassigned domains for a tenant
   */
  async getUnassignedDomainsForTenant(tenantId: string): Promise<Domain[]> {
    // Get all domains
    const allDomains = await this.getAllDomains();

    // Get assigned domains
    const assignedDomains = await this.getTenantDomains(tenantId);
    const assignedDomainIds = assignedDomains.map(a => a.domain_id);

    // Filter out assigned domains
    return allDomains.filter(domain => !assignedDomainIds.includes(domain.id));
  }

  /**
   * Get domain assignment statistics
   */
  async getDomainAssignmentStats() {
    // Get total assignments
    const { count: totalAssignments } = await supabase
      .from('tenant_domains')
      .select('*', { count: 'exact', head: true });

    // Get active assignments
    const { count: activeAssignments } = await supabase
      .from('tenant_domains')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get total domains
    const { count: totalDomains } = await supabase
      .from('domains')
      .select('*', { count: 'exact', head: true });

    // Get tenants with assignments
    const { data: tenantsWithAssignments } = await supabase
      .from('tenant_domains')
      .select('tenant_id')
      .distinct();

    return {
      total_assignments: totalAssignments || 0,
      active_assignments: activeAssignments || 0,
      total_domains: totalDomains || 0,
      tenants_with_assignments: tenantsWithAssignments?.length || 0,
    };
  }
}

export const domainAssignmentService = new DomainAssignmentService();