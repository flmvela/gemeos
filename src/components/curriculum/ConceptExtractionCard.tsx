import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Upload, AlertCircle, CheckCircle, FileText, RefreshCw } from 'lucide-react';
import { useConceptExtraction, ConceptExtractionResult } from '@/hooks/useConceptExtraction';

interface ConceptExtractionCardProps {
  domainId: string;
  domainName: string;
  onExtractionComplete?: () => void;
}

export const ConceptExtractionCard: React.FC<ConceptExtractionCardProps> = ({
  domainId,
  domainName,
  onExtractionComplete
}) => {
  const [conceptsText, setConceptsText] = useState('');
  const [lastResult, setLastResult] = useState<ConceptExtractionResult | null>(null);
  const { extractConceptsFromText, isExtracting } = useConceptExtraction();

  const handleExtractConcepts = async () => {
    if (!conceptsText.trim()) return;

    try {
      const result = await extractConceptsFromText(conceptsText, domainId);
      setLastResult(result);
      onExtractionComplete?.();
      
      // Clear the text area after successful extraction
      if (result.conceptsInserted > 0) {
        setConceptsText('');
      }
    } catch (error) {
      console.error('Concept extraction failed:', error);
    }
  };

  const exampleText = `## **I. Harmony**
- **Major Scale Harmonization**: Understanding how chords are built from the major scale
  - Triads and Seventh Chords: Basic chord construction and function
  - Diatonic Progressions: Common chord progressions in major keys
- **Minor Scale Harmonization**: Natural, harmonic, and melodic minor scale chords
  - Minor ii-V-I Progressions: Essential progressions in minor keys

## **II. Rhythm**
- **Swing Feel**: Understanding the triplet-based subdivision in jazz
  - Eighth Note Interpretation: How to swing eighth notes properly`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5" />
          <span>Extract Concepts from Text</span>
        </CardTitle>
        <CardDescription>
          Paste or type concepts to extract and add to the <strong>{domainName}</strong> domain.
          The system will automatically check for duplicates and suggest new concepts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input area */}
        <div className="space-y-2">
          <label htmlFor="concepts-text" className="text-sm font-medium">
            Concepts Text
          </label>
          <Textarea
            id="concepts-text"
            placeholder={`Enter concepts in structured format. Example:\n\n${exampleText}`}
            value={conceptsText}
            onChange={(e) => setConceptsText(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
            disabled={isExtracting}
          />
          <p className="text-xs text-muted-foreground">
            Use markdown format: ## for main topics, - for subtopics, and two spaces + - for sub-subtopics
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleExtractConcepts}
            disabled={isExtracting || !conceptsText.trim()}
            className="flex-1"
          >
            {isExtracting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Extract Concepts
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setConceptsText(exampleText)}
            disabled={isExtracting}
          >
            <FileText className="mr-2 h-4 w-4" />
            Use Example
          </Button>
        </div>

        {/* Results display */}
        {lastResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Extraction Results</span>
            </div>
            
            <div className="flex gap-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                {lastResult.conceptsInserted} New Concepts
              </Badge>
              {lastResult.duplicatesSkipped > 0 && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  {lastResult.duplicatesSkipped} Duplicates Skipped
                </Badge>
              )}
            </div>

            {/* Show details of skipped duplicates */}
            {lastResult.skippedDetails && lastResult.skippedDetails.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Skipped duplicates:</p>
                    {lastResult.skippedDetails.slice(0, 3).map((skip, index) => (
                      <div key={index} className="text-sm">
                        <strong>{skip.name}</strong>: {skip.reason}
                        {skip.similarTo && <span className="text-muted-foreground"> (similar to "{skip.similarTo}")</span>}
                      </div>
                    ))}
                    {lastResult.skippedDetails.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{lastResult.skippedDetails.length - 3} more...
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Help text */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>How it works:</strong> The system will parse your text, extract concepts in hierarchical structure,
            and check for duplicates against existing concepts. Only new, non-duplicate concepts will be suggested for review.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};