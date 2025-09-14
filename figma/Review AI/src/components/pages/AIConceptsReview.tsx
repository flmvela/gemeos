import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Slider } from '../ui/slider';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { toast } from 'sonner@2.0.3';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Edit,
  ArrowRight,
  Building2,
  Link,
  Brain,
  TrendingUp,
  AlertCircle,
  Save,
  SkipForward,
  RefreshCw
} from 'lucide-react';

// Mock data types
interface AIConcept {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  domain: string;
  difficulty: number;
  confidence: number;
  suggestionType: 'new' | 'refinement' | 'enrichment' | 'relationship';
  aiReasoning: string;
  originalTitle?: string;
  originalDescription?: string;
  relationships: Array<{
    id: string;
    type: 'prerequisite' | 'builtupon' | 'related';
    targetConcept: string;
  }>;
  tags: string[];
  parentConcept?: string;
  createdAt: string;
  confidence_breakdown: {
    relevance: number;
    accuracy: number;
    completeness: number;
    clarity: number;
  };
  processing_metadata: {
    model: string;
    tokens: number;
    processing_time: number;
  };
}

// Mock data
const mockConcepts: AIConcept[] = [
  {
    id: '1',
    title: 'Machine Learning Fundamentals',
    description: 'Core principles of machine learning including supervised, unsupervised, and reinforcement learning approaches with practical applications in data science.',
    originalTitle: 'Introduction to ML',
    originalDescription: 'Basic overview of machine learning concepts and types.',
    status: 'pending',
    domain: 'Computer Science',
    difficulty: 6,
    confidence: 87,
    suggestionType: 'enrichment',
    aiReasoning: 'The original concept lacked depth and practical context. This enhanced version provides comprehensive coverage of ML paradigms with real-world applications, better preparing students for advanced topics.',
    relationships: [
      { id: '1', type: 'prerequisite', targetConcept: 'Statistics and Probability' },
      { id: '2', type: 'builtupon', targetConcept: 'Programming Fundamentals' }
    ],
    tags: ['AI', 'Data Science', 'Algorithms', 'Supervised Learning', 'Unsupervised Learning'],
    createdAt: '2024-12-08T10:30:00Z',
    confidence_breakdown: {
      relevance: 92,
      accuracy: 89,
      completeness: 85,
      clarity: 83
    },
    processing_metadata: {
      model: 'GPT-4',
      tokens: 1247,
      processing_time: 2.3
    }
  },
  {
    id: '2',
    title: 'Neural Network Architecture',
    description: 'Deep dive into neural network structures, including feedforward, convolutional, and recurrent networks with hands-on implementation examples.',
    originalTitle: 'Basic Neural Networks',
    originalDescription: 'Introduction to neural networks and their basic structure.',
    status: 'pending',
    domain: 'Computer Science',
    difficulty: 8,
    confidence: 92,
    suggestionType: 'refinement',
    aiReasoning: 'The original concept was too basic for the target learning level. This enhancement provides more comprehensive coverage of modern architectures with practical implementation guidance.',
    relationships: [
      { id: '3', type: 'builtupon', targetConcept: 'Machine Learning Fundamentals' },
      { id: '4', type: 'related', targetConcept: 'Deep Learning Applications' }
    ],
    tags: ['Neural Networks', 'Deep Learning', 'Architecture', 'CNN', 'RNN'],
    parentConcept: 'Machine Learning Fundamentals',
    createdAt: '2024-12-08T09:15:00Z',
    confidence_breakdown: {
      relevance: 95,
      accuracy: 91,
      completeness: 90,
      clarity: 92
    },
    processing_metadata: {
      model: 'GPT-4',
      tokens: 1856,
      processing_time: 3.1
    }
  },
  {
    id: '3',
    title: 'Quantum Computing Principles',
    description: 'Fundamental concepts of quantum computing including qubits, superposition, entanglement, and quantum algorithms with practical applications in cryptography and optimization.',
    originalTitle: 'Quantum Computing Basics',
    originalDescription: 'Simple introduction to quantum computers and how they differ from classical computers.',
    status: 'approved',
    domain: 'Physics',
    difficulty: 9,
    confidence: 78,
    suggestionType: 'refinement',
    aiReasoning: 'The original was overly simplified. Enhanced version includes practical applications and bridges theoretical concepts with real-world use cases in cryptography and optimization.',
    relationships: [
      { id: '5', type: 'prerequisite', targetConcept: 'Linear Algebra' },
      { id: '6', type: 'prerequisite', targetConcept: 'Quantum Mechanics Basics' },
      { id: '7', type: 'related', targetConcept: 'Cryptography Fundamentals' }
    ],
    tags: ['Quantum', 'Computing', 'Physics', 'Cryptography', 'Algorithms'],
    createdAt: '2024-12-07T14:20:00Z',
    confidence_breakdown: {
      relevance: 85,
      accuracy: 82,
      completeness: 75,
      clarity: 70
    },
    processing_metadata: {
      model: 'GPT-4',
      tokens: 2103,
      processing_time: 4.2
    }
  },
  {
    id: '4',
    title: 'Advanced Data Structures and Algorithms',
    description: 'Comprehensive study of complex data structures including trees, graphs, heaps, and advanced algorithms for sorting, searching, and optimization with time complexity analysis.',
    originalTitle: 'Data Structures',
    originalDescription: 'Learn about arrays, lists, and basic data organization.',
    status: 'pending',
    domain: 'Computer Science',
    difficulty: 7,
    confidence: 94,
    suggestionType: 'enrichment',
    aiReasoning: 'Original concept was too elementary. Enhanced version covers advanced structures and algorithms with complexity analysis, preparing students for technical interviews and advanced CS courses.',
    relationships: [
      { id: '8', type: 'builtupon', targetConcept: 'Programming Fundamentals' },
      { id: '9', type: 'prerequisite', targetConcept: 'Mathematical Foundations' },
      { id: '10', type: 'related', targetConcept: 'Algorithm Design Patterns' }
    ],
    tags: ['Data Structures', 'Algorithms', 'Trees', 'Graphs', 'Optimization', 'Complexity Analysis'],
    createdAt: '2024-12-08T11:45:00Z',
    confidence_breakdown: {
      relevance: 96,
      accuracy: 94,
      completeness: 92,
      clarity: 94
    },
    processing_metadata: {
      model: 'GPT-4',
      tokens: 1654,
      processing_time: 2.8
    }
  },
  {
    id: '5',
    title: 'Blockchain Technology and Cryptocurrencies',
    description: 'In-depth exploration of blockchain architecture, consensus mechanisms, smart contracts, and cryptocurrency ecosystems with security considerations.',
    originalTitle: 'Introduction to Bitcoin',
    originalDescription: 'What is Bitcoin and how digital money works.',
    status: 'pending',
    domain: 'Computer Science',
    difficulty: 6,
    confidence: 89,
    suggestionType: 'enrichment',
    aiReasoning: 'Original focus was too narrow on Bitcoin. Expanded to cover comprehensive blockchain technology, various cryptocurrencies, and real-world applications beyond digital currency.',
    relationships: [
      { id: '11', type: 'prerequisite', targetConcept: 'Cryptography Fundamentals' },
      { id: '12', type: 'related', targetConcept: 'Distributed Systems' },
      { id: '13', type: 'related', targetConcept: 'Network Security' }
    ],
    tags: ['Blockchain', 'Cryptocurrency', 'Security', 'Distributed Systems', 'Smart Contracts'],
    createdAt: '2024-12-08T08:20:00Z',
    confidence_breakdown: {
      relevance: 91,
      accuracy: 87,
      completeness: 88,
      clarity: 90
    },
    processing_metadata: {
      model: 'GPT-4',
      tokens: 1923,
      processing_time: 3.5
    }
  }
];

