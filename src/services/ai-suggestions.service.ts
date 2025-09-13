import { supabase } from '@/integrations/supabase/client';

export interface AIProcessingJob {
  id: string;
  request_type: 'concept' | 'learning_goal' | 'exercise' | 'bulk';
  source_type: 'file_upload' | 'manual_entry' | 'ai_generation';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  tenant_id: string;
  domain_id?: string;
  requested_by: string;
  processing_options?: any;
  started_at?: string;
  completed_at?: string;
  processed_items_count?: number;
  error_message?: string;
  created_at: string;
}

export interface AISuggestion {
  id: string;
  job_id: string;
  content_type: 'concept' | 'learning_goal' | 'exercise';
  source_content_id?: string;
  suggestion_type: 'new' | 'refinement' | 'enrichment' | 'completion';
  original_content?: any;
  suggested_content: any;
  confidence_score: number;
  ai_reasoning?: string;
  review_status: 'pending' | 'approved' | 'rejected' | 'modified';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
}

export interface AIReviewItem {
  id: string;
  name: string;
  description: string;
  source: string;
  sourceType: 'file' | 'ai_analysis';
  difficultyLevel?: string;
  bloomLevel?: string;
  parent?: string;
  children?: string[];
  relationships?: {
    relatedTo?: string[];
    prerequisiteOf?: string[];
    builtUpon?: string[];
  };
  selected: boolean;
  suggestion_id: string;
  confidence_score: number;
  ai_reasoning?: string;
}

