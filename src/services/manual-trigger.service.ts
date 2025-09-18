import { supabase } from '@/integrations/supabase/client';

interface TriggerResult {
  success: boolean;
  message: string;
  processedCount?: number;
  error?: string;
}

/**
 * Manually trigger processing of learning goals from the Pub/Sub queue
 * @param domainId - The domain ID to process learning goals for
 * @returns Promise with the result of the trigger operation
 */
export async function triggerLearningGoalProcessing(domainId: string): Promise<TriggerResult> {
  try {
    const { data, error } = await supabase.functions.invoke('trigger-manual-processing', {
      body: { 
        domainId,
        contentType: 'learning_goal',
        subscription: 'learning-goal-manual-subscription'
      }
    });

    if (error) throw error;

    return {
      success: true,
      message: data?.message || 'Learning goal processing triggered successfully',
      processedCount: data?.processedCount || 0
    };
  } catch (error) {
    console.error('Error triggering learning goal processing:', error);
    return {
      success: false,
      message: 'Failed to trigger learning goal processing',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Manually trigger processing of exercises from the Pub/Sub queue
 * @param domainId - The domain ID to process exercises for
 * @returns Promise with the result of the trigger operation
 */
export async function triggerExerciseProcessing(domainId: string): Promise<TriggerResult> {
  try {
    const { data, error } = await supabase.functions.invoke('trigger-manual-processing', {
      body: { 
        domainId,
        contentType: 'exercise',
        subscription: 'exercise-manual-subscription'
      }
    });

    if (error) throw error;

    return {
      success: true,
      message: data?.message || 'Exercise processing triggered successfully',
      processedCount: data?.processedCount || 0
    };
  } catch (error) {
    console.error('Error triggering exercise processing:', error);
    return {
      success: false,
      message: 'Failed to trigger exercise processing',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if there are pending items in the queue for processing
 * @param domainId - The domain ID to check
 * @param contentType - Type of content to check
 * @returns Promise with the count of pending items
 */
export async function checkPendingItems(domainId: string, contentType: 'learning_goal' | 'exercise'): Promise<number> {
  try {
    const { data, error } = await supabase.functions.invoke('check-pending-items', {
      body: { 
        domainId,
        contentType,
        subscription: contentType === 'learning_goal' 
          ? 'learning-goal-manual-subscription'
          : 'exercise-manual-subscription'
      }
    });

    if (error) throw error;

    return data?.pendingCount || 0;
  } catch (error) {
    console.error('Error checking pending items:', error);
    return 0;
  }
}