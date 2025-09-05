
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FeedbackConfig {
  id: string;
  domain_id: string;
  aspect: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeedbackData {
  approved_items: string[];
  rejected_items: string[];
}

export const useFeedbackConfig = () => {
  const [configs, setConfigs] = useState<FeedbackConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('domain_feedback_config')
        .select('*')
        .order('domain_id', { ascending: true })
        .order('aspect', { ascending: true });

      if (fetchError) throw fetchError;
      setConfigs(data || []);
    } catch (err) {
      console.error('Error fetching feedback configs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch feedback configs');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (id: string, is_enabled: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('domain_feedback_config')
        .update({ is_enabled })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update local state
      setConfigs(prev => prev.map(config => 
        config.id === id ? { ...config, is_enabled } : config
      ));
    } catch (err) {
      console.error('Error updating feedback config:', err);
      setError(err instanceof Error ? err.message : 'Failed to update feedback config');
    }
  };

  const getFeedbackData = async (domain_id: string, aspect: string): Promise<FeedbackData> => {
    // First check if feedback is enabled for this domain/aspect
    const { data: configData } = await supabase
      .from('domain_feedback_config')
      .select('is_enabled')
      .eq('domain_id', domain_id)
      .eq('aspect', aspect)
      .maybeSingle();

    if (!configData?.is_enabled) {
      return { approved_items: [], rejected_items: [] };
    }

    let approved_items: string[] = [];
    let rejected_items: string[] = [];

    try {
      if (aspect === 'concepts') {
        const [approvedRes, rejectedRes] = await Promise.all([
          supabase
            .from('concepts')
            .select('name')
            .eq('domain_id', domain_id)
            .eq('status', 'approved'),
          supabase
            .from('concepts')
            .select('name')
            .eq('domain_id', domain_id)
            .eq('status', 'rejected')
        ]);

        approved_items = approvedRes.data?.map(item => item.name) || [];
        rejected_items = rejectedRes.data?.map(item => item.name) || [];
      } else if (aspect === 'learning_goals') {
        // learning_goals does not have domain_id; derive via concepts in the domain
        const { data: conceptRows, error: conceptErr } = await supabase
          .from('concepts')
          .select('id')
          .eq('domain_id', domain_id);

        if (conceptErr) {
          console.error('Error fetching concepts for learning goals feedback:', conceptErr);
          return { approved_items: [], rejected_items: [] };
        }

        const conceptIds = (conceptRows || []).map(r => r.id);
        if (conceptIds.length === 0) {
          return { approved_items: [], rejected_items: [] };
        }

        const [approvedRes, rejectedRes] = await Promise.all([
          supabase
            .from('learning_goals')
            .select('goal_description, concept_id, status')
            .in('concept_id', conceptIds)
            .eq('status', 'approved'),
          supabase
            .from('learning_goals')
            .select('goal_description, concept_id, status')
            .in('concept_id', conceptIds)
            .eq('status', 'rejected')
        ]);

        approved_items = approvedRes.data?.map(item => item.goal_description) || [];
        rejected_items = rejectedRes.data?.map(item => item.goal_description) || [];
      }
    } catch (err) {
      console.error('Error fetching feedback data:', err);
    }

    return { approved_items, rejected_items };
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  return {
    configs,
    loading,
    error,
    refetch: fetchConfigs,
    updateConfig,
    getFeedbackData
  };
};
