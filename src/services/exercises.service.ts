import { supabase } from '@/integrations/supabase/client';

export interface Exercise {
  id: string;
  domain_id: string;
  learning_goal_id?: string;
  name: string;
  description?: string;
  exercise_type?: string;
  difficulty_level?: string;
  sequence_number?: number;
  prerequisites?: string[];
  status: 'pending_review' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
  learning_goal?: {
    title: string;
    description?: string;
  };
}

/**
 * Get suggested exercises for a domain that need review
 */
export async function getSuggestedExercises(domainId: string): Promise<Exercise[]> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select(`
        *,
        learning_goal:learning_goals!exercises_learning_goal_id_fkey(
          title,
          description
        )
      `)
      .eq('domain_id', domainId)
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching exercises:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSuggestedExercises:', error);
    return [];
  }
}

/**
 * Approve multiple exercises
 */
export async function approveExercises(exerciseIds: string[]) {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .in('id', exerciseIds);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error approving exercises:', error);
    return { success: false, error };
  }
}

/**
 * Reject multiple exercises
 */
export async function rejectExercises(exerciseIds: string[], reason?: string) {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .in('id', exerciseIds);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error rejecting exercises:', error);
    return { success: false, error };
  }
}

/**
 * Get count of pending exercises for a domain
 */
export async function getPendingExercisesCount(domainId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domainId)
      .eq('status', 'pending_review');

    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error('Error getting exercises count:', error);
    return 0;
  }
}