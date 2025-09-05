import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { slugifyDomainName } from '@/lib/domainUtils';

export interface GuidanceArea {
  key: string;
  title: string;
  gcsPath: string;
  exists: boolean;
  lastModified: string | null;
}

export interface GuidanceStatus {
  domainId: string;
  areas: GuidanceArea[];
}

export const useGuidanceStatus = (domainId: string, domainName?: string) => {
  const [guidanceStatus, setGuidanceStatus] = useState<GuidanceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGuidanceStatus = useCallback(async () => {
    if (!domainId) return;

    setLoading(true);
    setError(null);

    try {
      // Use domain name directly for GCS path, fallback to domain ID
      const gcsPath = domainName || domainId;
      
      const { data, error: functionError } = await supabase.functions.invoke('check-guidance-status', {
        body: { domainId: gcsPath }
      });

      if (functionError) {
        throw functionError;
      }

      setGuidanceStatus(data);
    } catch (err) {
      console.error('Error fetching guidance status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch guidance status');
    } finally {
      setLoading(false);
    }
  }, [domainId, domainName]);

  useEffect(() => {
    fetchGuidanceStatus();
  }, [fetchGuidanceStatus]);

  return {
    guidanceStatus,
    loading,
    error,
    refetch: fetchGuidanceStatus
  };
};