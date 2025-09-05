/**
 * Invitation Service
 * Handles user invitations for multi-tenant system
 */

import { supabase } from '@/integrations/supabase/client';
import type { SystemRole, UserTenantStatus } from '@/types/auth.types';

export interface Invitation {
  id: string;
  email: string;
  tenant_id: string;
  role_name: SystemRole;
  status: InvitationStatus;
  expires_at: string;
  invited_by: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  invited_by_user?: {
    id: string;
    email: string;
  };
  role?: {
    id: string;
    name: string;
    display_name: string;
  };
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface CreateInvitationData {
  email: string;
  tenant_id: string;
  role: SystemRole;
  expires_in_days?: number;
}

export interface InvitationFilters {
  tenant_id?: string;
  status?: InvitationStatus;
  role?: SystemRole;
}

class InvitationService {
  /**
   * Create a new invitation
   */
  async createInvitation(data: CreateInvitationData): Promise<Invitation> {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User must be authenticated to send invitations');
    }

    // Check if user already exists in the tenant
    const { data: existingUser } = await supabase
      .from('user_tenants')
      .select('id')
      .eq('tenant_id', data.tenant_id)
      .eq('user_id', session.data.session.user.id)
      .single();

    if (existingUser) {
      throw new Error('User is already a member of this tenant');
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', data.email)
      .eq('tenant_id', data.tenant_id)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      throw new Error('An invitation for this email already exists for this tenant');
    }

    // Get role ID
    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('name', data.role)
      .single();

    if (roleError || !role) {
      throw new Error(`Role ${data.role} not found`);
    }

    // Calculate expiration date (default 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.expires_in_days || 7));

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        email: data.email,
        tenant_id: data.tenant_id,
        role_id: role.id,
        role_name: data.role,
        status: 'pending' as InvitationStatus,
        expires_at: expiresAt.toISOString(),
        invited_by: session.data.session.user.id,
      })
      .select(`
        *,
        tenant:tenants(id, name, slug),
        invited_by_user:profiles!invitations_invited_by_fkey(id, email),
        role:user_roles(id, name, display_name)
      `)
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      throw new Error(`Failed to create invitation: ${error.message}`);
    }

    return invitation as Invitation;
  }

  /**
   * Get invitations with optional filtering
   */
  async getInvitations(filters: InvitationFilters = {}): Promise<Invitation[]> {
    let query = supabase
      .from('invitations')
      .select(`
        *,
        tenant:tenants(id, name, slug),
        invited_by_user:profiles!invitations_invited_by_fkey(id, email),
        role:user_roles(id, name, display_name)
      `)
      .order('created_at', { ascending: false });

    if (filters.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.role) {
      query = query.eq('role_name', filters.role);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching invitations:', error);
      throw new Error(`Failed to fetch invitations: ${error.message}`);
    }

    return (data || []) as Invitation[];
  }

  /**
   * Get invitation by ID
   */
  async getInvitation(invitationId: string): Promise<Invitation | null> {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        tenant:tenants(id, name, slug),
        invited_by_user:profiles!invitations_invited_by_fkey(id, email),
        role:user_roles(id, name, display_name)
      `)
      .eq('id', invitationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching invitation:', error);
      throw new Error(`Failed to fetch invitation: ${error.message}`);
    }

    return data as Invitation;
  }

  /**
   * Get invitation by token (for invitation acceptance)
   */
  async getInvitationByToken(token: string): Promise<Invitation | null> {
    // For now, use ID as token. In production, implement proper token generation
    return this.getInvitation(token);
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    const invitation = await this.getInvitation(invitationId);
    
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer valid');
    }

    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitationId);
      
      throw new Error('Invitation has expired');
    }

    // Add user to tenant
    const { error: userTenantError } = await supabase
      .from('user_tenants')
      .insert({
        user_id: userId,
        tenant_id: invitation.tenant_id,
        role_id: invitation.role?.id,
        status: 'active' as UserTenantStatus,
        is_primary: false,
        joined_at: new Date().toISOString(),
      });

    if (userTenantError) {
      console.error('Error adding user to tenant:', userTenantError);
      throw new Error(`Failed to accept invitation: ${userTenantError.message}`);
    }

    // Mark invitation as accepted
    const { error: invitationError } = await supabase
      .from('invitations')
      .update({
        status: 'accepted' as InvitationStatus,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitationId);

    if (invitationError) {
      console.error('Error updating invitation status:', invitationError);
      // Don't throw here as the user was already added to the tenant
    }
  }

  /**
   * Cancel invitation
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('invitations')
      .update({
        status: 'cancelled' as InvitationStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId);

    if (error) {
      console.error('Error cancelling invitation:', error);
      throw new Error(`Failed to cancel invitation: ${error.message}`);
    }
  }

  /**
   * Resend invitation (update expiration date)
   */
  async resendInvitation(invitationId: string): Promise<Invitation> {
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7); // 7 days from now

    const { data, error } = await supabase
      .from('invitations')
      .update({
        expires_at: newExpiresAt.toISOString(),
        status: 'pending' as InvitationStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId)
      .select(`
        *,
        tenant:tenants(id, name, slug),
        invited_by_user:profiles!invitations_invited_by_fkey(id, email),
        role:user_roles(id, name, display_name)
      `)
      .single();

    if (error) {
      console.error('Error resending invitation:', error);
      throw new Error(`Failed to resend invitation: ${error.message}`);
    }

    return data as Invitation;
  }

  /**
   * Get pending invitations for tenant
   */
  async getTenantPendingInvitations(tenantId: string): Promise<Invitation[]> {
    return this.getInvitations({
      tenant_id: tenantId,
      status: 'pending',
    });
  }

  /**
   * Get invitations sent by user
   */
  async getInvitationsSentByUser(userId: string): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        tenant:tenants(id, name, slug),
        invited_by_user:profiles!invitations_invited_by_fkey(id, email),
        role:user_roles(id, name, display_name)
      `)
      .eq('invited_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user invitations:', error);
      throw new Error(`Failed to fetch invitations: ${error.message}`);
    }

    return (data || []) as Invitation[];
  }

  /**
   * Cleanup expired invitations
   */
  async cleanupExpiredInvitations(): Promise<number> {
    const { data, error } = await supabase
      .from('invitations')
      .update({ status: 'expired' as InvitationStatus })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning up expired invitations:', error);
      throw new Error(`Failed to cleanup expired invitations: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Get invitation statistics for tenant
   */
  async getInvitationStats(tenantId: string) {
    const { count: totalInvitations } = await supabase
      .from('invitations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    const { count: pendingInvitations } = await supabase
      .from('invitations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'pending');

    const { count: acceptedInvitations } = await supabase
      .from('invitations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'accepted');

    const { count: expiredInvitations } = await supabase
      .from('invitations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'expired');

    return {
      total_invitations: totalInvitations || 0,
      pending_invitations: pendingInvitations || 0,
      accepted_invitations: acceptedInvitations || 0,
      expired_invitations: expiredInvitations || 0,
    };
  }
}

export const invitationService = new InvitationService();