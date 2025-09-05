/**
 * Class Service
 * Handles API operations for class creation and management
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  WizardData, 
  DomainSelection, 
  ClassSession, 
  StudentInformation 
} from '@/stores/class-wizard.store';

// ============================================================
// TYPES
// ============================================================

export interface CreateClassRequest {
  // Class details
  class_name: string;
  description?: string;
  difficulty_level_id: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  allows_student_messages: boolean;
  max_students: number;
  
  // Domain and tenant context
  domain_id: string;
  tenant_id: string;
  
  // Sessions
  sessions: Array<{
    session_name?: string;
    session_date: string;
    start_time: string;
    end_time: string;
    time_zone: string;
  }>;
  
  // Student invitations
  students: Array<{
    first_name: string;
    last_name: string;
    email: string;
    custom_message?: string;
  }>;
}

export interface Domain {
  id: string;
  name: string;
  description?: string;
  difficulty_levels: DifficultyLevel[];
}

export interface DifficultyLevel {
  id: string;
  level_name: string;
  level_order: number;
  description?: string;
  color_code?: string;
}

export interface CreateClassResponse {
  class_id: string;
  success: boolean;
  sessions_created: number;
  invitations_sent: number;
}

// ============================================================
// CLASS SERVICE
// ============================================================

class ClassService {
  /**
   * Get available domains for the current teacher
   */
  async getAvailableDomainsForTeacher(): Promise<Domain[]> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication required');
      }

      // Get user's tenant information and accessible domains
      const { data: userTenants, error: tenantError } = await supabase
        .from('user_tenants')
        .select(`
          tenant_id,
          tenant:tenants!inner(
            id,
            name,
            tenant_domains!inner(
              domain:domains!inner(
                id,
                name,
                description
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (tenantError) {
        console.error('Error fetching user tenants:', tenantError);
        throw new Error('Failed to load accessible domains');
      }

      // Extract domains from the response
      const domains: Domain[] = [];
      const domainMap = new Map<string, Domain>();

      for (const userTenant of userTenants || []) {
        const tenantDomains = userTenant.tenant?.tenant_domains || [];
        
        for (const tenantDomain of tenantDomains) {
          const domain = tenantDomain.domain;
          if (domain && !domainMap.has(domain.id)) {
            domainMap.set(domain.id, {
              id: domain.id,
              name: domain.name,
              description: domain.description,
              difficulty_levels: []
            });
          }
        }
      }

      domains.push(...domainMap.values());

      // Get difficulty levels for each domain
      if (domains.length > 0) {
        const domainIds = domains.map(d => d.id);
        const { data: difficultyLevels, error: difficultyError } = await supabase
          .from('difficulty_level_labels')
          .select('*')
          .in('domain_id', domainIds)
          .order('level_order');

        if (!difficultyError && difficultyLevels) {
          // Group difficulty levels by domain
          for (const level of difficultyLevels) {
            const domain = domains.find(d => d.id === level.domain_id);
            if (domain) {
              domain.difficulty_levels.push({
                id: level.id,
                level_name: level.level_name,
                level_order: level.level_order,
                description: level.description,
                color_code: level.color_code
              });
            }
          }
        }
      }

      return domains;
    } catch (error) {
      console.error('Error in getAvailableDomainsForTeacher:', error);
      throw error;
    }
  }

  /**
   * Create a new class with sessions and student invitations
   */
  async createClass(wizardData: WizardData): Promise<CreateClassResponse> {
    try {
      // Get current user and tenant info
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication required');
      }

      // Get user's active tenant (simplified - using first active tenant)
      const { data: userTenants, error: tenantError } = await supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1);

      if (tenantError || !userTenants || userTenants.length === 0) {
        throw new Error('No active tenant found');
      }

      const tenantId = userTenants[0].tenant_id;

      // Prepare class creation request
      const classRequest: CreateClassRequest = {
        class_name: wizardData.configuration.className,
        description: wizardData.configuration.description,
        difficulty_level_id: wizardData.configuration.difficultyLevelId!,
        frequency: wizardData.configuration.frequency,
        allows_student_messages: wizardData.configuration.allowsStudentMessages,
        max_students: wizardData.configuration.maxStudents,
        domain_id: wizardData.domain.selectedDomainId!,
        tenant_id: tenantId,
        sessions: wizardData.sessions.map(session => ({
          session_name: session.sessionName,
          session_date: session.sessionDate,
          start_time: session.startTime,
          end_time: session.endTime,
          time_zone: session.timeZone
        })),
        students: wizardData.students.students.map(student => ({
          first_name: student.firstName,
          last_name: student.lastName,
          email: student.email,
          custom_message: student.customMessage || wizardData.students.defaultCustomMessage
        }))
      };

      // Create class record
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .insert({
          teacher_id: user.id,
          tenant_id: classRequest.tenant_id,
          domain_id: classRequest.domain_id,
          class_name: classRequest.class_name,
          description: classRequest.description,
          difficulty_level_id: classRequest.difficulty_level_id,
          frequency: classRequest.frequency,
          allows_student_messages: classRequest.allows_student_messages,
          max_students: classRequest.max_students,
          status: 'active'
        })
        .select('id')
        .single();

      if (classError || !classData) {
        console.error('Error creating class:', classError);
        throw new Error('Failed to create class');
      }

      const classId = classData.id;

      // Create sessions
      let sessionsCreated = 0;
      if (classRequest.sessions.length > 0) {
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('class_sessions')
          .insert(
            classRequest.sessions.map(session => ({
              class_id: classId,
              session_name: session.session_name,
              session_date: session.session_date,
              start_time: session.start_time,
              end_time: session.end_time,
              time_zone: session.time_zone,
              status: 'scheduled'
            }))
          );

        if (!sessionsError) {
          sessionsCreated = classRequest.sessions.length;
        }
      }

      // Create student invitations
      let invitationsSent = 0;
      if (classRequest.students.length > 0) {
        const { data: invitationsData, error: invitationsError } = await supabase
          .from('class_invitations')
          .insert(
            classRequest.students.map(student => ({
              class_id: classId,
              email: student.email,
              first_name: student.first_name,
              last_name: student.last_name,
              custom_message: student.custom_message,
              invited_by: user.id,
              status: 'pending'
            }))
          );

        if (!invitationsError) {
          invitationsSent = classRequest.students.length;
        }
      }

      return {
        class_id: classId,
        success: true,
        sessions_created: sessionsCreated,
        invitations_sent: invitationsSent
      };

    } catch (error) {
      console.error('Error in createClass:', error);
      throw error;
    }
  }

  /**
   * Check if teacher can create classes in a specific domain
   */
  async canTeacherCreateClassInDomain(domainId: string): Promise<boolean> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return false;
      }

      const { data, error } = await supabase
        .rpc('can_teacher_create_class_in_domain', {
          p_teacher_id: user.id,
          p_domain_id: domainId,
          p_tenant_id: '' // This would need to be determined from context
        });

      return !error && data === true;
    } catch (error) {
      console.error('Error checking teacher permissions:', error);
      return false;
    }
  }
}

// Export singleton instance
export const classService = new ClassService();