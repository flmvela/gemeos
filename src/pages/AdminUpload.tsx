import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CloudUpload, 
  AlertCircle, 
  CheckCircle,
  FileText,
  X,
  Loader2,
  BookOpen,
  Target,
  Dumbbell,
  ArrowRight,
  FileIcon,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { useDomains } from '@/hooks/useDomains';
import { cn } from '@/lib/utils';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface ContentGenerationOptions {
  concepts: boolean;
  learningGoals: boolean;
  exercises: boolean;
}

interface ProcessingResult {
  conceptsGenerated: number;
  learningGoalsGenerated: number;
  exercisesGenerated: number;
}

const AdminUpload = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { domains, loading: domainsLoading } = useDomains();
  
  // State management
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string>('');
  
  // Content generation options
  const [generationOptions, setGenerationOptions] = useState<ContentGenerationOptions>({
    concepts: true,
    learningGoals: false,
    exercises: false
  });

  // Set domain from URL parameter when domains are loaded
  useEffect(() => {
    const domainParam = searchParams.get('domain');
    if (domainParam && domains && domains.length > 0 && !selectedDomainId) {
      const domain = domains.find(d => d.slug === domainParam || d.id === domainParam);
      if (domain) {
        setSelectedDomainId(domain.id);
      }
    }
  }, [searchParams, domains, selectedDomainId]);

  const selectedDomain = domains?.find(d => d.id === selectedDomainId);

  // File handling functions
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    // Validate file types
    const validTypes = ['.pdf', '.docx', '.doc', '.txt'];
    const validFiles = files.filter(file => {
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      return validTypes.includes(extension);
    });

    if (validFiles.length !== files.length) {
      setError('Some files were not added. Only PDF, DOCX, and TXT files are supported.');
    }

    // Add valid files to state
    const newFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Processing simulation (will be replaced with actual API calls)
  const handleProcessAndGenerate = async () => {
    if (!selectedDomainId || uploadedFiles.length === 0) {
      setError('Please select a domain and upload at least one file.');
      return;
    }

    if (!generationOptions.concepts && !generationOptions.learningGoals && !generationOptions.exercises) {
      setError('Please select at least one content type to generate.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setProcessingProgress(0);

    // Simulate file upload
    setProcessingStep('Uploading files...');
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      setUploadedFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'uploading' } : f
      ));
      
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadedFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress } : f
        ));
        setProcessingProgress((i * 100 + progress) / (uploadedFiles.length * 3));
      }
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f
      ));
    }

    // Simulate content analysis
    setProcessingStep('Analyzing content structure...');
    setProcessingProgress(33);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate AI generation
    if (generationOptions.concepts) {
      setProcessingStep('Generating concepts...');
      setProcessingProgress(50);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (generationOptions.learningGoals) {
      setProcessingStep('Generating learning goals...');
      setProcessingProgress(66);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (generationOptions.exercises) {
      setProcessingStep('Generating exercises...');
      setProcessingProgress(83);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Simulate completion
    setProcessingStep('Sending to Review AI queue...');
    setProcessingProgress(95);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Set mock results
    setProcessingResult({
      conceptsGenerated: generationOptions.concepts ? 47 : 0,
      learningGoalsGenerated: generationOptions.learningGoals ? 156 : 0,
      exercisesGenerated: generationOptions.exercises ? 89 : 0
    });

    setProcessingProgress(100);
    setIsProcessing(false);
    setProcessingStep('');
  };

  const navigateToReviewAI = () => {
    if (selectedDomain) {
      navigate(`/admin/domains/${selectedDomain.slug}/review-ai`);
    }
  };

  const resetUpload = () => {
    setUploadedFiles([]);
    setProcessingResult(null);
    setError('');
  };

  // Content type cards configuration
  const contentTypeConfig = [
    {
      type: 'concepts' as keyof ContentGenerationOptions,
      title: 'Concepts',
      description: 'Extract and refine key concepts from curriculum',
      icon: BookOpen,
      color: 'blue'
    },
    {
      type: 'learningGoals' as keyof ContentGenerationOptions,
      title: 'Learning Goals',
      description: 'Generate measurable learning objectives',
      icon: Target,
      color: 'green'
    },
    {
      type: 'exercises' as keyof ContentGenerationOptions,
      title: 'Exercises',
      description: 'Create practice exercises and assessments',
      icon: Dumbbell,
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb Navigation */}
      <DynamicBreadcrumb />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg p-6">
        <h1 className="text-2xl font-bold">Upload & Generate AI Content</h1>
        <p className="mt-2 text-cyan-50">
          Upload curriculum documents and let AI generate concepts, learning goals, and exercises for review
        </p>
      </div>

      {/* Success State */}
      {processingResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900">Successfully Generated Content</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {processingResult.conceptsGenerated > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">{processingResult.conceptsGenerated}</div>
                  <div className="text-sm text-gray-600">Concepts</div>
                </div>
              )}
              {processingResult.learningGoalsGenerated > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">{processingResult.learningGoalsGenerated}</div>
                  <div className="text-sm text-gray-600">Learning Goals</div>
                </div>
              )}
              {processingResult.exercisesGenerated > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">{processingResult.exercisesGenerated}</div>
                  <div className="text-sm text-gray-600">Exercises</div>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              All items have been added to the Review AI queue for approval.
            </p>
            <div className="flex gap-3">
              <Button onClick={navigateToReviewAI} className="bg-gradient-to-r from-cyan-500 to-purple-600">
                View in Review AI
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={resetUpload}>
                Upload More Files
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Upload Interface */}
      {!processingResult && (
        <>
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>
                Upload curriculum documents to generate AI content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload Dropzone */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
                  isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-blue-50 hover:border-blue-400",
                  isProcessing && "opacity-50 pointer-events-none"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <CloudUpload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-lg font-medium">Drag and drop your files here</p>
                <p className="text-sm text-gray-600">or</p>
                <label htmlFor="file-upload">
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isProcessing}
                  />
                  <Button variant="link" className="text-blue-600" asChild>
                    <span>click to browse</span>
                  </Button>
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  Supports PDF, DOCX, TXT • Max 10MB per file
                </p>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-3">
                        <FileIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{file.file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === 'uploading' && (
                          <div className="w-24">
                            <Progress value={file.progress} className="h-2" />
                          </div>
                        )}
                        {file.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {file.status === 'pending' && !isProcessing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration Section */}
          <Card>
            <CardHeader>
              <CardTitle>Generation Settings</CardTitle>
              <CardDescription>
                Configure what content to generate from your documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Content Types */}
                <div className="space-y-4">
                  <Label>Content Types to Generate</Label>
                  <div className="space-y-3">
                    {contentTypeConfig.map(config => {
                      const IconComponent = config.icon;
                      return (
                        <div
                          key={config.type}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer",
                            generationOptions[config.type]
                              ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-500"
                              : "bg-white border-gray-200 hover:border-gray-300"
                          )}
                          onClick={() => setGenerationOptions(prev => ({
                            ...prev,
                            [config.type]: !prev[config.type]
                          }))}
                        >
                          <Checkbox
                            checked={generationOptions[config.type]}
                            onCheckedChange={(checked) => 
                              setGenerationOptions(prev => ({
                                ...prev,
                                [config.type]: checked as boolean
                              }))
                            }
                            onClick={(e) => e.stopPropagation()}
                            disabled={isProcessing}
                          />
                          <div className={cn(
                            "p-2 rounded-full",
                            config.color === 'blue' && "bg-blue-100",
                            config.color === 'green' && "bg-green-100",
                            config.color === 'purple' && "bg-purple-100"
                          )}>
                            <IconComponent className={cn(
                              "h-4 w-4",
                              config.color === 'blue' && "text-blue-600",
                              config.color === 'green' && "text-green-600",
                              config.color === 'purple' && "text-purple-600"
                            )} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{config.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{config.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Domain Selection */}
                <div className="space-y-4">
                  <Label htmlFor="domain-select">Target Domain</Label>
                  <Select
                    value={selectedDomainId}
                    onValueChange={setSelectedDomainId}
                    disabled={domainsLoading || isProcessing}
                  >
                    <SelectTrigger id="domain-select">
                      <SelectValue placeholder="Select a domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {domains?.map(domain => (
                        <SelectItem key={domain.id} value={domain.id}>
                          {domain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600">
                    Choose which domain this content belongs to
                  </p>

                  {/* Info Alert */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Processing Information</AlertTitle>
                    <AlertDescription className="text-xs">
                      Files will be processed using AI to extract and generate content. 
                      All generated content will be sent to the Review AI queue for your approval before being added to the system.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Processing State */}
          {isProcessing && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <p className="font-medium">{processingStep}</p>
                  </div>
                  <Progress value={processingProgress} className="h-2" />
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      {processingProgress >= 33 ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : processingProgress > 0 ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                      )}
                      <span>Files Uploaded</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {processingProgress >= 50 ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : processingProgress >= 33 ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                      )}
                      <span>Analyzing Content...</span>
                    </div>
                    {generationOptions.concepts && (
                      <div className="flex items-center gap-2">
                        {processingProgress >= 66 ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : processingProgress >= 50 ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        )}
                        <span>Generating Concepts</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {processingProgress >= 100 ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : processingProgress >= 95 ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                      )}
                      <span>Sending to Review Queue</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Bar */}
          <div className="flex justify-between items-center p-4 bg-white border-t sticky bottom-0">
            <Button variant="ghost" onClick={() => navigate(-1)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={handleProcessAndGenerate}
              disabled={uploadedFiles.length === 0 || !selectedDomainId || isProcessing}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Process & Generate
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminUpload;