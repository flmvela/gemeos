import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CloudUpload, AlertCircle, ChevronDown, ChevronRight, BookOpen, Target, Dumbbell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUploadDropzone } from '@/components/upload/FileUploadDropzone';
import { FileList } from '@/components/upload/FileList';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { useDomains } from '@/hooks/useDomains';
import { useFileUploads, useUploadFiles, useDeleteFileUpload } from '@/hooks/useFileUpload';

type ContentType = 'concept' | 'learning_goal' | 'exercise';

const AdminUpload = () => {
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null);
  const [isFilesExpanded, setIsFilesExpanded] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  
  const { domains, loading: domainsLoading } = useDomains();
  const { data: fileUploads = [], isLoading: filesLoading } = useFileUploads(selectedDomainId);
  const { uploadFiles, isUploading, uploadProgress, clearProgress } = useUploadFiles();
  const deleteFileMutation = useDeleteFileUpload();

  // Set domain from URL parameter when domains are loaded
  useEffect(() => {
    const domainParam = searchParams.get('domain');
    if (domainParam && domains && domains.length > 0 && !selectedDomainId) {
      setSelectedDomainId(domainParam);
    }
  }, [searchParams, domains, selectedDomainId]);

  const selectedDomain = domains?.find(d => d.id === selectedDomainId);

  const handleFilesSelected = (files: File[]) => {
    if (!selectedDomainId || !selectedDomain || !selectedContentType) {
      return;
    }

    uploadFiles({
      files,
      domainId: selectedDomainId,
      domainName: selectedDomain.name,
      contentType: selectedContentType
    });
  };

  const handleDeleteFile = (fileId: string) => {
    deleteFileMutation.mutate(fileId);
  };

  const totalFiles = fileUploads.length;
  const totalSize = fileUploads.reduce((sum, file) => sum + file.file_size, 0);
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const contentTypeCards = [
    {
      type: 'concept' as ContentType,
      title: 'Learning Concepts',
      description: 'Upload documents related to learning concepts and knowledge areas',
      icon: BookOpen,
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      iconColor: 'text-blue-600'
    },
    {
      type: 'learning_goal' as ContentType,
      title: 'Learning Goals',
      description: 'Upload materials defining learning objectives and outcomes',
      icon: Target,
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
      iconColor: 'text-green-600'
    },
    {
      type: 'exercise' as ContentType,
      title: 'Exercises',
      description: 'Upload practice exercises and assessment materials',
      icon: Dumbbell,
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <DynamicBreadcrumb />
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Data</h1>
        <p className="text-muted-foreground mt-2">
          Choose the type of content you want to upload for {selectedDomain?.name || 'the selected learning domain'}.
        </p>
      </div>

      {!selectedContentType ? (
        /* Content Type Selection Cards */
        <div className="grid md:grid-cols-3 gap-6">
          {contentTypeCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Card 
                key={card.type}
                className={`cursor-pointer transition-all duration-200 ${card.color}`}
                onClick={() => setSelectedContentType(card.type)}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 rounded-full bg-white">
                    <IconComponent className={`h-8 w-8 ${card.iconColor}`} />
                  </div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {card.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Upload Area */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-3 py-1">
                {contentTypeCards.find(c => c.type === selectedContentType)?.title}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedContentType(null)}
              >
                Change Type
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <FileUploadDropzone
                onFilesSelected={handleFilesSelected}
                uploadProgress={uploadProgress}
                isUploading={isUploading}
                disabled={!selectedDomainId}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Uploaded Files Section */}
      {selectedDomainId && (
        <>
          <Separator />
          <Collapsible open={isFilesExpanded} onOpenChange={setIsFilesExpanded}>
            <div className="flex items-center justify-between py-2">
              <h3 className="text-lg font-semibold">
                Uploaded Files ({totalFiles})
              </h3>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  {isFilesExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle uploaded files</span>
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-2">
              <FileList
                files={fileUploads}
                loading={filesLoading}
                onDelete={handleDeleteFile}
                isDeleting={deleteFileMutation.isPending}
              />
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </div>
  );
};

export default AdminUpload;