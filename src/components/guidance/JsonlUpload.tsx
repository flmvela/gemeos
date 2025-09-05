import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConceptExample } from './ExamplesManager';

interface JsonlUploadProps {
  domainId: string;
  domainName: string;
  area: string;
  onSuccess: () => void;
}

export const JsonlUpload = ({ domainId, domainName, area, onSuccess }: JsonlUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<ConceptExample[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const validateExample = (obj: any, lineNumber: number): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!obj.snippet || typeof obj.snippet !== 'string') {
      errors.push(`Line ${lineNumber}: Missing or invalid 'snippet' field`);
    } else {
      const wordCount = obj.snippet.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
      if (wordCount < 100 || wordCount > 800) {
        errors.push(`Line ${lineNumber}: Snippet must be 100-800 words (found ${wordCount})`);
      }
    }

    if (!obj.concepts || !Array.isArray(obj.concepts) || obj.concepts.length === 0) {
      errors.push(`Line ${lineNumber}: Missing or empty 'concepts' array`);
    }

    if (obj.difficulty && !['basic', 'intermediate', 'advanced'].includes(obj.difficulty)) {
      errors.push(`Line ${lineNumber}: Invalid difficulty level`);
    }

    return { valid: errors.length === 0, errors };
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.jsonl')) {
      setErrors(['File must have .jsonl extension']);
      return;
    }

    setFile(selectedFile);
    setParsing(true);
    setErrors([]);
    setPreview([]);

    try {
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const examples: ConceptExample[] = [];
      const parseErrors: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        try {
          const obj = JSON.parse(lines[i]);
          const { valid, errors: validationErrors } = validateExample(obj, i + 1);
          
          if (!valid) {
            parseErrors.push(...validationErrors);
            continue;
          }

          examples.push({
            id: `imported_${Date.now()}_${i}`,
            snippet: obj.snippet,
            concepts: obj.concepts,
            notes: obj.notes,
            difficulty: obj.difficulty,
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          parseErrors.push(`Line ${i + 1}: Invalid JSON format`);
        }
      }

      setPreview(examples);
      setErrors(parseErrors);
    } catch (err) {
      setErrors(['Failed to read file']);
    } finally {
      setParsing(false);
    }
  }, []);

  const handleImport = async () => {
    if (preview.length === 0) return;

    try {
      // Convert examples to JSONL and save via Supabase function
      const jsonlContent = preview.map(example => JSON.stringify(example)).join('\n');
      
      // Import the supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        'https://jfolpnyipoocflcrachg.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb2xwbnlpcG9vY2ZsY3JhY2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNTQxOTcsImV4cCI6MjA2ODkzMDE5N30.Z1vfzimy6x_B6cMLKeMS_91UXctePwSgMJsIgwQPrzg'
      );
      
      const { error } = await supabase.functions.invoke('save-guidance-content', {
        body: {
          domainName,
          area,
          content: jsonlContent,
          type: 'examples'
        }
      });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Import Successful",
        description: `Imported ${preview.length} examples`,
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import examples",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="jsonl-file">Select JSONL File</Label>
        <Input
          id="jsonl-file"
          type="file"
          accept=".jsonl"
          onChange={handleFileChange}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Upload a JSONL file with examples. Each line should contain a JSON object with: snippet, concepts, notes (optional), difficulty (optional)
        </p>
      </div>

      {parsing && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>Parsing file...</AlertDescription>
        </Alert>
      )}

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Validation Errors:</p>
              <ul className="text-xs space-y-1">
                {errors.slice(0, 10).map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
                {errors.length > 10 && (
                  <li>... and {errors.length - 10} more errors</li>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {preview.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">
                Ready to import {preview.length} valid examples
              </p>
              <div className="text-xs space-y-1">
                {preview.slice(0, 3).map((example, index) => (
                  <div key={index} className="border-l-2 pl-2">
                    <p className="font-medium">Concepts: {example.concepts.join(', ')}</p>
                    <p className="text-muted-foreground">
                      {example.snippet.substring(0, 100)}...
                    </p>
                  </div>
                ))}
                {preview.length > 3 && (
                  <p className="text-muted-foreground">... and {preview.length - 3} more</p>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button
          onClick={handleImport}
          disabled={preview.length === 0 || errors.length > 0}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Import {preview.length} Examples
        </Button>
      </div>
    </div>
  );
};