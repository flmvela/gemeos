/**
 * Email Hook
 * Provides email functionality to React components
 */

import { useState, useCallback } from 'react';
import { emailService } from '@/services/email.service';
import { useToast } from '@/hooks/use-toast';
import type {
  SendEmailRequest,
  QueueEmailRequest,
  EmailTemplate,
  EmailQueueItem,
  EmailLog,
  EmailStats,
  EmailLogFilters,
  EmailQueueFilters,
} from '@/types/email.types';

export const useEmail = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Send an email immediately
   */
  const sendEmail = useCallback(async (request: SendEmailRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await emailService.sendEmail(request);
      
      if (result.success) {
        toast({
          title: 'Email sent successfully',
          description: `Message has been sent to ${Array.isArray(request.to) ? request.to.join(', ') : request.to}`,
        });
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send email';
      setError(errorMessage);
      toast({
        title: 'Email error',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Queue an email for later processing
   */
  const queueEmail = useCallback(async (request: QueueEmailRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const queueId = await emailService.queueEmail(request);
      
      if (queueId) {
        toast({
          title: 'Email queued',
          description: 'Email has been added to the queue for processing',
        });
      }
      
      return queueId;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to queue email';
      setError(errorMessage);
      toast({
        title: 'Queue error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Send a teacher invitation
   */
  const sendTeacherInvitation = useCallback(async (
    email: string,
    inviteLink: string,
    inviterName: string,
    tenantName: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await emailService.sendTeacherInvitation(
        email,
        inviteLink,
        inviterName,
        tenantName
      );
      
      if (result.success) {
        toast({
          title: 'Invitation sent',
          description: `Teacher invitation has been sent to ${email}`,
        });
      } else {
        throw new Error('Failed to send invitation');
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send invitation';
      setError(errorMessage);
      toast({
        title: 'Invitation error',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Send a password reset email
   */
  const sendPasswordReset = useCallback(async (
    email: string,
    resetLink: string,
    userName?: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await emailService.sendPasswordReset(email, resetLink, userName);
      
      if (result.success) {
        toast({
          title: 'Password reset sent',
          description: `Password reset instructions have been sent to ${email}`,
        });
      } else {
        throw new Error('Failed to send password reset');
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send password reset';
      setError(errorMessage);
      toast({
        title: 'Password reset error',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Send a welcome email
   */
  const sendWelcomeEmail = useCallback(async (
    email: string,
    userName: string,
    tenantName: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await emailService.sendWelcomeEmail(email, userName, tenantName);
      
      if (result.success) {
        toast({
          title: 'Welcome email sent',
          description: `Welcome email has been sent to ${email}`,
        });
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send welcome email';
      setError(errorMessage);
      // Don't show error toast for welcome emails as they're not critical
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    error,
    sendEmail,
    queueEmail,
    sendTeacherInvitation,
    sendPasswordReset,
    sendWelcomeEmail,
  };
};

/**
 * Hook for managing email templates
 */
export const useEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await emailService.getTemplates();
      setTemplates(data);
    } catch (error: any) {
      toast({
        title: 'Error fetching templates',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const saveTemplate = useCallback(async (template: Partial<EmailTemplate>) => {
    setLoading(true);
    try {
      const saved = await emailService.saveTemplate(template);
      if (saved) {
        toast({
          title: 'Template saved',
          description: 'Email template has been saved successfully',
        });
        await fetchTemplates();
      }
      return saved;
    } catch (error: any) {
      toast({
        title: 'Error saving template',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchTemplates]);

  const deleteTemplate = useCallback(async (templateId: string) => {
    setLoading(true);
    try {
      const success = await emailService.deleteTemplate(templateId);
      if (success) {
        toast({
          title: 'Template deleted',
          description: 'Email template has been deleted',
        });
        await fetchTemplates();
      }
      return success;
    } catch (error: any) {
      toast({
        title: 'Error deleting template',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchTemplates]);

  return {
    templates,
    loading,
    fetchTemplates,
    saveTemplate,
    deleteTemplate,
  };
};

/**
 * Hook for managing email queue
 */
export const useEmailQueue = () => {
  const [queueItems, setQueueItems] = useState<EmailQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchQueueItems = useCallback(async (filters?: EmailQueueFilters) => {
    setLoading(true);
    try {
      const data = await emailService.getQueueItems(filters);
      setQueueItems(data);
    } catch (error: any) {
      toast({
        title: 'Error fetching queue',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const cancelQueueItem = useCallback(async (queueId: string) => {
    try {
      const success = await emailService.cancelQueueItem(queueId);
      if (success) {
        toast({
          title: 'Email cancelled',
          description: 'Queued email has been cancelled',
        });
        // Update local state
        setQueueItems(prev => prev.filter(item => item.id !== queueId));
      }
      return success;
    } catch (error: any) {
      toast({
        title: 'Error cancelling email',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const retryQueueItem = useCallback(async (queueId: string) => {
    try {
      const success = await emailService.retryQueueItem(queueId);
      if (success) {
        toast({
          title: 'Email retry initiated',
          description: 'Failed email will be retried',
        });
        await fetchQueueItems();
      }
      return success;
    } catch (error: any) {
      toast({
        title: 'Error retrying email',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchQueueItems]);

  return {
    queueItems,
    loading,
    fetchQueueItems,
    cancelQueueItem,
    retryQueueItem,
  };
};

/**
 * Hook for email logs and statistics
 */
export const useEmailLogs = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchLogs = useCallback(async (filters?: EmailLogFilters) => {
    setLoading(true);
    try {
      const data = await emailService.getEmailLogs(filters);
      setLogs(data);
    } catch (error: any) {
      toast({
        title: 'Error fetching logs',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchStats = useCallback(async (startDate?: Date, endDate?: Date) => {
    setLoading(true);
    try {
      const data = await emailService.getEmailStats(startDate, endDate);
      setStats(data);
    } catch (error: any) {
      toast({
        title: 'Error fetching statistics',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    logs,
    stats,
    loading,
    fetchLogs,
    fetchStats,
  };
};