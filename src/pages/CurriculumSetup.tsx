import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Upload, FolderOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConceptListView } from "@/components/curriculum/ConceptListView";
import { ConceptDetailPanel } from "@/components/curriculum/ConceptDetailPanel";
import { AddConceptModal } from "@/components/curriculum/AddConceptModal";
import { TeacherFileUpload } from "@/components/upload/TeacherFileUpload";
import { useTeacherDomains } from "@/hooks/useTeacherDomains";
import { useFileUploads } from "@/hooks/useFileUpload";

export interface Concept {
  id: string;
  name: string;
  description: string;
  domain_id: string;
  parent_concept_id?: string;
  status: 'confirmed' | 'ai_suggested' | 'pending_review' | 'rejected';
  metadata: {
    type?: 'theoretical' | 'practical' | 'stylistic';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  };
  teacher_id: string;
  created_at: string;
  updated_at: string;
}

export interface ConceptPrerequisite {
  id: string;
  concept_id: string;
  prerequisite_concept_id: string;
  created_at: string;
}

const CurriculumSetup = () => {
  const [activeTab, setActiveTab] = useState("learning-concepts");
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Get teacher's selected domains
  const { teacherDomains, loading: domainsLoading } = useTeacherDomains();
  const primaryDomain = teacherDomains[0]?.domain; // Use first selected domain as primary

  // Get uploaded files for the primary domain
  const { data: uploadedFiles = [], isLoading: filesLoading, refetch: refetchFiles } = useFileUploads(primaryDomain?.id);

  // Mock data for now
  const mockConcepts: Concept[] = [
    {
      id: "1",
      name: "Basic Music Theory",
      description: "Fundamental concepts of music including notes, scales, and intervals",
      domain_id: "music",
      status: "confirmed",
      metadata: { type: "theoretical", difficulty: "beginner" },
      teacher_id: "teacher-1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "2",
      name: "Major Scales",
      description: "Understanding major scale patterns and construction",
      domain_id: "music",
      parent_concept_id: "1",
      status: "confirmed",
      metadata: { type: "theoretical", difficulty: "beginner" },
      teacher_id: "teacher-1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "3",
      name: "Chord Progressions",
      description: "Common chord progressions and their applications",
      domain_id: "music",
      parent_concept_id: "2",
      status: "ai_suggested",
      metadata: { type: "practical", difficulty: "intermediate" },
      teacher_id: "teacher-1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const aiSuggestedCount = mockConcepts.filter(c => c.status === 'ai_suggested').length;

  const handleConceptClick = (concept: Concept) => {
    setSelectedConcept(concept);
    setShowDetailPanel(true);
  };

  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false);
    setSelectedConcept(null);
  };

  const handleAddConcept = () => {
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Set Up Your Curriculum</h1>
              <p className="text-muted-foreground mt-2">
                Design and organize your teaching concepts and learning paths
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              {primaryDomain ? primaryDomain.name : domainsLoading ? "Loading..." : "No Domain Selected"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="training-data">Training Data</TabsTrigger>
            <TabsTrigger value="learning-concepts">Learning Concepts</TabsTrigger>
            <TabsTrigger value="learning-paths">Learning Paths</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
          </TabsList>

          <TabsContent value="training-data" className="mt-6">
            <div className="space-y-6">
              {!primaryDomain ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FolderOpen className="h-5 w-5" />
                      <span>Select a Domain First</span>
                    </CardTitle>
                    <CardDescription>
                      You need to select a teaching domain before you can upload training materials.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => window.open('/teacher/domain-selection', '_self')}
                      className="w-full sm:w-auto"
                    >
                      Go to Domain Selection
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Upload Component */}
                  <TeacherFileUpload
                    domainId={primaryDomain.id}
                    domainName={primaryDomain.name}
                    onUploadComplete={refetchFiles}
                  />

                  {/* Uploaded Files Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Upload className="h-5 w-5" />
                        <span>Your Training Materials</span>
                      </CardTitle>
                      <CardDescription>
                        Files you've uploaded for the {primaryDomain.name} domain
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {filesLoading ? (
                        <p className="text-muted-foreground">Loading your files...</p>
                      ) : uploadedFiles.length === 0 ? (
                        <div className="text-center py-8">
                          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">No files uploaded yet</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Upload your first training materials to get started
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">
                              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded
                            </p>
                            <Badge variant="secondary">
                              Total: {uploadedFiles.reduce((sum, file) => sum + file.file_size, 0) > 0 && 
                                     Math.round(uploadedFiles.reduce((sum, file) => sum + file.file_size, 0) / 1024 / 1024 * 100) / 100} MB
                            </Badge>
                          </div>
                          <div className="grid gap-2">
                            {uploadedFiles.slice(0, 5).map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <div className="flex items-center space-x-2">
                                  <div className="text-lg">
                                    {file.mime_type?.includes('pdf') ? '📄' : 
                                     file.mime_type?.includes('image') ? '🖼️' : 
                                     file.mime_type?.includes('audio') ? '🎵' : 
                                     file.mime_type?.includes('video') ? '🎥' : '📎'}
                                  </div>
                                  <span className="text-sm font-medium truncate max-w-[200px]">
                                    {file.file_name}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(file.file_size / 1024)} KB
                                </Badge>
                              </div>
                            ))}
                            {uploadedFiles.length > 5 && (
                              <p className="text-xs text-muted-foreground text-center pt-2">
                                ...and {uploadedFiles.length - 5} more files
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="learning-concepts" className="mt-6">
            <div className="space-y-6">
              {/* AI Suggestions Banner */}
              {aiSuggestedCount > 0 && (
                <Card className="border-accent bg-accent/10">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{aiSuggestedCount}</Badge>
                      <span className="text-sm text-foreground">
                        new AI-suggested concepts to review
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setStatusFilter("ai_suggested")}
                    >
                      Review Now
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search concepts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Concepts</SelectItem>
                      <SelectItem value="confirmed">Confirmed Concepts</SelectItem>
                      <SelectItem value="ai_suggested">AI Suggested (Pending)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddConcept}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Concept
                </Button>
              </div>

              {/* Concepts List */}
              <Card className="min-h-[600px]">
                <CardHeader>
                  <CardTitle>Learning Concepts</CardTitle>
                  <CardDescription>
                    Manage and organize your concepts hierarchy. Click on concepts to edit, use actions to approve or reject AI suggestions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ConceptListView
                    concepts={mockConcepts}
                    onConceptClick={handleConceptClick}
                    adminMode={false}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="learning-paths" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Paths</CardTitle>
                <CardDescription>
                  Create structured learning sequences and progression paths
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Learning Paths feature coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Assessments</CardTitle>
                <CardDescription>
                  Design quizzes, exercises, and evaluation criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Assessments feature coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Panel */}
      {showDetailPanel && selectedConcept && (
        <ConceptDetailPanel
          concept={selectedConcept}
          concepts={mockConcepts}
          prerequisites={[]}
          onClose={handleCloseDetailPanel}
          onSave={(updatedConcept) => {
            // Handle save
            console.log('Save concept:', updatedConcept);
            handleCloseDetailPanel();
          }}
          onDelete={(conceptId) => {
            // Handle delete
            console.log('Delete concept:', conceptId);
            handleCloseDetailPanel();
          }}
        />
      )}

      {/* Add Concept Modal */}
      {showAddModal && (
        <AddConceptModal
          concepts={mockConcepts}
          domainId={primaryDomain?.id}
          onClose={() => setShowAddModal(false)}
          onSave={(newConcept) => {
            // Handle save
            console.log('Create concept:', newConcept);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

export default CurriculumSetup;