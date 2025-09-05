import { useState } from 'react';
import { LearningGoal } from '../App';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Check, 
  X, 
  Edit3, 
  Save, 
  BookOpen,
  Target
} from 'lucide-react';

interface GoalCardProps {
  goal: LearningGoal;
  onStatusChange: (goalId: string, status: LearningGoal['status']) => void;
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

export function GoalCard({ goal, onStatusChange, onEdit }: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(goal.title);
  const [editedDescription, setEditedDescription] = useState(goal.description);
  const [editedBloomsLevel, setEditedBloomsLevel] = useState(goal.bloomsLevel);

  const handleSaveEdit = () => {
    onEdit(goal.id, {
      title: editedTitle,
      description: editedDescription,
      bloomsLevel: editedBloomsLevel
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(goal.title);
    setEditedDescription(goal.description);
    setEditedBloomsLevel(goal.bloomsLevel);
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
              <h3 className="pr-4">{goal.title}</h3>
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
                  <span>{goal.bloomsLevel}</span>
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
            {goal.description}
          </p>
        )}

        {/* Concepts tags */}
        {goal.concepts.length > 0 && (
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