import { useState, useRef } from 'react';
import { Concept } from '../App';
import { ChevronRight, ChevronDown, Music } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

interface ConceptMapProps {
  selectedConcept: string | null;
  onConceptSelect: (conceptId: string) => void;
}

// Comprehensive music theory hierarchy with 7-8 levels
const MUSIC_CONCEPTS: Concept[] = [
  // Level 0 - Root concepts
  {
    id: 'harmony',
    name: 'Harmony',
    level: 0,
    children: ['harmonized-scales', 'chord-progressions', 'voice-leading'],
    category: 'theory',
    description: 'The study of simultaneous musical sounds and their relationships'
  },
  {
    id: 'melody',
    name: 'Melody',
    level: 0,
    children: ['melodic-intervals', 'melodic-scales', 'melodic-phrases'],
    category: 'theory',
    description: 'The study of single musical lines and their construction'
  },
  {
    id: 'rhythm',
    name: 'Rhythm',
    level: 0,
    children: ['time-signatures', 'note-values', 'rhythmic-patterns'],
    category: 'theory',
    description: 'The study of time and duration in music'
  },

  // Level 1 - Harmony branch
  {
    id: 'harmonized-scales',
    name: 'Harmonized Scales',
    level: 1,
    parentId: 'harmony',
    children: ['diatonic-chords', 'chromatic-harmony'],
    category: 'harmony',
    description: 'Scales with harmonies built upon each degree'
  },
  {
    id: 'chord-progressions',
    name: 'Chord Progressions',
    level: 1,
    parentId: 'harmony',
    children: ['functional-harmony', 'modal-progressions'],
    category: 'harmony'
  },
  {
    id: 'voice-leading',
    name: 'Voice Leading',
    level: 1,
    parentId: 'harmony',
    children: ['contrary-motion', 'parallel-motion'],
    category: 'harmony'
  },

  // Level 2 - Harmonized scales branch
  {
    id: 'diatonic-chords',
    name: 'Diatonic Chords',
    level: 2,
    parentId: 'harmonized-scales',
    children: ['triads', 'seventh-chords', 'extended-chords'],
    category: 'chords',
    description: 'Chords built from notes within a particular scale'
  },
  {
    id: 'chromatic-harmony',
    name: 'Chromatic Harmony',
    level: 2,
    parentId: 'harmonized-scales',
    children: ['secondary-dominants', 'augmented-sixth-chords'],
    category: 'chords'
  },

  // Level 3 - Chord types
  {
    id: 'triads',
    name: 'Triads',
    level: 3,
    parentId: 'diatonic-chords',
    children: ['major-triads', 'minor-triads', 'diminished-triads', 'augmented-triads'],
    category: 'basic-chords',
    description: 'Three-note chords built in thirds'
  },
  {
    id: 'seventh-chords',
    name: 'Seventh Chords',
    level: 3,
    parentId: 'diatonic-chords',
    children: ['major-seventh', 'minor-seventh', 'dominant-seventh', 'half-diminished'],
    category: 'extended-chords',
    description: 'Four-note chords including the seventh'
  },
  {
    id: 'extended-chords',
    name: 'Extended Chords',
    level: 3,
    parentId: 'diatonic-chords',
    children: ['ninth-chords', 'eleventh-chords', 'thirteenth-chords'],
    category: 'advanced-chords'
  },

  // Level 4 - Triad types
  {
    id: 'major-triads',
    name: 'Major Triads',
    level: 4,
    parentId: 'triads',
    children: ['major-scale-degrees', 'major-chord-inversions'],
    category: 'major-harmony',
    description: 'Triads with major third and perfect fifth'
  },
  {
    id: 'minor-triads',
    name: 'Minor Triads',
    level: 4,
    parentId: 'triads',
    children: ['natural-minor', 'harmonic-minor', 'melodic-minor'],
    category: 'minor-harmony'
  },
  {
    id: 'diminished-triads',
    name: 'Diminished Triads',
    level: 4,
    parentId: 'triads',
    children: ['diminished-scales', 'diminished-function'],
    category: 'diminished-harmony'
  },

  // Level 5 - Scale relationships
  {
    id: 'major-scale-degrees',
    name: 'Major Scale Degrees',
    level: 5,
    parentId: 'major-triads',
    children: ['scale-degree-functions', 'modal-scales'],
    category: 'scales',
    description: 'The seven degrees of the major scale and their functions'
  },
  {
    id: 'natural-minor',
    name: 'Natural Minor',
    level: 5,
    parentId: 'minor-triads',
    children: ['minor-intervals', 'relative-major'],
    category: 'minor-scales'
  },

  // Level 6 - Interval study
  {
    id: 'scale-degree-functions',
    name: 'Scale Degree Functions',
    level: 6,
    parentId: 'major-scale-degrees',
    children: ['tonic-function', 'dominant-function', 'subdominant-function'],
    category: 'functional-theory'
  },
  {
    id: 'minor-intervals',
    name: 'Minor Intervals',
    level: 6,
    parentId: 'natural-minor',
    children: ['interval-qualities', 'interval-inversions'],
    category: 'intervals',
    description: 'Study of intervals within minor scales'
  },

  // Level 7 - Deep theory
  {
    id: 'interval-qualities',
    name: 'Interval Qualities',
    level: 7,
    parentId: 'minor-intervals',
    children: [],
    category: 'interval-theory',
    description: 'Perfect, major, minor, augmented, and diminished intervals'
  },
  {
    id: 'tonic-function',
    name: 'Tonic Function',
    level: 7,
    parentId: 'scale-degree-functions',
    children: [],
    category: 'harmonic-function'
  },

  // Additional melody branch concepts
  {
    id: 'melodic-intervals',
    name: 'Melodic Intervals',
    level: 1,
    parentId: 'melody',
    children: ['stepwise-motion', 'leaps-and-skips'],
    category: 'melody-theory'
  },
  {
    id: 'stepwise-motion',
    name: 'Stepwise Motion',
    level: 2,
    parentId: 'melodic-intervals',
    children: ['scale-passages', 'chromatic-passages'],
    category: 'melodic-movement'
  },

  // Rhythm branch concepts
  {
    id: 'time-signatures',
    name: 'Time Signatures',
    level: 1,
    parentId: 'rhythm',
    children: ['simple-meters', 'compound-meters', 'asymmetrical-meters'],
    category: 'rhythm-theory'
  },
  {
    id: 'simple-meters',
    name: 'Simple Meters',
    level: 2,
    parentId: 'time-signatures',
    children: ['duple-meter', 'triple-meter', 'quadruple-meter'],
    category: 'meter-types'
  }
];

