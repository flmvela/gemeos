import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { 
  Search, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Eye,
  Brain,
  Target,
  PenTool,
  List
} from 'lucide-react';

// Mock data types
interface ReviewItem {
  id: string;
  name: string;
  source: string;
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  parent?: string;
  child?: string;
  relationships: string[];
  type: 'concept' | 'learning-goal' | 'exercise';
  status: 'pending' | 'approved' | 'rejected';
  aiGenerated: boolean;
  description?: string;
}

// Mock data
const mockReviewItems: ReviewItem[] = [
  {
    id: '1',
    name: 'Intervals',
    source: 'File: master concept file chunk: intervals',
    difficultyLevel: 'Beginner',
    parent: 'Scale',
    child: 'N/A',
    relationships: ['Related to: Triads', 'Prerequisite of: scales'],
    type: 'concept',
    status: 'pending',
    aiGenerated: true,
    description: 'The distance between two musical notes. Intervals form the foundation of harmony and melody, measuring how far apart notes are in pitch.'
  },
  {
    id: '2',
    name: 'Major Scale Construction',
    source: 'AI Analysis: music theory fundamentals',
    difficultyLevel: 'Beginner',
    parent: 'Scale Theory',
    child: 'Key Signatures',
    relationships: ['Built upon: Intervals', 'Related to: Circle of Fifths'],
    type: 'concept',
    status: 'pending',
    aiGenerated: true,
    description: 'A specific pattern of whole and half steps that creates the familiar do-re-mi sound. Built using the pattern: W-W-H-W-W-W-H.'
  },
  {
    id: '3',
    name: 'Identify Perfect 5th Intervals',
    source: 'Auto-generated from: Interval Recognition',
    difficultyLevel: 'Intermediate',
    parent: 'Interval Recognition',
    child: 'N/A',
    relationships: ['Practices: Intervals', 'Prepares for: Chord Recognition'],
    type: 'exercise',
    status: 'approved',
    aiGenerated: true
  },
  {
    id: '4',
    name: 'Master Basic Chord Progressions',
    source: 'Curriculum objective: harmony fundamentals',
    difficultyLevel: 'Intermediate',
    parent: 'Harmonic Analysis',
    child: 'N/A',
    relationships: ['Requires: Triads', 'Enables: Song Analysis'],
    type: 'learning-goal',
    status: 'pending',
    aiGenerated: true
  },
  {
    id: '5',
    name: 'Chord Inversion Practice',
    source: 'AI Generated: from chord theory module',
    difficultyLevel: 'Advanced',
    parent: 'Chord Theory',
    child: 'Voice Leading',
    relationships: ['Builds upon: Triads', 'Related to: Piano Technique'],
    type: 'exercise',
    status: 'pending',
    aiGenerated: true
  }
];

const reviewCounts = {
  concepts: mockReviewItems.filter(item => item.type === 'concept').length,
  learningGoals: mockReviewItems.filter(item => item.type === 'learning-goal').length,
  exercises: mockReviewItems.filter(item => item.type === 'exercise').length
};

const statusColors = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200'
};

const difficultyColors = {
  Beginner: 'bg-green-100 text-green-800',
  Intermediate: 'bg-yellow-100 text-yellow-800',
  Advanced: 'bg-red-100 text-red-800'
};

const typeIcons = {
  concept: Brain,
  'learning-goal': Target,
  exercise: PenTool
};

