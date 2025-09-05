import { 
  BookOpen, 
  GitBranch, 
  Target, 
  Dumbbell, 
  Lightbulb,
  FileText,
  Settings,
  CheckSquare,
  LucideIcon
} from 'lucide-react';

// Map folder names to appropriate icons
export function getGuidanceIcon(folderName: string): LucideIcon {
  const iconMap: { [key: string]: LucideIcon } = {
    'concepts': BookOpen,
    'concept-structuring': GitBranch,
    'learning-strategies': Target,
    'evaluation-methods': CheckSquare,
    'content-formats': FileText,
    'task-types': Dumbbell,
    'exercises': Dumbbell,
    'strategies': Lightbulb,
    'learning-goals': Target,
    'Learning-goals': Target, // Support capitalized version
  };
  
  return iconMap[folderName] || Settings; // Default icon
}

// Map folder names to descriptions
export function getGuidanceDescription(folderName: string): string {
  const descriptionMap: { [key: string]: string } = {
    'concepts': 'Rules for extracting "what to learn" from uploaded materials.',
    'concept-structuring': 'How to build hierarchies and dependencies among concepts.',
    'learning-strategies': 'Guidelines for turning concepts into measurable objectives.',
    'evaluation-methods': 'Methods for assessing learning progress and outcomes.',
    'content-formats': 'Guidelines for content presentation and formatting.',
    'task-types': 'Different types of learning tasks and activities.',
    'exercises': 'Guidelines for creating exercises and practice activities.',
    'strategies': 'General learning and teaching strategies.',
    'learning-goals': 'Guidelines for defining and structuring learning objectives.',
    'Learning-goals': 'Guidelines for defining and structuring learning objectives.', // Support capitalized version
  };
  
  return descriptionMap[folderName] || 'AI guidance configuration for this area.';
}