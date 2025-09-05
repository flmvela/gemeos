import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTriggerConceptStructuring = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const triggerStructuring = async (domainId: string, domainSlug: string) => {
    setIsLoading(true);
    
    try {
      console.log('Triggering concept structuring for domain:', domainSlug);
      
      const { data, error } = await supabase.functions.invoke('trigger-concept-structuring', {
        body: {
          domain_id: domainId,
          domain_slug: domainSlug,
        },
      });

      if (error) {
        console.error('Error triggering concept structuring:', error);
        throw error;
      }

      console.log('Concept structuring triggered successfully:', data);
      
      toast({
        title: "AI Analysis Started",
        description: "The AI is analyzing your concepts to suggest better hierarchical structures. Check back in a few minutes for results.",
      });

      return data;
    } catch (error: any) {
      console.error('Failed to trigger concept structuring:', error);
      
      toast({
        title: "Failed to Start AI Analysis",
        description: error.message || "There was an error starting the AI concept analysis. Please try again.",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    triggerStructuring,
    isLoading,
  };
};