export function ReviewAI() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'concept' | 'learning-goal' | 'exercise'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);

  // Filter items based on active filter and search
  const filteredItems = mockReviewItems.filter(item => {
    const matchesFilter = activeFilter === 'all' || item.type === activeFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.source.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCardClick = (type: 'concept' | 'learning-goal' | 'exercise') => {
    setActiveFilter(type);
  };

  const handleEdit = (itemId: string) => {
    // Navigate to concept detail page - placeholder for now
    console.log('Navigate to edit page for item:', itemId);
  };

  const handleApprove = (itemId: string) => {
    console.log('Approve item:', itemId);
  };

  const handleReject = (itemId: string) => {
    console.log('Reject item:', itemId);
  };

  const handleConceptSelect = (conceptId: string, checked: boolean) => {
    if (checked) {
      setSelectedConcepts(prev => [...prev, conceptId]);
    } else {
      setSelectedConcepts(prev => prev.filter(id => id !== conceptId));
    }
  };

  const handleBulkApprove = () => {
    console.log('Bulk approve concepts:', selectedConcepts);
    setSelectedConcepts([]);
  };

  const handleBulkReject = () => {
    console.log('Bulk reject concepts:', selectedConcepts);
    setSelectedConcepts([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Review AI</h1>
        <p className="text-gray-600 text-sm mt-1">Review and approve AI-generated learning content</p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Concepts Card */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === 'concept' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => handleCardClick('concept')}
        >
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Concepts</h3>
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">Review AI suggested ({reviewCounts.concepts})</p>
            </div>
          </CardContent>
        </Card>

        {/* Learning Goals Card */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === 'learning-goal' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => handleCardClick('learning-goal')}
        >
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Learning goals</h3>
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Click to review {reviewCounts.learningGoals} Learning goals</p>
            </div>
          </CardContent>
        </Card>

        {/* Exercises Card */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === 'exercise' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => handleCardClick('exercise')}
        >
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Exercises ({reviewCounts.exercises})</h3>
                <PenTool className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">Click to review {reviewCounts.exercises} Exercises</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Section */}
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Review {activeFilter === 'all' ? 'All Items' : 
                     activeFilter === 'concept' ? 'Concepts' :
                     activeFilter === 'learning-goal' ? 'Learning Goals' : 'Exercises'}
            </h2>
            <p className="text-gray-600 text-sm">
              Review suggested {activeFilter === 'all' ? 'content' : activeFilter.replace('-', ' ')} and decide if they shall be approved or rejected
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search Bar */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search anything"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {activeFilter === 'concept' && selectedConcepts.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedConcepts.length} selected
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkApprove}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkReject}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Data Grid */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {activeFilter === 'concept' && (
                    <th className="text-left py-3 px-4 font-medium text-gray-900 w-12">
                      {/* Checkbox column header */}
                    </th>
                  )}
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    {activeFilter === 'concept' ? 'Concept Name' :
                     activeFilter === 'learning-goal' ? 'Learning Goal' :
                     activeFilter === 'exercise' ? 'Exercise Name' : 'Name'}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Source</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Difficulty Level</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Parent / child</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Relationships</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const IconComponent = typeIcons[item.type];
                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      {activeFilter === 'concept' && (
                        <td className="py-3 px-4">
                          <Checkbox
                            checked={selectedConcepts.includes(item.id)}
                            onCheckedChange={(checked) => 
                              handleConceptSelect(item.id, checked as boolean)
                            }
                          />
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <div className="flex items-start space-x-3">
                          <IconComponent className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            {item.type === 'concept' && item.description ? (
                              <div className="text-sm text-gray-600 mt-1 max-w-sm">
                                {item.description}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`text-xs ${statusColors[item.status]}`}>
                                  {item.status}
                                </Badge>
                                {item.aiGenerated && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                                    AI Generated
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600 max-w-xs">
                          {item.source}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`text-xs ${difficultyColors[item.difficultyLevel]}`}>
                          {item.difficultyLevel}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {item.parent && (
                            <div>
                              <span className="text-gray-600">Parent:</span> 
                              <span className="text-gray-900 ml-1">{item.parent}</span>
                            </div>
                          )}
                          {item.child && item.child !== 'N/A' && (
                            <div>
                              <span className="text-gray-600">Child:</span> 
                              <span className="text-gray-900 ml-1">{item.child}</span>
                            </div>
                          )}
                          {!item.parent && (!item.child || item.child === 'N/A') && (
                            <span className="text-gray-400">None</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {item.relationships.map((rel, index) => (
                            <div key={index} className="text-xs text-gray-600">
                              {rel}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(item.id)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={activeFilter === 'concept' ? 7 : 6} className="py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <List className="w-8 h-8 text-gray-300 mb-2" />
                        <p>No items found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {searchTerm ? `Try adjusting your search terms` : `No ${activeFilter === 'all' ? 'items' : activeFilter.replace('-', ' ')} available`}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}