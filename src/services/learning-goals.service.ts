import { supabase } from '@/integrations/supabase/client';

export interface LearningGoal {
  id: string;
  domain_id: string;
  concept_id?: string;
  title: string;
  description?: string;
  bloom_level?: string;
  difficulty_level?: string;
  sequence_number?: number;
  prerequisites?: string[];
  status: 'pending_review' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
  concept?: {
    name: string;
    description?: string;
  };
}

/**
 * Get suggested learning goals for a domain that need review
 */
export async function getSuggestedLearningGoals(domainId: string): Promise<LearningGoal[]> {
  try {
    const { data, error } = await supabase
      .from('learning_goals')
      .select(`
        *,
        concept:concepts!learning_goals_concept_id_fkey(
          name,
          description
        )
      `)
      .eq('domain_id', domainId)
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching learning goals:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSuggestedLearningGoals:', error);
    return [];
  }
}

/**
 * Approve multiple learning goals
 */
export async function approveLearningGoals(learningGoalIds: string[]) {
  try {
    const { data, error } = await supabase
      .from('learning_goals')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .in('id', learningGoalIds);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error approving learning goals:', error);
    return { success: false, error };
  }
}

/**
 * Reject multiple learning goals
 */
export async function rejectLearningGoals(learningGoalIds: string[], reason?: string) {
  try {
    const { data, error } = await supabase
      .from('learning_goals')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .in('id', learningGoalIds);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error rejecting learning goals:', error);
    return { success: false, error };
  }
}

/**
 * Get count of pending learning goals for a domain
 */
export async function getPendingLearningGoalsCount(domainId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('learning_goals')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domainId)
      .eq('status', 'pending_review');

    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error('Error getting learning goals count:', error);
    return 0;
  }
}