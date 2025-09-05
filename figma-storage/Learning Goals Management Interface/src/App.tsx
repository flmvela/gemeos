import { useState } from 'react';
import { ConceptSearchDropdown } from './components/ConceptSearchDropdown';
import { LearningGoalsPanel } from './components/LearningGoalsPanel';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Separator } from './components/ui/separator';
import { Brain, Target, Music, Plus, Dumbbell } from 'lucide-react';

export interface Concept {
  id: string;
  name: string;
  level: number;
  parentId?: string;
  children: string[];
  category: string;
  description?: string;
}

export interface LearningGoal {
  id: string;
  title: string;
  description: string;
  concepts: string[];
  bloomsLevel: string;
  status: 'suggested' | 'approved' | 'rejected' | 'edited';
}

export default function App() {
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [generatedGoals, setGeneratedGoals] = useState<LearningGoal[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMusicSpecificGoals = (conceptId: string): LearningGoal[] => {
    const conceptName = conceptId.replace(/-/g, ' ');
    const baseGoals: LearningGoal[] = [];

    // Level-specific goal generation
    if (conceptId.includes('triad') || conceptId.includes('chord')) {
      baseGoals.push(
        {
          id: `goal-${conceptId}-identification`,
          title: `Identify ${conceptName} by sight and sound`,
          description: `Students will recognize ${conceptName} in musical notation and identify them aurally in various musical contexts, including different inversions and voicings.`,
          concepts: [conceptId],
          bloomsLevel: 'Apply',
          status: 'suggested' as const
        },
        {
          id: `goal-${conceptId}-construction`,
          title: `Construct ${conceptName} in all positions`,
          description: `Students will build ${conceptName} from any root note, demonstrating understanding of intervallic relationships and proper voice leading principles.`,
          concepts: [conceptId],
          bloomsLevel: 'Create',
          status: 'suggested' as const
        },
        {
          id: `goal-${conceptId}-progression`,
          title: `Use ${conceptName} in harmonic progressions`,
          description: `Students will incorporate ${conceptName} effectively within common chord progressions, understanding their functional role and resolution tendencies.`,
          concepts: [conceptId],
          bloomsLevel: 'Evaluate',
          status: 'suggested' as const
        }
      );
    } else if (conceptId.includes('scale') || conceptId.includes('mode')) {
      baseGoals.push(
        {
          id: `goal-${conceptId}-construction`,
          title: `Build ${conceptName} from any starting note`,
          description: `Students will construct ${conceptName} using the correct pattern of whole and half steps, demonstrating mastery of intervallic relationships.`,
          concepts: [conceptId],
          bloomsLevel: 'Apply',
          status: 'suggested' as const
        },
        {
          id: `goal-${conceptId}-performance`,
          title: `Perform ${conceptName} fluently`,
          description: `Students will perform ${conceptName} on their instrument with proper technique, demonstrating both ascending and descending patterns at various tempos.`,
          concepts: [conceptId],
          bloomsLevel: 'Apply',
          status: 'suggested' as const
        },
        {
          id: `goal-${conceptId}-improvisation`,
          title: `Improvise using ${conceptName}`,
          description: `Students will create melodic and harmonic improvisations using ${conceptName}, demonstrating understanding of its characteristic sound and appropriate usage.`,
          concepts: [conceptId],
          bloomsLevel: 'Create',
          status: 'suggested' as const
        }
      );
    } else if (conceptId.includes('interval')) {
      baseGoals.push(
        {
          id: `goal-${conceptId}-recognition`,
          title: `Recognize ${conceptName} aurally and visually`,
          description: `Students will identify ${conceptName} both by ear and in written notation, including various octave displacements and harmonic contexts.`,
          concepts: [conceptId],
          bloomsLevel: 'Understand',
          status: 'suggested' as const
        },
        {
          id: `goal-${conceptId}-singing`,
          title: `Sing ${conceptName} accurately`,
          description: `Students will vocally produce ${conceptName} with proper intonation, both ascending and descending, from various starting pitches.`,
          concepts: [conceptId],
          bloomsLevel: 'Apply',
          status: 'suggested' as const
        }
      );
    } else if (conceptId.includes('rhythm') || conceptId.includes('meter')) {
      baseGoals.push(
        {
          id: `goal-${conceptId}-performance`,
          title: `Perform ${conceptName} accurately`,
          description: `Students will clap, tap, or play ${conceptName} with precise timing, demonstrating understanding of beat subdivision and metric organization.`,
          concepts: [conceptId],
          bloomsLevel: 'Apply',
          status: 'suggested' as const
        },
        {
          id: `goal-${conceptId}-notation`,
          title: `Notate ${conceptName} correctly`,
          description: `Students will write ${conceptName} using proper rhythmic notation, including appropriate beaming, rests, and time signature relationships.`,
          concepts: [conceptId],
          bloomsLevel: 'Apply',
          status: 'suggested' as const
        }
      );
    } else {
      // Generic goals for other concepts
      baseGoals.push(
        {
          id: `goal-${conceptId}-understanding`,
          title: `Understand ${conceptName} fundamentals`,
          description: `Students will explain the basic principles and characteristics of ${conceptName}, including its role in music theory and practical applications.`,
          concepts: [conceptId],
          bloomsLevel: 'Understand',
          status: 'suggested' as const
        },
        {
          id: `goal-${conceptId}-analysis`,
          title: `Analyze ${conceptName} in musical works`,
          description: `Students will identify and analyze examples of ${conceptName} in various musical compositions, discussing their function and effect.`,
          concepts: [conceptId],
          bloomsLevel: 'Analyze',
          status: 'suggested' as const
        }
      );
    }

    // Add a synthesis goal for advanced concepts (level 3+)
    const conceptLevel = conceptId.split('-').length - 1;
    if (conceptLevel >= 3) {
      baseGoals.push({
        id: `goal-${conceptId}-synthesis`,
        title: `Integrate ${conceptName} with related concepts`,
        description: `Students will demonstrate how ${conceptName} connects to and supports understanding of broader musical concepts, showing mastery of hierarchical relationships in music theory.`,
        concepts: [conceptId],
        bloomsLevel: 'Evaluate',
        status: 'suggested' as const
      });
    }

    return baseGoals;
  };

  const handleGenerateGoals = async () => {
    if (!selectedConcept) return;
    
    setIsGenerating(true);
    
    // Mock AI service delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockGoals = generateMusicSpecificGoals(selectedConcept);
    
    setGeneratedGoals(mockGoals);
    setIsGenerating(false);
  };

  const handleGoalStatusChange = (goalId: string, status: LearningGoal['status']) => {
    setGeneratedGoals(prev => 
      prev.map(goal => 
        goal.id === goalId ? { ...goal, status } : goal
      )
    );
  };

  const getConceptDisplayName = (conceptId: string): string => {
    return conceptId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getConceptLevel = (conceptId: string): number => {
    // Simple estimation based on concept ID structure
    return Math.min(conceptId.split('-').length - 1, 7);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-3xl">Learning Goals Management</h1>
          </div>
          <p className="text-muted-foreground">
            Search and select a music theory concept below to generate AI-suggested learning goals for your curriculum.
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Concept Selection Section */}
          <div className="lg:col-span-2 flex">
            <Card className="p-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  <h2>Select concept or show the name of the selected concept</h2>
                </div>
              </div>
              <ConceptSearchDropdown
                selectedConcept={selectedConcept}
                onConceptSelect={(conceptId) => {
                  setSelectedConcept(conceptId === selectedConcept ? null : conceptId);
                }}
              />
            </Card>
          </div>

          {/* Control Panel */}
          <div className="flex flex-col">
            {/* Quick Actions Card */}
            <Card className="p-6 flex-1">
            
              <div className="space-y-1">
                
                
                {/* Action Buttons Grid */}
                <div className="grid grid-cols-1 gap-3">
                  {/* AI Generate Goals Button */}
                  <Button
                    onClick={handleGenerateGoals}
                    disabled={!selectedConcept || isGenerating}
                    className="flex items-center gap-2"
                    variant="default"
                  >
                    <Brain className="h-4 w-4" />
                    {isGenerating ? 'Generating...' : 'AI Generate Goals'}
                  </Button>
                  
                  {/* Manual Create Goal Button */}
                  <Button
                    onClick={() => {
                      // TODO: Implement manual goal creation
                      console.log('Manual goal creation clicked');
                    }}
                    disabled={!selectedConcept}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Goal Manually
                  </Button>
                  
                  {/* View Exercises Button */}
                  <Button
                    onClick={() => {
                      // TODO: Implement navigation to exercises
                      console.log('View exercises clicked');
                    }}
                    disabled={!selectedConcept}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Dumbbell className="h-4 w-4" />
                    View Exercises
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Learning Goals Panel - always displayed */}
        <div className="mt-12">
          <LearningGoalsPanel
            goals={generatedGoals}
            onGoalStatusChange={handleGoalStatusChange}
          />
        </div>
      </div>
    </div>
  );
}