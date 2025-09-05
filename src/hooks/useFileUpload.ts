import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { slugifyDomainName, validateFile } from '@/lib/domainUtils';

export interface FileUpload {
  id: string;
  uploaded_by: string;
  domain_id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  uploaded_by_type: 'admin' | 'teacher';
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// Hook to fetch file uploads for a domain
export const useFileUploads = (domainId?: string) => {
  return useQuery({
    queryKey: ['file-uploads', domainId],
    queryFn: async () => {
      let query = supabase
        .from('file_uploads')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (domainId) {
        query = query.eq('domain_id', domainId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FileUpload[];
    },
    enabled: !!domainId,
  });
};

// Hook to upload files
export const useUploadFiles = () => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async ({ 
      files, 
      domainId, 
      domainName
    }: { 
      files: File[]; 
      domainId: string; 
      domainName: string;
    }) => {
      const results = [];
      const domainSlug = slugifyDomainName(domainName);

      for (const file of files) {
        const fileId = `${file.name}-${Date.now()}`;
        
        try {
          // Validate file
          const validation = validateFile(file);
          if (!validation.isValid) {
            throw new Error(validation.error);
          }

          // Update progress
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: {
              file,
              progress: 0,
              status: 'uploading'
            }
          }));

          // Get current session
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('No authentication session found');
          }

          // Upload to GCS using existing edge function
          console.log('🔍 useFileUpload - About to upload:', {
            fileName: file.name,
            domainSlug
          });
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('domainId', domainId);
          formData.append('domainSlug', domainSlug);

          const { data: uploadData, error: uploadError } = await supabase.functions.invoke('generic-upload', {
            body: formData,
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (uploadError) {
            throw uploadError;
          }

          if (!uploadData.success) {
            throw new Error(uploadData.error || 'Upload failed');
          }

          console.log('File uploaded successfully:', {
            fileName: file.name,
            gcsPath: uploadData.gcsPath,
            responsePath: uploadData.storagePath
          });

          const data = uploadData;

          // Update progress to completed
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: {
              file,
              progress: 100,
              status: 'completed'
            }
          }));

          results.push(data.upload);

        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          
          // Update progress to error
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: {
              file,
              progress: 0,
              status: 'error',
              error: error.message
            }
          }));

          throw error;
        }
      }

      return results;
    },
    onSuccess: (results) => {
      toast({
        title: "Upload Successful",
        description: `${results.length} file(s) uploaded successfully`,
      });
      
      // Invalidate queries to refresh the file list
      queryClient.invalidateQueries({ queryKey: ['file-uploads'] });
      
      // Clear upload progress after a delay
      setTimeout(() => {
        setUploadProgress({});
      }, 3000);
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    uploadFiles: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    uploadProgress,
    clearProgress: () => setUploadProgress({}),
  };
};

// Hook to delete a file upload
export const useDeleteFileUpload = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uploadId: string) => {
      const { error } = await supabase
        .from('file_uploads')
        .delete()
        .eq('id', uploadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "File Deleted",
        description: "File upload record has been deleted",
      });
      queryClient.invalidateQueries({ queryKey: ['file-uploads'] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};