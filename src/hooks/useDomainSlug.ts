/**
 * Domain Slug Resolution Hook
 * Handles both UUID and slug identifiers for domain routing
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DomainInfo {
  id: string;
  slug: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface UseDomainSlugReturn {
  domain: DomainInfo | null;
  loading: boolean;
  error: string | null;
  isValidIdentifier: boolean;
}

/**
 * Hook to resolve domain by either UUID or slug
 * @param identifier - Either a UUID or slug string
 * @returns Domain information and loading state
 */
export const useDomainSlug = (identifier: string): UseDomainSlugReturn => {
  const [domain, setDomain] = useState<DomainInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidIdentifier, setIsValidIdentifier] = useState(false);

  useEffect(() => {
    if (!identifier) {
      setLoading(false);
      return;
    }

    const fetchDomain = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if identifier is a UUID (36 chars with hyphens)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
        
        let query = supabase
          .from('domains')
          .select('*');

        if (isUUID) {
          // Query by ID
          query = query.eq('id', identifier);
        } else {
          // Query by slug (assuming you have a slug field, otherwise use name)
          // For now, we'll try to match by a slug-like name or create a slug from name
          query = query.ilike('name', identifier.replace(/-/g, ' '));
        }

        const { data, error: fetchError } = await query.single();

        if (fetchError) {
          // If not found by slug, try a more flexible search
          if (!isUUID) {
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('domains')
              .select('*')
              .ilike('name', `%${identifier.replace(/-/g, ' ')}%`)
              .limit(1)
              .single();

            if (fallbackError) {
              throw new Error(`Domain not found: ${identifier}`);
            }
            
            if (fallbackData) {
              setDomain(fallbackData);
              setIsValidIdentifier(true);
              return;
            }
          }
          throw fetchError;
        }

        setDomain(data);
        setIsValidIdentifier(true);
      } catch (err) {
        console.error('Error fetching domain:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch domain');
        setIsValidIdentifier(false);
      } finally {
        setLoading(false);
      }
    };

    fetchDomain();
  }, [identifier]);

  return { domain, loading, error, isValidIdentifier };
};

/**
 * Utility function to convert domain name to URL slug
 * @param name - Domain name
 * @returns URL-friendly slug
 */
export const domainNameToSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

/**
 * Utility function to convert slug back to readable name
 * @param slug - URL slug
 * @returns Human-readable name
 */
export const slugToDomainName = (slug: string): string => {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Hook specifically for getting all domains with slug information
 */
export const useDomainsWithSlugs = () => {
  const [domains, setDomains] = useState<(DomainInfo & { slug: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('domains')
          .select('*')
          .order('name');

        if (fetchError) throw fetchError;

        // Add slug to each domain
        const domainsWithSlugs = data.map(domain => ({
          ...domain,
          slug: domainNameToSlug(domain.name)
        }));

        setDomains(domainsWithSlugs);
      } catch (err) {
        console.error('Error fetching domains:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch domains');
      } finally {
        setLoading(false);
      }
    };

    fetchDomains();
  }, []);

  return { domains, loading, error };
};