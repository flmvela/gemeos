import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { useDomains } from '@/hooks/useDomains';
import { useLearningGoals, type LearningGoal } from '@/hooks/useLearningGoals';
import { useToast } from '@/hooks/use-toast';
import { 
  Target, 
  Brain, 
  Plus, 
  Dumbbell, 
  Search, 
  ChevronDown, 
  Check, 
  X, 
  Edit3, 
  Save,
  Loader2,
  Music,
  BookOpen
} from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Concept {
  id: string;
  name: string;
  description?: string;
  difficulty_level?: number;
  domain_id: string;
}

interface GoalCardProps {
  goal: LearningGoal & { 
    title?: string; 
    bloomsLevel?: string; 
    concepts?: string[]; 
    status: 'suggested' | 'approved' | 'rejected' | 'edited';
  };
  onStatusChange: (goalId: string, status: 'suggested' | 'approved' | 'rejected' | 'edited') => void;
  onEdit: (goalId: string, updates: Partial<LearningGoal>) => void;
}

const BLOOMS_LEVELS = [
  'Remember',
  'Understand', 
  'Apply',
  'Analyze',
  'Evaluate',
  'Create'
];

const STATUS_CONFIG = {
  suggested: {
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    label: 'Pending Review'
  },
  approved: {
    color: 'bg-green-50 text-green-700 border-green-200',
    label: 'Approved'
  },
  rejected: {
    color: 'bg-red-50 text-red-700 border-red-200',
    label: 'Rejected'
  },
  edited: {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    label: 'Edited'
  }
};

