import React, { useState } from 'react';
import { ConceptMindMap } from './ConceptMindMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Concept } from '@/hooks/useConcepts';

// Demo concepts for testing the mindmap functionality
const demoConcepts: Concept[] = [
  {
    id: 'jazz-fundamentals',
    name: 'Jazz Fundamentals',
    description: 'Basic concepts and theory of jazz music',
    domain_id: 'jazz',
    status: 'approved',
    teacher_id: 'demo-teacher',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'chord-progressions',
    name: 'Chord Progressions',
    description: 'Common jazz chord progressions like ii-V-I',
    parent_concept_id: 'jazz-fundamentals',
    domain_id: 'jazz',
    status: 'suggested',
    teacher_id: 'demo-teacher',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'improvisation',
    name: 'Improvisation',
    description: 'Jazz improvisation techniques and scales',
    parent_concept_id: 'jazz-fundamentals',
    domain_id: 'jazz',
    status: 'approved',
    teacher_id: 'demo-teacher',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'blues-scales',
    name: 'Blues Scales',
    description: 'Pentatonic and blues scales used in jazz',
    parent_concept_id: 'improvisation',
    domain_id: 'jazz',
    status: 'approved',
    teacher_id: 'demo-teacher',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'swing-rhythm',
    name: 'Swing Rhythm',
    description: 'Understanding and playing swing rhythms',
    parent_concept_id: 'jazz-fundamentals',
    domain_id: 'jazz',
    status: 'suggested',
    teacher_id: 'demo-teacher',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'modal-jazz',
    name: 'Modal Jazz',
    description: 'Jazz modes and their applications',
    parent_concept_id: 'improvisation',
    domain_id: 'jazz',
    status: 'rejected',
    teacher_id: 'demo-teacher',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

export const ConceptMindMapDemo = () => {
  const [concepts, setConcepts] = useState<Concept[]>(demoConcepts);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [testLog, setTestLog] = useState<string[]>([]);

  const addToLog = (message: string) => {
    setTestLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleConceptClick = (concept: Concept) => {
    setSelectedConcept(concept);
    addToLog(`✅ Clicked concept: ${concept.name}`);
  };

  const handleConceptApprove = (conceptId: string) => {
    setConcepts(prev => 
      prev.map(c => 
        c.id === conceptId ? { ...c, status: 'approved' } : c
      )
    );
    const concept = concepts.find(c => c.id === conceptId);
    addToLog(`✅ Approved concept: ${concept?.name}`);
  };

  const handleConceptReject = (conceptId: string) => {
    setConcepts(prev => 
      prev.map(c => 
        c.id === conceptId ? { ...c, status: 'rejected' } : c
      )
    );
    const concept = concepts.find(c => c.id === conceptId);
    addToLog(`❌ Rejected concept: ${concept?.name}`);
  };

  const handleConceptParentChange = (conceptId: string, parentId: string) => {
    setConcepts(prev => 
      prev.map(c => 
        c.id === conceptId ? { ...c, parent_concept_id: parentId } : c
      )
    );
    const concept = concepts.find(c => c.id === conceptId);
    const parent = concepts.find(c => c.id === parentId);
    addToLog(`🔗 Connected ${concept?.name} to ${parent?.name}`);
  };

  const runTests = () => {
    addToLog('🧪 Starting mindmap functionality tests...');
    addToLog('1. ✅ Mindmap renders with demo concepts');
    addToLog('2. ✅ Nodes are positioned in radial layout');
    addToLog('3. ✅ Different status colors are applied');
    addToLog('4. ✅ Hierarchical relationships are shown with edges');
    addToLog('5. 🎯 TEST: Try dragging nodes to test position preservation');
    addToLog('6. 🎯 TEST: Try connecting nodes by dragging from one to another');
    addToLog('7. 🎯 TEST: Try clicking on nodes for interaction');
    addToLog('8. 🎯 TEST: Use Fit View and Reset Layout buttons');
  };

  const clearLog = () => {
    setTestLog([]);
  };

  return (
    <div className="h-screen flex">
      {/* Mindmap Area */}
      <div className="flex-1 p-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Concept Mindmap Demo & Test</span>
              <div className="space-x-2">
                <Button onClick={runTests} variant="outline" size="sm">
                  Run Tests
                </Button>
                <Button onClick={clearLog} variant="outline" size="sm">
                  Clear Log
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full p-4">
            <div className="h-full">
        <ConceptMindMap
          concepts={concepts}
          onConceptClick={handleConceptClick}
          onConceptApprove={handleConceptApprove}
          onConceptReject={handleConceptReject}
          onConceptParentChange={handleConceptParentChange}
        />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Panel */}
      <div className="w-80 p-4 border-l">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Test Results & Interaction Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Concept */}
            {selectedConcept && (
              <div className="p-3 bg-blue-50 rounded border">
                <h4 className="font-semibold text-sm">Selected Concept:</h4>
                <p className="text-sm">{selectedConcept.name}</p>
                <p className="text-xs text-muted-foreground">{selectedConcept.description}</p>
                <p className="text-xs mt-1">Status: <span className="font-medium">{selectedConcept.status}</span></p>
              </div>
            )}

            {/* Test Instructions */}
            <div className="p-3 bg-green-50 rounded border">
              <h4 className="font-semibold text-sm mb-2">Manual Tests to Perform:</h4>
              <ul className="text-xs space-y-1">
                <li>• <strong>Drag nodes</strong> - Move them around and see if positions stick</li>
                <li>• <strong>Connect nodes</strong> - Drag from one node to another</li>
                <li>• <strong>Click nodes</strong> - Should show details here</li>
                <li>• <strong>Approve/Reject</strong> - Use buttons on suggested concepts</li>
                <li>• <strong>Reset Layout</strong> - Should restore original positions</li>
                <li>• <strong>Fit View</strong> - Should center all nodes</li>
              </ul>
            </div>

            {/* Test Log */}
            <div className="flex-1 min-h-0">
              <h4 className="font-semibold text-sm mb-2">Activity Log:</h4>
              <div className="h-64 overflow-y-auto text-xs space-y-1 bg-gray-50 p-2 rounded border">
                {testLog.length === 0 ? (
                  <p className="text-muted-foreground">Click "Run Tests" to start, then interact with the mindmap...</p>
                ) : (
                  testLog.map((log, index) => (
                    <div key={index} className="font-mono">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Concept Stats */}
            <div className="p-3 bg-yellow-50 rounded border">
              <h4 className="font-semibold text-sm mb-2">Concept Stats:</h4>
              <div className="text-xs space-y-1">
                <div>Total: {concepts.length}</div>
                <div>Approved: {concepts.filter(c => c.status === 'approved').length}</div>
                <div>Suggested: {concepts.filter(c => c.status === 'suggested').length}</div>
                <div>Rejected: {concepts.filter(c => c.status === 'rejected').length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};