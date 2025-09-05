import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Eye,
  ExternalLink
} from 'lucide-react';
import { useDomains } from '@/hooks/useDomains';
import { useGuidanceStatus } from '@/hooks/useGuidanceStatus';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getGuidanceIcon, getGuidanceDescription } from '@/lib/guidanceUtils';

const DomainAIGuidance = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const { domains, loading: domainsLoading } = useDomains();
  const domain = domains.find(d => d.id === domainId);
  const { guidanceStatus, loading: guidanceLoading, error, refetch } = useGuidanceStatus(domainId || '', domain?.name);
  const { toast } = useToast();

  const loading = domainsLoading || guidanceLoading;

  // Create guidance areas from dynamic GCS data
  const guidanceAreas = guidanceStatus?.areas.map(area => ({
    key: area.key,
    title: area.title,
    description: getGuidanceDescription(area.key),
    icon: getGuidanceIcon(area.key),
  })) || [];

  const handleOpenGuidance = (areaKey: string) => {
    navigate(`/admin/domain/${domainId}/ai-guidance/${areaKey}`);
  };

  const handleViewFile = (areaKey: string) => {
    // TODO: Open guidance file viewer (Story 2)
    console.log(`View guidance file for ${areaKey}`);
    toast({
      title: "Coming Soon",
      description: "File viewer will be available in the next update.",
    });
  };

  const getStatusBadge = (areaKey: string) => {
    if (!guidanceStatus) return null;
    
    const area = guidanceStatus.areas.find(a => a.key === areaKey);
    if (!area) return <Badge variant="secondary">Not configured</Badge>;
    
    if (area.exists) {
      return <Badge variant="default">Configured</Badge>;
    } else {
      return <Badge variant="secondary">Not configured</Badge>;
    }
  };

  const isFileExists = (areaKey: string) => {
    if (!guidanceStatus) return false;
    const area = guidanceStatus.areas.find(a => a.key === areaKey);
    return area?.exists || false;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Domain Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested domain could not be found.</p>
          <Button onClick={() => navigate('/admin/learning-domains')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Learning Domains
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <DynamicBreadcrumb />
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Guidance</h2>
          <p className="text-muted-foreground mb-4">
            There was an error loading the guidance status. Please try again.
          </p>
          <Button onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <DynamicBreadcrumb />
      
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold text-foreground">AI Guidance</h1>
          <Badge variant="outline">{domain.name}</Badge>
        </div>
        <p className="text-muted-foreground">
          Configure AI guidance for different aspects of your learning domain
        </p>
      </div>

      {/* Guidance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guidanceAreas.length > 0 ? (
          guidanceAreas.map((area) => {
            const Icon = area.icon;
            const fileExists = isFileExists(area.key);
            
            return (
              <Card key={area.key} className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{area.title}</CardTitle>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {getStatusBadge(area.key)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-2">
                    {fileExists ? area.description : "No guidance file yet."}
                  </CardDescription>
                  
                  <div className="flex flex-col space-y-2">
                    <Button 
                      onClick={() => handleOpenGuidance(area.key)}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleViewFile(area.key)}
                      disabled={!fileExists}
                      className="w-full"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View file
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground mb-4">
              No guidance folders found for this domain yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Upload some files to the domain first, then guidance folders will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DomainAIGuidance;