const LEVEL_COLORS = [
  '#8b5cf6', // Level 0 - Purple
  '#3b82f6', // Level 1 - Blue  
  '#10b981', // Level 2 - Green
  '#f59e0b', // Level 3 - Amber
  '#ef4444', // Level 4 - Red
  '#ec4899', // Level 5 - Pink
  '#6366f1', // Level 6 - Indigo
  '#8b5cf6'  // Level 7 - Purple (cycles back)
];

export function ConceptMap({ selectedConcept, onConceptSelect }: ConceptMapProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['harmony', 'melody', 'rhythm']));

  const toggleNode = (conceptId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(conceptId)) {
      newExpanded.delete(conceptId);
    } else {
      newExpanded.add(conceptId);
    }
    setExpandedNodes(newExpanded);
  };

  const getConceptById = (id: string): Concept | undefined => {
    return MUSIC_CONCEPTS.find(c => c.id === id);
  };

  const getChildConcepts = (parentId: string): Concept[] => {
    return MUSIC_CONCEPTS.filter(c => c.parentId === parentId);
  };

  const getRootConcepts = (): Concept[] => {
    return MUSIC_CONCEPTS.filter(c => c.level === 0);
  };

  const renderConceptNode = (concept: Concept, depth: number = 0): JSX.Element => {
    const hasChildren = concept.children.length > 0;
    const isExpanded = expandedNodes.has(concept.id);
    const isSelected = selectedConcept === concept.id;
    const levelColor = LEVEL_COLORS[concept.level] || '#6b7280';
    
    return (
      <div key={concept.id} className="select-none">
        <div 
          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
            isSelected 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'hover:bg-accent/50'
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {/* Expand/Collapse button */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(concept.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {/* Level indicator */}
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: levelColor }}
          />
          
          {/* Concept name and info */}
          <div 
            className="flex-1 min-w-0"
            onClick={() => onConceptSelect(concept.id)}
          >
            <div className="flex items-center gap-2">
              <span className={`truncate ${isSelected ? 'font-medium' : ''}`}>
                {concept.name}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                isSelected 
                  ? 'bg-primary-foreground/20 text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                L{concept.level}
              </span>
            </div>
            {concept.description && (
              <div className={`text-xs mt-1 truncate ${
                isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
              }`}>
                {concept.description}
              </div>
            )}
          </div>
          
          {/* Children count */}
          {hasChildren && (
            <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
              isSelected 
                ? 'bg-primary-foreground/20 text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {concept.children.length}
            </span>
          )}
        </div>
        
        {/* Render children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {getChildConcepts(concept.id).map(child => 
              renderConceptNode(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header controls */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4" />
          <span className="text-sm">Music Theory Concepts</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedNodes(new Set(MUSIC_CONCEPTS.map(c => c.id)))}
          >
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedNodes(new Set(['harmony', 'melody', 'rhythm']))}
          >
            Collapse All
          </Button>
        </div>
      </div>
      
      {/* Level legend */}
      <div className="mb-4 p-3 bg-muted/30 rounded-lg flex-shrink-0">
        <div className="text-xs mb-2">Concept Levels:</div>
        <div className="flex flex-wrap gap-2">
          {LEVEL_COLORS.slice(0, 8).map((color, index) => (
            <div key={index} className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs">L{index}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Concept tree - this should take remaining space and scroll */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="space-y-1 pr-4 pb-4">
            {getRootConcepts().map(concept => renderConceptNode(concept))}
          </div>
        </ScrollArea>
      </div>
      
      {/* Instructions - fixed at bottom */}
      <div className="mt-4 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground flex-shrink-0">
        <strong>How to use:</strong>
        <ul className="mt-1 space-y-1">
          <li>• Click on concept names to select them</li>
          <li>• Use arrow buttons to expand/collapse branches</li>
          <li>• Selected concepts will be highlighted</li>
          <li>• Generate learning goals for your selected concept</li>
        </ul>
      </div>
    </div>
  );
}