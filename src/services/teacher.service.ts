/**
 * Teacher Management Service
 * Handles teacher creation, management, and invitation flow
 */

import { supabase } from '@/integrations/supabase/client';
import { emailService } from './email.service';
import type { Teacher, TeacherDomain, TeacherSchedule, TeacherPreferences } from '@/types/teacher.types';
import type { TeacherWizardData } from '@/stores/teacher-wizard.store';

export interface TeacherFilters {
  tenant_id?: string;
  status?: 'active' | 'inactive' | 'on_leave';
  domain_id?: string;
  search?: string;
}

class TeacherService {
  /**
   * Create a new teacher invitation (aligned with tenant admin flow)
   * No user is created until the invitation is accepted
   */
  async createTeacher(
    wizardData: TeacherWizardData,
    tenantId: string
  ): Promise<{ invitationId: string; invitationUrl: string; email: string }> {
    console.log('Creating teacher with data:', wizardData);
    console.log('Tenant ID:', tenantId);

    // Validate required data
    if (!wizardData.basic.email || !wizardData.basic.firstName || !wizardData.basic.lastName) {
      throw new Error('Missing required teacher information');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    try {
      // Get current user for authorization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if email already exists in invitations or users
      const { data: existingInvitations, error: invCheckError } = await supabase
        .from('invitations')
        .select('id')
        .eq('email', wizardData.basic.email)
        .eq('tenant_id', tenantId)
        .eq('status', 'pending');

      // Only throw if we found actual results (not on 406 errors)
      if (!invCheckError && existingInvitations && existingInvitations.length > 0) {
        throw new Error('An invitation for this email already exists for this tenant');
      }

      // Check if user already exists
      const { data: existingUsers, error: userCheckError } = await supabase
        .from('user_tenants')
        .select('id')
        .eq('email', wizardData.basic.email)
        .eq('tenant_id', tenantId);

      // Only throw if we found actual results (not on 406 errors)
      if (!userCheckError && existingUsers && existingUsers.length > 0) {
        throw new Error('A user with this email already exists in this tenant');
      }

      // Generate invitation token
      const invitationToken = crypto.randomUUID();

      // Get or create teacher role
      let teacherRoleId: string;
      const { data: teacherRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('name', 'teacher')
        .single();

      if (!teacherRole) {
        const { data: newRole, error: roleError } = await supabase
          .from('user_roles')
          .insert({
            name: 'teacher',
            display_name: 'Teacher',
            description: 'Teacher role with class management permissions'
          })
          .select()
          .single();

        if (roleError) throw roleError;
        teacherRoleId = newRole.id;
      } else {
        teacherRoleId = teacherRole.id;
      }

      // Create invitation with all teacher data in metadata
      const { data: invitation, error: invitationError } = await supabase
        .from('invitations')
        .insert({
          email: wizardData.basic.email,
          tenant_id: tenantId,
          role_id: teacherRoleId,
          role_name: 'teacher',
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          invited_by: user.id,
          invitation_token: invitationToken,
          metadata: {
            // Personal information
            firstName: wizardData.basic.firstName,
            lastName: wizardData.basic.lastName,
            phoneNumber: wizardData.basic.phoneNumber,
            
            // Domain information
            domains: wizardData.domains,
            
            // Schedule information
            schedule: wizardData.schedule,
            
            // Permissions
            permissions: wizardData.permissions,
            
            // Review/preferences
            notifications: wizardData.review?.notifications || {
              emailNotifications: true,
              smsNotifications: false,
              inAppNotifications: true
            },
            
            // Setup options
            sendWelcomeEmail: wizardData.review?.sendWelcomeEmail !== false,
            createInitialClass: wizardData.review?.createInitialClass === true,
            
            // Created by
            createdBy: user.id
          }
        })
        .select()
        .single();

      if (invitationError) {
        console.error('Failed to create invitation:', invitationError);
        throw new Error(`Failed to create teacher invitation: ${invitationError.message}`);
      }

      // Build invitation URL
      const invitationUrl = `${window.location.origin}/teacher-setup?token=${invitationToken}`;

      // Send invitation email if requested
      if (wizardData.basic.sendInvitation) {
        try {
          // Get tenant name for email
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('name')
            .eq('id', tenantId)
            .single();

          const tenantName = tenantData?.name || 'Gemeos Academy';

          // Get the list of domains for the email
          const domainsList = [];
          if (wizardData.domains.primaryDomain) {
            domainsList.push(wizardData.domains.primaryDomain.name);
          }
          wizardData.domains.additionalDomains.forEach(d => domainsList.push(d.name));

          // Send the invitation email
          const emailResult = await emailService.queueEmailForTenant(tenantId, {
            templateType: 'teacher_invitation',
            to: wizardData.basic.email,
            templateVariables: {
              tenantName,
              teacherName: `${wizardData.basic.firstName} ${wizardData.basic.lastName}`,
              teacherEmail: wizardData.basic.email,
              invitationUrl,
              domains: domainsList.join(', '),
              invitation_id: invitation.id
            },
            priority: 'high'
          });

          if (emailResult.success && emailResult.queueId) {
            console.log('Teacher invitation email queued successfully with ID:', emailResult.queueId);

            // Process the queue immediately to send the email
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.access_token) {
                const { data, error } = await supabase.functions.invoke('send-email', {
                  body: { 
                    queueId: emailResult.queueId, 
                    tenantId 
                  }
                });

                if (error) {
                  console.error('Failed to send teacher invitation email:', error);
                } else {
                  console.log('Teacher invitation email sent successfully');
                }
              }
            } catch (processError) {
              console.error('Error processing email queue:', processError);
            }
          }
        } catch (emailError) {
          console.error('Error sending teacher invitation email:', emailError);
          // Don't throw - invitation was created successfully even if email fails
        }
      }

      return {
        invitationId: invitation.id,
        invitationUrl,
        email: wizardData.basic.email
      };

    } catch (error) {
      console.error('Error creating teacher invitation:', error);
      throw error;
    }
  }

