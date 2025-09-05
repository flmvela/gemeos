import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DomainStats {
  learningGoalsCount: number;
  conceptsCount: number;
  exercisesCount: number;
}

export const useDomainStats = (domainId: string) => {
  const [stats, setStats] = useState<DomainStats>({
    learningGoalsCount: 0,
    conceptsCount: 0,
    exercisesCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch concepts count (approved + suggested + confirmed)
      const { count: conceptsCount, error: conceptsError } = await supabase
        .from('concepts')
        .select('*', { count: 'exact', head: true })
        .eq('domain_id', domainId)
        .in('status', ['approved', 'suggested', 'confirmed']);

      if (conceptsError) throw conceptsError;

      // Fetch concept IDs in this domain to count learning goals
      const { data: conceptIdRows, error: conceptIdsError } = await supabase
        .from('concepts')
        .select('id')
        .eq('domain_id', domainId);

      if (conceptIdsError) throw conceptIdsError;

      const conceptIds = (conceptIdRows || []).map((c) => c.id);

      // Count learning goals linked to concepts in this domain
      let learningGoalsCount = 0;
      if (conceptIds.length > 0) {
        const { count, error: learningGoalsError } = await (supabase as any)
          .from('learning_goals')
          .select('*', { count: 'exact', head: true })
          .in('concept_id', conceptIds);

        if (learningGoalsError) throw learningGoalsError;
        learningGoalsCount = count || 0;
      }

      // Exercises count - placeholder for now
      const exercisesCount = 0;

      setStats({
        learningGoalsCount,
        conceptsCount: conceptsCount || 0,
        exercisesCount,
      });
    } catch (error) {
      console.error('Error fetching domain stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch domain statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (domainId) {
      fetchStats();
    }
  }, [domainId]);

  return {
    stats,
    loading,
    refetch: fetchStats,
  };
};

export const useAllDomainsStats = () => {
  const [domainsStats, setDomainsStats] = useState<Record<string, DomainStats>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all domains first
      const { data: domains, error: domainsError } = await supabase
        .from('domains')
        .select('id');

      if (domainsError) throw domainsError;

      // Fetch stats for each domain
      const statsPromises = domains?.map(async (domain) => {
        // Concepts count (approved + suggested + confirmed)
        const { count: conceptsCount, error: conceptsError } = await supabase
          .from('concepts')
          .select('*', { count: 'exact', head: true })
          .eq('domain_id', domain.id)
          .in('status', ['approved', 'suggested', 'confirmed']);

        if (conceptsError) throw conceptsError;

        // Fetch concept IDs in this domain
        const { data: conceptIdRows, error: conceptIdsError } = await supabase
          .from('concepts')
          .select('id')
          .eq('domain_id', domain.id);

        if (conceptIdsError) throw conceptIdsError;

        const conceptIds = (conceptIdRows || []).map((c) => c.id);

        // Learning goals count for concepts in this domain
        let learningGoalsCount = 0;
        if (conceptIds.length > 0) {
          const { count, error: learningGoalsError } = await (supabase as any)
            .from('learning_goals')
            .select('*', { count: 'exact', head: true })
            .in('concept_id', conceptIds);

          if (learningGoalsError) throw learningGoalsError;
          learningGoalsCount = count || 0;
        }

        return {
          domainId: domain.id,
          stats: {
            learningGoalsCount,
            conceptsCount: conceptsCount || 0,
            exercisesCount: 0, // Placeholder
          }
        };
      }) || [];

      const results = await Promise.all(statsPromises);
      const statsMap = results.reduce((acc, result) => {
        acc[result.domainId] = result.stats;
        return acc;
      }, {} as Record<string, DomainStats>);

      setDomainsStats(statsMap);
    } catch (error) {
      console.error('Error fetching all domains stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch domains statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStats();
  }, []);

  return {
    domainsStats,
    loading,
    refetch: fetchAllStats,
  };
};