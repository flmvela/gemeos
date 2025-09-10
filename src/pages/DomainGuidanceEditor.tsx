import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDomains } from '@/hooks/useDomains';
import { useDomainSlug } from '@/hooks/useDomainSlug';
import { useGuidanceStatus } from '@/hooks/useGuidanceStatus';
import { useGuidanceContent } from '@/hooks/useGuidanceContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Edit3, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { GuidanceViewer } from '@/components/guidance/GuidanceViewer';
import { GuidanceEditor } from '@/components/guidance/GuidanceEditor';
import { ExamplesManager } from '@/components/guidance/ExamplesManager';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';

// Import guidance utils to get proper title and description
import { getGuidanceIcon, getGuidanceDescription } from '@/lib/guidanceUtils';

const DomainGuidanceEditor = () => {
  const { domainId, slug, area } = useParams<{ domainId?: string; slug?: string; area: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { domains, loading: domainsLoading } = useDomains();
  
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Use slug resolution if we have a slug parameter, otherwise fallback to old domainId logic
  const identifier = slug || domainId || '';
  const { domain: resolvedDomain, loading: domainLoading } = useDomainSlug(identifier);
  
  // Find domain - use resolved domain if available, otherwise fallback to legacy logic
  const domain = resolvedDomain || domains?.find(d => d.id === domainId);
  const { guidanceStatus, loading: statusLoading } = useGuidanceStatus(domain?.id || '', domain?.name);
  
  console.log('DomainGuidanceEditor Debug:', {
    domainId: domain?.id || domainId,
    area,
    domain: domain?.name,
    domainsLoading,
    domainsCount: domains?.length
  });
  
  const { guidanceContent, loading: contentLoading, saveContent } = useGuidanceContent(
    domain?.id || '', 
    domain?.name || '', 
    area || ''
  );

  // Update content when guidance content is loaded
  useEffect(() => {
    if (guidanceContent) {
      const incoming = (guidanceContent as any).content;
      const normalized = typeof incoming === 'string' ? incoming : JSON.stringify(incoming, null, 2);
      setContent(normalized);
    }
  }, [guidanceContent]);
  // Get guidance area from dynamic status data, or create fallback for new areas
  const guidanceArea = guidanceStatus?.areas.find(a => a.key === area) || {
    key: area || '',
    title: area?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Unknown',
    gcsPath: '',
    exists: false,
    lastModified: null
  };
  const areaStatus = guidanceArea;

  if (domainsLoading || statusLoading || contentLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Domain not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }


  const handleBack = () => {
    if (slug) {
      navigate(`/admin/domains/${slug}/ai-guidance`);
    } else {
      navigate(`/admin/domain/${domainId}/ai-guidance`);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await saveContent(content);
      
      if (success) {
        toast({
          title: "Success",
          description: "Guidance file saved successfully",
        });
        setIsEditing(false);
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save guidance file",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset content to original
    if (guidanceContent) {
      const incoming = (guidanceContent as any).content;
      const normalized = typeof incoming === 'string' ? incoming : JSON.stringify(incoming, null, 2);
      setContent(normalized);
    }
  };

  const fileExists = guidanceContent?.exists || false;

  return (
    <div className="p-6">
      {/* Breadcrumb Navigation */}
      <DynamicBreadcrumb />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to AI Guidance
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{guidanceArea.title} Guidance</h1>
            <p className="text-muted-foreground">
              {domain.name} • AI Guidance Configuration
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {fileExists && !isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {/* Show Save button when editing existing file OR creating new file with content */}
          {(isEditing || (!fileExists && content.trim().length > 0)) && (
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
          {/* Show Cancel button only when editing existing file */}
          {isEditing && fileExists && (
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="guidance" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="guidance">Guidance</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>
        
        <TabsContent value="guidance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Edit3 className="h-5 w-5" />
                    Editing {guidanceArea.title} Guidance
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5" />
                    {fileExists ? 'Viewing' : 'Create'} {guidanceArea.title} Guidance
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing || !fileExists ? (
                <GuidanceEditor
                  content={content}
                  onChange={setContent}
                  placeholder={`Enter your ${guidanceArea.title.toLowerCase()} guidance content here...`}
                  areaTitle={guidanceArea.title}
                />
              ) : (
                <GuidanceViewer
                  content={content}
                  isEmpty={!fileExists}
                  areaTitle={guidanceArea.title}
                  onEdit={() => setIsEditing(true)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {guidanceArea.title} Examples
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExamplesManager 
                domainId={domain?.id || ''}
                domainName={domain.name}
                area={area || ''}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DomainGuidanceEditor;