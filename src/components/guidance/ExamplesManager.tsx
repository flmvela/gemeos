import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Search, Edit, Trash2 } from 'lucide-react';
import { JsonlUpload } from './JsonlUpload';
import { useConceptExamples } from '@/hooks/useConceptExamples';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toStringSafe } from '@/lib/utils';

interface ExamplesManagerProps {
  domainId: string;
  domainName: string;
  area: string;
}

export interface ConceptExample {
  id: string;
  snippet: string;
  concepts: string[];
  notes?: string;
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  created_at: string;
  // Learning-goals specific metadata
  bloom_level?: string;
  sequence_order?: number;
}


export const ExamplesManager = ({ domainId, domainName, area }: ExamplesManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [editingExample, setEditingExample] = useState<ConceptExample | null>(null);
  
  const { examples, loading, saveExamples, deleteExample } = useConceptExamples(
    domainId,
    domainName,
    area
  );

  const isLearningGoalsArea = (area || '').toLowerCase() === 'learning-goals';


  const filteredExamples = examples.filter(example => {
    const term = searchTerm.toLowerCase();
    const snippetText = toStringSafe(example.snippet).toLowerCase();
    const notesText = toStringSafe(example.notes).toLowerCase();
    const hasConceptMatch = (example.concepts || []).some(concept =>
      toStringSafe(concept).toLowerCase().includes(term)
    );
    return snippetText.includes(term) || hasConceptMatch || notesText.includes(term);
  });

  const handleSaveExample = async (example: Omit<ConceptExample, 'id' | 'created_at'>) => {
    const newExample: ConceptExample = {
      ...example,
      id: editingExample?.id || `example_${Date.now()}`,
      created_at: editingExample?.created_at || new Date().toISOString(),
    };

    let updatedExamples;
    if (editingExample) {
      updatedExamples = examples.map(ex => ex.id === editingExample.id ? newExample : ex);
    } else {
      updatedExamples = [...examples, newExample];
    }

    await saveExamples(updatedExamples);
    setShowForm(false);
    setEditingExample(null);
  };

  const handleEdit = (example: ConceptExample) => {
    setEditingExample(example);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteExample(id);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'basic': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-4">Loading examples...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search examples..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import JSONL
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Examples from JSONL</DialogTitle>
              </DialogHeader>
              <JsonlUpload 
                domainId={domainId}
                domainName={domainName}
                area={area}
                onSuccess={() => {
                  setShowUpload(false);
                  // Refresh examples after import
                  window.location.reload();
                }}
              />
            </DialogContent>
          </Dialog>

          <Button 
            variant="default" 
            onClick={async () => {
              try {
                const response = await fetch(`https://jfolpnyipoocflcrachg.supabase.co/functions/v1/publish-guidance`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    domainName,
                    area,
                    type: 'examples'
                  })
                });
                
                if (response.ok) {
                  // Show success toast - this would be handled by a proper hook
                  console.log('Published successfully');
                }
              } catch (error) {
                console.error('Publish failed:', error);
              }
            }}
          >
            Publish Examples
          </Button>

          <Button
            onClick={() => {
              window.location.href = `/admin/domain/${domainId}/ai-guidance/${area}/examples/new`;
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Example
          </Button>
        </div>
      </div>

      {/* Examples List */}
      <div className={isLearningGoalsArea ? "space-y-2" : "space-y-4"}>
        {filteredExamples.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                {searchTerm ? 'No examples match your search.' : 'No examples yet. Add your first example to get started.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredExamples.map((example) => (
            <Card key={example.id}>
              {isLearningGoalsArea ? (
                <CardContent className="py-2">
                  <div className="flex items-center gap-3">
                    <p className="text-sm truncate flex-1">{toStringSafe(example.snippet)}</p>
                    <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
                      {example.bloom_level ? <Badge variant="outline">{example.bloom_level}</Badge> : null}
                      {example.sequence_order != null ? <Badge variant="outline">#{example.sequence_order}</Badge> : null}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(example.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              ) : (
                <>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {example.difficulty && (
                          <Badge className={getDifficultyColor(example.difficulty)}>
                            {example.difficulty}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {new Date(example.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(example.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      {typeof example.snippet === 'string' ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{example.snippet}</p>
                      ) : (
                        <pre className="text-xs bg-muted/50 rounded p-3 overflow-auto">
                          {JSON.stringify(example.snippet, null, 2)}
                        </pre>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Concepts:</p>
                      <div className="flex flex-wrap gap-1">
                        {example.concepts.map((concept, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {toStringSafe(concept)}
                          </Badge>
                        ))}
                      </div>
                    </div>
    
                    {example.notes !== undefined && example.notes !== null && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Notes:</p>
                        {typeof example.notes === 'string' ? (
                          <p className="text-xs text-muted-foreground">{example.notes}</p>
                        ) : (
                          <pre className="text-xs bg-muted/50 rounded p-3 overflow-auto">
                            {JSON.stringify(example.notes, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};