/**
 * Email Notification System Types
 */

export type EmailTemplateType = 
  | 'teacher_invitation'
  | 'tenant_admin_invitation'
  | 'password_reset'
  | 'welcome'
  | 'account_suspended'
  | 'account_reactivated'
  | 'system_maintenance'
  | 'system_update'
  | 'custom';

export type EmailStatus = 
  | 'pending'
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'bounced'
  | 'failed'
  | 'cancelled';

export type EmailPriority = 'low' | 'normal' | 'high' | 'critical';

export interface EmailTemplate {
  id: string;
  tenant_id?: string;
  template_type: EmailTemplateType;
  name: string;
  subject: string;
  description?: string;
  html_template: string;
  text_template?: string;
  variables_schema?: Record<string, any>;
  from_name?: string;
  from_email?: string;
  reply_to?: string;
  is_active: boolean;
  is_system_template: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface EmailQueueItem {
  id: string;
  tenant_id: string;
  template_id?: string;
  template_type: EmailTemplateType;
  to_email: string;
  to_name?: string;
  cc_emails?: string[];
  bcc_emails?: string[];
  subject: string;
  html_content: string;
  text_content?: string;
  template_variables?: Record<string, any>;
  from_email?: string;
  from_name?: string;
  reply_to?: string;
  status: EmailStatus;
  priority: EmailPriority;
  scheduled_for?: string;
  attempts: number;
  max_attempts: number;
  last_attempt_at?: string;
  processed_at?: string;
  error_message?: string;
  error_details?: Record<string, any>;
  provider_message_id?: string;
  provider_response?: Record<string, any>;
  created_at: string;
  created_by?: string;
  related_entity_type?: string;
  related_entity_id?: string;
}

export interface EmailLog {
  id: string;
  tenant_id: string;
  queue_id?: string;
  template_type: EmailTemplateType;
  to_email: string;
  subject: string;
  status: EmailStatus;
  provider_message_id?: string;
  provider_response?: Record<string, any>;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  bounced_at?: string;
  error_message?: string;
  error_details?: Record<string, any>;
  created_at: string;
  created_by?: string;
}

export interface EmailBlacklistEntry {
  id: string;
  tenant_id: string;
  email: string;
  reason?: string;
  blacklisted_at: string;
  blacklisted_by?: string;
  expires_at?: string;
}

export interface EmailRateLimit {
  id: string;
  tenant_id: string;
  hourly_limit: number;
  daily_limit: number;
  monthly_limit: number;
  hourly_count: number;
  daily_count: number;
  monthly_count: number;
  hourly_reset_at: string;
  daily_reset_at: string;
  monthly_reset_at: string;
  created_at: string;
  updated_at: string;
}

// Email sending interfaces
export interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  templateType?: EmailTemplateType;
  templateVariables?: Record<string, any>;
  priority?: EmailPriority;
  scheduledFor?: Date;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface QueueEmailRequest {
  templateType: EmailTemplateType;
  to: string;
  templateVariables?: Record<string, any>;
  priority?: EmailPriority;
  scheduledFor?: Date;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface EmailTemplateVariables {
  // Common variables
  user_name?: string;
  tenant_name?: string;
  app_url?: string;
  current_year?: number;
  
  // Invitation specific
  invite_link?: string;
  inviter_name?: string;
  role?: string;
  expires_at?: string;
  
  // Password reset specific
  reset_link?: string;
  reset_code?: string;
  
  // Account status specific
  status_reason?: string;
  action_required?: string;
  
  // System notification specific
  maintenance_start?: string;
  maintenance_end?: string;
  update_version?: string;
  update_features?: string[];
  
  // Custom variables
  [key: string]: any;
}

export interface EmailStats {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_failed: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
}

export interface EmailWebhook {
  id: string;
  provider: string;
  event_type: string;
  message_id?: string;
  payload: Record<string, any>;
  processed: boolean;
  processed_at?: string;
  error_message?: string;
  received_at: string;
}

// Filter interfaces
export interface EmailLogFilters {
  tenant_id?: string;
  status?: EmailStatus;
  template_type?: EmailTemplateType;
  to_email?: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}

export interface EmailQueueFilters {
  tenant_id?: string;
  status?: EmailStatus | EmailStatus[];
  priority?: EmailPriority;
  scheduled_before?: Date;
  limit?: number;
  offset?: number;
}