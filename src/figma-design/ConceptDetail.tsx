import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { RelationshipsPanel } from './RelationshipsPanel';
import { ChangeParentDialog } from './ChangeParentDialog';
import { EditRelationshipModal } from './EditRelationshipModal';
import { AddChildConceptDialog } from './AddChildConceptDialog';
import { 
  Users,
  Network,
  BarChart3,
  Plus,
  Settings,
  Edit3,
  Save,
  X,
  Search,
  ArrowLeft,
  ArrowRight,
  Link,
  Trash2,
  Unlink,
  Target
} from 'lucide-react';
import type { Concept } from '../types/concepts';
import { getStatusDisplayText, getStatusBadgeVariant } from '../utils/conceptsUtils';

interface ConceptDetailProps {
  concept: Concept;
  concepts: Concept[];
  initialTab?: string;
  onBack: () => void;
  onUpdateConcept: (conceptId: string, updates: Partial<Concept>) => void;
  onUpdateRelationships: (conceptId: string, relationships: { conceptId: string; type: 'prerequisite' | 'related' }[]) => void;
  onChangeParent: (conceptId: string, newParentId?: string) => void;
  onNavigateToConcept?: (conceptId: string, tab?: string) => void;
}

export function ConceptDetail({ 
  concept, 
  concepts,
  initialTab = 'overview',
  onBack, 
  onUpdateConcept,
  onUpdateRelationships,
  onChangeParent,
  onNavigateToConcept
}: ConceptDetailProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(concept.description || '');
  const [relationshipsPanel, setRelationshipsPanel] = useState(false);
  const [changeParentDialog, setChangeParentDialog] = useState(false);
  const [editRelationshipModal, setEditRelationshipModal] = useState(false);
  const [addChildDialog, setAddChildDialog] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<{
    conceptId: string;
    type: string;
    description?: string;
  } | null>(null);

  // Get parent concept
  const parentConcept = concept.parentId 
    ? concepts.find(c => c.id === concept.parentId)
    : null;

  // Get child concepts
  const childConcepts = concepts.filter(c => concept.children.includes(c.id));

  // Get difficulty level based on concept level
  const getDifficultyLevel = (level: number) => {
    if (level === 0) return { label: 'Foundational', color: 'bg-blue-100 text-blue-800' };
    if (level === 1) return { label: 'Beginner', color: 'bg-green-100 text-green-800' };
    if (level === 2) return { label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' };
    if (level === 3) return { label: 'Advanced', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Expert', color: 'bg-red-100 text-red-800' };
  };

  const difficulty = getDifficultyLevel(concept.level);

  const handleSaveDescription = () => {
    onUpdateConcept(concept.id, { description });
    setIsEditingDescription(false);
  };

  const handleCancelEdit = () => {
    setDescription(concept.description || '');
    setIsEditingDescription(false);
  };

  const handleEditRelationship = (relationship: { conceptId: string; type: string; description?: string }) => {
    setEditingRelationship(relationship);
    setEditRelationshipModal(true);
  };

  const handleAddRelationship = () => {
    setEditingRelationship(null);
    setEditRelationshipModal(true);
  };

  const handleSaveRelationship = (relationship: { conceptId: string; type: string; description?: string }) => {
    // Here you would update the concept's relationships
    // For now, we'll just close the modal
    console.log('Saving relationship:', relationship);
    setEditRelationshipModal(false);
    setEditingRelationship(null);
  };

  // Handle child concept actions
  const handleEditChildConcept = (childId: string) => {
    if (onNavigateToConcept) {
      onNavigateToConcept(childId, 'overview');
    }
  };

  const handleManageChildRelationships = (childId: string) => {
    if (onNavigateToConcept) {
      onNavigateToConcept(childId, 'relationships');
    }
  };

  const handleChildConceptSettings = (childId: string) => {
    if (onNavigateToConcept) {
      onNavigateToConcept(childId, 'settings');
    }
  };

  const handleRemoveChildRelationship = (childId: string) => {
    // Remove the child relationship (not delete the concept)
    onChangeParent(childId, undefined);
  };

  const handleAddChild = (childId: string) => {
    // Add the concept as a child by setting its parent to this concept
    onChangeParent(childId, concept.id);
  };

  // Mock relationships for demo
  const mockRelationships = [
    {
      conceptId: 'musical-intervals',
      type: 'prerequisite',
      name: 'Musical Intervals',
      description: 'Understanding intervals is essential before learning theory fundamentals'
    },
    {
      conceptId: 'chord-construction',
      type: 'builds-upon',
      name: 'Chord Construction',
      description: 'Chord construction builds upon music theory fundamentals'
    },
    {
      conceptId: 'scale-modes',
      type: 'related',
      name: 'Scale Modes',
      description: 'Scale modes are closely related to fundamental theory concepts'
    },
    {
      conceptId: 'circle-of-fifths',
      type: 'contains',
      name: 'Circle of Fifths',
      description: 'The circle of fifths is a component of music theory fundamentals'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-background">

      {/* Concept Header - Always Visible */}
      <div className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-semibold text-foreground">{concept.name}</h1>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                  Level {concept.level}
                </Badge>
                <Badge 
                  variant={getStatusBadgeVariant(concept.status)}
                  className={
                    concept.status === 'approved'
                      ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200 font-medium'
                      : concept.status === 'suggested'
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 font-medium'
                      : concept.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 font-medium'
                      : 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200 font-medium'
                  }
                >
                  {getStatusDisplayText(concept.status)}
                </Badge>
              </div>
              
              {/* Description */}
              <div className="max-w-4xl">
                {isEditingDescription ? (
                  <div className="space-y-3">
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter concept description..."
                      rows={3}
                      className="resize-none border-gray-200 bg-white"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveDescription}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {concept.description || 'No description available. Click the edit button to add one.'}
                  </p>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-4">
              {concept.status === 'approved' && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => console.log('Learning goals for:', concept.id)}
                  className="h-9 w-9 p-0 hover:bg-blue-50 rounded-md"
                  title="Learning goals"
                >
                  <Target className="h-4 w-4 text-blue-600" />
                </Button>
              )}
              {!isEditingDescription && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsEditingDescription(true)}
                  className="h-9 w-9 p-0 hover:bg-gray-100 rounded-md"
                  title="Edit description"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <div className="border-b bg-card py-4">
            <div className="container mx-auto px-6">
              <TabsList className="grid w-full grid-cols-3 h-11">
                <TabsTrigger value="overview" className="text-sm font-medium">Overview</TabsTrigger>
                <TabsTrigger value="relationships" className="text-sm font-medium">Relationships</TabsTrigger>
                <TabsTrigger value="settings" className="text-sm font-medium">Settings</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="flex-1 overflow-auto py-8">
            <div className="container mx-auto px-6 max-w-6xl">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-0">
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Parent & Children */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Parent & Children</p>
                          <div className="space-y-1">
                            {parentConcept ? (
                              <div className="flex items-center gap-1 text-sm">
                                <span>↗</span>
                                <span>{parentConcept.name}</span>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">Root level concept</div>
                            )}
                            <div className="flex items-center gap-1 text-sm">
                              <span>↘</span>
                              <span>{childConcepts.length} child concept{childConcepts.length !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Relationships */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Network className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Relationships</p>
                          <p className="text-2xl font-semibold">{concept.relationships.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Difficulty Level */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <BarChart3 className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Difficulty Level</p>
                          <Badge variant="outline" className={`mt-1 ${difficulty.color} border-0`}>
                            {difficulty.label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Child Concepts List */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Child Concepts</CardTitle>
                      <Button
                        size="sm"
                        onClick={() => setAddChildDialog(true)}
                        className="bg-black text-white hover:bg-black/90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Child
                      </Button>
                    </div>
                  </CardHeader>
                  {childConcepts.length > 0 && (
                    <CardContent>
                      <div className="space-y-3">
                        {childConcepts.map((child, index) => (
                          <div key={child.id}>
                            <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-2 h-2 bg-muted rounded-full flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground">{child.name}</p>
                                  {child.description && (
                                    <p className="text-sm text-muted-foreground truncate">{child.description}</p>
                                  )}
                                </div>
                                <Badge variant="outline" className="flex-shrink-0">L{child.level}</Badge>
                              </div>
                              
                              {/* Action Icons */}
                              <div className="flex items-center gap-1 ml-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-gray-100"
                                  onClick={() => handleEditChildConcept(child.id)}
                                  title="Edit concept"
                                >
                                  <Edit3 className="h-4 w-4 text-gray-600" />
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-gray-100"
                                  onClick={() => handleManageChildRelationships(child.id)}
                                  title="Manage relationships"
                                >
                                  <Network className="h-4 w-4 text-gray-600" />
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-gray-100"
                                  onClick={() => handleChildConceptSettings(child.id)}
                                  title="Settings"
                                >
                                  <Settings className="h-4 w-4 text-gray-600" />
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-red-50"
                                  onClick={() => handleRemoveChildRelationship(child.id)}
                                  title="Remove child relationship"
                                >
                                  <Unlink className="h-4 w-4 text-gray-600 hover:text-red-600" />
                                </Button>
                              </div>
                            </div>
                            {index < childConcepts.length - 1 && <Separator className="mt-3" />}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                  {childConcepts.length === 0 && (
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No child concepts yet</p>
                        <p className="text-sm mt-1">Add a child concept to build the knowledge hierarchy</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </TabsContent>

              {/* Relationships Tab */}
              <TabsContent value="relationships" className="space-y-8 mt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Relationships</h2>
                    <p className="text-muted-foreground mt-1">
                      Manage connections between this concept and others in the knowledge graph.
                    </p>
                  </div>
                  <Button onClick={handleAddRelationship} className="bg-black text-white hover:bg-black/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Relationship
                  </Button>
                </div>

                {/* Mock Relationships - Extended for demo */}
                <div className="space-y-4">
                  {mockRelationships.map((relationship, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-2 mt-1">
                        {relationship.type === 'prerequisite' && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                        {relationship.type === 'builds-upon' && <ArrowLeft className="h-4 w-4 text-muted-foreground" />}
                        {(relationship.type === 'related' || relationship.type === 'contains') && <Link className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={
                            relationship.type === 'prerequisite' ? "bg-red-100 text-red-800 hover:bg-red-100" :
                            relationship.type === 'builds-upon' ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                            relationship.type === 'contains' ? "bg-green-100 text-green-800 hover:bg-green-100" :
                            "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }>
                            {relationship.type === 'builds-upon' ? 'Is built upon by' : 
                             relationship.type.charAt(0).toUpperCase() + relationship.type.slice(1)}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-foreground">{relationship.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {relationship.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditRelationship(relationship)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-8 mt-0">
                <div>
                  <h2 className="text-xl font-semibold">Concept Settings</h2>
                  <p className="text-muted-foreground mt-1">
                    Administrative settings and actions for this concept.
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Hierarchy Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Current Parent</label>
                      <p className="text-sm text-muted-foreground mb-2">
                        {parentConcept ? parentConcept.name : 'None (Root level concept)'}
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setChangeParentDialog(true)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Change Parent Concept
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Concept Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Level</label>
                        <p className="text-sm text-muted-foreground">Level {concept.level}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <p className="text-sm text-muted-foreground capitalize">{concept.status}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Child Concepts</label>
                        <p className="text-sm text-muted-foreground">{childConcepts.length}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Relationships</label>
                        <p className="text-sm text-muted-foreground">{concept.relationships.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Dialogs */}
      <RelationshipsPanel
        open={relationshipsPanel}
        onOpenChange={setRelationshipsPanel}
        conceptId={concept.id}
        concepts={concepts}
        onUpdateRelationships={onUpdateRelationships}
      />

      <ChangeParentDialog
        open={changeParentDialog}
        onOpenChange={setChangeParentDialog}
        conceptId={concept.id}
        concepts={concepts}
        onChangeParent={onChangeParent}
      />

      <EditRelationshipModal
        open={editRelationshipModal}
        onOpenChange={setEditRelationshipModal}
        concepts={concepts}
        currentConceptId={concept.id}
        relationship={editingRelationship}
        onSave={handleSaveRelationship}
      />

      <AddChildConceptDialog
        open={addChildDialog}
        onOpenChange={setAddChildDialog}
        currentConcept={concept}
        concepts={concepts}
        onAddChild={handleAddChild}
      />
    </div>
  );
}