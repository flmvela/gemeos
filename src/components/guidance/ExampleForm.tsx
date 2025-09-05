import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConceptExample } from './ExamplesManager';

interface ExampleFormProps {
  example?: ConceptExample | null;
  onSave: (example: Omit<ConceptExample, 'id' | 'created_at'>) => void;
  onCancel: () => void;
}

export const ExampleForm = ({ example, onSave, onCancel }: ExampleFormProps) => {
  const [snippet, setSnippet] = useState(example?.snippet || '');
  const [conceptsText, setConceptsText] = useState(example?.concepts.join('\n') || '');
  const [notes, setNotes] = useState(example?.notes || '');
  const [difficulty, setDifficulty] = useState<'basic' | 'intermediate' | 'advanced' | undefined>(
    example?.difficulty
  );

  const wordCount = snippet.trim().split(/\s+/).filter(word => word.length > 0).length;
  const isValidWordCount = wordCount >= 100 && wordCount <= 800;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidWordCount || !snippet.trim()) return;

    const concepts = conceptsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (concepts.length === 0) return;

    onSave({
      snippet: snippet.trim(),
      concepts,
      notes: notes.trim() || undefined,
      difficulty,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="snippet">
          Snippet <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="snippet"
          value={snippet}
          onChange={(e) => setSnippet(e.target.value)}
          placeholder="Enter your example snippet (100-800 words)..."
          className="min-h-32"
          required
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Word count: {wordCount}</span>
          <span className={!isValidWordCount && snippet ? 'text-destructive' : ''}>
            100-800 words required
          </span>
        </div>
      </div>

      <div>
        <Label htmlFor="concepts">
          Concepts <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="concepts"
          value={conceptsText}
          onChange={(e) => setConceptsText(e.target.value)}
          placeholder="Enter concepts, one per line..."
          className="min-h-24"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Enter one concept per line
        </p>
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Why these concepts? Additional context..."
          className="min-h-20"
        />
      </div>

      <div>
        <Label htmlFor="difficulty">Difficulty (Optional)</Label>
        <Select value={difficulty} onValueChange={(value) => 
          setDifficulty(value as 'basic' | 'intermediate' | 'advanced' | undefined)
        }>
          <SelectTrigger>
            <SelectValue placeholder="Select difficulty level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!isValidWordCount || !snippet.trim() || conceptsText.trim().length === 0}
        >
          {example ? 'Update Example' : 'Add Example'}
        </Button>
      </div>
    </form>
  );
};