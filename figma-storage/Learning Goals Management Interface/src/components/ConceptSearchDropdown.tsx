import { useState, useMemo } from 'react';
import { Concept } from '../App';
import { Music, Search, ChevronDown, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { ScrollArea } from './ui/scroll-area';
import { cn } from './ui/utils';

interface ConceptSearchDropdownProps {
  selectedConcept: string | null;
  onConceptSelect: (conceptId: string) => void;
}

// All music concepts from the original ConceptMap
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

export function ConceptSearchDropdown({ selectedConcept, onConceptSelect }: ConceptSearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedConceptData = useMemo(() => {
    return MUSIC_CONCEPTS.find(c => c.id === selectedConcept);
  }, [selectedConcept]);

  const getConceptPath = (concept: Concept): string => {
    const path = [concept.name];
    let current = concept;
    
    while (current.parentId) {
      const parent = MUSIC_CONCEPTS.find(c => c.id === current.parentId);
      if (parent) {
        path.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }
    
    return path.join(' → ');
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConceptSelect('');
  };

  const filteredConcepts = useMemo(() => {
    if (!searchTerm) return MUSIC_CONCEPTS;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return MUSIC_CONCEPTS.filter(concept => 
      concept.name.toLowerCase().includes(lowerSearchTerm) ||
      concept.description?.toLowerCase().includes(lowerSearchTerm) ||
      concept.category.toLowerCase().includes(lowerSearchTerm) ||
      getConceptPath(concept).toLowerCase().includes(lowerSearchTerm)
    );
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
      </div>

      {/* Combobox - Search and Select */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[44px] p-3"
          >
            {selectedConceptData ? (
              <div className="flex items-center gap-2 text-left w-full">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: LEVEL_COLORS[selectedConceptData.level] || '#6b7280' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{selectedConceptData.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {getConceptPath(selectedConceptData)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                  <button
                    onClick={handleClearSelection}
                    className="h-4 w-4 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <Search className="h-4 w-4 opacity-70" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Search className="h-4 w-4" />
                <span>Type to search a concept...</span>
              </div>
            )}
            {!selectedConceptData && (
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Type to search concepts..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-6 text-center text-sm">
                  <Search className="mx-auto h-4 w-4 opacity-50 mb-2" />
                  No concepts found matching "{searchTerm}"
                </div>
              </CommandEmpty>
              <ScrollArea className="h-[400px]">
                <CommandGroup>
                  {filteredConcepts
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((concept) => (
                    <CommandItem
                      key={concept.id}
                      value={concept.id}
                      onSelect={(currentValue) => {
                        if (currentValue === selectedConcept) {
                          onConceptSelect('');
                        } else {
                          onConceptSelect(currentValue);
                        }
                        setOpen(false);
                        setSearchTerm('');
                      }}
                      className="p-3"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Check
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            selectedConcept === concept.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: LEVEL_COLORS[concept.level] || '#6b7280' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{concept.name}</span>
                          </div>
                          {concept.description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {concept.description}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {getConceptPath(concept)}
                          </div>
                        </div>
                        {concept.children.length > 0 && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {concept.children.length}
                          </Badge>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>


    </div>
  );
}