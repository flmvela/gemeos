import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { BookOpen, GitBranch, BarChart3, Edit3, Check, X } from "lucide-react";

interface ConceptType {
  id: string;
  title: string;
  description: string;
  parentConcept: string;
  totalLearningGoals: number;
  totalRelationships: number;
  difficultyLevel: string;
}

interface OverviewTabProps {
  concept: ConceptType;
  updateConcept: (updates: Partial<ConceptType>) => void;
}

export function OverviewTab({ concept, updateConcept }: OverviewTabProps) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState(concept.description);

  const handleSaveDescription = () => {
    updateConcept({ description: tempDescription });
    setIsEditingDescription(false);
  };

  const handleCancelEdit = () => {
    setTempDescription(concept.description);
    setIsEditingDescription(false);
  };

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Description Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Description</CardTitle>
          {!isEditingDescription && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingDescription(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditingDescription ? (
            <div className="space-y-4">
              <Textarea
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                rows={4}
                placeholder="Enter concept description..."
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveDescription}>
                  <Check className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground leading-relaxed">
              {concept.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Learning Goals</p>
                <p className="text-2xl font-semibold">{concept.totalLearningGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <GitBranch className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Relationships</p>
                <p className="text-2xl font-semibold">{concept.totalRelationships}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Difficulty Level</p>
                <Badge className={getDifficultyColor(concept.difficultyLevel)}>
                  {concept.difficultyLevel}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline">
            <BookOpen className="h-4 w-4 mr-2" />
            Add Learning Goal
          </Button>
          <Button variant="outline">
            <GitBranch className="h-4 w-4 mr-2" />
            Add Relationship
          </Button>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}