function GoalCard({ goal, onStatusChange, onEdit }: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(goal.title || 'Untitled Goal');
  const [editedDescription, setEditedDescription] = useState(goal.goal_description);
  const [editedBloomsLevel, setEditedBloomsLevel] = useState(goal.bloomsLevel || goal.bloom_level || 'Apply');

  const handleSaveEdit = () => {
    onEdit(goal.id, {
      goal_description: editedDescription,
      bloom_level: editedBloomsLevel
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(goal.title || 'Untitled Goal');
    setEditedDescription(goal.goal_description);
    setEditedBloomsLevel(goal.bloomsLevel || goal.bloom_level || 'Apply');
    setIsEditing(false);
  };

  const statusConfig = STATUS_CONFIG[goal.status];

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="mb-2"
                placeholder="Goal title..."
              />
            ) : (
              <h3 className="pr-4">{goal.title || goal.goal_description.split('.')[0] || 'Untitled Goal'}</h3>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
              
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <BookOpen className="h-3 w-3" />
                {isEditing ? (
                  <Select value={editedBloomsLevel} onValueChange={setEditedBloomsLevel}>
                    <SelectTrigger className="w-32 h-6 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOMS_LEVELS.map(level => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span>{goal.bloomsLevel || goal.bloom_level || 'Apply'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveEdit}
                  className="h-8 w-8 p-0"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8 p-0"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                
                {goal.status !== 'approved' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onStatusChange(goal.id, 'approved')}
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                
                {goal.status !== 'rejected' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onStatusChange(goal.id, 'rejected')}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isEditing ? (
          <Textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            placeholder="Goal description..."
            className="min-h-[80px]"
          />
        ) : (
          <p className="text-muted-foreground leading-relaxed">
            {goal.goal_description}
          </p>
        )}

        {/* Concepts tags */}
        {goal.concepts && goal.concepts.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-4">
            {goal.concepts.map(conceptId => (
              <Badge key={conceptId} variant="secondary" className="text-xs">
                {conceptId.replace('-', ' ')}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ConceptSearchDropdownProps {
  selectedConcept: string | null;
  onConceptSelect: (conceptId: string) => void;
  concepts: Concept[];
}

function ConceptSearchDropdown({ selectedConcept, onConceptSelect, concepts }: ConceptSearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedConceptData = useMemo(() => {
    return concepts.find(c => c.id === selectedConcept);
  }, [concepts, selectedConcept]);

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConceptSelect('');
  };

  const filteredConcepts = useMemo(() => {
    if (!searchTerm) return concepts;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return concepts.filter(concept => 
      concept.name.toLowerCase().includes(lowerSearchTerm) ||
      concept.description?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [searchTerm, concepts]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[44px] p-3"
        >
          {selectedConceptData ? (
            <div className="flex items-center gap-2 text-left w-full">
              <div className="w-3 h-3 rounded-full flex-shrink-0 bg-blue-500" />
              <div className="flex-1 min-w-0">
                <div className="truncate">{selectedConceptData.name}</div>
                {selectedConceptData.description && (
                  <div className="text-xs text-muted-foreground truncate">
                    {selectedConceptData.description}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                <button
                  onClick={handleClearSelection}
                  className="h-4 w-4 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                <Search className="h-4 w-4 opacity-70" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Search className="h-4 w-4" />
              <span>Type to search a concept...</span>
            </div>
          )}
          {!selectedConceptData && (
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Type to search concepts..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-6 text-center text-sm">
                <Search className="mx-auto h-4 w-4 opacity-50 mb-2" />
                No concepts found matching "{searchTerm}"
              </div>
            </CommandEmpty>
            <ScrollArea className="h-[400px]">
              <CommandGroup>
                {filteredConcepts
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((concept) => (
                  <CommandItem
                    key={concept.id}
                    value={concept.id}
                    onSelect={(currentValue) => {
                      if (currentValue === selectedConcept) {
                        onConceptSelect('');
                      } else {
                        onConceptSelect(currentValue);
                      }
                      setOpen(false);
                      setSearchTerm('');
                    }}
                    className="p-3"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Check
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          selectedConcept === concept.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="w-3 h-3 rounded-full flex-shrink-0 bg-blue-500" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{concept.name}</span>
                          {concept.difficulty_level !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              L{concept.difficulty_level}
                            </Badge>
                          )}
                        </div>
                        {concept.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {concept.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface LearningGoalsPanelProps {
  goals: (LearningGoal & { 
    title?: string; 
    bloomsLevel?: string; 
    concepts?: string[]; 
    status: 'suggested' | 'approved' | 'rejected' | 'edited';
  })[];
  onGoalStatusChange: (goalId: string, status: 'suggested' | 'approved' | 'rejected' | 'edited') => void;
  onEdit: (goalId: string, updates: Partial<LearningGoal>) => void;
}

function LearningGoalsPanel({ goals, onGoalStatusChange, onEdit }: LearningGoalsPanelProps) {
  const [activeTab, setActiveTab] = useState('all');

  const filterGoalsByStatus = (status?: 'suggested' | 'approved' | 'rejected' | 'edited') => {
    if (!status) return goals;
    return goals.filter(goal => goal.status === status);
  };

  const getStatusCount = (status: 'suggested' | 'approved' | 'rejected' | 'edited') => {
    return goals.filter(goal => goal.status === status).length;
  };

  const handleGoalEdit = (goalId: string, updates: Partial<LearningGoal>) => {
    onEdit(goalId, updates);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Target className="h-5 w-5" />
        <h2>Generated Learning Goals</h2>
        <Badge variant="secondary">{goals.length} goals</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="relative">
            All
            <Badge variant="outline" className="ml-2 text-xs">
              {goals.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="suggested" className="relative">
            Pending
            <Badge variant="outline" className="ml-2 text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
              {getStatusCount('suggested')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="relative">
            Approved
            <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
              {getStatusCount('approved')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="relative">
            Rejected
            <Badge variant="outline" className="ml-2 text-xs bg-red-50 text-red-700 border-red-200">
              {getStatusCount('rejected')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="edited" className="relative">
            Edited
            <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
              {getStatusCount('edited')}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="all" className="mt-0">
            <GoalsList
              goals={filterGoalsByStatus()}
              onStatusChange={onGoalStatusChange}
              onEdit={handleGoalEdit}
            />
          </TabsContent>

          <TabsContent value="suggested" className="mt-0">
            <GoalsList
              goals={filterGoalsByStatus('suggested')}
              onStatusChange={onGoalStatusChange}
              onEdit={handleGoalEdit}
            />
          </TabsContent>

          <TabsContent value="approved" className="mt-0">
            <GoalsList
              goals={filterGoalsByStatus('approved')}
              onStatusChange={onGoalStatusChange}
              onEdit={handleGoalEdit}
            />
          </TabsContent>

          <TabsContent value="rejected" className="mt-0">
            <GoalsList
              goals={filterGoalsByStatus('rejected')}
              onStatusChange={onGoalStatusChange}
              onEdit={handleGoalEdit}
            />
          </TabsContent>

          <TabsContent value="edited" className="mt-0">
            <GoalsList
              goals={filterGoalsByStatus('edited')}
              onStatusChange={onGoalStatusChange}
              onEdit={handleGoalEdit}
            />
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}

interface GoalsListProps {
  goals: (LearningGoal & { 
    title?: string; 
    bloomsLevel?: string; 
    concepts?: string[]; 
    status: 'suggested' | 'approved' | 'rejected' | 'edited';
  })[];
  onStatusChange: (goalId: string, status: 'suggested' | 'approved' | 'rejected' | 'edited') => void;
  onEdit: (goalId: string, updates: Partial<LearningGoal>) => void;
}

function GoalsList({ goals, onStatusChange, onEdit }: GoalsListProps) {
  if (goals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>No learning goals in this category.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {goals.map(goal => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

export default function LearningGoalsPage() {
  const { domainId } = useParams<{ domainId: string }>();
  const [searchParams] = useSearchParams();
  const conceptIdFromUrl = searchParams.get('conceptId');
  
  const { domains } = useDomains();
  const domain = useMemo(() => {
    if (domainId) {
      return domains.find(d => d.id === domainId || (d as any).slug === domainId);
    }
    // For teacher routes without domainId, try to get domain from the first available domain
    // or we could add domain selection UI
    return domains[0];
  }, [domains, domainId]);
  
  const [selectedConcept, setSelectedConcept] = useState<string | null>(conceptIdFromUrl);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [generatedGoals, setGeneratedGoals] = useState<(LearningGoal & { 
    title?: string; 
    bloomsLevel?: string; 
    concepts?: string[]; 
    status: 'suggested' | 'approved' | 'rejected' | 'edited';
  })[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingConcepts, setIsLoadingConcepts] = useState(false);

  const { goals, approveGoal, rejectGoal, editGoal } = useLearningGoals(domain?.id ?? domainId);
  const { toast } = useToast();

  // Load concepts for the domain
  useEffect(() => {
    if (!domain?.id && !domainId) return;
    
    const loadConcepts = async () => {
      setIsLoadingConcepts(true);
      try {
        const dId = domain?.id ?? domainId!;
        const { data, error } = await supabase
          .from('concepts')
          .select('id, name, description, difficulty_level, domain_id')
          .eq('domain_id', dId)
          .eq('status', 'approved')
          .order('name');
        
        if (error) throw error;
        setConcepts(data || []);
      } catch (error) {
        console.error('Failed to load concepts:', error);
        toast({
          title: 'Failed to load concepts',
          description: 'Please try refreshing the page.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingConcepts(false);
      }
    };

    loadConcepts();
  }, [domain?.id, domainId, toast]);

  // Convert goals to the expected format
  useEffect(() => {
    const formattedGoals = goals.map(goal => ({
      ...goal,
      status: (goal.status as 'suggested' | 'approved' | 'rejected' | 'edited') || 'suggested',
      title: goal.goal_description.split('.')[0] + '.',
      bloomsLevel: goal.bloom_level,
      concepts: [selectedConcept].filter(Boolean) as string[]
    }));
    setGeneratedGoals(formattedGoals);
  }, [goals, selectedConcept]);

  // Generate goals function (similar to the Figma design)
  const generateGoalsForConcept = async (conceptId: string): Promise<(LearningGoal & { 
    title?: string; 
    bloomsLevel?: string; 
    concepts?: string[]; 
    status: 'suggested' | 'approved' | 'rejected' | 'edited';
  })[]> => {
    const concept = concepts.find(c => c.id === conceptId);
    if (!concept) return [];

    const conceptName = concept.name;
    const baseGoals: (LearningGoal & { 
      title?: string; 
      bloomsLevel?: string; 
      concepts?: string[]; 
      status: 'suggested' | 'approved' | 'rejected' | 'edited';
    })[] = [];

    // Generate goals based on concept
    baseGoals.push(
      {
        id: `goal-${conceptId}-understanding`,
        concept_id: conceptId,
        title: `Understand ${conceptName} fundamentals`,
        goal_description: `Students will explain the basic principles and characteristics of ${conceptName}, including its role in the domain and practical applications.`,
        bloom_level: 'Understand',
        bloomsLevel: 'Understand',
        goal_type: 'learning_objective',
        sequence_order: 1,
        status: 'suggested',
        created_at: new Date().toISOString(),
        concepts: [conceptId],
        metadata_json: null
      },
      {
        id: `goal-${conceptId}-application`,
        concept_id: conceptId,
        title: `Apply ${conceptName} in practice`,
        goal_description: `Students will demonstrate practical application of ${conceptName} in real-world scenarios and problem-solving contexts.`,
        bloom_level: 'Apply',
        bloomsLevel: 'Apply',
        goal_type: 'learning_objective',
        sequence_order: 2,
        status: 'suggested',
        created_at: new Date().toISOString(),
        concepts: [conceptId],
        metadata_json: null
      },
      {
        id: `goal-${conceptId}-analysis`,
        concept_id: conceptId,
        title: `Analyze ${conceptName} in context`,
        goal_description: `Students will analyze examples of ${conceptName} in various contexts, identifying key patterns and relationships with other concepts.`,
        bloom_level: 'Analyze',
        bloomsLevel: 'Analyze',
        goal_type: 'learning_objective',
        sequence_order: 3,
        status: 'suggested',
        created_at: new Date().toISOString(),
        concepts: [conceptId],
        metadata_json: null
      }
    );

    return baseGoals;
  };

  const handleGenerateGoals = async () => {
    if (!selectedConcept) return;
    
    setIsGenerating(true);
    
    try {
      // Mock AI service delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockGoals = await generateGoalsForConcept(selectedConcept);
      setGeneratedGoals(mockGoals);
      
      toast({
        title: 'Goals Generated',
        description: `Generated ${mockGoals.length} learning goals for the selected concept.`,
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate learning goals. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGoalStatusChange = async (goalId: string, status: 'suggested' | 'approved' | 'rejected' | 'edited') => {
    try {
      if (status === 'approved') {
        await approveGoal(goalId);
      } else if (status === 'rejected') {
        await rejectGoal(goalId);
      }
      
      // Update local state
      setGeneratedGoals(prev => 
        prev.map(goal => 
          goal.id === goalId ? { ...goal, status } : goal
        )
      );
    } catch (error) {
      toast({
        title: 'Status Update Failed',
        description: 'Failed to update goal status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async (goalId: string, updates: Partial<LearningGoal>) => {
    try {
      await editGoal(goalId, updates.goal_description || '');
      
      // Update local state
      setGeneratedGoals(prev => 
        prev.map(goal => 
          goal.id === goalId ? { ...goal, ...updates, status: 'edited' as const } : goal
        )
      );
    } catch (error) {
      toast({
        title: 'Edit Failed',
        description: 'Failed to edit goal. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getConceptDisplayName = (conceptId: string): string => {
    const concept = concepts.find(c => c.id === conceptId);
    return concept?.name || conceptId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Breadcrumb Navigation */}
        <DynamicBreadcrumb />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-3xl">Learning Goals Management</h1>
          </div>
          <p className="text-muted-foreground">
            {domainId 
              ? `Search and select a concept below to generate AI-suggested learning goals for ${domain?.name || 'this domain'}.`
              : 'Search and select a concept below to generate AI-suggested learning goals for your curriculum.'
            }
          </p>
          
          {/* Domain Selection for Teacher Routes */}
          {!domainId && domains.length > 0 && (
            <div className="mt-4">
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <label className="text-sm font-medium">Domain:</label>
                    <Select 
                      value={domain?.id || ''} 
                      onValueChange={(value) => {
                        // This would ideally update the domain selection
                        window.location.reload(); // Simple reload for now
                      }}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select a domain" />
                      </SelectTrigger>
                      <SelectContent>
                        {domains.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Concept Selection Section */}
          <div className="lg:col-span-2 flex">
            <Card className="p-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  <h2>
                    {selectedConcept 
                      ? `Selected concept: ${getConceptDisplayName(selectedConcept)}`
                      : 'Select concept or show the name of the selected concept'
                    }
                  </h2>
                </div>
              </div>
              {isLoadingConcepts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading concepts...</span>
                </div>
              ) : (
                <ConceptSearchDropdown
                  selectedConcept={selectedConcept}
                  onConceptSelect={(conceptId) => {
                    setSelectedConcept(conceptId === selectedConcept ? null : conceptId);
                    setGeneratedGoals([]); // Clear previous goals when concept changes
                  }}
                  concepts={concepts}
                />
              )}
            </Card>
          </div>

          {/* Control Panel */}
          <div className="flex flex-col">
            <Card className="p-6 flex-1">
              <div className="space-y-1">
                {/* Action Buttons Grid */}
                <div className="grid grid-cols-1 gap-3">
                  {/* AI Generate Goals Button */}
                  <Button
                    onClick={handleGenerateGoals}
                    disabled={!selectedConcept || isGenerating}
                    className="flex items-center gap-2"
                    variant="default"
                  >
                    <Brain className="h-4 w-4" />
                    {isGenerating ? 'Generating...' : 'AI Generate Goals'}
                  </Button>
                  
                  {/* Manual Create Goal Button */}
                  <Button
                    onClick={() => {
                      // TODO: Implement manual goal creation
                      console.log('Manual goal creation clicked');
                      toast({
                        title: 'Coming Soon',
                        description: 'Manual goal creation will be available soon.',
                      });
                    }}
                    disabled={!selectedConcept}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Goal Manually
                  </Button>
                  
                  {/* View Exercises Button */}
                  <Button
                    onClick={() => {
                      // TODO: Implement navigation to exercises
                      console.log('View exercises clicked');
                      toast({
                        title: 'Coming Soon',
                        description: 'Exercise management will be available soon.',
                      });
                    }}
                    disabled={!selectedConcept}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Dumbbell className="h-4 w-4" />
                    View Exercises
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Learning Goals Panel - always displayed */}
        <div className="mt-12">
          <LearningGoalsPanel
            goals={generatedGoals}
            onGoalStatusChange={handleGoalStatusChange}
            onEdit={handleEdit}
          />
        </div>
      </div>
    </div>
  );
}