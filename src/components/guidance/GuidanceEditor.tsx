import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileText, X } from 'lucide-react';
import { useState } from 'react';
import { AIAssistantPanel } from './AIAssistantPanel';

interface GuidanceEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  areaTitle?: string;
}

export const GuidanceEditor = ({ content, onChange, placeholder, areaTitle }: GuidanceEditorProps) => {
  const [wordCount, setWordCount] = useState(0);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const handleContentChange = (value: string) => {
    onChange(value);
    setWordCount(value.trim().split(/\s+/).filter(word => word.length > 0).length);
  };

  const toggleAIAssistant = () => {
    setShowAIAssistant(!showAIAssistant);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>{wordCount} words</span>
        </div>
        <Button variant="outline" size="sm" onClick={toggleAIAssistant}>
          {showAIAssistant ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Close Assistant
            </>
          ) : (
            <>
              <MessageSquare className="h-4 w-4 mr-2" />
              AI Assist
            </>
          )}
        </Button>
      </div>
      
      <Textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[400px] resize-none"
      />
      
      <div className="text-xs text-muted-foreground">
        <p>💡 Tip: Use Markdown formatting for headers, lists, and links. {showAIAssistant ? 'The AI assistant is helping you refine your content below.' : 'Click "AI Assist" to get help editing specific sections.'}</p>
      </div>

      {showAIAssistant && (
        <div className="border-t pt-6">
          <AIAssistantPanel
            currentContent={content}
            onContentUpdate={onChange}
            areaTitle={areaTitle || 'Guidance'}
            onClose={() => setShowAIAssistant(false)}
          />
        </div>
      )}
    </div>
  );
};