import React, { useState, useEffect } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MasterConceptUploadProps {
  domainId: string;
  domainSlug: string;
  domainName: string;
  onUploadComplete: () => void;
  onImportComplete: () => void;
}

export const MasterConceptUpload: React.FC<MasterConceptUploadProps> = ({
  domainId,
  domainSlug,
  domainName,
  onUploadComplete,
  onImportComplete
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const { toast } = useToast();

  // Check if file already exists on mount
  useEffect(() => {
    const checkExistingFile = async () => {
      try {
        const { data: files, error } = await supabase
          .from('file_uploads')
          .select('*')
          .eq('domain_id', domainId)
          .eq('file_name', 'master_concept_list.md')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error checking existing file:', error);
          return;
        }

        if (files && files.length > 0) {
          console.log('🔍 Found existing upload:', files[0]);
          setUploadComplete(true);
        }
      } catch (error) {
        console.error('Error checking existing file:', error);
      }
    };

    checkExistingFile();
  }, [domainId]);

  useEffect(() => {
    console.log('🔍 MasterConceptUpload state:', {
      uploadComplete,
      isUploading,
      isImporting,
      hasFile: !!uploadedFile
    });
  }, [uploadComplete, isUploading, isImporting, uploadedFile]);

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.name.endsWith('.md')) {
      setUploadedFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a .md (Markdown) file.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    fileRejections
  } = useDropzone({
    onDrop,
    disabled: isUploading || uploadComplete,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: {
      'text/markdown': ['.md'],
      'text/plain': ['.md']
    },
    multiple: false
  });

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Create FormData for the upload with the correct path structure
      const formData = new FormData();
      // Create a new file with the correct name for the guidance system
      const guidanceFile = new File([uploadedFile], 'master_concept_list.md', { type: uploadedFile.type });
      formData.append('file', guidanceFile);
      formData.append('domainId', domainId);
      formData.append('domainSlug', domainSlug || domainId);
      formData.append('targetPath', `${domainId}/guidance/concepts/master_concept_list.md`);

      // Call edge function to upload to GCS
      const { data, error } = await supabase.functions.invoke('upload-to-gcs', {
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      setUploadComplete(true);
      console.log('🎯 Upload completed, uploadComplete state set to true');
      toast({
        title: "Upload successful",
        description: "Master concept list uploaded successfully.",
      });
      onUploadComplete();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload the master concept list.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);

    try {
      const { data, error } = await supabase.functions.invoke('clear-and-reimport-concepts', {
        body: { domainId }
      });

      if (error) throw error;

      toast({
        title: "Import successful",
        description: `Imported ${data?.conceptCount || 0} concepts successfully.`,
      });
      onImportComplete();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "Failed to import concepts from the master list.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <FileText className="h-6 w-6" />
            <span>Initialize Concept Map</span>
          </CardTitle>
          <CardDescription>
            Upload the master_concept_list.md file for the <strong>{domainName}</strong> domain 
            to create the foundational concept hierarchy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!uploadComplete ? (
            <>
              {/* Upload Section */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : isUploading
                    ? 'border-muted bg-muted/20 pointer-events-none opacity-50'
                    : 'border-border hover:border-primary/50 hover:bg-muted/20'
                }`}
              >
                <input {...getInputProps()} />
                
                <div className="space-y-4">
                  <Upload className={`mx-auto h-12 w-12 ${
                    isDragActive ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  
                  {isDragActive ? (
                    <p className="text-primary font-medium text-lg">Drop your master_concept_list.md file here...</p>
                  ) : (
                    <>
                      <p className="font-medium text-lg">
                        Drag & drop master_concept_list.md here, or click to select
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Only .md (Markdown) files accepted (max 10MB)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* File Rejection Errors */}
              {fileRejections.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {fileRejections[0]?.errors[0]?.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Selected File */}
              {uploadedFile && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Uploading...</span>
                        <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  <Button 
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full"
                    size="lg"
                  >
                    {isUploading ? 'Uploading...' : 'Upload Master Concept List'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Import Section */
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-medium">Upload Complete!</span>
              </div>
              
              <p className="text-muted-foreground">
                Your master concept list has been uploaded successfully. 
                Click the button below to import and structure the concepts.
              </p>

              <Button 
                onClick={handleImport}
                disabled={isImporting}
                className="w-full"
                size="lg"
              >
                {isImporting ? 'Importing Concepts...' : 'Import Concepts from Master List'}
              </Button>
            </div>
          )}

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>File Format:</strong> The master concept list should be a Markdown file with 
              hierarchical structure using indentation (2 spaces per level) to define parent-child relationships.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};