  /**
   * Accept a teacher invitation and create the user account
   * This is called when the teacher clicks the invitation link and sets their password
   * Uses Edge Function to bypass RLS restrictions
   */
  async acceptTeacherInvitation(
    invitationToken: string,
    password: string
  ): Promise<{ success: boolean; email: string }> {
    try {
      // Use Edge Function to handle the invitation acceptance with service role
      const { data, error } = await supabase.functions.invoke('accept-teacher-invitation', {
        body: { token: invitationToken, password }
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || 'Failed to accept invitation');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to accept invitation');
      }

      // Try to sign in the user after successful account creation
      const { data: invitation } = await supabase
        .from('invitations')
        .select('email')
        .eq('invitation_token', invitationToken)
        .single();
      
      const email = invitation?.email || '';
      
      if (email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          console.warn('Auto sign-in failed:', signInError);
          // Don't throw - account was created successfully
        }
      }

      return {
        success: true,
        email
      };
    } catch (error) {
      console.error('Error accepting teacher invitation:', error);
      throw error;
    }
  }

  /**
   * Legacy implementation - kept for reference
   * Direct database operations (requires fixing RLS policies)
   */
  private async _acceptTeacherInvitationLegacy(
    invitationToken: string,
    password: string
  ): Promise<{ success: boolean; email: string }> {
    try {
      // Get invitation by token
      const { data: invitation, error: invitationError } = await supabase
        .from('invitations')
        .select('*')
        .eq('invitation_token', invitationToken)
        .eq('status', 'pending')
        .single();

      if (invitationError || !invitation) {
        throw new Error('Invalid or expired invitation');
      }

      // Check if invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        await supabase
          .from('invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id);
        throw new Error('Invitation has expired');
      }

      // Extract metadata
      const metadata = invitation.metadata || {};

      let userId: string;

      // Try to create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            first_name: metadata.firstName,
            last_name: metadata.lastName,
            role: 'teacher',
            tenant_id: invitation.tenant_id
          }
        }
      });

      if (authError) {
        // Check if error is because user already exists
        if (authError.message?.includes('User already registered')) {
          // Try to sign in with the new password to verify it works
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: invitation.email,
            password: password
          });
          
          if (signInError) {
            // User exists but password doesn't match - they need to use forgot password flow
            throw new Error('An account already exists for this email. Please use the "Forgot Password" option on the login page to reset your password.');
          }
          
          // Sign in successful, use this user ID
          userId = signInData.user.id;
          
          // Check if teacher profile already exists
          const { data: existingTeacher } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', userId)
            .eq('tenant_id', invitation.tenant_id)
            .maybeSingle();
            
          if (existingTeacher) {
            // Teacher already exists, just update the invitation status
            await supabase
              .from('invitations')
              .update({ 
                status: 'accepted',
                accepted_at: new Date().toISOString()
              })
              .eq('id', invitation.id);
              
            // Sign in the user
            await supabase.auth.signInWithPassword({
              email: invitation.email,
              password
            });
            
            return {
              success: true,
              message: 'Account already exists. You have been signed in.',
              userId
            };
          }
        } else {
          throw new Error(`Failed to create user account: ${authError.message}`);
        }
      } else {
        if (!authData.user) {
          throw new Error('Failed to create user account: No user data returned');
        }
        userId = authData.user.id;
      }

      // Check if teacher profile already exists
      let teacher;
      const { data: existingTeacher } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_id', invitation.tenant_id)
        .maybeSingle();
      
      if (existingTeacher) {
        teacher = existingTeacher;
      } else {
        // Create teacher profile
        const { data: newTeacher, error: teacherError } = await supabase
          .from('teachers')
          .insert({
            user_id: userId,
            tenant_id: invitation.tenant_id,
            first_name: metadata.firstName,
            last_name: metadata.lastName,
            phone_number: metadata.phoneNumber,
            status: 'active',
            created_by: metadata.createdBy || invitation.invited_by
          })
          .select()
          .single();

        if (teacherError) throw teacherError;
        teacher = newTeacher;
      }

      // Add to user_tenants
      const { error: userTenantError } = await supabase
        .from('user_tenants')
        .insert({
          user_id: userId,
          tenant_id: invitation.tenant_id,
          role_id: invitation.role_id,
          email: invitation.email,
          status: 'active',
          is_primary: true,
          joined_at: new Date().toISOString()
        });

      if (userTenantError && userTenantError.code !== '23505') {
        throw userTenantError;
      }

      // Process domains from metadata (only if teacher was just created)
      if (metadata.domains && !existingTeacher) {
        // Check existing domains for this teacher
        const { data: existingDomains } = await supabase
          .from('teacher_domains')
          .select('domain_id')
          .eq('teacher_id', teacher.id);
        
        const existingDomainIds = new Set(existingDomains?.map(d => d.domain_id) || []);
        
        // Primary domain
        if (metadata.domains.primaryDomain && !existingDomainIds.has(metadata.domains.primaryDomain.id)) {
          await supabase
            .from('teacher_domains')
            .insert({
              teacher_id: teacher.id,
              domain_id: metadata.domains.primaryDomain.id,
              is_primary: true,
              certification_level: metadata.domains.primaryDomain.certificationLevel || 'intermediate',
              max_students: metadata.domains.maxStudents,
              preferred_class_size: metadata.domains.preferredClassSize
            });
        }

        // Additional domains
        if (metadata.domains.additionalDomains?.length > 0) {
          const additionalDomainsData = metadata.domains.additionalDomains
            .filter(domain => !existingDomainIds.has(domain.id))
            .map(domain => ({
              teacher_id: teacher.id,
              domain_id: domain.id,
              is_primary: false,
              certification_level: domain.certificationLevel || 'beginner'
            }));

          if (additionalDomainsData.length > 0) {
            await supabase
              .from('teacher_domains')
              .insert(additionalDomainsData);
          }
        }
      }

      // Process schedule from metadata (only if teacher was just created)
      if (metadata.schedule?.weeklyAvailability && !existingTeacher) {
        const scheduleData = Object.entries(metadata.schedule.weeklyAvailability)
          .filter(([_, daySchedule]: [string, any]) => daySchedule.enabled)
          .map(([day, daySchedule]: [string, any]) => ({
            teacher_id: teacher.id,
            day_of_week: day.toLowerCase(),
            start_time: daySchedule.start,
            end_time: daySchedule.end,
            is_available: true
          }));

        if (scheduleData.length > 0) {
          await supabase
            .from('teacher_schedules')
            .insert(scheduleData);
        }
      }

      // Process preferences from metadata
      if (metadata.permissions || metadata.schedule || metadata.domains) {
        await supabase
          .from('teacher_preferences')
          .insert({
            teacher_id: teacher.id,
            min_class_duration: metadata.schedule?.minClassDuration || 60,
            max_classes_per_day: metadata.schedule?.maxClassesPerDay || 6,
            teaching_modality: metadata.domains?.teachingModalities || ['online', 'in-person'],
            notification_preferences: metadata.notifications || {
              emailNotifications: true,
              smsNotifications: false,
              inAppNotifications: true
            },
            custom_permissions: {
              canCreateClasses: metadata.permissions?.canCreateClasses !== false,
              canManageStudents: metadata.permissions?.canManageStudents !== false,
              canViewReports: metadata.permissions?.canViewReports === true,
              canManageDomainContent: metadata.permissions?.canManageDomainContent === true,
              restrictToOwnStudents: metadata.permissions?.restrictToOwnStudents !== false,
              restrictToOwnClasses: metadata.permissions?.restrictToOwnClasses !== false,
              isLeadTeacher: metadata.permissions?.isLeadTeacher === true,
              canApproveEnrollments: metadata.permissions?.canApproveEnrollments === true
            },
            auto_accept_students: metadata.permissions?.canApproveEnrollments !== true
          });
      }

      // Mark invitation as accepted
      await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      // Send welcome email if requested
      if (metadata.sendWelcomeEmail) {
        // TODO: Send welcome email
      }

      // Create initial class if requested
      if (metadata.createInitialClass) {
        // TODO: Create initial class
      }

      return {
        success: true,
        email: invitation.email
      };

    } catch (error) {
      console.error('Error accepting teacher invitation:', error);
      throw error;
    }
  }

  /**
   * Get all teachers for a tenant
   */
  async getTeachersByTenant(tenantId: string): Promise<Teacher[]> {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('last_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get teacher by ID with all related data
   */
  async getTeacherById(teacherId: string): Promise<Teacher & {
    domains: TeacherDomain[];
    schedules: TeacherSchedule[];
    preferences: TeacherPreferences | null;
  }> {
    // Get teacher basic info
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select(`
        *,
        user:users!teachers_user_id_fkey(
          email,
          created_at
        ),
        tenant:tenants!teachers_tenant_id_fkey(
          name,
          slug
        )
      `)
      .eq('id', teacherId)
      .single();

    if (teacherError) throw teacherError;
    return teacher;
  }

  /**
   * Update teacher profile
   */
  async updateTeacher(teacherId: string, updates: Partial<Teacher>): Promise<Teacher> {
    const { data, error } = await supabase
      .from('teachers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', teacherId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete teacher (soft delete by setting status to inactive)
   */
  async deleteTeacher(teacherId: string): Promise<void> {
    const { error } = await supabase
      .from('teachers')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', teacherId);

    if (error) throw error;
  }

  /**
   * Get teacher statistics
   */
  async getTeacherStats(teacherId: string) {
    // Get class count
    const { count: classCount } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .eq('status', 'active');

    // Get student count
    const { count: studentCount } = await supabase
      .from('class_students')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .eq('status', 'enrolled');

    // Get domain count
    const { count: domainCount } = await supabase
      .from('teacher_domains')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacherId);

    return {
      total_classes: classCount || 0,
      total_students: studentCount || 0,
      total_domains: domainCount || 0
    };
  }
}

export const teacherService = new TeacherService();