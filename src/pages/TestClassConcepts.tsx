import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClassDifficultyOverview } from '@/components/class/ClassDifficultyOverview';
import { AssignConceptsDialog } from '@/components/class/AssignConceptsDialog';
import { classService } from '@/services/class.service';
import { supabase } from '@/integrations/supabase/client';
import { Plus, RefreshCw } from 'lucide-react';
import type { ClassDifficultyAnalysis, ClassConcept } from '@/types/class-concepts.types';
import { getDifficultyLevel } from '@/types/class-concepts.types';

export function TestClassConcepts() {
  const { classId } = useParams<{ classId: string }>();
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [concepts, setClassConcepts] = useState<ClassConcept[]>([]);
  const [availableConcepts, setAvailableConcepts] = useState<any[]>([]);
  const [difficultyAnalysis, setDifficultyAnalysis] = useState<ClassDifficultyAnalysis | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load class info
  useEffect(() => {
    if (!classId) return;
    
    const loadClassInfo = async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();
      
      if (error) {
        console.error('Error loading class:', error);
        setError('Failed to load class information');
      } else {
        setClassInfo(data);
      }
    };
    
    loadClassInfo();
  }, [classId]);

  // Load class concepts and difficulty
  useEffect(() => {
    if (!classId) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        // Load assigned concepts
        const classConcepts = await classService.getClassConcepts(classId);
        setClassConcepts(classConcepts);
        
        // Load difficulty analysis
        const analysis = await classService.getClassDifficulty(classId);
        setDifficultyAnalysis(analysis);
        
        // Load available concepts for the domain
        if (classInfo?.domain_id) {
          const { data: domainConcepts } = await supabase
            .from('concepts')
            .select('*')
            .eq('domain_id', classInfo.domain_id)
            .order('name');
          
          setAvailableConcepts(domainConcepts || []);
        }
      } catch (err) {
        console.error('Error loading class data:', err);
        setError('Failed to load class concepts');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [classId, classInfo?.domain_id]);

  const handleAssignConcepts = async (request: Omit<AssignConceptsRequest, 'classId'>) => {
    if (!classId) return;
    
    try {
      await classService.assignConceptsToClass({
        classId,
        ...request
      });
      
      // Reload data
      const classConcepts = await classService.getClassConcepts(classId);
      setClassConcepts(classConcepts);
      
      const analysis = await classService.getClassDifficulty(classId);
      setDifficultyAnalysis(analysis);
      
      setShowAssignDialog(false);
    } catch (err) {
      console.error('Error assigning concepts:', err);
      setError('Failed to assign concepts to class');
    }
  };

  const handleRemoveConcept = async (conceptId: string) => {
    if (!classId) return;
    
    try {
      await classService.removeConceptFromClass(classId, conceptId);
      
      // Reload data
      const classConcepts = await classService.getClassConcepts(classId);
      setClassConcepts(classConcepts);
      
      const analysis = await classService.getClassDifficulty(classId);
      setDifficultyAnalysis(analysis);
    } catch (err) {
      console.error('Error removing concept:', err);
      setError('Failed to remove concept from class');
    }
  };

  const handleRecalculateDifficulty = async () => {
    if (!classId) return;
    
    try {
      const analysis = await classService.recalculateClassDifficulty(classId);
      setDifficultyAnalysis(analysis);
    } catch (err) {
      console.error('Error recalculating difficulty:', err);
      setError('Failed to recalculate difficulty');
    }
  };

  if (!classId) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Please provide a class ID in the URL to test the class concepts system.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Class Concepts Test</h1>
          {classInfo && (
            <p className="text-muted-foreground mt-1">
              Class: {classInfo.name} • {concepts.length} concepts assigned
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRecalculateDifficulty} variant="outline">
            <RefreshCw className="h-4 w-4 mr-1" />
            Recalculate
          </Button>
          <Button onClick={() => setShowAssignDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Assign Concepts
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Difficulty Overview */}
        <div className="lg:col-span-1">
          <ClassDifficultyOverview
            analysis={difficultyAnalysis}
            loading={loading}
          />
        </div>

        {/* Assigned Concepts */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Concepts</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : concepts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No concepts assigned yet. Click "Assign Concepts" to add some.
                </p>
              ) : (
                <div className="space-y-2">
                  {concepts.map((classConcept) => {
                    const difficulty = classConcept.override_difficulty || 
                                     classConcept.concept?.difficulty_level || 1;
                    const level = getDifficultyLevel(difficulty);
                    
                    return (
                      <div
                        key={classConcept.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {classConcept.concept?.name || 'Unknown Concept'}
                            </span>
                            <Badge
                              style={{ backgroundColor: level.color }}
                              className="text-white text-xs"
                            >
                              {level.icon} {level.label}
                            </Badge>
                            {classConcept.is_mandatory && (
                              <Badge variant="outline">Mandatory</Badge>
                            )}
                          </div>
                          {classConcept.concept?.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {classConcept.concept.description}
                            </p>
                          )}
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Order: {classConcept.sequence_order}</span>
                            {classConcept.concept_group && (
                              <span>Group: {classConcept.concept_group}</span>
                            )}
                            {classConcept.estimated_hours && (
                              <span>Est. Hours: {classConcept.estimated_hours}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveConcept(classConcept.concept_id)}
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assign Concepts Dialog */}
      {classInfo && (
        <AssignConceptsDialog
          open={showAssignDialog}
          onOpenChange={setShowAssignDialog}
          classId={classId}
          domainId={classInfo.domain_id}
          availableConcepts={availableConcepts}
          assignedConceptIds={concepts.map(c => c.concept_id)}
          onAssign={handleAssignConcepts}
        />
      )}
    </div>
  );
}

// Add missing import
import { Badge } from '@/components/ui/badge';
import type { AssignConceptsRequest } from '@/types/class-concepts.types';