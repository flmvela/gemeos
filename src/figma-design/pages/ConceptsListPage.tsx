import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { ConceptTree } from '../ConceptTree';
import { ConceptsTabNavigation } from '../ConceptsTabNavigation';
import { ConceptsSearchControls } from '../ConceptsSearchControls';
import { ConceptsTableView } from '../ConceptsTableView';
import { AddConceptDialog } from '../AddConceptDialog';
import { ChangeParentDialog } from '../ChangeParentDialog';
import { RelationshipsPanel } from '../RelationshipsPanel';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Plus, MoreHorizontal, Settings, RefreshCw } from 'lucide-react';
import { Concept, mockConcepts } from '../../types/concepts';
import { 
  TabType, 
  filterConceptsByTab, 
  filterConceptsBySearch 
} from '../../utils/conceptsUtils';

interface ConceptsListPageProps {
  domainName: string;
  domainId: string;
  onNavigateBack: () => void;
  onViewDetails: (conceptId: string, tab?: string) => void;
}

export function ConceptsListPage({ 
  domainName, 
  domainId, 
  onNavigateBack,
  onViewDetails
}: ConceptsListPageProps) {
  const [concepts, setConcepts] = useState<Concept[]>(mockConcepts);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['harmony', 'improvisation']));
  const [addConceptDialog, setAddConceptDialog] = useState(false);
  const [addConceptParent, setAddConceptParent] = useState<Concept | undefined>();
  const [changeParentDialog, setChangeParentDialog] = useState(false);
  const [changeParentConceptId, setChangeParentConceptId] = useState<string | undefined>();
  const [relationshipsPanel, setRelationshipsPanel] = useState(false);
  const [relationshipConceptId, setRelationshipConceptId] = useState<string | undefined>();
  const [inlineEditingParent, setInlineEditingParent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Filter and organize concepts
  const filteredAndSortedConcepts = useMemo(() => {
    let filtered = filterConceptsByTab(concepts, activeTab);
    filtered = filterConceptsBySearch(filtered, searchTerm);
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [concepts, activeTab, searchTerm]);



  const handleToggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleAddConcept = (name: string, description: string, parentId?: string) => {
    const newConcept: Concept = {
      id: `concept-${Date.now()}`,
      name,
      description: description || undefined,
      level: parentId ? (concepts.find(c => c.id === parentId)?.level ?? 0) + 1 : 0,
      parentId,
      children: [],
      status: 'pending',
      relationships: []
    };

    setConcepts(prev => {
      const updated = [...prev, newConcept];
      
      // Update parent's children array if applicable
      if (parentId) {
        return updated.map(c => 
          c.id === parentId 
            ? { ...c, children: [...c.children, newConcept.id] }
            : c
        );
      }
      
      return updated;
    });

    // Expand parent node if concept was added as child
    if (parentId) {
      setExpandedNodes(prev => new Set(prev).add(parentId));
    }
  };

  const handleChangeParent = (conceptId: string, newParentId?: string) => {
    setConcepts(prev => {
      return prev.map(concept => {
        // Update the concept being moved
        if (concept.id === conceptId) {
          const newLevel = newParentId 
            ? (prev.find(c => c.id === newParentId)?.level ?? 0) + 1 
            : 0;
          return {
            ...concept,
            parentId: newParentId,
            level: newLevel
          };
        }

        // Remove from old parent's children
        if (concept.children.includes(conceptId)) {
          return {
            ...concept,
            children: concept.children.filter(id => id !== conceptId)
          };
        }

        // Add to new parent's children
        if (concept.id === newParentId) {
          return {
            ...concept,
            children: [...concept.children, conceptId]
          };
        }

        return concept;
      });
    });
  };

  const handleManageRelationships = (conceptId: string) => {
    setRelationshipConceptId(conceptId);
    setRelationshipsPanel(true);
  };

  const handleUpdateRelationships = (conceptId: string, relationships: { conceptId: string; type: 'prerequisite' | 'related' }[]) => {
    setConcepts(prev =>
      prev.map(concept =>
        concept.id === conceptId
          ? { ...concept, relationships }
          : concept
      )
    );
  };

  const handleDeleteConcept = (conceptId: string) => {
    if (confirm('Are you sure you want to delete this concept? This action cannot be undone.')) {
      setConcepts(prev => {
        const conceptToDelete = prev.find(c => c.id === conceptId);
        if (!conceptToDelete) return prev;

        // Remove from parent's children array
        const updated = prev.map(concept => {
          if (concept.children.includes(conceptId)) {
            return {
              ...concept,
              children: concept.children.filter(id => id !== conceptId)
            };
          }
          return concept;
        });

        // Remove the concept and its children recursively
        const removeConceptAndChildren = (id: string, concepts: Concept[]): Concept[] => {
          const concept = concepts.find(c => c.id === id);
          if (!concept) return concepts;

          let result = concepts.filter(c => c.id !== id);
          
          concept.children.forEach(childId => {
            result = removeConceptAndChildren(childId, result);
          });

          return result;
        };

        return removeConceptAndChildren(conceptId, updated);
      });
    }
  };

  const handleAddChildConcept = (parentId: string) => {
    const parent = concepts.find(c => c.id === parentId);
    setAddConceptParent(parent);
    setAddConceptDialog(true);
  };

  const handleSaveInlineEdit = (parentId: string | null, name: string) => {
    handleAddConcept(name, '', parentId || undefined);
    setInlineEditingParent(null);
  };

  const handleCancelInlineEdit = () => {
    setInlineEditingParent(null);
  };

  const handleGenerateAIStructure = () => {
    console.log('Generating AI Structure...');
    // Placeholder for AI structure generation
    alert('AI Structure Generation feature will be implemented here');
  };

  const handleReimportMasterConcepts = () => {
    console.log('Re-importing Master Concepts...');
    // Placeholder for master concepts re-import
    alert('Master Concepts Re-import feature will be implemented here');
  };

  const handleApproveConcept = (conceptId: string) => {
    setConcepts(prev =>
      prev.map(concept =>
        concept.id === conceptId
          ? { ...concept, status: 'approved' as const }
          : concept
      )
    );
  };

  const handleRejectConcept = (conceptId: string) => {
    setConcepts(prev =>
      prev.map(concept =>
        concept.id === conceptId
          ? { ...concept, status: 'rejected' as const }
          : concept
      )
    );
  };



  return (
    <main className="container mx-auto px-6 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white -mx-6 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1>Concept Management</h1>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setAddConceptParent(undefined);
                  setAddConceptDialog(true);
                }}
                className="bg-black text-white hover:bg-black/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Concept
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleGenerateAIStructure}>
                    <Settings className="mr-2 h-4 w-4" />
                    Generate AI Structure
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleReimportMasterConcepts}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Re-import Master Concepts
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Search and View Controls */}
        <ConceptsSearchControls
          searchTerm={searchTerm}
          viewMode={viewMode}
          onSearchChange={setSearchTerm}
          onViewModeChange={setViewMode}
        />

        {/* Tabs - Only show in list view */}
        {viewMode === 'list' && (
          <ConceptsTabNavigation
            activeTab={activeTab}
            concepts={concepts}
            onTabChange={setActiveTab}
          />
        )}

        {/* Content */}
        <div className="bg-white -mx-6">
          {viewMode === 'list' ? (
            <ConceptsTableView
              concepts={filteredAndSortedConcepts}
              allConcepts={concepts}
              onViewDetails={onViewDetails}
              onDeleteConcept={handleDeleteConcept}
              onApproveConcept={handleApproveConcept}
              onRejectConcept={handleRejectConcept}
            />
          ) : (
            /* Tree View */
            <div className="px-6 py-4">
              <div className="bg-white">
                <ConceptTree
                  concepts={filteredAndSortedConcepts}
                  allConcepts={concepts}
                  expandedNodes={expandedNodes}
                  inlineEditingParent={inlineEditingParent}
                  onToggleExpand={handleToggleExpand}
                  onChangeParent={(conceptId) => {
                    setChangeParentConceptId(conceptId);
                    setChangeParentDialog(true);
                  }}
                  onManageRelationships={handleManageRelationships}
                  onAddChild={handleAddChildConcept}
                  onDelete={handleDeleteConcept}
                  onSaveInlineEdit={handleSaveInlineEdit}
                  onCancelInlineEdit={handleCancelInlineEdit}
                  onViewDetails={onViewDetails}
                />
              </div>
            </div>
          )}
        </div>

        {/* Dialogs */}
        <AddConceptDialog
          open={addConceptDialog}
          onOpenChange={setAddConceptDialog}
          parentConcept={addConceptParent}
          onAddConcept={handleAddConcept}
        />

        <ChangeParentDialog
          open={changeParentDialog}
          onOpenChange={setChangeParentDialog}
          conceptId={changeParentConceptId}
          concepts={concepts}
          onChangeParent={handleChangeParent}
        />

        <RelationshipsPanel
          open={relationshipsPanel}
          onOpenChange={setRelationshipsPanel}
          conceptId={relationshipConceptId}
          concepts={concepts}
          onUpdateRelationships={handleUpdateRelationships}
        />
      </div>
    </main>
  );
}