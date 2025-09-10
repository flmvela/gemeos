/**
 * Content Service with Override Pattern Support
 * Handles concept, learning goal, and exercise resolution with inheritance
 * Priority: teacher > tenant > platform
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface EffectiveConcept {
  concept_id: string;
  domain_id: string;
  parent_concept_id?: string;
  name: string;
  description?: string;
  difficulty_level: number;
  status: string;
  display_order?: number;
  metadata: Record<string, any>;
  generation_source: string;
  override_level: 'platform' | 'tenant' | 'teacher';
  is_customized: boolean;
  customized_by?: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface EffectiveLearningGoal {
  learning_goal_id: string;
  concept_id: string;
  goal_description: string;
  goal_type?: string;
  bloom_level?: string;
  sequence_order?: number;
  status: string;
  metadata: Record<string, any>;
  goal_type_id?: string;
  generation_source: string;
  override_level: 'platform' | 'tenant' | 'teacher';
  is_customized: boolean;
  customized_by?: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface EffectiveExercise {
  exercise_id: string;
  learning_goal_id: string;
  exercise_type: string;
  content?: Record<string, any>;
  status: string;
  override_level: 'platform' | 'tenant' | 'teacher';
  is_customized: boolean;
  customized_by?: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface ContentOverride {
  id?: string;
  scope: 'tenant' | 'teacher';
  tenant_id: string;
  teacher_id?: string;
  version?: number;
  change_reason?: string;
  // Fields vary by content type
  [key: string]: any;
}

export interface TenantContentSummary {
  domain_id: string;
  domain_name: string;
  total_concepts: number;
  customized_concepts: number;
  total_learning_goals: number;
  customized_learning_goals: number;
  total_exercises: number;
  customized_exercises: number;
}

// ============================================================
// CONTENT SERVICE CLASS
// ============================================================

export class ContentService {

  // ============================================================
  // CONTENT RETRIEVAL (with inheritance resolution)
  // ============================================================

  /**
   * Get effective concepts with inheritance resolved
   */
  async getEffectiveConcepts(tenantId?: string, userId?: string): Promise<EffectiveConcept[]> {
    try {
      const { data, error } = await supabase.rpc('effective_concepts', {
        p_tenant_id: tenantId,
        p_user_id: userId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching effective concepts:', error);
      // Error already logged to console
      throw error;
    }
  }

  /**
   * Get concepts for a specific domain
   */
  async getConceptsForDomain(domainId: string, tenantId?: string, userId?: string): Promise<EffectiveConcept[]> {
    try {
      const { data, error } = await supabase.rpc('effective_concepts_for_domain', {
        p_domain_id: domainId,
        p_tenant_id: tenantId,
        p_user_id: userId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching concepts for domain:', error);
      // Error already logged to console
      throw error;
    }
  }

  /**
   * Get effective learning goals with inheritance resolved
   */
  async getEffectiveLearningGoals(tenantId?: string, userId?: string): Promise<EffectiveLearningGoal[]> {
    try {
      const { data, error } = await supabase.rpc('effective_learning_goals', {
        p_tenant_id: tenantId,
        p_user_id: userId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching effective learning goals:', error);
      // Error already logged to console
      throw error;
    }
  }

  /**
   * Get learning goals for a specific concept
   */
  async getLearningGoalsForConcept(conceptId: string, tenantId?: string, userId?: string): Promise<EffectiveLearningGoal[]> {
    try {
      const { data, error } = await supabase.rpc('effective_learning_goals_for_concept', {
        p_concept_id: conceptId,
        p_tenant_id: tenantId,
        p_user_id: userId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching learning goals for concept:', error);
      throw error;
    }
  }

  /**
   * Get effective exercises with inheritance resolved
   */
  async getEffectiveExercises(tenantId?: string, userId?: string): Promise<EffectiveExercise[]> {
    try {
      const { data, error } = await supabase.rpc('effective_exercises', {
        p_tenant_id: tenantId,
        p_user_id: userId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching effective exercises:', error);
      // Error already logged to console
      throw error;
    }
  }

  // ============================================================
  // CONTENT CUSTOMIZATION (overrides)
  // ============================================================

  /**
   * Create or update concept override
   */
  async updateConceptOverride(
    baseConceptId: string,
    updates: Partial<ContentOverride>,
    scope: 'tenant' | 'teacher'
  ): Promise<ContentOverride> {
    try {
      const tenantId = await this.getCurrentTenantId();
      const userId = scope === 'teacher' ? (await supabase.auth.getUser()).data.user?.id : undefined;

      const overrideData = {
        base_concept_id: baseConceptId,
        scope,
        tenant_id: tenantId,
        teacher_id: userId,
        ...updates,
        version: (updates.version || 0) + 1
      };

      const { data, error } = await supabase
        .from('concept_overrides')
        .upsert(overrideData, {
          onConflict: 'base_concept_id,scope,tenant_id,teacher_id'
        })
        .select()
        .single();

      if (error) throw error;


      return data;
    } catch (error) {
      console.error('Error updating concept override:', error);
      throw error;
    }
  }

  /**
   * Create or update learning goal override
   */
  async updateLearningGoalOverride(
    baseLearningGoalId: string,
    updates: Partial<ContentOverride>,
    scope: 'tenant' | 'teacher'
  ): Promise<ContentOverride> {
    try {
      const tenantId = await this.getCurrentTenantId();
      const userId = scope === 'teacher' ? (await supabase.auth.getUser()).data.user?.id : undefined;

      const overrideData = {
        base_goal_id: baseLearningGoalId,
        scope,
        tenant_id: tenantId,
        teacher_id: userId,
        ...updates,
        version: (updates.version || 0) + 1
      };

      const { data, error } = await supabase
        .from('learning_goal_overrides')
        .upsert(overrideData, {
          onConflict: 'base_goal_id,scope,tenant_id,teacher_id'
        })
        .select()
        .single();

      if (error) throw error;


      return data;
    } catch (error) {
      console.error('Error updating learning goal override:', error);
      throw error;
    }
  }

  /**
   * Create or update exercise override
   */
  async updateExerciseOverride(
    baseExerciseId: string,
    updates: Partial<ContentOverride>,
    scope: 'tenant' | 'teacher'
  ): Promise<ContentOverride> {
    try {
      const tenantId = await this.getCurrentTenantId();
      const userId = scope === 'teacher' ? (await supabase.auth.getUser()).data.user?.id : undefined;

      const overrideData = {
        base_exercise_id: baseExerciseId,
        scope,
        tenant_id: tenantId,
        teacher_id: userId,
        ...updates,
        version: (updates.version || 0) + 1
      };

      const { data, error } = await supabase
        .from('exercise_overrides')
        .upsert(overrideData, {
          onConflict: 'base_exercise_id,scope,tenant_id,teacher_id'
        })
        .select()
        .single();

      if (error) throw error;


      return data;
    } catch (error) {
      console.error('Error updating exercise override:', error);
      throw error;
    }
  }

  // ============================================================
  // OVERRIDE MANAGEMENT
  // ============================================================

  /**
   * Revert content to parent version (soft delete override)
   */
  async revertToParent(
    contentType: 'concept' | 'learning_goal' | 'exercise',
    baseId: string,
    scope: 'tenant' | 'teacher'
  ): Promise<void> {
    try {
      const tenantId = await this.getCurrentTenantId();
      const userId = scope === 'teacher' ? (await supabase.auth.getUser()).data.user?.id : undefined;

      const tableName = `${contentType === 'learning_goal' ? 'learning_goal' : contentType}_overrides`;
      const idField = contentType === 'learning_goal' ? 'base_goal_id' : 
                     contentType === 'concept' ? 'base_concept_id' : 'base_exercise_id';

      const matchCondition = {
        [idField]: baseId,
        scope,
        tenant_id: tenantId,
        ...(scope === 'teacher' && { teacher_id: userId })
      };

      const { error } = await supabase
        .from(tableName)
        .update({ 
          deleted_at: new Date().toISOString(),
          change_reason: 'Reverted to parent version'
        })
        .match(matchCondition);

      if (error) throw error;

    } catch (error) {
      console.error('Error reverting to parent:', error);
      throw error;
    }
  }

  /**
   * Get tenant content summary for dashboard
   */
  async getTenantContentSummary(tenantId?: string): Promise<TenantContentSummary[]> {
    try {
      const { data, error } = await supabase.rpc('get_tenant_content_summary', {
        p_tenant_id: tenantId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tenant content summary:', error);
      throw error;
    }
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  /**
   * Get current user's tenant ID
   */
  private async getCurrentTenantId(): Promise<string> {
    const { data, error } = await supabase.rpc('get_current_tenant_id');
    if (error || !data) {
      throw new Error('Unable to determine current tenant context');
    }
    return data;
  }

  /**
   * Check if user is platform admin
   */
  async isPlatformAdmin(): Promise<boolean> {
    try {
      const { data } = await supabase.rpc('auth_is_platform_admin');
      return data || false;
    } catch {
      return false;
    }
  }

  /**
   * Get user's role in current tenant
   */
  async getCurrentTenantRole(tenantId?: string): Promise<string | null> {
    try {
      const currentTenantId = tenantId || await this.getCurrentTenantId();
      const { data } = await supabase.rpc('auth_tenant_role', {
        p_tenant_id: currentTenantId
      });
      return data;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const contentService = new ContentService();