const statusColors = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200'
};

const suggestionTypeColors = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  refinement: 'bg-purple-100 text-purple-800 border-purple-200',
  enrichment: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  relationship: 'bg-teal-100 text-teal-800 border-teal-200'
};

const getConfidenceColor = (score: number) => {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
};

const getDifficultyColor = (level: number) => {
  const percentage = (level - 1) / 9;
  if (percentage <= 0.33) return 'bg-green-500';
  if (percentage <= 0.66) return 'bg-amber-500';
  return 'bg-red-500';
};

export function AIConceptsReview() {
  const [concepts, setConcepts] = useState<AIConcept[]>(mockConcepts);
  const [selectedConcept, setSelectedConcept] = useState<AIConcept | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    status: 'all',
    domain: 'all',
    difficulty: 'all',
    suggestionType: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [editedConcept, setEditedConcept] = useState<Partial<AIConcept>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Stats calculation
  const stats = {
    totalPending: concepts.filter(c => c.status === 'pending').length,
    approvedToday: concepts.filter(c => 
      c.status === 'approved' && 
      new Date(c.createdAt).toDateString() === new Date().toDateString()
    ).length,
    rejectedToday: concepts.filter(c => 
      c.status === 'rejected' && 
      new Date(c.createdAt).toDateString() === new Date().toDateString()
    ).length
  };

  // Filter concepts
  const filteredConcepts = concepts.filter(concept => {
    const matchesSearch = concept.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         concept.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filters.status === 'all' || concept.status === filters.status;
    const matchesDomain = filters.domain === 'all' || concept.domain === filters.domain;
    const matchesSuggestionType = filters.suggestionType === 'all' || concept.suggestionType === filters.suggestionType;
    
    return matchesSearch && matchesStatus && matchesDomain && matchesSuggestionType;
  });

  // Handle concept selection
  const handleConceptSelect = (concept: AIConcept) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Do you want to discard them?');
      if (!confirmed) return;
    }
    setSelectedConcept(concept);
    setEditedConcept({});
    setHasUnsavedChanges(false);
    setActiveTab('overview');
  };

  // Handle field editing
  const handleFieldChange = (field: string, value: any) => {
    setEditedConcept(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Handle concept actions
  const handleApprove = (conceptId: string, withEdits = false) => {
    setConcepts(prev => prev.map(c => 
      c.id === conceptId 
        ? { ...c, ...editedConcept, status: 'approved' as const }
        : c
    ));
    toast.success(`Concept ${withEdits ? 'approved with edits' : 'approved'}`);
    setHasUnsavedChanges(false);
  };

  const handleReject = (conceptId: string) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (reason) {
      setConcepts(prev => prev.map(c => 
        c.id === conceptId ? { ...c, status: 'rejected' as const } : c
      ));
      toast.error('Concept rejected');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedConcept) return;
      
      switch (e.key.toLowerCase()) {
        case 'a':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handleApprove(selectedConcept.id);
          }
          break;
        case 'r':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handleReject(selectedConcept.id);
          }
          break;
        case 'e':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setActiveTab('overview');
          }
          break;
        case ' ':
          e.preventDefault();
          const currentIndex = filteredConcepts.findIndex(c => c.id === selectedConcept.id);
          const nextConcept = filteredConcepts[currentIndex + 1];
          if (nextConcept) {
            handleConceptSelect(nextConcept);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedConcept, filteredConcepts]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">AI Concepts Review</h1>
              <p className="text-sm text-gray-600 mt-1">Review and approve AI-generated learning concepts</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">{stats.totalPending}</span>
                  <span className="text-gray-600">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium">{stats.approvedToday}</span>
                  <span className="text-gray-600">Approved Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="font-medium">{stats.rejectedToday}</span>
                  <span className="text-gray-600">Rejected Today</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Column - Review Queue */}
        <div className="w-1/2 lg:w-[55%] border-r border-gray-200 bg-white min-w-0">
          <div className="p-4 space-y-4">
            {/* Batch Operations */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedItems.size === filteredConcepts.length && filteredConcepts.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedItems(new Set(filteredConcepts.map(c => c.id)));
                        } else {
                          setSelectedItems(new Set());
                        }
                      }}
                    />
                    <span className="text-sm font-medium">
                      {selectedItems.size > 0 ? `${selectedItems.size} selected` : 'Select All'}
                    </span>
                  </div>
                  {selectedItems.size > 0 && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve Selected
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-600">
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject Selected
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search concepts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.domain} onValueChange={(value) => setFilters(prev => ({ ...prev, domain: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Domain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Domains</SelectItem>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.suggestionType} onValueChange={(value) => setFilters(prev => ({ ...prev, suggestionType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="new">New Concept</SelectItem>
                      <SelectItem value="refinement">Refinement</SelectItem>
                      <SelectItem value="enrichment">Enrichment</SelectItem>
                      <SelectItem value="relationship">Relationship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Concept List */}
            <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto">
              {filteredConcepts.map((concept) => (
                <Card 
                  key={concept.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedConcept?.id === concept.id ? 'ring-2 ring-blue-500 shadow-md' : ''
                  }`}
                  onClick={() => handleConceptSelect(concept)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={selectedItems.has(concept.id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedItems);
                          if (checked) {
                            newSelected.add(concept.id);
                          } else {
                            newSelected.delete(concept.id);
                          }
                          setSelectedItems(newSelected);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900 leading-tight">{concept.title}</h3>
                          <div className="flex gap-2 ml-2">
                            <Badge className={`text-xs ${statusColors[concept.status]}`}>
                              {concept.status}
                            </Badge>
                            <Badge className={`text-xs ${suggestionTypeColors[concept.suggestionType]}`}>
                              {concept.suggestionType}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {concept.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-4">
                            <span>{concept.domain}</span>
                            <div className="flex items-center gap-1">
                              <div 
                                className={`w-2 h-2 rounded-full ${getDifficultyColor(concept.difficulty)}`}
                              ></div>
                              <span>Level {concept.difficulty}</span>
                            </div>
                            <span className={`font-medium ${getConfidenceColor(concept.confidence)}`}>
                              {concept.confidence}% confidence
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-red-600">
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Detail View */}
        <div className="w-1/2 lg:w-[45%] bg-white flex flex-col min-w-0">
          {selectedConcept ? (
            <>
              {/* Detail Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {activeTab === 'overview' ? (
                      <Input
                        value={editedConcept.title ?? selectedConcept.title}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        className="text-xl font-semibold mb-2 border-none p-0 focus:ring-0"
                        placeholder="Concept title..."
                      />
                    ) : (
                      <h2 className="text-xl font-semibold mb-2">{selectedConcept.title}</h2>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusColors[selectedConcept.status]}`}>
                        {selectedConcept.status}
                      </Badge>
                      <Badge className={`${suggestionTypeColors[selectedConcept.suggestionType]}`}>
                        {selectedConcept.suggestionType}
                      </Badge>
                      <span className="text-sm text-gray-500">{selectedConcept.domain}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-transparent border-none">
                    <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="comparison" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none">
                      Comparison
                    </TabsTrigger>
                    <TabsTrigger value="relationships" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none">
                      Relationships
                    </TabsTrigger>
                    <TabsTrigger value="reasoning" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none">
                      AI Reasoning
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <Tabs value={activeTab} className="w-full">
                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-6 mt-0">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                      <Textarea
                        value={editedConcept.description ?? selectedConcept.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Difficulty Level</label>
                        <div className="px-3">
                          <Slider
                            value={[editedConcept.difficulty ?? selectedConcept.difficulty]}
                            onValueChange={([value]) => handleFieldChange('difficulty', value)}
                            max={10}
                            min={1}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Beginner</span>
                            <span className="font-medium">{editedConcept.difficulty ?? selectedConcept.difficulty}/10</span>
                            <span>Expert</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Domain</label>
                        <Select 
                          value={editedConcept.domain ?? selectedConcept.domain}
                          onValueChange={(value) => handleFieldChange('domain', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Computer Science">Computer Science</SelectItem>
                            <SelectItem value="Physics">Physics</SelectItem>
                            <SelectItem value="Mathematics">Mathematics</SelectItem>
                            <SelectItem value="Biology">Biology</SelectItem>
                            <SelectItem value="Chemistry">Chemistry</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
                      <Input
                        value={(editedConcept.tags ?? selectedConcept.tags).join(', ')}
                        onChange={(e) => handleFieldChange('tags', e.target.value.split(', ').filter(Boolean))}
                        placeholder="Enter tags separated by commas"
                      />
                    </div>

                    {selectedConcept.parentConcept && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Parent Concept</label>
                        <Input
                          value={editedConcept.parentConcept ?? selectedConcept.parentConcept}
                          onChange={(e) => handleFieldChange('parentConcept', e.target.value)}
                          placeholder="Parent concept name"
                        />
                      </div>
                    )}
                  </TabsContent>

                  {/* Comparison Tab */}
                  <TabsContent value="comparison" className="mt-0">
                    {selectedConcept.originalTitle || selectedConcept.originalDescription ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Changes Overview</h3>
                          <div className="flex gap-2">
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              {selectedConcept.suggestionType === 'enrichment' ? 'Content Enhanced' : 
                               selectedConcept.suggestionType === 'refinement' ? 'Content Refined' : 
                               'Content Modified'}
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Detailed View
                            </Button>
                          </div>
                        </div>

                        {/* Summary of Changes */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Enhancement Summary</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-blue-700">Title:</span>
                              <span className="ml-2 text-blue-900">
                                {selectedConcept.originalTitle !== selectedConcept.title ? 'Modified' : 'Unchanged'}
                              </span>
                            </div>
                            <div>
                              <span className="text-blue-700">Description:</span>
                              <span className="ml-2 text-blue-900">
                                {selectedConcept.originalDescription !== selectedConcept.description ? 'Enhanced' : 'Unchanged'}
                              </span>
                            </div>
                            <div>
                              <span className="text-blue-700">Complexity:</span>
                              <span className="ml-2 text-blue-900">Level {selectedConcept.difficulty}</span>
                            </div>
                            <div>
                              <span className="text-blue-700">Tags Added:</span>
                              <span className="ml-2 text-blue-900">
                                {selectedConcept.tags.length > 3 ? `${selectedConcept.tags.length - 3} new` : 'None'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {selectedConcept.originalTitle && (
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Title Changes</label>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                              <div className="p-3 bg-red-50 border border-red-200 rounded">
                                <div className="text-xs text-red-600 mb-1 font-medium">ORIGINAL</div>
                                <div className="text-red-800">{selectedConcept.originalTitle}</div>
                                <div className="text-xs text-red-600 mt-2">
                                  Characters: {selectedConcept.originalTitle.length}
                                </div>
                              </div>
                              <div className="p-3 bg-green-50 border border-green-200 rounded">
                                <div className="text-xs text-green-600 mb-1 font-medium">ENHANCED</div>
                                <div className="text-green-800">{selectedConcept.title}</div>
                                <div className="text-xs text-green-600 mt-2">
                                  Characters: {selectedConcept.title.length} 
                                  <span className="ml-2">
                                    ({selectedConcept.title.length > selectedConcept.originalTitle.length ? '+' : ''}
                                    {selectedConcept.title.length - selectedConcept.originalTitle.length})
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {selectedConcept.originalDescription && (
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Description Changes</label>
                            <div className="space-y-3">
                              <div className="p-3 bg-red-50 border border-red-200 rounded">
                                <div className="text-xs text-red-600 mb-1 font-medium">ORIGINAL</div>
                                <div className="text-red-800 text-sm leading-relaxed">{selectedConcept.originalDescription}</div>
                                <div className="text-xs text-red-600 mt-2">
                                  Words: {selectedConcept.originalDescription.split(' ').length} | 
                                  Characters: {selectedConcept.originalDescription.length}
                                </div>
                              </div>
                              <div className="p-3 bg-green-50 border border-green-200 rounded">
                                <div className="text-xs text-green-600 mb-1 font-medium">ENHANCED</div>
                                <div className="text-green-800 text-sm leading-relaxed">{selectedConcept.description}</div>
                                <div className="text-xs text-green-600 mt-2">
                                  Words: {selectedConcept.description.split(' ').length} 
                                  <span className="ml-2">
                                    ({selectedConcept.description.split(' ').length > selectedConcept.originalDescription.split(' ').length ? '+' : ''}
                                    {selectedConcept.description.split(' ').length - selectedConcept.originalDescription.split(' ').length})
                                  </span>
                                  | Characters: {selectedConcept.description.length}
                                  <span className="ml-2">
                                    ({selectedConcept.description.length > selectedConcept.originalDescription.length ? '+' : ''}
                                    {selectedConcept.description.length - selectedConcept.originalDescription.length})
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Key Improvements */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Key Improvements</label>
                          <div className="space-y-2">
                            {selectedConcept.suggestionType === 'enrichment' && (
                              <>
                                <div className="flex items-start gap-2 p-2 bg-green-50 rounded">
                                  <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
                                  <span className="text-sm text-green-800">Enhanced depth and practical applications</span>
                                </div>
                                <div className="flex items-start gap-2 p-2 bg-green-50 rounded">
                                  <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
                                  <span className="text-sm text-green-800">Added comprehensive examples and use cases</span>
                                </div>
                                <div className="flex items-start gap-2 p-2 bg-green-50 rounded">
                                  <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
                                  <span className="text-sm text-green-800">Improved learning progression and structure</span>
                                </div>
                              </>
                            )}
                            {selectedConcept.suggestionType === 'refinement' && (
                              <>
                                <div className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                                  <RefreshCw className="w-4 h-4 text-blue-600 mt-0.5" />
                                  <span className="text-sm text-blue-800">Refined content for target audience</span>
                                </div>
                                <div className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                                  <RefreshCw className="w-4 h-4 text-blue-600 mt-0.5" />
                                  <span className="text-sm text-blue-800">Improved clarity and technical accuracy</span>
                                </div>
                                <div className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                                  <RefreshCw className="w-4 h-4 text-blue-600 mt-0.5" />
                                  <span className="text-sm text-blue-800">Better alignment with learning objectives</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Tags Comparison */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Enhanced Tags</label>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs text-gray-600 mb-2">ORIGINAL TAGS</div>
                              <div className="flex flex-wrap gap-1">
                                {selectedConcept.tags.slice(0, 3).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-gray-50">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 mb-2">ENHANCED TAGS</div>
                              <div className="flex flex-wrap gap-1">
                                {selectedConcept.tags.map((tag, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="outline" 
                                    className={`text-xs ${index >= 3 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50'}`}
                                  >
                                    {tag}
                                    {index >= 3 && <span className="ml-1 text-xs">✨</span>}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Validation Results */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Enhancement Validation</label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 border rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">Content Quality</div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">Improved</span>
                              </div>
                            </div>
                            <div className="p-3 border rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">Learning Depth</div>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">Enhanced</span>
                              </div>
                            </div>
                            <div className="p-3 border rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">Practical Relevance</div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">Increased</span>
                              </div>
                            </div>
                            <div className="p-3 border rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">Technical Accuracy</div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">Validated</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Comparison Available</h3>
                        <p className="text-gray-600">This is a new concept with no original version to compare against.</p>
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            💡 New concepts are created based on curriculum gaps and learning objectives analysis.
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Relationships Tab */}
                  <TabsContent value="relationships" className="mt-0">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Concept Relationships</h3>
                        <Button variant="outline" size="sm">
                          <Link className="w-4 h-4 mr-1" />
                          Add Relationship
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {selectedConcept.relationships.map((rel) => (
                          <div key={rel.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {rel.type === 'prerequisite' && <ArrowRight className="w-4 h-4 text-blue-500" />}
                              {rel.type === 'builtupon' && <Building2 className="w-4 h-4 text-green-500" />}
                              {rel.type === 'related' && <Link className="w-4 h-4 text-purple-500" />}
                              <div>
                                <div className="font-medium">{rel.targetConcept}</div>
                                <div className="text-xs text-gray-500 capitalize">{rel.type.replace('builtupon', 'built upon')}</div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      {selectedConcept.relationships.length === 0 && (
                        <div className="text-center py-8">
                          <Link className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No relationships defined for this concept.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* AI Reasoning Tab */}
                  <TabsContent value="reasoning" className="mt-0">
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-3">AI Explanation</h3>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                            <p className="text-blue-900">{selectedConcept.aiReasoning}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-3">Confidence Breakdown</h3>
                        <div className="space-y-3">
                          {Object.entries(selectedConcept.confidence_breakdown).map(([aspect, score]) => (
                            <div key={aspect} className="flex items-center justify-between">
                              <span className="capitalize text-sm font-medium">{aspect}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${getConfidenceColor(score) === 'text-green-600' ? 'bg-green-500' : getConfidenceColor(score) === 'text-amber-600' ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${score}%` }}
                                  ></div>
                                </div>
                                <span className={`text-sm font-medium ${getConfidenceColor(score)}`}>{score}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-3">Processing Metadata</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Model:</span>
                            <span className="font-medium">{selectedConcept.processing_metadata.model}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tokens:</span>
                            <span className="font-medium">{selectedConcept.processing_metadata.tokens.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Processing Time:</span>
                            <span className="font-medium">{selectedConcept.processing_metadata.processing_time}s</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Created:</span>
                            <span className="font-medium">{new Date(selectedConcept.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Action Buttons - Sticky Footer */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(selectedConcept.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleApprove(selectedConcept.id, true)}
                      variant="default"
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={!hasUnsavedChanges}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Approve with Edits
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => toast.info('Refinement requested')}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Request Refinement
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReject(selectedConcept.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => toast.info('Concept skipped')}>
                      <SkipForward className="w-4 h-4 mr-1" />
                      Skip
                    </Button>
                    <Button 
                      variant="ghost"
                      disabled={!hasUnsavedChanges}
                      onClick={() => {
                        setHasUnsavedChanges(false);
                        toast.success('Draft saved');
                      }}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save Draft
                    </Button>
                  </div>
                </div>
                
                {hasUnsavedChanges && (
                  <div className="mt-3 text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    You have unsaved changes
                  </div>
                )}
                
                <div className="mt-3 text-xs text-gray-500">
                  Keyboard shortcuts: A (approve) | R (reject) | E (edit) | Space (next)
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Concept</h3>
                <p className="text-gray-600">Choose a concept from the list to review and edit its details.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}