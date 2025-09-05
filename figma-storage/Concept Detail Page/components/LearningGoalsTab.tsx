import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Plus, CheckCircle, XCircle, Edit, Trash2, Sparkles, BookOpen } from "lucide-react";

interface LearningGoal {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const mockGoals: LearningGoal[] = [
  {
    id: "1",
    title: "Understand major and minor scales",
    description: "Learn the pattern of whole and half steps that create major and minor scales, and be able to construct them starting from any note.",
    status: "approved",
    createdAt: "2024-01-15",
    difficulty: "medium"
  },
  {
    id: "2",
    title: "Identify intervals by ear",
    description: "Develop the ability to recognize perfect fifths, major thirds, minor thirds, and other common intervals through ear training exercises.",
    status: "approved",
    createdAt: "2024-01-14",
    difficulty: "hard"
  },
  {
    id: "3",
    title: "Build basic triads",
    description: "Construct major, minor, diminished, and augmented triads using the proper intervals and note relationships.",
    status: "pending",
    createdAt: "2024-01-13",
    difficulty: "medium"
  },
  {
    id: "4",
    title: "Analyze chord progressions",
    description: "Recognize and analyze common chord progressions like I-V-vi-IV and understand their harmonic function.",
    status: "pending",
    createdAt: "2024-01-12",
    difficulty: "hard"
  }
];

interface LearningGoalsTabProps {
  conceptId: string;
}

export function LearningGoalsTab({ conceptId }: LearningGoalsTabProps) {
  const [goals, setGoals] = useState(mockGoals);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleApprove = (goalId: string) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId ? { ...goal, status: 'approved' as const } : goal
    ));
  };

  const handleReject = (goalId: string) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId ? { ...goal, status: 'rejected' as const } : goal
    ));
  };

  const handleDelete = (goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
  };

  const handleGenerateGoals = () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      const newGoal: LearningGoal = {
        id: Date.now().toString(),
        title: "Master circle of fifths",
        description: "Understand and memorize the circle of fifths to quickly identify key signatures and relationships between keys.",
        status: "pending",
        createdAt: new Date().toISOString().split('T')[0],
        difficulty: "medium"
      };
      setGoals(prev => [newGoal, ...prev]);
      setIsGenerating(false);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h3>Learning Goals</h3>
          <p className="text-muted-foreground">
            Manage and organize learning objectives for this concept
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateGoals} disabled={isGenerating}>
            <Sparkles className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate Goals"}
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Manual Goal
          </Button>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal, index) => (
          <Card key={goal.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{goal.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getStatusColor(goal.status)}>
                      {goal.status}
                    </Badge>
                    <Badge className={getDifficultyColor(goal.difficulty)}>
                      {goal.difficulty}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Created: {goal.createdAt}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(goal.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-muted-foreground mb-4">{goal.description}</p>
              
              {goal.status === 'pending' && (
                <>
                  <Separator className="mb-4" />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleApprove(goal.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleReject(goal.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {goals.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No learning goals yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by generating goals or adding them manually
            </p>
            <Button onClick={handleGenerateGoals}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Goals
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}