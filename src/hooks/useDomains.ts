import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Domain {
  id: string;
  name: string;
  description: string;
  icon_name?: string;
  created_at: string;
  updated_at: string;
}

export const useDomains = (tenantId?: string) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDomains = async () => {
    try {
      setLoading(true);
      
      if (tenantId) {
        // Tenant-specific domains from tenant_domains
        const { data, error } = await supabase
          .from('domains')
          .select(`
            *,
            tenant_domains!inner(
              tenant_id,
              is_active
            )
          `)
          .eq('tenant_domains.tenant_id', tenantId)
          .eq('tenant_domains.is_active', true)
          .order('name');
        
        if (error) throw error;
        setDomains(data || []);
      } else {
        // Platform admin - all domains
        const { data, error } = await supabase
          .from('domains')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setDomains(data || []);
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast({
        title: "Error",
        description: "Failed to fetch domains",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDomain = async (domainData: { id: string; name: string; description: string; icon_name?: string }) => {
    try {
      const { data, error } = await supabase
        .from('domains')
        .insert(domainData)
        .select()
        .single();

      if (error) throw error;

      setDomains(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Domain created successfully",
      });
      return data;
    } catch (error) {
      console.error('Error creating domain:', error);
      toast({
        title: "Error",
        description: "Failed to create domain",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateDomain = async (id: string, updates: { name?: string; description?: string; icon_name?: string }) => {
    try {
      const { data, error } = await supabase
        .from('domains')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setDomains(prev => prev.map(domain => 
        domain.id === id ? data : domain
      ));
      toast({
        title: "Success",
        description: "Domain updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Error updating domain:', error);
      toast({
        title: "Error",
        description: "Failed to update domain",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteDomain = async (id: string) => {
    try {
      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDomains(prev => prev.filter(domain => domain.id !== id));
      toast({
        title: "Success",
        description: "Domain deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting domain:', error);
      toast({
        title: "Error",
        description: "Failed to delete domain",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchDomains();
  }, [tenantId]);

  return {
    domains,
    loading,
    createDomain,
    updateDomain,
    deleteDomain,
    refetch: fetchDomains,
  };
};