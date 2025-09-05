import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConceptExample } from '@/components/guidance/ExamplesManager';
import { useToast } from '@/hooks/use-toast';

export const useConceptExamples = (domainId: string, domainName: string, area: string) => {
  const [examples, setExamples] = useState<ConceptExample[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchExamples = useCallback(async () => {
    if (!domainId || !domainName || !area) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('get-guidance-content', {
        body: { 
          domainName,
          area,
          type: 'examples' // Add type parameter to distinguish from guidance content
        }
      });

      if (functionError) {
        throw functionError;
      }

      if (data?.content) {
        // Parse JSONL content - handle both old format and new Gemini format
        const lines = data.content.split('\n').filter((line: string) => line.trim());
        const parsedExamples: ConceptExample[] = [];
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            
            // Check if it's the new Gemini format (input/output structure)
            if (parsed.input && parsed.output) {
              const inputText = typeof parsed.input === 'string' 
                ? parsed.input 
                : JSON.stringify(parsed.input, null, 2);
              parsedExamples.push({
                id: crypto.randomUUID(),
                snippet: inputText,
                concepts: parsed.output.concepts || [],
                notes: parsed.output.notes,
                difficulty: parsed.output.difficulty,
                bloom_level: parsed.output.bloom_level,
                sequence_order: parsed.output.sequence_order,
                created_at: new Date().toISOString()
              });
            } else if (parsed.snippet) {
              // Old format - use as-is
              parsedExamples.push(parsed);
            }
          } catch (err) {
            console.warn('Failed to parse example line:', line);
          }
        }
        
        setExamples(parsedExamples);
      } else {
        setExamples([]);
      }
    } catch (err) {
      console.error('Error fetching examples:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch examples');
      setExamples([]);
    } finally {
      setLoading(false);
    }
  }, [domainId, domainName, area]);

  const saveExamples = useCallback(async (updatedExamples: ConceptExample[]) => {
    try {
      // Convert examples to Gemini-compatible JSONL format
      const jsonlContent = updatedExamples
        .map(example => JSON.stringify({
          input: example.snippet,
          output: {
            concepts: example.concepts,
            notes: example.notes,
            difficulty: example.difficulty,
            bloom_level: example.bloom_level,
            sequence_order: example.sequence_order
          }
        }))
        .join('\n');

      const { error: functionError } = await supabase.functions.invoke('save-guidance-content', {
        body: {
          domainName,
          area,
          content: jsonlContent,
          type: 'examples'
        }
      });

      if (functionError) {
        throw functionError;
      }

      setExamples(updatedExamples);
      
      toast({
        title: "Success",
        description: "Examples saved successfully",
      });

      return true;
    } catch (error) {
      console.error('Error saving examples:', error);
      toast({
        title: "Error",
        description: "Failed to save examples",
        variant: "destructive",
      });
      return false;
    }
  }, [domainName, area, toast]);

  const deleteExample = useCallback(async (exampleId: string) => {
    try {
      const updatedExamples = examples.filter(ex => ex.id !== exampleId);
      await saveExamples(updatedExamples);
    } catch (error) {
      console.error('Error deleting example:', error);
      toast({
        title: "Error",
        description: "Failed to delete example",
        variant: "destructive",
      });
    }
  }, [examples, saveExamples, toast]);

  useEffect(() => {
    fetchExamples();
  }, [fetchExamples]);

  return {
    examples,
    loading,
    error,
    saveExamples,
    deleteExample,
    refetch: fetchExamples
  };
};