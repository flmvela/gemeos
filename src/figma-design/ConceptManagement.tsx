import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import { ConceptTree } from './ConceptTree';
import { ConceptDetail } from './ConceptDetail';
import { AddConceptDialog } from './AddConceptDialog';
import { ChangeParentDialog } from './ChangeParentDialog';
import { RelationshipsPanel } from './RelationshipsPanel';
import { Plus, Search, List as ListIcon, GitBranch, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Concept, mockConcepts } from '../types/concepts';

interface ConceptManagementProps {
  domainName: string;
  domainId: string;
  onNavigateBack: () => void;
}



export function ConceptManagement({ domainName, domainId, onNavigateBack }: ConceptManagementProps) {
  const [concepts, setConcepts] = useState<Concept[]>(mockConcepts);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['harmony', 'improvisation']));
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [addConceptDialog, setAddConceptDialog] = useState(false);
  const [addConceptParent, setAddConceptParent] = useState<Concept | undefined>();
  const [changeParentDialog, setChangeParentDialog] = useState(false);
  const [changeParentConceptId, setChangeParentConceptId] = useState<string | undefined>();
  const [relationshipsPanel, setRelationshipsPanel] = useState(false);
  const [relationshipConceptId, setRelationshipConceptId] = useState<string | undefined>();
  const [inlineEditingParent, setInlineEditingParent] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'tree' | 'details'>('tree');
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suggested'>('active');

  // Filter and organize concepts
  const filteredAndSortedConcepts = useMemo(() => {
    let filtered = concepts;
    
    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(c => c.status === 'approved');
    } else if (statusFilter === 'suggested') {
      filtered = filtered.filter(c => c.status === 'suggested');
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(concept =>
        concept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (concept.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      );
    }
    
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [concepts, statusFilter, searchTerm]);

  // Calculate counts for tabs
  const activeConcepts = concepts.filter(c => c.status === 'approved');
  const suggestedConcepts = concepts.filter(c => c.status === 'suggested');

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
      status: 'suggested',
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

      // Close detail view if deleted concept was selected
      if (selectedConceptId === conceptId) {
        setSelectedConceptId(null);
        setActiveView('tree');
      }
    }
  };

  const handleUpdateConcept = (conceptId: string, updates: Partial<Concept>) => {
    setConcepts(prev =>
      prev.map(concept =>
        concept.id === conceptId
          ? { ...concept, ...updates }
          : concept
      )
    );
  };

  const handleViewDetails = (conceptId: string) => {
    setSelectedConceptId(conceptId);
    setActiveView('details');
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

  // Get parent concept name for display
  const getParentName = (parentId?: string) => {
    if (!parentId) return '–';
    const parent = concepts.find(c => c.id === parentId);
    return parent ? parent.name : '–';
  };

  // Get level badge styling
  const getLevelBadgeProps = (level: number) => {
    const colors = [
      'bg-blue-100 text-blue-800', // L0
      'bg-green-100 text-green-800', // L1
      'bg-yellow-100 text-yellow-800', // L2
      'bg-orange-100 text-orange-800', // L3
      'bg-red-100 text-red-800', // L4+
    ];
    return colors[Math.min(level, colors.length - 1)];
  };

  const selectedConcept = selectedConceptId ? concepts.find(c => c.id === selectedConceptId) : null;

  if (activeView === 'details' && selectedConcept) {
    return (
      <ConceptDetail
        concept={selectedConcept}
        concepts={concepts}
        onBack={() => setActiveView('tree')}
        onUpdateConcept={handleUpdateConcept}
        onUpdateRelationships={handleUpdateRelationships}
        onChangeParent={handleChangeParent}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b bg-white -mx-6 px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={onNavigateBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {domainName}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Concept Management</h1>
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
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-6 mt-4">
          <button
            onClick={() => setStatusFilter('active')}
            className={`flex items-center gap-2 pb-2 border-b-2 transition-colors ${
              statusFilter === 'active'
                ? 'border-black text-black'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Active Concepts ({activeConcepts.length})
          </button>
          <button
            onClick={() => setStatusFilter('suggested')}
            className={`flex items-center gap-2 pb-2 border-b-2 transition-colors ${
              statusFilter === 'suggested'
                ? 'border-black text-black'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            AI Suggested ({suggestedConcepts.length})
          </button>
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          Showing {filteredAndSortedConcepts.length} concepts. Use search/filters to find specific concepts.
        </p>
      </div>

      {/* Search and View Controls */}
      <div className="bg-white border-b -mx-6 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search concepts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-50"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'tree' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('tree')}
              className="flex items-center gap-2"
            >
              <GitBranch className="h-4 w-4" />
              Tree
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2"
            >
              <ListIcon className="h-4 w-4" />
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-50 -mx-6">
        {viewMode === 'list' ? (
          /* List View */
          <div className="px-6 py-6">
            <div className="bg-white rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead className="font-medium text-gray-600">Concept Name</TableHead>
                    <TableHead className="font-medium text-gray-600">Status</TableHead>
                    <TableHead className="font-medium text-gray-600">Level</TableHead>
                    <TableHead className="font-medium text-gray-600">Parent</TableHead>
                    <TableHead className="font-medium text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedConcepts.map((concept) => (
                    <TableRow 
                      key={concept.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewDetails(concept.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{concept.name}</div>
                          {concept.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {concept.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={concept.status === 'approved' ? 'default' : 'secondary'}
                          className={
                            concept.status === 'approved'
                              ? 'bg-green-100 text-green-800 hover:bg-green-100'
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                          }
                        >
                          {concept.status === 'approved' ? 'Approved' : 'Suggested'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getLevelBadgeProps(concept.level)} border-0`}
                        >
                          L{concept.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getParentName(concept.parentId)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(concept.id);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConcept(concept.id);
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          /* Tree View */
          <div className="px-6 py-6">
            <div className="bg-white rounded-lg border">
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
                onViewDetails={handleViewDetails}
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
  );
}