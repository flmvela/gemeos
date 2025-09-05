import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Edit, Save, X, Target } from "lucide-react";

export type UILearningGoal = {
  id: string;
  title: string;
  description: string;
  conceptNames: string[];
  bloomsLevel: string;
  status: "suggested" | "approved" | "rejected" | "edited";
};

interface LearningGoalsPanelProps {
  goals: UILearningGoal[];
  onApprove: (goalId: string) => void | Promise<void>;
  onReject: (goalId: string) => void | Promise<void>;
  onSaveEdit: (goalId: string, title: string, description: string) => void | Promise<void>;
}

export function LearningGoalsPanel({ goals, onApprove, onReject, onSaveEdit }: LearningGoalsPanelProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const getBloomsColor = (level: string) => {
    const l = (level || '').toLowerCase();
    if (l === 'remember') return 'bg-muted text-foreground';
    if (l === 'understand') return 'bg-[hsl(var(--info)/0.15)] text-[hsl(var(--info))]';
    if (l === 'apply') return 'bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]';
    if (l === 'analyze') return 'bg-[hsl(var(--warning)/0.18)] text-[hsl(var(--warning))]';
    if (l === 'evaluate') return 'bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))]';
    if (l === 'create') return 'bg-[hsl(var(--purple)/0.18)] text-[hsl(var(--purple))]';
    return 'bg-muted text-foreground';
  };

  const getStatusClasses = (status: UILearningGoal['status']) => {
    switch (status) {
      case 'suggested':
        return 'bg-[hsl(var(--warning)/0.18)] text-[hsl(var(--warning))]';
      case 'approved':
        return 'bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]';
      case 'rejected':
        return 'bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))]';
      case 'edited':
        return 'bg-[hsl(var(--accent)/0.12)] text-[hsl(var(--accent))]';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const counts = useMemo(() => {
    return {
      all: goals.length,
      suggested: goals.filter((g) => g.status === "suggested").length,
      approved: goals.filter((g) => g.status === "approved").length,
      rejected: goals.filter((g) => g.status === "rejected").length,
      edited: goals.filter((g) => g.status === "edited").length,
    };
  }, [goals]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return goals;
    return goals.filter((g) => g.status === (activeTab as any));
  }, [goals, activeTab]);

  const startEditing = (goal: UILearningGoal) => {
    setEditingGoal(goal.id);
    setEditedTitle(goal.title);
    setEditedDescription(goal.description);
  };

  const cancelEdit = () => {
    setEditingGoal(null);
    setEditedTitle("");
    setEditedDescription("");
  };

  const saveEdit = async (goalId: string) => {
    try {
      setSaving(true);
      await onSaveEdit(goalId, editedTitle, editedDescription);
    } finally {
      setSaving(false);
      cancelEdit();
    }
  };

  if (goals.length === 0) return null;

  const renderGoalCard = (goal: UILearningGoal) => (
    <Card key={goal.id} className="p-6 rounded-2xl border shadow-sm animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {editingGoal === goal.id ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm font-medium bg-background"
              />
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`text-xs rounded-full px-2.5 py-1 ${getStatusClasses(goal.status)}`}>
                  {goal.status === 'suggested' ? 'Pending Review' : goal.status}
                </Badge>
                <Badge variant="outline" className={`text-xs rounded-full px-2.5 py-1 ${getBloomsColor(goal.bloomsLevel)}`}>
                  {goal.bloomsLevel || '—'}
                </Badge>
                <span className="text-xs text-muted-foreground">1 concept</span>
              </div>
              <h4 className="font-medium text-[15px] leading-6 whitespace-pre-line">{goal.title}</h4>
              {goal.description && (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line mt-1">
                  {goal.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {goal.conceptNames.map((name) => (
                  <Badge key={name} variant="secondary" className="text-xs rounded-full px-2.5 py-1">
                    {name}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 ml-2">
          {editingGoal === goal.id ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => saveEdit(goal.id)} className="h-8 w-8 p-0" disabled={saving} aria-label="Save">
                <Save className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0" aria-label="Cancel">
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => startEditing(goal)}
                className="h-8 w-8 p-0"
                aria-label="Edit"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onApprove(goal.id)}
                className="h-8 w-8 p-0 text-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.12)]"
                aria-label="Approve"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onReject(goal.id)}
                className="h-8 w-8 p-0 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.12)]"
                aria-label="Reject"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Target className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold tracking-tight">Generated Learning Goals</h2>
        <Badge variant="outline" className="ml-auto rounded-full px-3 py-1 text-xs text-muted-foreground">
          {goals.length} goals
        </Badge>
      </div>

      <Separator />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-muted rounded-full p-1 flex gap-1">
          <TabsTrigger value="all" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            All
            <Badge variant="secondary" className="ml-2 rounded-full text-[11px] px-2">
              {counts.all}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="suggested" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Pending
            <Badge variant="secondary" className="ml-2 rounded-full text-[11px] px-2">
              {counts.suggested}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Approved
            <Badge variant="secondary" className="ml-2 rounded-full text-[11px] px-2">
              {counts.approved}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Rejected
            <Badge variant="secondary" className="ml-2 rounded-full text-[11px] px-2">
              {counts.rejected}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="edited" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Edited
            <Badge variant="secondary" className="ml-2 rounded-full text-[11px] px-2">
              {counts.edited}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {filtered.map(renderGoalCard)}
        </TabsContent>

        <TabsContent value="suggested" className="space-y-4 mt-6">
          {filtered.map(renderGoalCard)}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-6">
          {filtered.map(renderGoalCard)}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-6">
          {filtered.map(renderGoalCard)}
        </TabsContent>

        <TabsContent value="edited" className="space-y-4 mt-6">
          {filtered.map(renderGoalCard)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
