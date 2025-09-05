import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DomainExtractedFile {
  id: string;
  domain_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  mime_type?: string;
  extracted_text?: string;
  bucket_path?: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Hook to get domain extracted files
export const useDomainExtractedFiles = (domainId?: string) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['domain-extracted-files', domainId],
    queryFn: async () => {
      let query = supabase
        .from('domain_extracted_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (domainId) {
        query = query.eq('domain_id', domainId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching domain extracted files:', error);
        toast({
          title: "Error",
          description: "Failed to fetch extracted files",
          variant: "destructive",
        });
        throw error;
      }

      return data as DomainExtractedFile[];
    },
    enabled: true,
  });
};

// Hook to update extraction status (admin only)
export const useUpdateExtractionStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      extractedText 
    }: { 
      id: string; 
      status: 'pending' | 'approved' | 'rejected';
      extractedText?: string;
    }) => {
      const updates: any = { status };
      if (extractedText !== undefined) {
        updates.extracted_text = extractedText;
      }

      const { data, error } = await supabase
        .from('domain_extracted_files')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain-extracted-files'] });
      toast({
        title: "Success",
        description: "Extraction status updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating extraction status:', error);
      toast({
        title: "Error",
        description: "Failed to update extraction status",
        variant: "destructive",
      });
    },
  });
};

// Hook to delete extraction record (admin only)
export const useDeleteExtractionRecord = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('domain_extracted_files')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain-extracted-files'] });
      toast({
        title: "Success",
        description: "Extraction record deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting extraction record:', error);
      toast({
        title: "Error",
        description: "Failed to delete extraction record",
        variant: "destructive",
      });
    },
  });
};