import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ConceptExtractionResult {
  conceptsInserted: number;
  duplicatesSkipped: number;
  skippedDetails: Array<{
    name: string;
    reason: string;
    similarTo?: string;
  }>;
}

export const useConceptExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();

  const extractConceptsFromText = async (
    conceptsText: string,
    domainId: string,
    fileId?: string
  ): Promise<ConceptExtractionResult> => {
    setIsExtracting(true);
    
    try {
      console.log('Extracting concepts with duplicate check for domain:', domainId);
      
      const { data, error } = await supabase.functions.invoke('extract-concepts-with-duplicate-check', {
        body: {
          domainId,
          conceptsText,
          fileId,
        },
      });

      if (error) {
        console.error('Error extracting concepts:', error);
        throw error;
      }

      console.log('Concept extraction completed:', data);
      
      const result = data as ConceptExtractionResult;
      
      // Show summary toast
      if (result.conceptsInserted > 0 || result.duplicatesSkipped > 0) {
        toast({
          title: "Concept Extraction Complete",
          description: `${result.conceptsInserted} new concepts suggested. ${result.duplicatesSkipped} duplicates skipped.`,
        });
      } else {
        toast({
          title: "No New Concepts",
          description: "All concepts in the file already exist or are too similar to existing ones.",
        });
      }

      return result;
    } catch (error: any) {
      console.error('Failed to extract concepts:', error);
      
      toast({
        title: "Concept Extraction Failed",
        description: error.message || "There was an error extracting concepts. Please try again.",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsExtracting(false);
    }
  };

  const extractConceptsFromFile = async (
    fileContent: string,
    domainId: string,
    fileId?: string
  ): Promise<ConceptExtractionResult> => {
    // For file-based extraction, we can parse the content and then call the text extraction
    return extractConceptsFromText(fileContent, domainId, fileId);
  };

  return {
    extractConceptsFromText,
    extractConceptsFromFile,
    isExtracting,
  };
};