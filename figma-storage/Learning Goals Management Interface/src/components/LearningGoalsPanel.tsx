import { useState } from 'react';
import { LearningGoal } from '../App';
import { GoalCard } from './GoalCard';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Target } from 'lucide-react';

interface LearningGoalsPanelProps {
  goals: LearningGoal[];
  onGoalStatusChange: (goalId: string, status: LearningGoal['status']) => void;
}

export function LearningGoalsPanel({ goals, onGoalStatusChange }: LearningGoalsPanelProps) {
  const [activeTab, setActiveTab] = useState('all');

  const filterGoalsByStatus = (status?: LearningGoal['status']) => {
    if (!status) return goals;
    return goals.filter(goal => goal.status === status);
  };

  const getStatusCount = (status: LearningGoal['status']) => {
    return goals.filter(goal => goal.status === status).length;
  };

  const handleGoalEdit = (goalId: string, updates: Partial<LearningGoal>) => {
    onGoalStatusChange(goalId, 'edited');
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
  goals: LearningGoal[];
  onStatusChange: (goalId: string, status: LearningGoal['status']) => void;
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