/**
 * Email Service
 * Handles all email operations including sending, queueing, and template management
 */

import { supabase } from '@/integrations/supabase/client';
import { authService } from './auth.service';
import type {
  EmailTemplate,
  EmailTemplateType,
  EmailQueueItem,
  EmailLog,
  EmailBlacklistEntry,
  EmailRateLimit,
  SendEmailRequest,
  QueueEmailRequest,
  EmailTemplateVariables,
  EmailStats,
  EmailLogFilters,
  EmailQueueFilters,
  EmailStatus,
  EmailPriority,
} from '@/types/email.types';

export class EmailService {
  private static instance: EmailService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // ============================================================
  // EMAIL SENDING
  // ============================================================

  /**
   * Send an email immediately
   */
  async sendEmail(request: SendEmailRequest): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const tenantId = authService.getCurrentTenantId();
      if (!tenantId) {
        throw new Error('No tenant context');
      }

      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication session found');
      }

      // Normalize recipients
      const recipients = Array.isArray(request.to) ? request.to : [request.to];
      
      // Send to each recipient
      const results = [];
      for (const recipient of recipients) {
        const { data, error } = await supabase.functions.invoke('send-email', {
          body: {
            to: recipient,
            subject: request.subject,
            html: request.html,
            text: request.text,
            from: request.from,
            fromName: request.fromName,
            replyTo: request.replyTo,
            tenantId,
            templateType: request.templateType,
            templateVariables: request.templateVariables,
            priority: request.priority,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          console.error('Error sending email:', error);
          results.push({ success: false, error: error.message });
        } else {
          results.push({ success: true, messageId: data?.messageId });
        }
      }

      // Return first result for single recipient, or summary for multiple
      if (recipients.length === 1) {
        return results[0];
      }

      const successCount = results.filter(r => r.success).length;
      return {
        success: successCount > 0,
        messageId: `Sent ${successCount}/${recipients.length} emails`,
      };
    } catch (error: any) {
      console.error('Error in sendEmail:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  /**
   * Queue an email for processing for a specific tenant (used during tenant creation)
   */
  async queueEmailForTenant(tenantId: string, request: QueueEmailRequest): Promise<string | null> {
    try {
      console.log('🔍 [QA-EMAIL] Starting queueEmailForTenant with request:', {
        tenantId,
        templateType: request.templateType,
        to: request.to,
        priority: request.priority,
        relatedEntityType: request.relatedEntityType,
        relatedEntityId: request.relatedEntityId,
        templateVariablesKeys: Object.keys(request.templateVariables || {})
      });

      console.log('🔍 [QA-EMAIL] Calling supabase.rpc queue_email with explicit tenant ID...');

      const { data, error } = await supabase
        .rpc('queue_email', {
          p_tenant_id: tenantId,
          p_template_type: request.templateType,
          p_to_email: request.to,
          p_template_variables: request.templateVariables || {},
          p_priority: request.priority || 'normal',
          p_scheduled_for: request.scheduledFor?.toISOString() || null,
          p_related_entity_type: request.relatedEntityType || null,
          p_related_entity_id: request.relatedEntityId || null,
        });

      console.log('🔍 [QA-EMAIL] RPC queue_email response:', { data, error });

      if (error) {
        console.error('❌ [QA-EMAIL] Error queueing email for tenant:', error);
        throw error;
      }

      console.log('✅ [QA-EMAIL] Email queued successfully for tenant, queue ID:', data);
      return data;
    } catch (error: any) {
      console.error('❌ [QA-EMAIL] Error in queueEmailForTenant:', {
        error,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Queue an email for processing
   */
  async queueEmail(request: QueueEmailRequest): Promise<string | null> {
    try {
      console.log('🔍 [QA-EMAIL] Starting queueEmail with request:', {
        templateType: request.templateType,
        to: request.to,
        priority: request.priority,
        relatedEntityType: request.relatedEntityType,
        relatedEntityId: request.relatedEntityId,
        templateVariablesKeys: Object.keys(request.templateVariables || {})
      });

      const tenantId = authService.getCurrentTenantId();
      console.log('🔍 [QA-EMAIL] Current tenant ID:', tenantId);
      
      if (!tenantId) {
        throw new Error('No tenant context');
      }

      console.log('🔍 [QA-EMAIL] Calling supabase.rpc queue_email...');

      const { data, error } = await supabase
        .rpc('queue_email', {
          p_tenant_id: tenantId,
          p_template_type: request.templateType,
          p_to_email: request.to,
          p_template_variables: request.templateVariables || {},
          p_priority: request.priority || 'normal',
          p_scheduled_for: request.scheduledFor?.toISOString() || null,
          p_related_entity_type: request.relatedEntityType || null,
          p_related_entity_id: request.relatedEntityId || null,
        });

      console.log('🔍 [QA-EMAIL] RPC queue_email response:', { data, error });

      if (error) {
        console.error('❌ [QA-EMAIL] Error queueing email:', error);
        throw error;
      }

      console.log('✅ [QA-EMAIL] Email queued successfully, queue ID:', data);
      return data;
    } catch (error: any) {
      console.error('❌ [QA-EMAIL] Error in queueEmail:', {
        error,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details
      });
      throw error;
    }
  }

  /**
   * Send a teacher invitation email
   */
  async sendTeacherInvitation(
    email: string,
    inviteLink: string,
    inviterName: string,
    tenantName: string
  ): Promise<{ success: boolean; queueId?: string }> {
    try {
      const queueId = await this.queueEmail({
        templateType: 'teacher_invitation',
        to: email,
        templateVariables: {
          invite_link: inviteLink,
          inviter_name: inviterName,
          tenant_name: tenantName,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        },
        priority: 'high',
      });

      // Send immediately
      if (queueId) {
        await this.processQueueItem(queueId);
      }

      return { success: true, queueId: queueId || undefined };
    } catch (error: any) {
      console.error('Error sending teacher invitation:', error);
      return { success: false };
    }
  }

  /**
   * Send a tenant admin invitation email
   */
  async sendTenantAdminInvitation(
    email: string,
    tenantId: string,
    tenantName: string,
    tenantSlug: string,
    inviterName?: string
  ): Promise<{ success: boolean; queueId?: string; error?: string }> {
    try {
      // Generate invitation link
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gemeos.ai';
      const inviteLink = `${baseUrl}/auth/signup?tenant=${tenantSlug}&role=tenant_admin&email=${encodeURIComponent(email)}`;

      const queueId = await this.queueEmailForTenant(tenantId, {
        templateType: 'tenant_admin_invitation',
        to: email,
        templateVariables: {
          invite_link: inviteLink,
          tenant_name: tenantName,
          tenant_slug: tenantSlug,
          tenant_id: tenantId,
          inviter_name: inviterName || 'Platform Administrator',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          support_email: 'support@gemeos.ai',
          login_url: `${baseUrl}/auth/signin`,
        },
        priority: 'high',
        relatedEntityType: 'tenant',
        relatedEntityId: tenantId,
      });

      // Send immediately
      if (queueId) {
        await this.processQueueItemForTenant(queueId, tenantId);
      }

      console.log('✅ [QA-EMAIL] Tenant admin invitation queued and sent:', {
        email,
        tenantName,
        tenantSlug,
        queueId,
        inviteLink
      });

      return { success: true, queueId: queueId || undefined };
    } catch (error: any) {
      console.error('❌ [QA-EMAIL] Error sending tenant admin invitation:', {
        error,
        errorMessage: error?.message || 'Unknown error',
        errorStack: error?.stack,
        email,
        tenantId,
        tenantName,
        tenantSlug
      });
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  /**
   * Send a password reset email
   */
  async sendPasswordReset(
    email: string,
    resetLink: string,
    userName?: string
  ): Promise<{ success: boolean; queueId?: string }> {
    try {
      const queueId = await this.queueEmail({
        templateType: 'password_reset',
        to: email,
        templateVariables: {
          reset_link: resetLink,
          user_name: userName || email,
        },
        priority: 'critical',
      });

      // Send immediately
      if (queueId) {
        await this.processQueueItem(queueId);
      }

      return { success: true, queueId: queueId || undefined };
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      return { success: false };
    }
  }

  /**
   * Send a welcome email
   */
  async sendWelcomeEmail(
    email: string,
    userName: string,
    tenantName: string
  ): Promise<{ success: boolean; queueId?: string }> {
    try {
      const queueId = await this.queueEmail({
        templateType: 'welcome',
        to: email,
        templateVariables: {
          user_name: userName,
          tenant_name: tenantName,
          login_link: `${window.location.origin}/auth`,
        },
        priority: 'normal',
      });

      return { success: true, queueId: queueId || undefined };
    } catch (error: any) {
      console.error('Error sending welcome email:', error);
      return { success: false };
    }
  }

  /**
   * Test direct email sending (temporary debug function)
   */
  async testDirectEmail(to: string): Promise<void> {
    try {
      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication session found');
      }

      console.log('🔍 [QA-EMAIL] Testing direct email sending...');

      const { data, error } = await supabase.functions.invoke('send-email-direct', {
        body: {
          to: to,
          subject: 'Test Email from Gemeos',
          html: '<h1>Test Email</h1><p>This is a test email to verify the email function works.</p>',
          text: 'Test Email - This is a test email to verify the email function works.',
          from: 'Gemeos <noreply@gemeos.ai>'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('🔍 [QA-EMAIL] Direct email response:', { data, error });

      if (error) {
        console.error('❌ [QA-EMAIL] Direct email failed:', error);
        throw error;
      }

      console.log('✅ [QA-EMAIL] Direct email sent successfully');
    } catch (error) {
      console.error('❌ [QA-EMAIL] Error in testDirectEmail:', error);
      throw error;
    }
  }

  /**
   * Process a specific queue item for a specific tenant
   */
  private async processQueueItemForTenant(queueId: string, tenantId: string): Promise<void> {
    console.log('🔍 [QA-EMAIL] Processing queue item for tenant:', { queueId, tenantId });
    
    try {
      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 [QA-EMAIL] Session available:', !!session);
      console.log('🔍 [QA-EMAIL] Access token available:', !!session?.access_token);
      console.log('🔍 [QA-EMAIL] Access token (first 20 chars):', session?.access_token?.substring(0, 20));
      
      if (!session?.access_token) {
        console.error('❌ [QA-EMAIL] No authentication session found');
        throw new Error('No authentication session found');
      }

      const headers = {
        Authorization: `Bearer ${session.access_token}`,
      };
      
      console.log('🔍 [QA-EMAIL] Sending request to send-email function with headers:', {
        hasAuthorization: !!headers.Authorization,
        authHeaderPrefix: headers.Authorization.substring(0, 20)
      });

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { queueId, tenantId },
        headers,
      });

      console.log('🔍 [QA-EMAIL] send-email function response:', { data, error });
      
      if (error) {
        console.error('❌ [QA-EMAIL] Error invoking send-email function:', {
          message: error.message,
          name: error.name,
          context: error.context,
          details: error.details || error,
          stack: error.stack
        });
        
        // Try to get more details from the error response
        if (error.context && error.context.body) {
          try {
            // If it's a ReadableStream, try to read it
            if (error.context.body instanceof ReadableStream) {
              const reader = error.context.body.getReader();
              const { value } = await reader.read();
              const errorText = new TextDecoder().decode(value);
              console.error('❌ [QA-EMAIL] Function error body (stream):', errorText);
            } else {
              console.error('❌ [QA-EMAIL] Function error body (direct):', error.context.body);
            }
          } catch (streamError) {
            console.error('❌ [QA-EMAIL] Could not read error stream:', streamError);
            console.error('❌ [QA-EMAIL] Function error body (fallback):', error.context);
          }
        }
        
        throw error;
      }

      console.log('✅ [QA-EMAIL] Queue item processed successfully');
    } catch (error) {
      console.error('❌ [QA-EMAIL] Error in processQueueItemForTenant:', error);
      throw error;
    }
  }

  /**
   * Process a specific queue item
   */
  private async processQueueItem(queueId: string): Promise<void> {
    const tenantId = authService.getCurrentTenantId();
    if (!tenantId) return;

    // Get current session for auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No authentication session found');
    }

    await supabase.functions.invoke('send-email', {
      body: { queueId, tenantId },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
  }

  // ============================================================
  // TEMPLATE MANAGEMENT
  // ============================================================

  /**
   * Get all email templates for the current tenant
   */
  async getTemplates(): Promise<EmailTemplate[]> {
    const tenantId = authService.getCurrentTenantId();
    if (!tenantId) return [];

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
      .order('template_type', { ascending: true });

    if (error) {
      console.error('Error fetching templates:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get a specific template by type
   */
  async getTemplate(templateType: EmailTemplateType): Promise<EmailTemplate | null> {
    const tenantId = authService.getCurrentTenantId();
    if (!tenantId) return null;

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_type', templateType)
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
      .single();

    if (error) {
      console.error('Error fetching template:', error);
      return null;
    }

    return data;
  }

  /**
   * Create or update an email template
   */
  async saveTemplate(template: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    const tenantId = authService.getCurrentTenantId();
    if (!tenantId) return null;

    const templateData = {
      ...template,
      tenant_id: tenantId,
    };

    if (template.id) {
      const { data, error } = await supabase
        .from('email_templates')
        .update(templateData)
        .eq('id', template.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating template:', error);
        return null;
      }

      return data;
    } else {
      const { data, error } = await supabase
        .from('email_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) {
        console.error('Error creating template:', error);
        return null;
      }

      return data;
    }
  }

  /**
   * Delete an email template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Error deleting template:', error);
      return false;
    }

    return true;
  }

  // ============================================================
  // EMAIL QUEUE MANAGEMENT
  // ============================================================

  /**
   * Get email queue items
   */
  async getQueueItems(filters?: EmailQueueFilters): Promise<EmailQueueItem[]> {
    const tenantId = authService.getCurrentTenantId();
    if (!tenantId) return [];

    let query = supabase
      .from('email_queue')
      .select('*')
      .eq('tenant_id', filters?.tenant_id || tenantId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters?.scheduled_before) {
      query = query.lte('scheduled_for', filters.scheduled_before.toISOString());
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching queue items:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Cancel a queued email
   */
  async cancelQueueItem(queueId: string): Promise<boolean> {
    const { error } = await supabase
      .from('email_queue')
      .update({ status: 'cancelled' })
      .eq('id', queueId)
      .in('status', ['pending', 'queued']);

    if (error) {
      console.error('Error cancelling queue item:', error);
      return false;
    }

    return true;
  }

  /**
   * Retry a failed email
   */
  async retryQueueItem(queueId: string): Promise<boolean> {
    const { error } = await supabase
      .from('email_queue')
      .update({
        status: 'pending',
        attempts: 0,
        error_message: null,
        error_details: null,
      })
      .eq('id', queueId)
      .eq('status', 'failed');

    if (error) {
      console.error('Error retrying queue item:', error);
      return false;
    }

    // Trigger immediate processing
    await this.processQueueItem(queueId);

    return true;
  }

  // ============================================================
  // EMAIL LOGS
  // ============================================================

  /**
   * Get email logs
   */
  async getEmailLogs(filters?: EmailLogFilters): Promise<EmailLog[]> {
    const tenantId = authService.getCurrentTenantId();
    if (!tenantId) return [];

    let query = supabase
      .from('email_logs')
      .select('*')
      .eq('tenant_id', filters?.tenant_id || tenantId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.template_type) {
      query = query.eq('template_type', filters.template_type);
    }

    if (filters?.to_email) {
      query = query.eq('to_email', filters.to_email);
    }

    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date.toISOString());
    }

    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date.toISOString());
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching email logs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get email statistics
   */
  async getEmailStats(startDate?: Date, endDate?: Date): Promise<EmailStats> {
    const tenantId = authService.getCurrentTenantId();
    if (!tenantId) {
      return {
        total_sent: 0,
        total_delivered: 0,
        total_opened: 0,
        total_clicked: 0,
        total_bounced: 0,
        total_failed: 0,
        delivery_rate: 0,
        open_rate: 0,
        click_rate: 0,
        bounce_rate: 0,
      };
    }

    let query = supabase
      .from('email_logs')
      .select('status, opened_at, clicked_at')
      .eq('tenant_id', tenantId);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching email stats:', error);
      return {
        total_sent: 0,
        total_delivered: 0,
        total_opened: 0,
        total_clicked: 0,
        total_bounced: 0,
        total_failed: 0,
        delivery_rate: 0,
        open_rate: 0,
        click_rate: 0,
        bounce_rate: 0,
      };
    }

    const logs = data || [];
    const total_sent = logs.filter(l => l.status === 'sent').length;
    const total_delivered = logs.filter(l => l.status === 'delivered').length;
    const total_opened = logs.filter(l => l.opened_at).length;
    const total_clicked = logs.filter(l => l.clicked_at).length;
    const total_bounced = logs.filter(l => l.status === 'bounced').length;
    const total_failed = logs.filter(l => l.status === 'failed').length;

    return {
      total_sent,
      total_delivered,
      total_opened,
      total_clicked,
      total_bounced,
      total_failed,
      delivery_rate: total_sent > 0 ? (total_delivered / total_sent) * 100 : 0,
      open_rate: total_delivered > 0 ? (total_opened / total_delivered) * 100 : 0,
      click_rate: total_opened > 0 ? (total_clicked / total_opened) * 100 : 0,
      bounce_rate: total_sent > 0 ? (total_bounced / total_sent) * 100 : 0,
    };
  }

  // ============================================================
  // BLACKLIST MANAGEMENT
  // ============================================================

  /**
   * Get blacklisted emails
   */
  async getBlacklistedEmails(): Promise<EmailBlacklistEntry[]> {
    const tenantId = authService.getCurrentTenantId();
    if (!tenantId) return [];

    const { data, error } = await supabase
      .from('email_blacklist')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('blacklisted_at', { ascending: false });

    if (error) {
      console.error('Error fetching blacklist:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Add email to blacklist
   */
  async addToBlacklist(email: string, reason?: string): Promise<boolean> {
    const tenantId = authService.getCurrentTenantId();
    if (!tenantId) return false;

    const { error } = await supabase
      .from('email_blacklist')
      .insert({
        tenant_id: tenantId,
        email,
        reason,
      });

    if (error) {
      console.error('Error adding to blacklist:', error);
      return false;
    }

    return true;
  }

  /**
   * Remove email from blacklist
   */
  async removeFromBlacklist(email: string): Promise<boolean> {
    const tenantId = authService.getCurrentTenantId();
    if (!tenantId) return false;

    const { error } = await supabase
      .from('email_blacklist')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('email', email);

    if (error) {
      console.error('Error removing from blacklist:', error);
      return false;
    }

    return true;
  }

  // ============================================================
  // RATE LIMITS
  // ============================================================

  /**
   * Get rate limit status
   */
  async getRateLimit(): Promise<EmailRateLimit | null> {
    const tenantId = authService.getCurrentTenantId();
    if (!tenantId) return null;

    const { data, error } = await supabase
      .from('email_rate_limits')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      console.error('Error fetching rate limit:', error);
      return null;
    }

    return data;
  }

  /**
   * Update rate limits
   */
  async updateRateLimits(limits: Partial<EmailRateLimit>): Promise<boolean> {
    const tenantId = authService.getCurrentTenantId();
    if (!tenantId) return false;

    const { error } = await supabase
      .from('email_rate_limits')
      .upsert({
        tenant_id: tenantId,
        ...limits,
      });

    if (error) {
      console.error('Error updating rate limits:', error);
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();