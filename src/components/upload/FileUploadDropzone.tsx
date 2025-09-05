import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatFileSize } from '@/lib/domainUtils';
import { UploadProgress } from '@/hooks/useFileUpload';

interface FileUploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  uploadProgress: Record<string, UploadProgress>;
  isUploading: boolean;
  disabled?: boolean;
}

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  onFilesSelected,
  uploadProgress,
  isUploading,
  disabled = false
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    fileRejections
  } = useDropzone({
    onDrop,
    disabled: disabled || isUploading,
    maxSize: 50 * 1024 * 1024, // 50MB
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'video/mp4': ['.mp4'],
      'video/avi': ['.avi']
    }
  });

  const progressEntries = Object.entries(uploadProgress);

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <Card className={`border-2 border-dashed transition-all duration-200 ${
        isDragActive 
          ? 'border-primary bg-primary/5' 
          : disabled || isUploading
          ? 'border-muted bg-muted/20'
          : 'border-border hover:border-primary/50'
      }`}>
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`text-center cursor-pointer ${
              disabled || isUploading ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            <input {...getInputProps()} />
            
            <div className="mx-auto w-12 h-12 mb-4">
              <Upload 
                className={`w-full h-full ${
                  isDragActive ? 'text-primary' : 'text-muted-foreground'
                }`} 
              />
            </div>
            
            <div className="space-y-2">
              {isDragActive ? (
                <p className="text-lg font-medium text-primary">
                  Drop the files here...
                </p>
              ) : (
                <>
                  <p className="text-lg font-medium">
                    Drag & drop files here, or click to select
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports PDF, Word, Excel, PowerPoint, images, audio, and video files
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 50MB
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Upload Progress */}
      {progressEntries.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Upload Progress</h4>
          {progressEntries.map(([fileId, progress]) => (
            <Card key={fileId} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {progress.file.name}
                  </span>
                  <Badge variant={
                    progress.status === 'completed' ? 'default' :
                    progress.status === 'error' ? 'destructive' :
                    'secondary'
                  }>
                    {progress.status}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  {formatFileSize(progress.file.size)}
                </span>
              </div>
              
              {progress.status === 'uploading' && (
                <Progress value={progress.progress} className="mb-2" />
              )}
              
              {progress.error && (
                <p className="text-xs text-destructive mt-1">{progress.error}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};