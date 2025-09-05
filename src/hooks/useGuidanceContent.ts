import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GuidanceContent {
  content: string;
  exists: boolean;
}

export const useGuidanceContent = (domainId: string, domainName: string, area: string) => {
  const [guidanceContent, setGuidanceContent] = useState<GuidanceContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGuidanceContent = useCallback(async () => {
    if (!domainId || !domainName || !area) {
      console.log('Missing parameters:', { domainId, domainName, area });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('get-guidance-content', {
        body: { domainName, area }
      });

      if (functionError) {
        throw functionError;
      }

      setGuidanceContent(data);
    } catch (err) {
      console.error('Error fetching guidance content:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch guidance content');
    } finally {
      setLoading(false);
    }
  }, [domainId, domainName, area]);

  useEffect(() => {
    fetchGuidanceContent();
  }, [fetchGuidanceContent]);

  const saveGuidanceContent = async (content: string): Promise<boolean> => {
    try {
      const { data, error: functionError } = await supabase.functions.invoke('save-guidance-content', {
        body: { domainName, area, content }
      });

      if (functionError) {
        throw functionError;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to save guidance content');
      }

      // Update local state after successful save
      setGuidanceContent({ content, exists: true });
      return true;
    } catch (err) {
      console.error('Error saving guidance content:', err);
      return false;
    }
  };

  return {
    guidanceContent,
    loading,
    error,
    refetch: fetchGuidanceContent,
    saveContent: saveGuidanceContent
  };
};