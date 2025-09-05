import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Settings, Move, Trash2, Archive, Copy, Download, Upload } from "lucide-react";

interface ConceptType {
  id: string;
  title: string;
  description: string;
  parentConcept: string;
  totalLearningGoals: number;
  totalRelationships: number;
  difficultyLevel: string;
}

interface SettingsTabProps {
  concept: ConceptType;
  updateConcept: (updates: Partial<ConceptType>) => void;
}

const mockParentConcepts = [
  "Music Education",
  "Advanced Music Theory",
  "Music Fundamentals",
  "Performance Studies",
  "Music Composition",
  "Music History"
];

const difficultyLevels = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" }
];

export function SettingsTab({ concept, updateConcept }: SettingsTabProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

  const handleParentConceptChange = (newParent: string) => {
    updateConcept({ parentConcept: newParent });
  };

  const handleDifficultyChange = (newDifficulty: string) => {
    updateConcept({ difficultyLevel: newDifficulty });
  };

  const handleDeleteConcept = () => {
    console.log("Deleting concept:", concept.id);
    // In a real app, this would delete the concept and redirect
    setIsDeleteDialogOpen(false);
  };

  const handleArchiveConcept = () => {
    console.log("Archiving concept:", concept.id);
    // In a real app, this would archive the concept
    setIsArchiveDialogOpen(false);
  };

  const handleDuplicateConcept = () => {
    console.log("Duplicating concept:", concept.id);
    // In a real app, this would create a copy of the concept
  };

  const handleExportConcept = () => {
    console.log("Exporting concept:", concept.id);
    // In a real app, this would export concept data
  };

  const handleImportData = () => {
    console.log("Importing data for concept:", concept.id);
    // In a real app, this would open file picker for import
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3>Settings</h3>
        <p className="text-muted-foreground">
          Administrative settings and actions for this concept
        </p>
      </div>

      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Basic Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="parent-concept">Parent Concept</Label>
            <Select value={concept.parentConcept} onValueChange={handleParentConceptChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockParentConcepts.map(parent => (
                  <SelectItem key={parent} value={parent}>
                    {parent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              Move this concept to a different location in the hierarchy
            </p>
          </div>

          <div>
            <Label htmlFor="difficulty-level">Difficulty Level</Label>
            <Select value={concept.difficultyLevel.toLowerCase()} onValueChange={handleDifficultyChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {difficultyLevels.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              Set the appropriate difficulty level for learners
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleDuplicateConcept} className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Duplicate Concept
            </Button>
            <Button variant="outline" onClick={handleExportConcept} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" onClick={handleImportData} className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage concept data through duplication, export, and import operations
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Concept
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive this concept?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Archiving will hide this concept from the main interface but preserve all data. 
                    You can restore it later if needed. Associated learning goals and relationships 
                    will also be archived.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleArchiveConcept}>
                    Archive Concept
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-sm text-muted-foreground mt-1">
              Hide this concept while preserving all data
            </p>
          </div>

          <Separator />

          <div>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Concept
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this concept permanently?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the concept "{concept.title}" 
                    and all associated learning goals, relationships, and progress data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteConcept}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently remove this concept and all associated data
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Concept ID:</span>
              <span className="ml-2 font-mono">{concept.id}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <span className="ml-2">January 15, 2024</span>
            </div>
            <div>
              <span className="text-muted-foreground">Last Modified:</span>
              <span className="ml-2">March 8, 2024</span>
            </div>
            <div>
              <span className="text-muted-foreground">Version:</span>
              <span className="ml-2">1.3.2</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}