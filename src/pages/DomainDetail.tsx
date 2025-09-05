import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Target, 
  Dumbbell, 
  Upload, 
  Brain, 
  CheckSquare, 
  Lightbulb,
  ArrowLeft,
  Trophy,
  Heart,
  ArrowRight
} from 'lucide-react';
import { useDomains } from '@/hooks/useDomains';
import { useDomainStats } from '@/hooks/useDomainStats';
import { DomainDetailCard } from '@/components/DomainDetailCard';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/layout/PageContainer';
import { FileUploadDropzone } from '@/components/upload/FileUploadDropzone';
import { useUploadFiles } from '@/hooks/useFileUpload';

type ContentType = 'concept' | 'learning_goal' | 'exercise';

const DomainDetail = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const [showUpload, setShowUpload] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null);
  
  const { domains, loading: domainsLoading } = useDomains();
  const { stats, loading: statsLoading } = useDomainStats(domainId || '');
  const { uploadFiles, isUploading, uploadProgress } = useUploadFiles();

  const domain = domains.find(d => d.id === domainId);
  const loading = domainsLoading || statsLoading;

  const handleCardClick = (section: string) => {
    if (section === 'upload') {
      setShowUpload(true);
    } else if (section === 'ai-guidance') {
      navigate(`/admin/domain/${domainId}/ai-guidance`);
    } else if (section === 'concepts') {
      // Use domain slug instead of domainId for concepts route
      const domainSlug = domain?.slug || domain?.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || domainId;
      navigate(`/admin/domain/${domainSlug}/concepts`);
    } else if (section === 'goals') {
      navigate(`/admin/domain/${domainId}/goals`);
    } else {
      // TODO: Navigate to other section pages
      console.log(`Navigate to ${section} for domain ${domainId}`);
    }
  };

  const handleContentTypeSelect = (contentType: ContentType) => {
    setSelectedContentType(contentType);
  };

  const handleFilesSelected = (files: File[]) => {
    if (!domainId || !domain || !selectedContentType) {
      return;
    }

    uploadFiles({
      files,
      domainId,
      domainName: domain.name,
      contentType: selectedContentType
    });
  };

  const handleBackToCards = () => {
    setShowUpload(false);
    setSelectedContentType(null);
  };

  const dashboardCards = [
    {
      title: 'Learning Concepts',
      description: 'Manage learning concepts and their relationships',
      count: stats?.conceptsCount,
      icon: BookOpen,
      section: 'concepts',
    },
    {
      title: 'Learning Goals',
      description: 'Define and organize learning objectives',
      count: stats?.learningGoalsCount,
      icon: Target,
      section: 'goals',
    },
    {
      title: 'Exercises',
      description: 'Create and manage practice exercises',
      count: stats?.exercisesCount,
      icon: Dumbbell,
      section: 'exercises',
      badge: 'Coming Soon',
    },
    {
      title: 'Upload Data',
      description: 'Upload and manage learning materials',
      icon: Upload,
      section: 'upload',
    },
    {
      title: 'AI Guidance',
      description: 'AI-powered learning recommendations',
      icon: Brain,
      section: 'ai-guidance',
      badge: 'Coming Soon',
    },
    {
      title: 'Tasks',
      description: 'Manage learning tasks and assignments',
      icon: CheckSquare,
      section: 'tasks',
      badge: 'Coming Soon',
    },
    {
      title: 'Strategies',
      description: 'Define learning strategies and methodologies',
      icon: Lightbulb,
      section: 'strategies',
      badge: 'Coming Soon',
    },
    {
      title: 'Gamification',
      description: 'Add game elements to enhance learning motivation',
      icon: Trophy,
      section: 'gamification',
      badge: 'Coming Soon',
    },
    {
      title: 'Motivation',
      description: 'Track and boost learner motivation and engagement',
      icon: Heart,
      section: 'motivation',
      badge: 'Coming Soon',
    },
  ];

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!domain) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Domain Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested domain could not be found.</p>
          <Button onClick={() => navigate('/admin/learning-domains')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Learning Domains
          </Button>
        </div>
      </PageContainer>
    );
  }

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
    <PageContainer>
      {/* Breadcrumb Navigation */}
      <DynamicBreadcrumb />
      
      {!showUpload ? (
        /* Dashboard Cards */
        <Card>
          <CardHeader>
            <CardTitle>{domain.name} Management</CardTitle>
            <CardDescription>
              Manage different aspects of this learning domain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardCards.map((card) => (
                <DomainDetailCard
                  key={card.section}
                  title={card.title}
                  description={card.description}
                  count={card.count}
                  icon={card.icon}
                  onClick={() => handleCardClick(card.section)}
                  badge={card.badge}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Upload Interface */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Upload Data</h1>
              <p className="text-muted-foreground mt-2">
                Choose the type of content you want to upload for {domain.name}.
              </p>
            </div>
            <Button variant="ghost" onClick={handleBackToCards}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
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
                    onClick={() => handleContentTypeSelect(card.type)}
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
                    disabled={!domainId}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default DomainDetail;