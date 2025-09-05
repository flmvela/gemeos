
import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type LearningGoal = {
  id: string;
  concept_id: string | null;
  goal_description: string;
  bloom_level: string | null;
  goal_type: string | null;
  sequence_order: number | null;
  status: string;
  created_at: string;
  metadata_json: any;
};

export const useLearningGoals = (domainId?: string) => {
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchGoals = useCallback(async () => {
    if (!domainId) return;
    setLoading(true);

    // learning_goals has no domain_id; get concept IDs for this domain first
    const { data: concepts, error: conceptsError } = await supabase
      .from('concepts')
      .select('id')
      .eq('domain_id', domainId);

    if (conceptsError) {
      console.error('Failed to load concepts for domain:', conceptsError);
      setLoading(false);
      throw conceptsError;
    }

    const conceptIds = (concepts || []).map(c => c.id);
    if (conceptIds.length === 0) {
      setGoals([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('learning_goals')
      .select('id, concept_id, goal_description, bloom_level, goal_type, sequence_order, status, created_at, metadata_json')
      .in('concept_id', conceptIds)
      .in('status', ['suggested', 'approved', 'rejected'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load learning goals:', error);
      setLoading(false);
      throw error;
    }
    setGoals(data || []);
    setLoading(false);
  }, [domainId]);

  useEffect(() => {
    fetchGoals().catch(() => void 0);
  }, [fetchGoals]);

  const groupedByConcept = useMemo(() => {
    const map = new Map<string, LearningGoal[]>();
    for (const g of goals) {
      const key = g.concept_id || 'unlinked';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    }
    return map;
  }, [goals]);

  const approveGoal = async (goalId: string) => {
    const { error } = await supabase.from('learning_goals').update({ status: 'approved' }).eq('id', goalId);
    if (error) {
      console.error('Approve goal failed:', error);
      throw error;
    }
    toast({ title: 'Goal approved' });
    await fetchGoals();
  };

  const rejectGoal = async (goalId: string) => {
    const { error } = await supabase.from('learning_goals').update({ status: 'rejected' }).eq('id', goalId);
    if (error) {
      console.error('Reject goal failed:', error);
      throw error;
    }
    toast({ title: 'Goal rejected' });
    await fetchGoals();
  };

  const editGoal = async (goalId: string, description: string) => {
    const { error } = await supabase.from('learning_goals').update({ goal_description: description }).eq('id', goalId);
    if (error) {
      console.error('Edit goal failed:', error);
      throw error;
    }
    toast({ title: 'Goal updated' });
    await fetchGoals();
  };

  return {
    goals,
    groupedByConcept,
    loading,
    refresh: fetchGoals,
    approveGoal,
    rejectGoal,
    editGoal,
  };
};
