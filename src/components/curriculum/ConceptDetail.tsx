import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users,
  Network,
  BarChart3,
  Plus,
  Settings,
  Edit3,
  Save,
  X,
  Target,
  Unlink,
  ArrowRight,
  ArrowLeft,
  Link2,
  Trash2
} from 'lucide-react';
import { Concept } from '@/hooks/useConcepts';
import { AddChildConceptModal } from '@/components/curriculum/AddChildConceptModal';

interface ConceptRelationship {
  id: string;
  domain_id: string;
  concept_a_id: string;
  concept_b_id: string;
  relationship_kind: 'prerequisite_of' | 'builds_on' | 'related_to';
  status: 'suggested' | 'approved' | 'rejected';
  source: 'ai' | 'human' | 'system';
  metadata: any;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface ConceptDetailProps {
  concept: Concept;
  concepts: Concept[];
  onBack: () => void;
  onUpdateConcept: (conceptId: string, updates: Partial<Concept>) => void;
  onChangeParent: (conceptId: string, newParentId?: string) => void;
  onNavigateToConcept?: (conceptId: string) => void;
}

export function ConceptDetail({ 
  concept, 
  concepts,
  onBack, 
  onUpdateConcept,
  onChangeParent,
  onNavigateToConcept
}: ConceptDetailProps) {
  const navigate = useNavigate();
  
  // Initialize activeTab from URL parameters
  const [activeTab, setActiveTab] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tab') || 'overview';
  });
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [description, setDescription] = useState(concept.description || '');
  const [name, setName] = useState(concept.name);
  const [addChildDialog, setAddChildDialog] = useState(false);
  
  // Relationship management state
  const [addRelationshipDialog, setAddRelationshipDialog] = useState(false);
  const [relationships, setRelationships] = useState<ConceptRelationship[]>([]);
  const [relationshipType, setRelationshipType] = useState('');
  const [targetConceptId, setTargetConceptId] = useState('');
  const [relationshipDescription, setRelationshipDescription] = useState('');
  const [isLoadingRelationships, setIsLoadingRelationships] = useState(false);
  const [isSavingRelationship, setIsSavingRelationship] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<ConceptRelationship | null>(null);
  const [difficultyLabel, setDifficultyLabel] = useState<string>('');
  
  // Settings tab state
  const [changeParentDialog, setChangeParentDialog] = useState(false);
  const [isEditingDifficulty, setIsEditingDifficulty] = useState(false);
  const [difficultyLevels, setDifficultyLevels] = useState<{level: number, level_label: string}[]>([]);
  const [newDifficultyLevel, setNewDifficultyLevel] = useState(concept.difficulty_level ?? 0);

  // Get parent concept
  const parentConcept = concept.parent_concept_id 
    ? concepts.find(c => c.id === concept.parent_concept_id)
    : null;

  // Get child concepts
  const childConcepts = concepts.filter(c => c.parent_concept_id === concept.id);

  // Get difficulty level based on concept level
  const getDifficultyLevel = (level: number) => {
    if (level === 0) return { label: 'Foundational', color: 'bg-blue-100 text-blue-800' };
    if (level === 1) return { label: 'Beginner', color: 'bg-green-100 text-green-800' };
    if (level === 2) return { label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' };
    if (level === 3) return { label: 'Advanced', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Expert', color: 'bg-red-100 text-red-800' };
  };

  const difficulty = getDifficultyLevel(concept.difficulty_level ?? 0);

  const handleSaveDescription = () => {
    onUpdateConcept(concept.id, { description });
    setIsEditingDescription(false);
  };

  const handleCancelDescriptionEdit = () => {
    setDescription(concept.description || '');
    setIsEditingDescription(false);
  };

  const handleSaveName = () => {
    onUpdateConcept(concept.id, { name });
    setIsEditingName(false);
  };

  const handleCancelNameEdit = () => {
    setName(concept.name);
    setIsEditingName(false);
  };

  // Handle child concept actions
  const handleEditChildConcept = (childId: string) => {
    if (onNavigateToConcept) {
      onNavigateToConcept(childId);
    }
  };

  const handleManageChildRelationships = (childId: string) => {
    // Navigate to child concept relationships tab
    if (onNavigateToConcept) {
      onNavigateToConcept(childId);
    }
  };

  const handleChildConceptSettings = (childId: string) => {
    // Navigate to child concept settings tab
    if (onNavigateToConcept) {
      onNavigateToConcept(childId);
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

  // Relationship management functions
  const loadRelationships = async () => {
    setIsLoadingRelationships(true);
    try {
      const { data, error } = await supabase
        .from('concept_relationships')
        .select('*')
        .or(`concept_a_id.eq.${concept.id},concept_b_id.eq.${concept.id}`)
        .eq('status', 'approved');
      
      if (!error && data) {
        setRelationships(data);
      }
    } catch (error) {
      console.error('Failed to load relationships:', error);
    }
    setIsLoadingRelationships(false);
  };

  const handleOpenAddRelationship = () => {
    setRelationshipType('');
    setTargetConceptId('');
    setRelationshipDescription('');
    setAddRelationshipDialog(true);
  };

  const handleSaveRelationship = async () => {
    console.log('Save relationship clicked', { relationshipType, targetConceptId });
    
    if (!relationshipType || !targetConceptId) {
      console.log('Missing required fields');
      return;
    }

    setIsSavingRelationship(true);

    const relationshipData = {
      domain_id: concept.domain_id,
      concept_a_id: concept.id,
      concept_b_id: targetConceptId,
      relationship_kind: getRelationshipKind(relationshipType),
      status: 'approved',
      // source: 'human', // Field may not exist in database
      metadata: {
        label: getRelationshipLabel(relationshipType),
        description: relationshipDescription || null
      }
    };

    console.log('Saving relationship data:', relationshipData);

    try {
      const { data, error } = await supabase
        .from('concept_relationships')
        .insert([relationshipData]);

      console.log('Supabase response:', { data, error });

      if (!error) {
        setAddRelationshipDialog(false);
        loadRelationships(); // Reload relationships
        console.log('Relationship saved successfully');
        // Reset form
        setRelationshipType('');
        setTargetConceptId('');
        setRelationshipDescription('');
      } else {
        console.error('Supabase error:', error);
        alert(`Failed to save relationship: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to save relationship:', error);
      alert('Failed to save relationship. Please try again.');
    } finally {
      setIsSavingRelationship(false);
    }
  };

  const getRelationshipKind = (type: string): 'prerequisite_of' | 'builds_on' | 'related_to' => {
    if (type === 'is_prerequisite_for') return 'prerequisite_of';
    if (type === 'is_built_upon_by') return 'builds_on';
    if (type === 'is_related_to') return 'related_to';
    return 'related_to';
  };

  const getRelationshipLabel = (type: string): string => {
    if (type === 'is_prerequisite_for') return 'Is a prerequisite of';
    if (type === 'is_built_upon_by') return 'Builds on';
    if (type === 'is_related_to') return 'Is related to';
    if (type === 'contains') return 'Contains';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const deleteRelationship = async (relationshipId: string) => {
    try {
      const { error } = await supabase
        .from('concept_relationships')
        .delete()
        .eq('id', relationshipId);

      if (!error) {
        loadRelationships(); // Reload relationships
      }
    } catch (error) {
      console.error('Failed to delete relationship:', error);
    }
  };

  const getRelationshipDisplay = (relationship: ConceptRelationship) => {
    const isSource = relationship.concept_a_id === concept.id;
    const otherConceptId = isSource ? relationship.concept_b_id : relationship.concept_a_id;
    const otherConcept = concepts.find(c => c.id === otherConceptId);
    
    return {
      otherConcept,
      direction: isSource ? 'outgoing' : 'incoming',
      displayType: relationship.relationship_kind,
      label: relationship.metadata?.label || relationship.relationship_kind.replace(/_/g, ' ')
    };
  };

  // Load difficulty level label
  const loadDifficultyLabel = async () => {
    try {
      const { data, error } = await supabase
        .from('difficulty_level_labels')
        .select('level_label')
        .eq('level', concept.difficulty_level ?? 0)
        .single();
      
      if (!error && data) {
        setDifficultyLabel(data.level_label);
      } else {
        // Fallback to default labels if database lookup fails
        setDifficultyLabel(getDifficultyLevel(concept.difficulty_level ?? 0).label);
      }
    } catch (error) {
      console.error('Failed to load difficulty label:', error);
      setDifficultyLabel(getDifficultyLevel(concept.difficulty_level ?? 0).label);
    }
  };

  // Load all difficulty levels for the dropdown
  const loadDifficultyLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('difficulty_level_labels')
        .select('level, level_label')
        .order('level');
      
      console.log('Difficulty levels response:', { data, error });
      
      if (!error && data) {
        setDifficultyLevels(data);
        console.log('Loaded difficulty levels:', data);
      } else {
        console.error('Error loading difficulty levels:', error);
        // Fallback to default levels if database query fails
        const defaultLevels = [
          { level: 0, level_label: 'Foundational' },
          { level: 1, level_label: 'Beginner' },
          { level: 2, level_label: 'Intermediate' },
          { level: 3, level_label: 'Advanced' },
          { level: 4, level_label: 'Expert' }
        ];
        setDifficultyLevels(defaultLevels);
        console.log('Using fallback difficulty levels:', defaultLevels);
      }
    } catch (error) {
      console.error('Failed to load difficulty levels:', error);
      // Fallback to default levels
      const defaultLevels = [
        { level: 0, level_label: 'Foundational' },
        { level: 1, level_label: 'Beginner' },
        { level: 2, level_label: 'Intermediate' },
        { level: 3, level_label: 'Advanced' },
        { level: 4, level_label: 'Expert' }
      ];
      setDifficultyLevels(defaultLevels);
    }
  };

  // Handle difficulty level update
  const handleSaveDifficultyLevel = () => {
    onUpdateConcept(concept.id, { difficulty_level: newDifficultyLevel });
    setIsEditingDifficulty(false);
    // Reload the difficulty label
    loadDifficultyLabel();
  };

  const handleCancelDifficultyEdit = () => {
    setNewDifficultyLevel(concept.difficulty_level ?? 0);
    setIsEditingDifficulty(false);
  };

  // Load relationships and difficulty label when component mounts
  useEffect(() => {
    loadRelationships();
    loadDifficultyLabel();
    loadDifficultyLevels();
  }, [concept.id]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Concept Header - Always Visible */}
      <div className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-3xl font-medium h-12 border-gray-300"
                    />
                    <Button size="sm" onClick={handleSaveName}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelNameEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-medium text-gray-900">{concept.name}</h1>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                      Level {concept.difficulty_level ?? 0}
                    </Badge>
                    <Badge 
                      className={
                        concept.status === 'approved' || concept.status === 'confirmed'
                          ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200 font-medium'
                          : concept.status === 'suggested'
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 font-medium'
                          : concept.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 font-medium'
                          : 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200 font-medium'
                      }
                    >
                      {concept.status === 'approved' || concept.status === 'confirmed' ? 'Approved' : 
                       concept.status === 'suggested' ? 'AI Suggested' : 
                       concept.status === 'pending' ? 'Pending' :
                       concept.status}
                    </Badge>
                  </>
                )}
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
                      <Button size="sm" variant="outline" onClick={handleCancelDescriptionEdit}>
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
                  onClick={() => {
                    // Navigate to learning goals page with the concept selected
                    navigate(`/admin/domain/${concept.domain_id}/goals?conceptId=${concept.id}`);
                  }}
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
                          <p className="text-2xl font-semibold">{relationships.length}</p>
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
                            {difficultyLabel || difficulty.label}
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
                                <Badge variant="outline" className="flex-shrink-0">L{child.difficulty_level ?? 0}</Badge>
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
                                  <Network className="h-4 w-4 text-blue-600" />
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
                  <Button 
                    className="bg-black text-white hover:bg-black/90"
                    onClick={handleOpenAddRelationship}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Relationship
                  </Button>
                </div>

                {isLoadingRelationships ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : relationships.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No relationships configured yet</p>
                    <p className="text-sm mt-1">Add relationships to connect this concept with others</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {relationships.map((relationship) => {
                      const { otherConcept, direction, displayType, label } = getRelationshipDisplay(relationship);
                      
                      if (!otherConcept) return null;

                      const getRelationshipIcon = (type: string, dir: string) => {
                        if (type === 'prerequisite_of') {
                          return dir === 'outgoing' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />;
                        }
                        if (type === 'builds_on') {
                          return dir === 'incoming' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />;
                        }
                        if (type === 'related_to') {
                          return <Link2 className="h-4 w-4" />;
                        }
                        return <Link2 className="h-4 w-4" />;
                      };

                      const getBadgeColor = (type: string) => {
                        if (type === 'prerequisite_of') return 'bg-red-100 text-red-800';
                        if (type === 'builds_on') return 'bg-blue-100 text-blue-800';
                        if (type === 'related_to') return 'bg-gray-100 text-gray-800';
                        return 'bg-gray-100 text-gray-800';
                      };

                      return (
                        <Card key={relationship.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getRelationshipIcon(displayType, direction)}
                              <Badge className={`${getBadgeColor(displayType)} border-0`}>
                                {label}
                              </Badge>
                              <div>
                                <h3 className="font-medium">{otherConcept.name}</h3>
                                {relationship.metadata?.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {relationship.metadata.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Edit relationship"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteRelationship(relationship.id)}
                                title="Delete relationship"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
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
                    <CardTitle className="text-lg">Difficulty Level</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Current Level</label>
                      {isEditingDifficulty ? (
                        <div className="space-y-3 mt-2">
                          <Select 
                            value={newDifficultyLevel.toString()} 
                            onValueChange={(value) => setNewDifficultyLevel(parseInt(value))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select difficulty level" />
                            </SelectTrigger>
                            <SelectContent>
                              {difficultyLevels.length > 0 ? (
                                difficultyLevels.map((level) => (
                                  <SelectItem key={level.level} value={level.level.toString()}>
                                    Level {level.level}: {level.level_label}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="0" disabled>Loading levels...</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveDifficultyLevel}>
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelDifficultyEdit}>
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground mb-2">
                            Level {concept.difficulty_level ?? 0}: {difficultyLabel || 'Loading...'}
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              console.log('Change Level clicked. Available levels:', difficultyLevels);
                              setIsEditingDifficulty(true);
                            }}
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Change Level
                          </Button>
                        </div>
                      )}
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
                        <label className="text-sm font-medium">Current Level</label>
                        <p className="text-sm text-muted-foreground">Level {concept.difficulty_level ?? 0}</p>
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
                        <p className="text-sm text-muted-foreground">{relationships.length}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Created By</label>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="bg-gray-100 text-gray-800 border-gray-200"
                          >
                            {/* Source field may not exist in database */}
                            {/* {concept.source === 'human' ? '👤 Human' : 
                             concept.source === 'ai' ? '🤖 AI' : 
                             concept.source === 'system' ? '⚙️ System' : concept.source} */}
                            📝 Manual
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Created At</label>
                        <p className="text-sm text-muted-foreground">
                          {concept.created_at ? new Date(concept.created_at).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Add Child Dialog */}
      <AddChildConceptModal
        open={addChildDialog}
        onOpenChange={setAddChildDialog}
        currentConcept={concept}
        concepts={concepts}
        onAddChild={handleAddChild}
      />

      {/* Add Relationship Dialog */}
      <Dialog open={addRelationshipDialog} onOpenChange={setAddRelationshipDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Relationship</DialogTitle>
            <DialogDescription>
              Create a new relationship between "{concept.name}" and another concept.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Relationship Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Relationship Type</label>
              <Select value={relationshipType} onValueChange={setRelationshipType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="is_prerequisite_for">Prerequisite: Must be learned before</SelectItem>
                  <SelectItem value="is_built_upon_by">Builds Upon: Extends this concept</SelectItem>
                  <SelectItem value="is_related_to">Related: Similar or connected concept</SelectItem>
                  <SelectItem value="contains">Contains: Includes as sub-concept</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Concept */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Concept</label>
              <Select value={targetConceptId} onValueChange={setTargetConceptId}>
                <SelectTrigger>
                  <SelectValue placeholder="Search and select concept" />
                </SelectTrigger>
                <SelectContent>
                  {concepts
                    .filter(c => c.id !== concept.id) // Don't show current concept
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((targetConcept) => (
                      <SelectItem key={targetConcept.id} value={targetConcept.id}>
                        <div className="flex items-center gap-2">
                          <span>{targetConcept.name}</span>
                          <Badge variant="outline" className="text-xs">
                            L{targetConcept.difficulty_level ?? 0}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            {/* Optional Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea
                value={relationshipDescription}
                onChange={(e) => setRelationshipDescription(e.target.value)}
                placeholder="Add additional context about this relationship..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddRelationshipDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRelationship}
              disabled={!relationshipType || !targetConceptId || isSavingRelationship}
              className="bg-black text-white hover:bg-black/90"
            >
              {isSavingRelationship ? 'Saving...' : 'Save Relationship'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Parent Dialog */}
      <Dialog open={changeParentDialog} onOpenChange={setChangeParentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Change Parent Concept</DialogTitle>
            <DialogDescription>
              Select a new parent concept for "{concept.name}" or make it a root-level concept.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Parent Concept</label>
              <Select 
                value={parentConcept?.id || 'none'} 
                onValueChange={(value) => {
                  if (value === 'none') {
                    onChangeParent(concept.id, undefined);
                  } else {
                    onChangeParent(concept.id, value);
                  }
                  setChangeParentDialog(false);
                }}
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
                    .filter(c => c.id !== concept.id) // Don't show current concept
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
              onClick={() => setChangeParentDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}