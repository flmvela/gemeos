import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDropzone } from 'react-dropzone';
import { formatFileSize, validateFile } from '@/lib/domainUtils';
import { useUploadFiles, UploadProgress } from '@/hooks/useFileUpload';

interface TeacherFileUploadProps {
  domainId: string;
  domainName: string;
  onUploadComplete?: () => void;
}

export const TeacherFileUpload: React.FC<TeacherFileUploadProps> = ({
  domainId,
  domainName,
  onUploadComplete
}) => {
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const { uploadFiles: performUpload, isUploading, uploadProgress } = useUploadFiles();

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];

    acceptedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      // You could show these errors in a toast or alert
      console.error('File validation errors:', errors);
    }

    setUploadFiles(validFiles);
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    fileRejections
  } = useDropzone({
    onDrop,
    disabled: isUploading,
    maxSize: 50 * 1024 * 1024, // 50MB
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'video/mp4': ['.mp4']
    }
  });

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    try {
      await performUpload({
        files: uploadFiles,
        domainId,
        domainName
      });
      
      // Clear uploaded files on success
      setUploadFiles([]);
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const progressEntries = Object.entries(uploadProgress);
  const hasProgressItems = progressEntries.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Upload Training Materials</span>
        </CardTitle>
        <CardDescription>
          Upload files to enhance AI training for the <strong>{domainName}</strong> domain. 
          Files will be automatically processed and integrated into the learning system.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : isUploading
              ? 'border-muted bg-muted/20 pointer-events-none opacity-50'
              : 'border-border hover:border-primary/50 hover:bg-muted/20'
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-2">
            <Upload className={`mx-auto h-8 w-8 ${
              isDragActive ? 'text-primary' : 'text-muted-foreground'
            }`} />
            
            {isDragActive ? (
              <p className="text-primary font-medium">Drop your files here...</p>
            ) : (
              <>
                <p className="font-medium">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, Word, Excel, images, audio, and video files accepted (max 50MB)
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
              <div className="space-y-1">
                {fileRejections.map(({ file, errors }) => (
                  <div key={file.name} className="text-sm">
                    <strong>{file.name}:</strong> {errors[0]?.message}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Selected Files */}
        {uploadFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Files ({uploadFiles.length})</h4>
            <div className="space-y-2">
              {uploadFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{file.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(file.size)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={handleUpload}
              disabled={isUploading || uploadFiles.length === 0}
              className="w-full"
            >
              {isUploading ? 'Uploading...' : `Upload ${uploadFiles.length} File${uploadFiles.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        )}

        {/* Upload Progress */}
        {hasProgressItems && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Upload Progress</h4>
            {progressEntries.map(([fileId, progress]) => (
              <div key={fileId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="text-sm truncate">{progress.file.name}</span>
                    <Badge variant={
                      progress.status === 'completed' ? 'default' :
                      progress.status === 'error' ? 'destructive' :
                      'secondary'
                    }>
                      {progress.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {progress.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(progress.file.size)}
                  </span>
                </div>
                
                {progress.status === 'uploading' && (
                  <Progress value={progress.progress} className="h-2" />
                )}
                
                {progress.error && (
                  <p className="text-xs text-destructive">{progress.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>How it works:</strong> Your uploaded files will be processed by our AI system to enhance 
            teaching recommendations and generate domain-specific content for the {domainName} subject area.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};