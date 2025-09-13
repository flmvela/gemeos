import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  ChevronRight, 
  BookOpen, 
  Target, 
  Dumbbell,
  Edit,
  Check,
  X,
  Eye,
  RefreshCw
} from 'lucide-react';
import { aiSuggestionsService, AIReviewItem } from '@/services/ai-suggestions.service';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ContentCard {
  type: 'concepts' | 'learning_goals' | 'exercises';
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface ConceptSuggestion {
  id: string;
  name: string;
  description: string;
  source: string;
  sourceType: 'file' | 'ai_analysis';
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  parent?: string;
  children?: string[];
  relationships: {
    relatedTo?: string[];
    prerequisiteOf?: string[];
    builtUpon?: string[];
  };
  selected: boolean;
}

interface LearningGoalSuggestion {
  id: string;
  title: string;
  description: string;
  conceptName: string;
  conceptDescription: string;
  bloomLevel: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  sequence: number;
  selected: boolean;
}

export default function ReviewAI() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { user } = useAuth();
  const [activeCard, setActiveCard] = useState<'concepts' | 'learning_goals' | 'exercises'>('concepts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contentCounts, setContentCounts] = useState({
    concepts: 0,
    learningGoals: 0,
    exercises: 0
  });
  
  // Real data for suggestions
  const [suggestions, setSuggestions] = useState<AIReviewItem[]>([]);
  
  // Mock data for concept suggestions (will be replaced with real data)
  const [conceptSuggestions, setConceptSuggestions] = useState<ConceptSuggestion[]>([
    {
      id: '1',
      name: 'Intervals',
      description: 'The distance between two musical notes. Intervals form the foundation of harmony and melody, measuring how far apart notes are in pitch.',
      source: 'File: master concept file chunk: intervals',
      sourceType: 'file',
      difficultyLevel: 'Beginner',
      parent: 'Scale',
      relationships: {
        relatedTo: ['Triads'],
        prerequisiteOf: ['scales']
      },
      selected: true
    },
    {
      id: '2',
      name: 'Major Scale Construction',
      description: 'A specific pattern of whole and half steps that creates the familiar do-re-mi sound. Built using the pattern: W-W-H-W-W-W-H.',
      source: 'AI Analysis: music theory fundamentals',
      sourceType: 'ai_analysis',
      difficultyLevel: 'Beginner',
      parent: 'Scale Theory',
      children: ['Key Signatures'],
      relationships: {
        builtUpon: ['Intervals'],
        relatedTo: ['Circle of Fifths']
      },
      selected: false
    }
  ]);
  
  // Mock data for learning goal suggestions
  const [learningGoalSuggestions, setLearningGoalSuggestions] = useState<LearningGoalSuggestion[]>([
    {
      id: '1',
      title: 'Master Basic Chord Progressions',
      description: 'Students will be able to identify, construct, and analyze common chord progressions in major and minor keys.',
      conceptName: 'Chord Progressions',
      conceptDescription: 'Sequential harmonic movement that creates musical structure and emotional expression through chord changes.',
      bloomLevel: 'Apply',
      sequence: 3,
      selected: true
    },
    {
      id: '2',
      title: 'Analyze Musical Form Structure',
      description: 'Students will demonstrate understanding of binary, ternary, and rondo forms through detailed structural analysis.',
      conceptName: 'Musical Form',
      conceptDescription: 'The organizational structure of a musical composition, defining how sections relate and develop over time.',
      bloomLevel: 'Analyze',
      sequence: 1,
      selected: false
    },
    {
      id: '3',
      title: 'Create Original Melodic Lines',
      description: 'Students will compose original melodies using appropriate scale choices and rhythmic patterns.',
      conceptName: 'Melodic Composition',
      conceptDescription: 'The art and technique of creating memorable and musically coherent melodic lines with proper phrasing.',
      bloomLevel: 'Create',
      sequence: 2,
      selected: false
    }
  ]);

  // Content cards configuration (using real counts)
  const contentCards: ContentCard[] = [
    {
      type: 'concepts',
      title: 'Concepts',
      count: contentCounts.concepts,
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-blue-600',
      description: 'Review AI suggested'
    },
    {
      type: 'learning_goals',
      title: 'Learning goals',
      count: contentCounts.learningGoals,
      icon: <Target className="h-5 w-5" />,
      color: 'text-green-600',
      description: 'Click to review'
    },
    {
      type: 'exercises',
      title: 'Exercises',
      count: contentCounts.exercises,
      icon: <Dumbbell className="h-5 w-5" />,
      color: 'text-purple-600',
      description: 'Click to review'
    }
  ];
  
  // Fetch review counts on mount
  useEffect(() => {
    fetchReviewCounts();
  }, [slug]);
  
  // Fetch suggestions when active card changes
  useEffect(() => {
    if (activeCard) {
      fetchSuggestions();
    }
  }, [activeCard, slug]);
  
  const fetchReviewCounts = async () => {
    try {
      // For now, use mock data since database might not be fully set up
      // In production, this would call: aiSuggestionsService.getReviewCounts(domainId)
      setContentCounts({
        concepts: 2,
        learningGoals: 3,
        exercises: 2
      });
    } catch (error) {
      console.error('Error fetching review counts:', error);
    }
  };
  
  const fetchSuggestions = async () => {
    try {
      setIsLoading(true);
      // For now, keep using mock data
      // In production: const data = await aiSuggestionsService.getReviewQueue(domainId, activeCard);
      // setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine default active card based on availability
  useEffect(() => {
    const cardsWithContent = contentCards.filter(card => card.count > 0);
    if (cardsWithContent.length > 0 && !cardsWithContent.find(c => c.type === activeCard)) {
      setActiveCard(cardsWithContent[0].type);
    }
  }, []);

  // Update selected count based on active card
  useEffect(() => {
    let selected = 0;
    let total = 0;
    
    if (activeCard === 'concepts') {
      selected = conceptSuggestions.filter(c => c.selected).length;
      total = conceptSuggestions.length;
    } else if (activeCard === 'learning_goals') {
      selected = learningGoalSuggestions.filter(lg => lg.selected).length;
      total = learningGoalSuggestions.length;
    }
    
    setSelectedCount(selected);
    setSelectAll(selected === total && total > 0);
  }, [conceptSuggestions, learningGoalSuggestions, activeCard]);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (activeCard === 'concepts') {
      setConceptSuggestions(concepts =>
        concepts.map(c => ({ ...c, selected: checked }))
      );
    } else if (activeCard === 'learning_goals') {
      setLearningGoalSuggestions(goals =>
        goals.map(lg => ({ ...lg, selected: checked }))
      );
    }
  };

  const handleSelectConcept = (id: string, checked: boolean) => {
    setConceptSuggestions(concepts =>
      concepts.map(c => c.id === id ? { ...c, selected: checked } : c)
    );
  };
  
  const handleSelectLearningGoal = (id: string, checked: boolean) => {
    setLearningGoalSuggestions(goals =>
      goals.map(lg => lg.id === id ? { ...lg, selected: checked } : lg)
    );
  };

  const handleApprove = async () => {
    let selectedItems: any[] = [];
    let itemType = '';
    
    if (activeCard === 'concepts') {
      selectedItems = conceptSuggestions.filter(c => c.selected);
      itemType = 'concept';
    } else if (activeCard === 'learning_goals') {
      selectedItems = learningGoalSuggestions.filter(lg => lg.selected);
      itemType = 'learning goal';
    }
    
    if (selectedItems.length === 0) {
      toast.error('Please select items to approve');
      return;
    }
    
    try {
      setIsLoading(true);
      // In production, this would call the actual service:
      // const suggestionIds = selectedItems.map(item => item.id);
      // await aiSuggestionsService.approveSuggestions(suggestionIds, user?.id || '');
      
      toast.success(`Approved ${selectedItems.length} ${itemType}${selectedItems.length > 1 ? 's' : ''}`);
      
      // Remove approved items from the list
      if (activeCard === 'concepts') {
        setConceptSuggestions(prev => prev.filter(c => !c.selected));
        setContentCounts(prev => ({
          ...prev,
          concepts: Math.max(0, prev.concepts - selectedItems.length)
        }));
      } else if (activeCard === 'learning_goals') {
        setLearningGoalSuggestions(prev => prev.filter(lg => !lg.selected));
        setContentCounts(prev => ({
          ...prev,
          learningGoals: Math.max(0, prev.learningGoals - selectedItems.length)
        }));
      }
      
      // Reset selection
      setSelectAll(false);
      setSelectedCount(0);
    } catch (error) {
      console.error('Error approving suggestions:', error);
      toast.error('Failed to approve suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    let selectedItems: any[] = [];
    let itemType = '';
    
    if (activeCard === 'concepts') {
      selectedItems = conceptSuggestions.filter(c => c.selected);
      itemType = 'concept';
    } else if (activeCard === 'learning_goals') {
      selectedItems = learningGoalSuggestions.filter(lg => lg.selected);
      itemType = 'learning goal';
    }
    
    if (selectedItems.length === 0) {
      toast.error('Please select items to reject');
      return;
    }
    
    try {
      setIsLoading(true);
      // In production, this would call the actual service:
      // const suggestionIds = selectedItems.map(item => item.id);
      // await aiSuggestionsService.rejectSuggestions(suggestionIds, user?.id || '', 'Rejected by user');
      
      toast.success(`Rejected ${selectedItems.length} ${itemType}${selectedItems.length > 1 ? 's' : ''}`);
      
      // Remove rejected items from the list
      if (activeCard === 'concepts') {
        setConceptSuggestions(prev => prev.filter(c => !c.selected));
        setContentCounts(prev => ({
          ...prev,
          concepts: Math.max(0, prev.concepts - selectedItems.length)
        }));
      } else if (activeCard === 'learning_goals') {
        setLearningGoalSuggestions(prev => prev.filter(lg => !lg.selected));
        setContentCounts(prev => ({
          ...prev,
          learningGoals: Math.max(0, prev.learningGoals - selectedItems.length)
        }));
      }
      
      // Reset selection
      setSelectAll(false);
      setSelectedCount(0);
    } catch (error) {
      console.error('Error rejecting suggestions:', error);
      toast.error('Failed to reject suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConcepts = conceptSuggestions.filter(concept =>
    concept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    concept.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredLearningGoals = learningGoalSuggestions.filter(goal =>
    goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    goal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    goal.conceptName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Review AI</h1>
        <p className="text-gray-600 mt-2">Review and approve AI-generated learning content</p>
      </div>

      {/* Content Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {contentCards.map((card) => (
          <Card
            key={card.type}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              activeCard === card.type 
                ? 'ring-2 ring-blue-500 shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => card.count > 0 && setActiveCard(card.type)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={card.color}>{card.icon}</div>
                    <h3 className="font-semibold text-lg">{card.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {card.type === activeCard ? (
                      <span>{card.description} ({card.count})</span>
                    ) : (
                      <span>{card.description} {card.count} {card.title.toLowerCase()}</span>
                    )}
                  </p>
                </div>
                {card.count > 0 && (
                  <ChevronRight className={`h-5 w-5 ${
                    activeCard === card.type ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review Section */}
      {activeCard === 'concepts' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Review Concepts</h2>
            <p className="text-gray-600">Review suggested concept and decide if they shall be approved or rejected</p>
          </div>

          {/* Search and Actions Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search anything"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button
              onClick={() => {
                fetchReviewCounts();
                fetchSuggestions();
              }}
              variant="outline"
              size="icon"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{selectedCount} selected</span>
              <Button
                onClick={handleApprove}
                disabled={selectedCount === 0 || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={handleReject}
                disabled={selectedCount === 0 || isLoading}
                variant="destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>

          {/* Concepts Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Concept Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Difficulty Level
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Parent / child
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Relationships
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredConcepts.map((concept) => (
                      <tr key={concept.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <Checkbox
                            checked={concept.selected}
                            onCheckedChange={(checked) => 
                              handleSelectConcept(concept.id, checked as boolean)
                            }
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            <BookOpen className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="font-medium text-gray-900">{concept.name}</p>
                              <p className="text-sm text-gray-600 mt-1 max-w-xs">
                                {concept.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">
                            {concept.sourceType === 'file' ? 'File: ' : 'AI Analysis: '}
                            {concept.source.replace('File: ', '').replace('AI Analysis: ', '')}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant="outline"
                            className={
                              concept.difficultyLevel === 'Beginner' 
                                ? 'text-green-700 border-green-300 bg-green-50' 
                                : concept.difficultyLevel === 'Intermediate'
                                ? 'text-yellow-700 border-yellow-300 bg-yellow-50'
                                : 'text-red-700 border-red-300 bg-red-50'
                            }
                          >
                            {concept.difficultyLevel}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {concept.parent && (
                              <p className="text-gray-600">Parent: {concept.parent}</p>
                            )}
                            {concept.children && concept.children.length > 0 && (
                              <p className="text-gray-600">
                                Child: {concept.children.join(', ')}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {concept.relationships.relatedTo && (
                              <p>Related to: {concept.relationships.relatedTo.join(', ')}</p>
                            )}
                            {concept.relationships.prerequisiteOf && (
                              <p>Prerequisite of: {concept.relationships.prerequisiteOf.join(', ')}</p>
                            )}
                            {concept.relationships.builtUpon && (
                              <p>Built upon: {concept.relationships.builtUpon.join(', ')}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => console.log('Edit concept:', concept.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => console.log('Approve concept:', concept.id)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => console.log('Reject concept:', concept.id)}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeCard === 'learning_goals' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Review Learning Goals</h2>
            <p className="text-gray-600">Review suggested learning goal and decide if they shall be approved or rejected</p>
          </div>

          {/* Search and Actions Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search anything"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button
              onClick={() => {
                fetchReviewCounts();
                fetchSuggestions();
              }}
              variant="outline"
              size="icon"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{selectedCount} selected</span>
              <Button
                onClick={handleApprove}
                disabled={selectedCount === 0 || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={handleReject}
                disabled={selectedCount === 0 || isLoading}
                variant="destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>

          {/* Learning Goals Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Learning Goal
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Concept
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Bloom Level
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Sequence
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLearningGoals.map((goal) => (
                      <tr key={goal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <Checkbox
                            checked={goal.selected}
                            onCheckedChange={(checked) => 
                              handleSelectLearningGoal(goal.id, checked as boolean)
                            }
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            <Target className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-base">{goal.title}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                {goal.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{goal.conceptName}</p>
                            <p className="text-sm text-gray-600 mt-1 max-w-xs">
                              {goal.conceptDescription}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant="outline"
                            className={
                              goal.bloomLevel === 'Remember' || goal.bloomLevel === 'Understand'
                                ? 'text-blue-700 border-blue-300 bg-blue-50' 
                                : goal.bloomLevel === 'Apply' || goal.bloomLevel === 'Analyze'
                                ? 'text-green-700 border-green-300 bg-green-50'
                                : 'text-purple-700 border-purple-300 bg-purple-50'
                            }
                          >
                            {goal.bloomLevel}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-semibold text-gray-700">#{goal.sequence}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => console.log('Edit learning goal:', goal.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => console.log('Approve learning goal:', goal.id)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => console.log('Reject learning goal:', goal.id)}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeCard === 'exercises' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Review Exercises</h2>
            <p className="text-gray-600">Review AI-generated exercises and approve or reject them</p>
          </div>
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No exercises to review at this time</p>
              <p className="text-sm mt-2">AI-generated exercises will appear here for review</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}