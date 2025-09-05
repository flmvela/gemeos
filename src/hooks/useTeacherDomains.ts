import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TeacherDomain {
  id: string;
  teacher_id: string;
  domain_id: string;
  selected_at: string;
  domain: {
    id: string;
    name: string;
    description: string;
    icon_name?: string;
  };
}

// Hook to get teacher's selected domains
export const useTeacherDomains = () => {
  const [teacherDomains, setTeacherDomains] = useState<TeacherDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTeacherDomains = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teacher_domains')
        .select(`
          *,
          domain:domains(*)
        `)
        .order('selected_at', { ascending: false });

      if (error) throw error;
      setTeacherDomains(data || []);
    } catch (error) {
      console.error('Error fetching teacher domains:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your domain selections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherDomains();
  }, []);

  return {
    teacherDomains,
    loading,
    refetch: fetchTeacherDomains,
  };
};