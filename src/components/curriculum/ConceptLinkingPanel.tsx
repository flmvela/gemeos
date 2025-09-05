import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Concept } from '@/hooks/useConcepts';
import { Link, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConceptLinkingPanelProps {
  suggestedConcepts: Concept[];
  onStartLinking: (concept: Concept) => void;
  onApprove: (conceptId: string) => void;
  onReject: (conceptId: string) => void;
  linkingMode: boolean;
  selectedConcept: Concept | null;
}

export const ConceptLinkingPanel: React.FC<ConceptLinkingPanelProps> = ({
  suggestedConcepts,
  onStartLinking,
  onApprove,
  onReject,
  linkingMode,
  selectedConcept
}) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>New Suggested Concepts</span>
          <Badge variant="secondary">{suggestedConcepts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {linkingMode && selectedConcept && (
          <Alert>
            <Link className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Linking Mode:</strong> Click on a concept in the main tree to set it as the parent of 
              "<strong>{selectedConcept.name}</strong>".
            </AlertDescription>
          </Alert>
        )}

        {suggestedConcepts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No new suggested concepts</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            {suggestedConcepts.map((concept) => (
              <Card 
                key={concept.id} 
                className={`p-3 transition-all duration-200 ${
                  selectedConcept?.id === concept.id && linkingMode 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:shadow-sm'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm leading-tight">
                        {concept.name}
                      </h4>
                      {concept.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {concept.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStartLinking(concept)}
                      disabled={linkingMode}
                      className="flex-1 h-7 text-xs"
                    >
                      <Link className="h-3 w-3 mr-1" />
                      Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onApprove(concept.id)}
                      disabled={linkingMode}
                      className="h-7 px-2"
                      title="Approve as root concept"
                    >
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReject(concept.id)}
                      disabled={linkingMode}
                      className="h-7 px-2"
                      title="Reject concept"
                    >
                      <XCircle className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};