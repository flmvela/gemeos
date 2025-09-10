import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DomainContextHeader } from '@/components/navigation/DomainContextHeader';
import { DragDropConceptTree } from '@/components/curriculum/DragDropConceptTree';
import { ConceptTreeView } from '@/components/curriculum/ConceptTreeView';
import { ConceptListView } from '@/components/curriculum/ConceptListView';
import { ConceptFlowDiagram } from '@/components/curriculum/ConceptFlowDiagram';
import { ConceptMindMap } from '@/components/curriculum/ConceptMindMap';
import { AddConceptModal } from '@/components/curriculum/AddConceptModal';
import { MasterConceptUpload } from '@/components/curriculum/MasterConceptUpload';
import { ConceptLinkingPanel } from '@/components/curriculum/ConceptLinkingPanel';
import { ConceptExtractionCard } from '@/components/curriculum/ConceptExtractionCard';
import { ConceptDetailsPanel } from '@/components/curriculum/ConceptDetailsPanel';
import { useConcepts, type Concept } from '@/hooks/useConcepts';
import { useDomainSlug } from '@/hooks/useDomainSlug';
import { useAuth } from '@/hooks/useAuth';
import { PageContainer } from '@/components/layout/PageContainer';
import { useTriggerConceptStructuring } from '@/hooks/useTriggerConceptStructuring';
import { CheckCircle, XCircle, Brain, Search, Filter, Plus, Sparkles, Network, List, GitBranch, MoreVertical, Upload, RefreshCw, AlertTriangle, ArrowUpDown, Link2, Check, X } from 'lucide-react';
import { ConceptTreeDebugPanel } from '@/components/curriculum/ConceptTreeDebugPanel';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
export default function DomainConcepts() {
  const { slug, domainSlug } = useParams<{ slug?: string; domainSlug?: string }>();
  const navigate = useNavigate();
  // Support both slug and domainSlug parameters for backward compatibility
  const identifier = slug || domainSlug || '';
  const { domain, loading: domainLoading, error: domainError } = useDomainSlug(identifier);
  const domainId = domain?.id || ''; // Use resolved domain ID

  const {
    concepts,
    loading,
    refetch,
    updateConceptStatus,
    updateConceptParent,
    updateConcept,
    bulkUpdateStatus,
    addConcept,
    deleteConcept,
    saveMindmapPosition,
    getMindmapPosition,
    clearMindmapPositions,
    moveConceptUp,
    moveConceptDown,
    stats
  } = useConcepts(domainId);
  const {
    triggerStructuring,
    isLoading: isStructuringLoading
  } = useTriggerConceptStructuring();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('approved'); // Show only approved concepts by default
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(undefined);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    childId: string;
    parentId: string;
    childName: string;
    parentName: string;
  } | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExtractionCard, setShowExtractionCard] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Linking modal state
  const [linkingOpen, setLinkingOpen] = useState(false);
  const [linkingSource, setLinkingSource] = useState<Concept | null>(null);
  const [linkTargetSearch, setLinkTargetSearch] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<string>('is_related_to');
  
  // Hierarchy management state
  const [hierarchyDialog, setHierarchyDialog] = useState(false);
  const [hierarchyConcept, setHierarchyConcept] = useState<Concept | null>(null);
  const [newParentId, setNewParentId] = useState<string>('');
  const {
    user,
    session,
    authState
  } = useAuth();
  const {
    toast
  } = useToast();

  // Force refresh for debugging - MUST be at top level before any returns
  useEffect(() => {
    console.log('🔍 Current concepts in React state:', concepts.length);
    console.log('🔍 Suggested concepts in state:', concepts.filter(c => c.status === 'suggested').length);
  }, [concepts]);

  // Filter concepts based on search and status (supports queries like "Intervals (L6)")
  const filteredConcepts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    console.log('🔍 Filtering concepts:', concepts.length, 'with filter:', statusFilter, 'query:', q);
    return concepts.filter(concept => {
      // Build search haystack: name + level label + description
      const levelStr = typeof (concept as any).difficulty_level === 'number' ? ` (L${(concept as any).difficulty_level})` : '';
      const haystack = (concept.name + levelStr + ' ' + (concept.description || '')).toLowerCase();
      const matchesSearch = q ? haystack.includes(q) : true;

      // Status filtering logic
      let matchesStatus = false;
      if (statusFilter === 'all') {
        matchesStatus = true;
      } else if (statusFilter === 'approved') {
        matchesStatus = concept.status === 'approved'; // Show approved concepts
      } else if (statusFilter === 'pending') {
        matchesStatus = concept.status === 'suggested'; // Show suggested concepts (pending approval)
      } else if (statusFilter === 'rejected') {
        matchesStatus = concept.status === 'rejected'; // Show rejected concepts
      } else if (statusFilter === 'ai_suggested') {
        matchesStatus = concept.status === 'suggested' && concept.generation_source === 'ai'; // Show only AI suggested concepts
      } else {
        matchesStatus = concept.status === statusFilter; // Fallback for any other status
      }
      return matchesSearch && matchesStatus;
    });
  }, [concepts, searchQuery, statusFilter]);

  // Separate approved and suggested concepts
  const approvedConcepts = useMemo(() => concepts.filter(c => c.status === 'approved'), [concepts]);
  const suggestedConcepts = useMemo(() => concepts.filter(c => c.status === 'suggested'), [concepts]);

  // Check if domain is empty (no concepts at all)
  const isDomainEmpty = concepts.length === 0;
  const handleConceptClick = (concept: Concept) => {
    // Navigate to concept detail page using slug
    navigate(`/admin/domains/${identifier}/concepts/${concept.id}`);
  };
  const handleApproveAll = async () => {
    const aiSuggestedIds = concepts.filter(c => c.status === 'suggested').map(c => c.id);
    if (aiSuggestedIds.length > 0) {
      await bulkUpdateStatus(aiSuggestedIds, 'approved');
    }
  };
  const handleRejectAll = async () => {
    const aiSuggestedIds = concepts.filter(c => c.status === 'suggested').map(c => c.id);
    if (aiSuggestedIds.length > 0) {
      await bulkUpdateStatus(aiSuggestedIds, 'rejected');
    }
  };
  const handleConceptDrop = (childId: string, parentId: string) => {
    const childConcept = concepts.find(c => c.id === childId);
    const parentConcept = concepts.find(c => c.id === parentId);
    if (childConcept && parentConcept) {
      setConfirmDialog({
        open: true,
        childId,
        parentId,
        childName: childConcept.name,
        parentName: parentConcept.name
      });
    }
  };
  const confirmHierarchyChange = async () => {
    if (confirmDialog) {
      await updateConceptParent(confirmDialog.childId, confirmDialog.parentId);
      setConfirmDialog(null);
    }
  };
  const handleTriggerStructuring = async () => {
    if (!domainSlug || !domainId) return;
    try {
      await triggerStructuring(domainId, domainSlug);
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error triggering structuring:', error);
    }
  };

  // Check if we have concepts that can be structured (suggested or approved)
  const hasStructurableConcepts = stats.ai_suggested > 0 || stats.approved > 0;
  const handleConceptParentChange = async (conceptId: string, parentId: string) => {
    await updateConceptParent(conceptId, parentId);
  };
  const handleConceptSave = async (concept: Concept) => {
    await updateConcept(concept.id, {
      name: concept.name,
      description: concept.description
    });
    if (concept.parent_concept_id !== selectedConcept?.parent_concept_id) {
      await updateConceptParent(concept.id, concept.parent_concept_id || '');
    }

    // Update status if it's an AI suggested concept
    if (concept.status !== selectedConcept?.status) {
      await updateConceptStatus(concept.id, concept.status as 'approved' | 'rejected');
    }
    setSelectedConcept(concept);
  };

  // Handle concept import
  const handleImportConcepts = async () => {
    setIsImporting(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('clear-and-reimport-concepts', {
        body: {
          domainId
        }
      });
      console.log('Import response:', {
        data,
        error
      });
      if (error) {
        throw error;
      }
      toast({
        title: "Import successful!",
        description: "Concepts have been cleared and re-imported with proper hierarchy."
      });

      // Refresh the page to show updated concepts
      window.location.reload();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import concepts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      setShowImportModal(false);
    }
  };

  // Check if user is admin
  const isAdmin = user?.app_metadata?.role === 'admin';
  const handleAddConcept = async (conceptData: Omit<Concept, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'reviewed_by' | 'reviewed_at'>) => {
    console.log('🔍 handleAddConcept called with:', conceptData);
    const success = await addConcept({
      ...conceptData,
      domain_id: conceptData.domain_id || domainId
    });
    console.log('🔍 addConcept result:', success);
    if (success) {
      console.log('🔍 Concept added successfully, closing modal and refetching...');
      setShowAddModal(false);
      setSelectedParentId(undefined);
      // Add a small delay to allow database to propagate the change
      console.log('🔍 Waiting 500ms before refetch to allow database propagation...');
      setTimeout(() => {
        console.log('🔍 Now calling refetch...');
        refetch();
      }, 500);
    }
  };
  const handleDeleteConcept = async (conceptId: string) => {
    if (window.confirm('Are you sure you want to delete this concept? This action cannot be undone.')) {
      await deleteConcept(conceptId);
    }
  };

  // Approve concept function
  const handleApproveConcept = async (conceptId: string) => {
    const success = await updateConceptStatus(conceptId, 'approved');
    if (success) {
      toast({
        title: "Concept Approved",
        description: "The concept has been approved successfully.",
      });
    }
  };

  // Reject concept function
  const handleRejectConcept = async (conceptId: string) => {
    const success = await updateConceptStatus(conceptId, 'rejected');
    if (success) {
      toast({
        title: "Concept Rejected",
        description: "The concept has been rejected.",
        variant: "destructive",
      });
    }
  };

  // Inline add: create child under a parent and return new id for immediate editing
  const handleInlineAddSubConcept = async (parentId: string): Promise<string | undefined> => {
    const existingSiblings = concepts.filter(c => c.parent_concept_id === parentId);
    const newDisplayOrder = existingSiblings.length;
    const defaultName = 'New Concept';
    const created = await addConcept({
      name: defaultName,
      description: '',
      parent_concept_id: parentId,
      domain_id: domainId,
      display_order: newDisplayOrder,
      status: 'approved'
    } as any);
    if (created && typeof created === 'object' && 'id' in created) {
      return (created as Concept).id;
    }
    return undefined;
  };

  // Relationship linking handlers
  const relationshipTypes = [{
    value: 'is_prerequisite_for',
    label: 'Is a prerequisite for'
  }, {
    value: 'is_related_to',
    label: 'Is related to'
  }, {
    value: 'contrasts_with',
    label: 'Contrasts with'
  }, {
    value: 'is_a_practical_application_of',
    label: 'Is a practical application of'
  }];
  const handleStartLinking = (concept: Concept) => {
    setLinkingSource(concept);
    setSelectedTargetId('');
    setLinkTargetSearch('');
    setRelationshipType('is_related_to');
    setLinkingOpen(true);
  };

  // Navigate to concept detail page with relationships tab
  const handleManageRelationships = (concept: Concept) => {
    navigate(`/admin/domains/${identifier}/concepts/${concept.id}?tab=relationships`);
  };

  // Hierarchy management handlers
  const handleStartHierarchyChange = (concept: Concept) => {
    console.log('Hierarchy change for:', concept.name);
    setHierarchyConcept(concept);
    setNewParentId(concept.parent_concept_id || '');
    setHierarchyDialog(true);
  };

  const handleSaveHierarchyChange = async () => {
    if (!hierarchyConcept) return;
    
    try {
      const newParentValue = newParentId === '' ? null : newParentId;
      await updateConcept(hierarchyConcept.id, { parent_concept_id: newParentValue });
      setHierarchyDialog(false);
      setHierarchyConcept(null);
      setNewParentId('');
    } catch (error) {
      console.error('Failed to update parent concept:', error);
    }
  };
  const handleCreateLink = async () => {
    if (!linkingSource || !selectedTargetId) {
      toast({
        title: 'Missing information',
        description: 'Please select a target concept and relationship type.',
        variant: 'destructive'
      });
      return;
    }
    if (selectedTargetId === linkingSource.id) {
      toast({
        title: 'Invalid selection',
        description: 'Source and target concepts must be different.',
        variant: 'destructive'
      });
      return;
    }
    try {
      const {
        error
      } = await (supabase as any).from('concept_relationships').insert([{
        concept_a_id: linkingSource.id,
        concept_b_id: selectedTargetId,
        relationship_type: relationshipType
      }]);
      if (error) throw error;
      toast({
        title: 'Relationship created',
        description: 'The concepts have been linked successfully.'
      });
      setLinkingOpen(false);
      setLinkingSource(null);
      setSelectedTargetId('');
      setLinkTargetSearch('');
    } catch (err: any) {
      console.error('Create link error:', err);
      toast({
        title: 'Failed to create link',
        description: err.message || 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Authentication and domain loading check
  if (authState === 'authenticating' || loading || domainLoading) {
    return (
      <PageContainer>
        <DomainContextHeader />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }
  
  // Check for domain resolution error
  if (domainError || !domain) {
    return (
      <PageContainer>
        <DomainContextHeader />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Domain Not Found</h2>
            <p className="text-gray-600">{domainError || "The requested domain could not be found."}</p>
          </div>
        </div>
      </PageContainer>
    );
  }
  if (!user || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be logged in to access concepts. Please login to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show upload interface if domain is empty
  if (isDomainEmpty && !loading) {
    return (
      <PageContainer>
        <DomainContextHeader />
        <MasterConceptUpload domainId={domainId} domainSlug={domainSlug || domainId} domainName={domain?.name || domainSlug || 'Unknown Domain'} onUploadComplete={() => {
        // File uploaded, waiting for import
      }} onImportComplete={() => {
        // Refresh concepts after import
        window.location.reload();
      }} />
      </PageContainer>
    );
  }
  return (
    <PageContainer>
      <DomainContextHeader />
      
      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-medium text-gray-900">{domain?.name || 'Domain'} Management</h1>
          <Button
            onClick={() => {
              setSelectedParentId(undefined);
              setShowAddModal(true);
            }}
            className="bg-black text-white hover:bg-black/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Concept
          </Button>
        </div>
        
        {/* View Controls */}
        <div className="flex items-center justify-end gap-4">
          <div className="flex items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      Approved
                    </div>
                  </SelectItem>
                  <SelectItem value="suggested">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      Suggested
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value="rejected">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      Rejected
                    </div>
                  </SelectItem>
                  <SelectItem value="ai_suggested">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      AI Suggested
                    </div>
                  </SelectItem>
                  <SelectItem value="confirmed">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Confirmed
                    </div>
                  </SelectItem>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                      Active (All except Rejected)
                    </div>
                  </SelectItem>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      All Statuses
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-2 rounded-none border-0 px-3 ${
                  viewMode === 'tree' 
                    ? 'bg-black text-white hover:bg-black/90' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <GitBranch className="h-4 w-4" />
                Tree
              </Button>
              <div className="w-px bg-gray-300 h-6"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 rounded-none border-0 px-3 ${
                  viewMode === 'list' 
                    ? 'bg-black text-white hover:bg-black/90' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <List className="h-4 w-4" />
                List
              </Button>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="bg-white border-b">
          <div className="flex justify-between items-center">
            <div className="flex space-x-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === 'all'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All ({concepts.length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === 'approved'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Approved ({concepts.filter(c => c.status === 'approved').length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === 'pending'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending ({concepts.filter(c => c.status === 'suggested').length})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === 'rejected'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rejected ({concepts.filter(c => c.status === 'rejected').length})
            </button>
            <button
              onClick={() => setStatusFilter('ai_suggested')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === 'ai_suggested'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              AI Suggested ({concepts.filter(c => c.status === 'suggested' && c.generation_source === 'ai').length})
            </button>
            </div>
            
            {/* Search Field */}
            <div className="relative mr-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 w-64"
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg border">
          {viewMode === 'tree' ? (
            <div className="overflow-hidden">
              <ConceptTreeView 
                concepts={filteredConcepts} 
                onConceptClick={handleConceptClick} 
                onConceptDelete={handleDeleteConcept} 
                onConceptUpdate={updateConcept} 
                onAddChild={(parentId) => {
                  console.log('🔍 Add child clicked for parentId:', parentId);
                  const parentConcept = concepts.find(c => c.id === parentId);
                  console.log('🔍 Parent concept found:', parentConcept?.name, parentConcept);
                  setSelectedParentId(parentId);
                  setShowAddModal(true);
                  console.log('🔍 Modal will open with selectedParentId:', parentId);
                }} 
                onStartLinking={handleStartLinking} 
                onStartHierarchyChange={handleStartHierarchyChange}
                onManageRelationships={handleManageRelationships}
                showApprovalActions={statusFilter === 'pending'}
                onApproveConcept={handleApproveConcept}
                onRejectConcept={handleRejectConcept}
              />
            </div>
          ) : (
            <div className="overflow-hidden">
              <ConceptListView 
                concepts={filteredConcepts} 
                onConceptClick={handleConceptClick} 
                onConceptDelete={handleDeleteConcept} 
                onConceptUpdate={updateConcept} 
                onAddChild={(parentId) => {
                  console.log('🔍 Add child clicked for parentId:', parentId);
                  const parentConcept = concepts.find(c => c.id === parentId);
                  console.log('🔍 Parent concept found:', parentConcept?.name, parentConcept);
                  setSelectedParentId(parentId);
                  setShowAddModal(true);
                  console.log('🔍 Modal will open with selectedParentId:', parentId);
                }} 
                onStartLinking={handleStartLinking} 
                onStartHierarchyChange={handleStartHierarchyChange}
                onManageRelationships={handleManageRelationships}
                showApprovalActions={statusFilter === 'pending'}
                onApproveConcept={handleApproveConcept}
                onRejectConcept={handleRejectConcept}
              />
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog?.open || false} onOpenChange={open => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Hierarchy Change</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to make <strong>"{confirmDialog?.parentName}"</strong> the parent of{' '}
              <strong>"{confirmDialog?.childName}"</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmHierarchyChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Concept Modal */}
      {showAddModal && <AddConceptModal concepts={concepts} parentConceptId={selectedParentId} domainId={domainId} onClose={() => { setShowAddModal(false); setSelectedParentId(undefined); }} onSave={handleAddConcept} />}

      {/* Import Concepts Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-import Master Concepts</DialogTitle>
            <DialogDescription>
              This will clear all existing concepts for this domain and re-import them from the master concept list file. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportConcepts} disabled={isImporting} className="flex items-center gap-2">
              {isImporting ? <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Importing...
                </> : <>
                  <Upload className="h-4 w-4" />
                  Re-import Concepts
                </>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Concepts Modal */}
      <Dialog open={linkingOpen} onOpenChange={setLinkingOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4" /> Create Relationship
            </DialogTitle>
            <DialogDescription>
              {linkingSource ? <span>
                  Linking from: <strong>{linkingSource.name}</strong>
                </span> : 'Choose a source concept to start linking.'}
            </DialogDescription>
          </DialogHeader>

          {/* Target Concept Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Target concept</label>
            <div className="border rounded-md">
              <Command>
                <CommandInput placeholder="Search concepts..." value={linkTargetSearch} onValueChange={setLinkTargetSearch} />
                <CommandList>
                  <CommandEmpty>No concepts found.</CommandEmpty>
                  <CommandGroup>
                    {concepts.filter(c => c.id !== linkingSource?.id).filter(c => !linkTargetSearch ? true : (c.name + ' ' + (c.description || '')).toLowerCase().includes(linkTargetSearch.toLowerCase())).map(c => <CommandItem key={c.id} value={c.name} onSelect={() => setSelectedTargetId(c.id)}>
                          <div className="flex items-center justify-between w-full">
                            <span className="truncate mr-3">{c.name}</span>
                            {selectedTargetId === c.id && <Badge variant="secondary" className="text-xs">Selected</Badge>}
                          </div>
                        </CommandItem>)}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </div>

          {/* Relationship type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Relationship type</label>
            <Select value={relationshipType} onValueChange={setRelationshipType}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship type" />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map(rt => <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkingOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateLink} disabled={!selectedTargetId || !linkingSource}>Create Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hierarchy Management Modal */}
      <Dialog open={hierarchyDialog} onOpenChange={setHierarchyDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" /> Change Parent Concept
            </DialogTitle>
            <DialogDescription>
              {hierarchyConcept && (
                <span>
                  Change parent for: <strong>{hierarchyConcept.name}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Parent Concept</label>
              <Select 
                value={newParentId || 'none'} 
                onValueChange={(value) => setNewParentId(value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent concept or none" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <span>None (Root level concept)</span>
                    </div>
                  </SelectItem>
                  {concepts
                    .filter(c => c.id !== hierarchyConcept?.id) // Don't show current concept
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((parentOption) => (
                      <SelectItem key={parentOption.id} value={parentOption.id}>
                        <div className="flex items-center gap-2">
                          <span>{parentOption.name}</span>
                          <Badge variant="outline" className="text-xs">
                            L{parentOption.difficulty_level ?? 0}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setHierarchyDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveHierarchyChange}
              className="bg-black text-white hover:bg-black/90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}