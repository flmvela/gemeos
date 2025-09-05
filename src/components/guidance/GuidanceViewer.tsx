import { Button } from '@/components/ui/button';
import { FileText, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface GuidanceViewerProps {
  content: string;
  isEmpty: boolean;
  areaTitle: string;
  onEdit: () => void;
}

export const GuidanceViewer = ({ content, isEmpty, areaTitle, onEdit }: GuidanceViewerProps) => {
  if (isEmpty) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No {areaTitle} Guidance Found</h3>
        <p className="text-muted-foreground mb-6">
          Create guidance content for this area to help configure AI assistance.
        </p>
        <Button onClick={onEdit}>
          <Edit3 className="h-4 w-4 mr-2" />
          Create Guidance Content
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown>{typeof content === 'string' ? content : '```json\n' + JSON.stringify(content, null, 2) + '\n```'}</ReactMarkdown>
      </div>
    </div>
  );
};