class AISuggestionsService {
  /**
   * Get pending AI suggestions for review
   */
  async getPendingSuggestions(
    domainId?: string,
    contentType?: 'concept' | 'learning_goal' | 'exercise'
  ): Promise<AISuggestion[]> {
    let query = supabase
      .from('ai_suggestions')
      .select(`
        *,
        ai_processing_jobs!inner (
          domain_id,
          tenant_id
        )
      `)
      .eq('review_status', 'pending');

    if (domainId) {
      query = query.eq('ai_processing_jobs.domain_id', domainId);
    }

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending suggestions:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get review queue items
   */
  async getReviewQueue(
    domainId?: string,
    contentType?: 'concept' | 'learning_goal' | 'exercise'
  ): Promise<AIReviewItem[]> {
    const suggestions = await this.getPendingSuggestions(domainId, contentType);
    
    return suggestions.map(suggestion => {
      const content = suggestion.suggested_content;
      return {
        id: suggestion.id,
        name: content.name || content.title || '',
        description: content.description || '',
        source: this.formatSource(suggestion),
        sourceType: suggestion.suggestion_type === 'new' ? 'ai_analysis' : 'file',
        difficultyLevel: this.mapDifficultyLevel(content.difficulty_level),
        bloomLevel: content.bloom_level,
        parent: content.parent_name || content.parent_id,
        children: content.children || [],
        relationships: content.relationships || {},
        selected: false,
        suggestion_id: suggestion.id,
        confidence_score: suggestion.confidence_score,
        ai_reasoning: suggestion.ai_reasoning
      };
    });
  }

  /**
   * Approve selected suggestions
   */
  async approveSuggestions(suggestionIds: string[], userId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_suggestions')
      .update({
        review_status: 'approved',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString()
      })
      .in('id', suggestionIds);

    if (error) {
      console.error('Error approving suggestions:', error);
      throw error;
    }

    // Process approved suggestions to create actual content
    await this.processApprovedSuggestions(suggestionIds);
  }

  /**
   * Reject selected suggestions
   */
  async rejectSuggestions(
    suggestionIds: string[], 
    userId: string, 
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('ai_suggestions')
      .update({
        review_status: 'rejected',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes
      })
      .in('id', suggestionIds);

    if (error) {
      console.error('Error rejecting suggestions:', error);
      throw error;
    }
  }

  /**
   * Update a suggestion with modifications
   */
  async updateSuggestion(
    suggestionId: string, 
    updatedContent: any,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('ai_suggestions')
      .update({
        suggested_content: updatedContent,
        review_status: 'modified',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', suggestionId);

    if (error) {
      console.error('Error updating suggestion:', error);
      throw error;
    }
  }

  /**
   * Process approved suggestions to create actual content
   */
  private async processApprovedSuggestions(suggestionIds: string[]): Promise<void> {
    const { data: suggestions, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .in('id', suggestionIds);

    if (error) {
      console.error('Error fetching suggestions for processing:', error);
      return;
    }

    for (const suggestion of suggestions || []) {
      try {
        switch (suggestion.content_type) {
          case 'concept':
            await this.createConceptFromSuggestion(suggestion);
            break;
          case 'learning_goal':
            await this.createLearningGoalFromSuggestion(suggestion);
            break;
          case 'exercise':
            await this.createExerciseFromSuggestion(suggestion);
            break;
        }
      } catch (error) {
        console.error(`Error processing suggestion ${suggestion.id}:`, error);
      }
    }
  }

  /**
   * Create a concept from an approved suggestion
   */
  private async createConceptFromSuggestion(suggestion: AISuggestion): Promise<void> {
    const content = suggestion.suggested_content;
    
    // Get the job to get domain_id and tenant_id
    const { data: job } = await supabase
      .from('ai_processing_jobs')
      .select('domain_id, tenant_id')
      .eq('id', suggestion.job_id)
      .single();

    if (!job) return;

    // If updating existing concept
    if (suggestion.source_content_id) {
      const { error } = await supabase
        .from('concepts')
        .update({
          name: content.name,
          description: content.description,
          difficulty_level: content.difficulty_level,
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestion.source_content_id);

      if (error) {
        console.error('Error updating concept:', error);
      }
    } else {
      // Create new concept
      const { error } = await supabase
        .from('concepts')
        .insert({
          name: content.name,
          description: content.description,
          difficulty_level: content.difficulty_level,
          domain_id: job.domain_id,
          tenant_id: job.tenant_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating concept:', error);
      }
    }
  }

  /**
   * Create a learning goal from an approved suggestion
   */
  private async createLearningGoalFromSuggestion(suggestion: AISuggestion): Promise<void> {
    const content = suggestion.suggested_content;
    
    // Get the job to get domain_id and tenant_id
    const { data: job } = await supabase
      .from('ai_processing_jobs')
      .select('domain_id, tenant_id')
      .eq('id', suggestion.job_id)
      .single();

    if (!job) return;

    // If updating existing learning goal
    if (suggestion.source_content_id) {
      const { error } = await supabase
        .from('learning_goals')
        .update({
          title: content.title,
          description: content.description,
          bloom_level: content.bloom_level,
          difficulty_level: content.difficulty_level,
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestion.source_content_id);

      if (error) {
        console.error('Error updating learning goal:', error);
      }
    } else {
      // Create new learning goal
      const { error } = await supabase
        .from('learning_goals')
        .insert({
          title: content.title,
          description: content.description,
          bloom_level: content.bloom_level,
          difficulty_level: content.difficulty_level,
          domain_id: job.domain_id,
          tenant_id: job.tenant_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating learning goal:', error);
      }
    }
  }

  /**
   * Create an exercise from an approved suggestion
   */
  private async createExerciseFromSuggestion(suggestion: AISuggestion): Promise<void> {
    const content = suggestion.suggested_content;
    
    // Get the job to get domain_id and tenant_id
    const { data: job } = await supabase
      .from('ai_processing_jobs')
      .select('domain_id, tenant_id')
      .eq('id', suggestion.job_id)
      .single();

    if (!job) return;

    // If updating existing exercise
    if (suggestion.source_content_id) {
      const { error } = await supabase
        .from('exercises')
        .update({
          title: content.title,
          description: content.description,
          instructions: content.instructions,
          difficulty_level: content.difficulty_level,
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestion.source_content_id);

      if (error) {
        console.error('Error updating exercise:', error);
      }
    } else {
      // Create new exercise
      const { error } = await supabase
        .from('exercises')
        .insert({
          title: content.title,
          description: content.description,
          instructions: content.instructions,
          difficulty_level: content.difficulty_level,
          domain_id: job.domain_id,
          tenant_id: job.tenant_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating exercise:', error);
      }
    }
  }

  /**
   * Format source for display
   */
  private formatSource(suggestion: AISuggestion): string {
    if (suggestion.suggestion_type === 'new') {
      return 'AI Analysis: content generation';
    }
    if (suggestion.original_content?.source) {
      return `File: ${suggestion.original_content.source}`;
    }
    return 'File: uploaded content';
  }

  /**
   * Map numeric difficulty level to string
   */
  private mapDifficultyLevel(level?: number): string {
    if (!level) return 'Unassigned';
    if (level <= 2) return 'Beginner';
    if (level <= 4) return 'Elementary';
    if (level <= 6) return 'Intermediate';
    if (level <= 8) return 'Advanced';
    return 'Expert';
  }

  /**
   * Get counts for review dashboard
   */
  async getReviewCounts(domainId?: string): Promise<{
    concepts: number;
    learningGoals: number;
    exercises: number;
  }> {
    let baseQuery = supabase
      .from('ai_suggestions')
      .select('content_type', { count: 'exact', head: true })
      .eq('review_status', 'pending');

    if (domainId) {
      baseQuery = baseQuery.eq('ai_processing_jobs.domain_id', domainId);
    }

    const [conceptsResult, goalsResult, exercisesResult] = await Promise.all([
      baseQuery.eq('content_type', 'concept'),
      baseQuery.eq('content_type', 'learning_goal'),
      baseQuery.eq('content_type', 'exercise')
    ]);

    return {
      concepts: conceptsResult.count || 0,
      learningGoals: goalsResult.count || 0,
      exercises: exercisesResult.count || 0
    };
  }
}

export const aiSuggestionsService = new AISuggestionsService();