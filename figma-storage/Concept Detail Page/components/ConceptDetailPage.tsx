import { useState } from "react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { OverviewTab } from "./OverviewTab";
import { LearningGoalsTab } from "./LearningGoalsTab";
import { RelationshipsTab } from "./RelationshipsTab";
import { SettingsTab } from "./SettingsTab";
import { ArrowLeft, Save } from "lucide-react";

// Mock concept data
const mockConcept = {
  id: "1",
  title: "Music Theory Fundamentals",
  description: "Core concepts and principles that form the foundation of musical understanding, including scales, intervals, chords, and harmonic progressions.",
  parentConcept: "Music Education",
  totalLearningGoals: 12,
  totalRelationships: 8,
  difficultyLevel: "Intermediate",
};

export function ConceptDetailPage() {
  const [concept, setConcept] = useState(mockConcept);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSaveChanges = () => {
    // In a real app, this would save to backend
    console.log("Saving changes...", concept);
    setHasUnsavedChanges(false);
  };

  const updateConcept = (updates: Partial<typeof concept>) => {
    setConcept(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{concept.title}</h1>
          <p className="text-muted-foreground mb-2">
            Parent: {concept.parentConcept}
          </p>
          <Button variant="ghost" size="sm" className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Concepts
          </Button>
        </div>
        <Button 
          onClick={handleSaveChanges}
          disabled={!hasUnsavedChanges}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="learning-goals">Learning Goals</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab concept={concept} updateConcept={updateConcept} />
        </TabsContent>

        <TabsContent value="learning-goals">
          <LearningGoalsTab conceptId={concept.id} />
        </TabsContent>

        <TabsContent value="relationships">
          <RelationshipsTab conceptId={concept.id} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab concept={concept} updateConcept={updateConcept} />
        </TabsContent>
      </Tabs>
    </div>
  );
}