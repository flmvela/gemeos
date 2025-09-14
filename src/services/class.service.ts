/**
 * Service for managing class concepts and difficulty calculations
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ClassConcept,
  ClassDifficultyCache,
  ClassDifficultyAnalysis,
  AssignConceptsRequest,
  UpdateClassConceptRequest,
  ReorderConceptsRequest,
  ConceptHistory,
  ClassConceptHistory,
  getDifficultyWarning,
  getDifficultyRecommendation
} from '@/types/class-concepts.types';

export class ClassService {
  /**
   * Create a new class with all related data
   */
  async createClass(data: any): Promise<any> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get teacher record
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id, tenant_id')
        .eq('user_id', user.id)
        .single();

      if (teacherError || !teacherData) {
        throw new Error('Teacher not found');
      }

      // Prepare class data (removing created_by as it doesn't exist in the table)
      const classData = {
        tenant_id: teacherData.tenant_id,
        teacher_id: teacherData.id,
        domain_id: data.domain.selectedDomainId,
        name: data.configuration.className,
        description: data.configuration.description || null,
        max_students: data.configuration.maxStudents,
        min_students: data.configuration.minStudents || null,
        enrollment_type: data.students.enrollmentType || 'invite-only',
        enrollment_code: data.students.enrollmentType === 'open' ? 
          (data.students.enrollmentCode || this.generateEnrollmentCode()) : null,
        allows_student_messages: data.configuration.allowsStudentMessages || false,
        status: 'active'
      };

      // Insert class
      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert(classData)
        .select()
        .single();

      if (classError) {
        console.error('Error creating class:', classError);
        throw new Error('Failed to create class');
      }

      // Create class sessions
      let sessionsCreated = 0;
      if (data.sessions && data.sessions.length > 0) {
        const sessionData = data.sessions.map((session: any) => ({
          class_id: newClass.id,
          session_date: session.sessionDate || null,
          day_of_week: session.dayOfWeek || null,
          start_time: session.startTime,
          duration_minutes: session.duration || 60,
          location_type: session.location || 'online',
          location_address: session.locationAddress || null,
          meeting_link: session.meetingLink || null,
          is_recurring: data.recurrence ? true : false,
          recurrence_pattern: data.recurrence?.pattern || null,
          recurrence_end_type: data.recurrence?.endType || null,
          recurrence_end_date: data.recurrence?.endDate || null,
          recurrence_occurrences: data.recurrence?.occurrences || null
        }));

        const { data: sessions, error: sessionError } = await supabase
          .from('class_sessions')
          .insert(sessionData)
          .select();

        if (sessionError) {
          console.error('Error creating sessions:', sessionError);
          // Don't fail the entire operation if sessions fail
        } else {
          sessionsCreated = sessions?.length || 0;
        }
      }

      // Handle student invitations
      let invitationsSent = 0;
      if (data.students.studentEmails && data.students.studentEmails.length > 0) {
        // Import email service
        const { emailService } = await import('@/services/email.service');
        
        // Create student invitations - we'll use the ID as the token
        const invitationData = data.students.studentEmails.map((email: string) => ({
          class_id: newClass.id,
          student_email: email,
          invitation_status: 'pending',
          custom_message: data.students.defaultCustomMessage || null,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        }));

        const { data: invitations, error: invitationError } = await supabase
          .from('class_student_invitations')
          .insert(invitationData)
          .select();

        if (invitationError) {
          console.error('Error creating invitations:', invitationError);
          // Don't fail the entire operation if invitations fail
        } else {
          invitationsSent = invitations?.length || 0;

          // Send invitation emails if requested
          if (data.students.sendInvitesImmediately && invitations) {
            console.log('📧 Sending student invitation emails...', {
              invitationCount: invitations.length,
              sendImmediately: data.students.sendInvitesImmediately,
              invitations: invitations.map(i => ({
                email: i.student_email,
                token: i.invitation_token,
                hasToken: !!i.invitation_token
              }))
            });
            
            // Get class and teacher info for the email
            const { data: classInfo } = await supabase
              .from('classes')
              .select(`
                name,
                teachers (
                  first_name,
                  last_name
                )
              `)
              .eq('id', newClass.id)
              .single();
            
            const teacherName = classInfo?.teachers 
              ? `${classInfo.teachers.first_name} ${classInfo.teachers.last_name}`
              : 'Your Teacher';
            
            console.log('📧 Email details:', {
              className: classInfo?.name || data.configuration.className,
              teacherName,
              tenantId: teacherData.tenant_id
            });
            
            // Send email to each invited student
            for (const invitation of invitations) {
              try {
                console.log(`📧 Attempting to send invitation to ${invitation.student_email}...`);
                // Use the invitation ID as the token (it's a UUID)
                const result = await emailService.sendStudentInvitation(
                  invitation.student_email,
                  invitation.id, // Use the invitation ID instead of invitation_token
                  classInfo?.name || data.configuration.className,
                  teacherName,
                  invitation.custom_message,
                  teacherData.tenant_id
                );
                
                if (result.success) {
                  console.log(`✅ Invitation email sent to ${invitation.student_email}`, {
                    queueId: result.queueId
                  });
                } else {
                  console.error(`❌ Failed to send invitation to ${invitation.student_email}:`, result.error);
                }
              } catch (error) {
                console.error(`Error sending invitation to ${invitation.student_email}:`, error);
              }
            }
          } else {
            console.log('📧 Not sending invitations:', {
              sendImmediately: data.students.sendInvitesImmediately,
              hasInvitations: !!invitations,
              invitationCount: invitations?.length || 0
            });
          }
        }
      }

      // Assign difficulty levels to the class
      if (data.configuration.difficultyLevelIds && data.configuration.difficultyLevelIds.length > 0) {
        const difficultyData = data.configuration.difficultyLevelIds.map((levelId: string, index: number) => ({
          class_id: newClass.id,
          difficulty_level_id: levelId,
          sequence_order: index
        }));

        const { error: difficultyError } = await supabase
          .from('class_difficulty_levels')
          .insert(difficultyData);

        if (difficultyError) {
          console.error('Error assigning difficulty levels:', difficultyError);
          // Don't fail the entire operation
        }
      }

      return {
        success: true,
        class_id: newClass.id,
        class: newClass,
        sessions_created: sessionsCreated,
        invitations_sent: invitationsSent
      };
    } catch (error) {
      console.error('Error in createClass:', error);
      throw error;
    }
  }

  /**
   * Generate a random enrollment code
   */
  private generateEnrollmentCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate a unique invitation token
   */
  private generateInvitationToken(): string {
    // Generate a URL-safe token
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Get domains available to the current teacher
   */
  async getAvailableDomainsForTeacher(): Promise<any[]> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get teacher record
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (teacherError || !teacherData) {
      throw new Error('Teacher not found');
    }

    // Get domains assigned to this teacher
    const { data: teacherDomains, error: tdError } = await supabase
      .from('teacher_domains')
      .select('domain_id, is_primary, certification_level')
      .eq('teacher_id', teacherData.id);

    if (tdError) {
      console.error('Error fetching teacher domains:', tdError);
      throw new Error('Failed to fetch teacher domains');
    }

    if (!teacherDomains || teacherDomains.length === 0) {
      return [];
    }

    // Get the full domain details
    const domainIds = teacherDomains.map(td => td.domain_id);
    const { data: domains, error: domainsError } = await supabase
      .from('domains')
      .select('*')
      .in('id', domainIds)
      .eq('status', 'active');

    if (domainsError) {
      console.error('Error fetching domains:', domainsError);
      throw new Error('Failed to fetch domains');
    }

    // For each domain, fetch the distinct difficulty levels from concepts
    const domainsWithMetadata = await Promise.all(
      (domains || []).map(async (domain) => {
        const teacherDomain = teacherDomains.find(td => td.domain_id === domain.id);
        
        // First try to fetch from domain_difficulty_levels table
        let { data: difficultyLevels, error: levelsError } = await supabase
          .from('domain_difficulty_levels')
          .select('*')
          .eq('domain_id', domain.id)
          .order('level_number');
        
        console.log(`Domain ${domain.name} - Difficulty levels from DB:`, difficultyLevels);
        
        let difficultyLevelObjects;
        
        if (levelsError && levelsError.code === '42P01') {
          // Table doesn't exist yet
          console.log('domain_difficulty_levels table does not exist, using fallback');
        }
        
        if (difficultyLevels && difficultyLevels.length > 0) {
          // Use the defined difficulty levels from the database
          console.log(`Using ${difficultyLevels.length} difficulty levels from database`);
          difficultyLevelObjects = difficultyLevels.map(level => ({
            id: level.id,
            level_name: level.level_name,
            level_order: level.level_number,
            description: level.description,
            color_code: level.color_code
          }));
        } else {
          // Fallback: fetch distinct levels from concepts
          const { data: conceptLevels } = await supabase
            .from('concepts')
            .select('difficulty_level')
            .eq('domain_id', domain.id)
            .not('difficulty_level', 'is', null)
            .order('difficulty_level');
          
          console.log(`Domain ${domain.name} - Concept difficulty levels:`, conceptLevels);
          
          const uniqueLevels = [...new Set(conceptLevels?.map(c => c.difficulty_level) || [])];
          
          // If we have very few levels from concepts, provide a reasonable default set
          let levels;
          if (uniqueLevels.length <= 2) {
            console.log(`Only ${uniqueLevels.length} levels found in concepts, using default set`);
            levels = [1, 2, 3, 4, 5]; // Default to 5 levels
          } else {
            levels = uniqueLevels;
          }
          
          console.log(`Using ${levels.length} difficulty levels:`, levels);
          
          // Create proper difficulty level objects with meaningful names
          const levelNames = {
            1: 'Beginner',
            2: 'Elementary', 
            3: 'Intermediate',
            4: 'Advanced',
            5: 'Expert',
            6: 'Master',
            7: 'Professional',
            8: 'Specialist',
            9: 'Elite',
            10: 'Grandmaster'
          };
          
          // If no difficulty levels exist in DB, return empty array
          // The migration should have created them
          console.error(`No difficulty levels found for domain ${domain.id}. Please run the difficulty levels migration.`);
          difficultyLevelObjects = [];
        }
        
        return {
          ...domain,
          is_primary: teacherDomain?.is_primary || false,
          certification_level: teacherDomain?.certification_level || 'basic',
          difficulty_levels: difficultyLevelObjects
        };
      })
    );

    // Sort so primary domain appears first
    domainsWithMetadata.sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return a.name.localeCompare(b.name);
    });

    return domainsWithMetadata;
  }
  /**
   * Assign concepts to a class
   */
  async assignConceptsToClass(request: AssignConceptsRequest): Promise<ClassConcept[]> {
    const { classId, concepts } = request;
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Prepare insert data
    const insertData = concepts.map((concept, index) => ({
      class_id: classId,
      concept_id: concept.conceptId,
      assigned_by: user.id,
      sequence_order: concept.sequenceOrder ?? index,
      concept_group: concept.conceptGroup,
      override_difficulty: concept.overrideDifficulty,
      estimated_hours: concept.estimatedHours ?? 1.0,
      is_mandatory: concept.isMandatory ?? true,
      is_prerequisite_for_next: concept.isPrerequisiteForNext ?? false,
      status: 'active'
    }));

    // Insert concepts
    const { data, error } = await supabase
      .from('class_concepts')
      .insert(insertData)
      .select(`
        *,
        concept:concepts(*)
      `);

    if (error) throw error;

    // Trigger difficulty recalculation
    await this.recalculateClassDifficulty(classId);

    return data as ClassConcept[];
  }

  /**
   * Get all concepts assigned to a class
   */
  async getClassConcepts(classId: string): Promise<ClassConcept[]> {
    const { data, error } = await supabase
      .from('class_concepts')
      .select(`
        *,
        concept:concepts(
          *,
          learning_goals (
            id,
            name,
            description
          )
        )
      `)
      .eq('class_id', classId)
      .order('sequence_order', { ascending: true });

    if (error) throw error;
    return data as ClassConcept[];
  }

  /**
   * Update a class concept assignment
   */
  async updateClassConcept(
    classId: string,
    conceptId: string,
    updates: UpdateClassConceptRequest
  ): Promise<ClassConcept> {
    const { data, error } = await supabase
      .from('class_concepts')
      .update({
        sequence_order: updates.sequenceOrder,
        concept_group: updates.conceptGroup,
        override_difficulty: updates.overrideDifficulty,
        estimated_hours: updates.estimatedHours,
        is_mandatory: updates.isMandatory,
        is_prerequisite_for_next: updates.isPrerequisiteForNext,
        status: updates.status
      })
      .eq('class_id', classId)
      .eq('concept_id', conceptId)
      .select(`
        *,
        concept:concepts(*)
      `)
      .single();

    if (error) throw error;

    // Trigger difficulty recalculation if difficulty or status changed
    if (updates.overrideDifficulty !== undefined || updates.status !== undefined) {
      await this.recalculateClassDifficulty(classId);
    }

    return data as ClassConcept;
  }

  /**
   * Remove a concept from a class
   */
  async removeConceptFromClass(classId: string, conceptId: string): Promise<void> {
    const { error } = await supabase
      .from('class_concepts')
      .delete()
      .eq('class_id', classId)
      .eq('concept_id', conceptId);

    if (error) throw error;

    // Trigger difficulty recalculation
    await this.recalculateClassDifficulty(classId);
  }

  /**
   * Reorder concepts in a class
   */
  async reorderClassConcepts(request: ReorderConceptsRequest): Promise<void> {
    const { classId, conceptOrders } = request;

    // Update each concept's order
    const updates = conceptOrders.map(order =>
      supabase
        .from('class_concepts')
        .update({ sequence_order: order.newOrder })
        .eq('class_id', classId)
        .eq('concept_id', order.conceptId)
    );

    // Execute all updates
    const results = await Promise.all(updates);
    
    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      throw new Error(`Failed to reorder concepts: ${errors[0].error?.message}`);
    }
  }

  /**
   * Get class difficulty analysis
   */
  async getClassDifficulty(classId: string): Promise<ClassDifficultyAnalysis | null> {
    // First check cache
    const { data: cache, error: cacheError } = await supabase
      .from('class_difficulty_cache')
      .select('*')
      .eq('class_id', classId)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (cache && !cacheError) {
      // Return cached analysis with warnings and recommendations
      const analysis: ClassDifficultyAnalysis = {
        classId: cache.class_id,
        minDifficulty: cache.min_difficulty,
        maxDifficulty: cache.max_difficulty,
        avgDifficulty: cache.avg_difficulty,
        medianDifficulty: cache.median_difficulty,
        modeDifficulty: cache.mode_difficulty,
        weightedAvgDifficulty: cache.weighted_avg_difficulty,
        difficultyDistribution: cache.difficulty_distribution as Record<number, number>,
        conceptCount: cache.concept_count,
        mandatoryConceptCount: cache.mandatory_concept_count,
        suggestedLevel: cache.suggested_difficulty_level || Math.round(cache.median_difficulty),
        suggestedLevelConfidence: cache.suggested_level_confidence || 0.5
      };

      // Add warnings and recommendations
      analysis.warning = getDifficultyWarning(cache.min_difficulty, cache.max_difficulty);
      analysis.recommendation = getDifficultyRecommendation(analysis);

      return analysis;
    }

    // If no cache or expired, calculate
    return await this.recalculateClassDifficulty(classId);
  }

  /**
   * Force recalculation of class difficulty
   */
  async recalculateClassDifficulty(classId: string): Promise<ClassDifficultyAnalysis | null> {
    // Call the database function to calculate difficulty
    const { data, error } = await supabase
      .rpc('calculate_class_difficulty', { p_class_id: classId });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const calc = data[0];
    
    // Update cache
    await supabase
      .rpc('update_class_difficulty_cache', { p_class_id: classId });

    // Get the updated cache
    const { data: cache } = await supabase
      .from('class_difficulty_cache')
      .select('*')
      .eq('class_id', classId)
      .single();

    if (!cache) return null;

    // Build analysis object
    const analysis: ClassDifficultyAnalysis = {
      classId: classId,
      minDifficulty: calc.min_difficulty,
      maxDifficulty: calc.max_difficulty,
      avgDifficulty: parseFloat(calc.avg_difficulty),
      medianDifficulty: parseFloat(calc.median_difficulty),
      modeDifficulty: cache.mode_difficulty,
      weightedAvgDifficulty: cache.weighted_avg_difficulty,
      difficultyDistribution: cache.difficulty_distribution as Record<number, number>,
      conceptCount: calc.concept_count,
      mandatoryConceptCount: cache.mandatory_concept_count,
      suggestedLevel: calc.suggested_level,
      suggestedLevelConfidence: parseFloat(calc.confidence)
    };

    // Add warnings and recommendations
    analysis.warning = getDifficultyWarning(calc.min_difficulty, calc.max_difficulty);
    analysis.recommendation = getDifficultyRecommendation(analysis);

    return analysis;
  }

  /**
   * Get concept history
   */
  async getConceptHistory(conceptId: string): Promise<ConceptHistory[]> {
    const { data, error } = await supabase
      .from('concept_history')
      .select('*')
      .eq('concept_id', conceptId)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    return data as ConceptHistory[];
  }

  /**
   * Get class concept history
   */
  async getClassConceptHistory(classId: string): Promise<ClassConceptHistory[]> {
    const { data, error } = await supabase
      .from('class_concept_history')
      .select('*')
      .eq('class_id', classId)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    return data as ClassConceptHistory[];
  }

  /**
   * Bulk assign concepts to a class
   */
  async bulkAssignConcepts(
    classId: string,
    conceptIds: string[],
    options?: {
      conceptGroup?: string;
      estimatedHoursPerConcept?: number;
      allMandatory?: boolean;
    }
  ): Promise<ClassConcept[]> {
    const concepts = conceptIds.map((id, index) => ({
      conceptId: id,
      sequenceOrder: index,
      conceptGroup: options?.conceptGroup,
      estimatedHours: options?.estimatedHoursPerConcept,
      isMandatory: options?.allMandatory
    }));

    return await this.assignConceptsToClass({ classId, concepts });
  }

  /**
   * Get suggested concepts for a class based on target difficulty
   */
  async getSuggestedConcepts(
    classId: string,
    targetDifficulty: number,
    limit: number = 10
  ): Promise<any[]> {
    // Get class domain
    const { data: classData } = await supabase
      .from('classes')
      .select('domain_id')
      .eq('id', classId)
      .single();

    if (!classData) throw new Error('Class not found');

    // Get concepts already in the class
    const { data: existingConcepts } = await supabase
      .from('class_concepts')
      .select('concept_id')
      .eq('class_id', classId);

    const existingIds = existingConcepts?.map(c => c.concept_id) || [];

    // Find concepts within ±1 difficulty level of target
    const { data: suggestions, error } = await supabase
      .from('concepts')
      .select('*')
      .eq('domain_id', classData.domain_id)
      .gte('difficulty_level', targetDifficulty - 1)
      .lte('difficulty_level', targetDifficulty + 1)
      .not('id', 'in', `(${existingIds.join(',')})`)
      .limit(limit);

    if (error) throw error;
    return suggestions;
  }

  /**
   * Validate class difficulty balance
   */
  validateDifficultyBalance(analysis: ClassDifficultyAnalysis): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check spread
    const spread = analysis.maxDifficulty - analysis.minDifficulty;
    if (spread > 5) {
      issues.push(`Extreme difficulty spread (${spread} levels)`);
      suggestions.push('Consider splitting into beginner and advanced sections');
    } else if (spread > 3) {
      issues.push(`High difficulty spread (${spread} levels)`);
      suggestions.push('Add transitional concepts between difficulty jumps');
    }

    // Check confidence
    if (analysis.suggestedLevelConfidence < 0.5) {
      issues.push('Low confidence in suggested difficulty level');
      suggestions.push('Manual review of concept difficulties recommended');
    }

    // Check concept count
    if (analysis.conceptCount < 3) {
      issues.push('Too few concepts to establish reliable difficulty');
      suggestions.push('Add more concepts for better difficulty assessment');
    }

    // Check mandatory vs optional balance
    const mandatoryRatio = analysis.mandatoryConceptCount / analysis.conceptCount;
    if (mandatoryRatio === 1 && analysis.conceptCount > 10) {
      issues.push('All concepts are mandatory');
      suggestions.push('Consider making some advanced concepts optional');
    } else if (mandatoryRatio < 0.3) {
      issues.push('Very few mandatory concepts');
      suggestions.push('Ensure core concepts are marked as mandatory');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
}

// Export singleton instance
export const classService = new ClassService();