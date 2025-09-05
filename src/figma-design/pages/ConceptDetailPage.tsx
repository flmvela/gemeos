import React from 'react';
import { ConceptDetail } from '../ConceptDetail';
import { Concept } from '../../types/concepts';

interface ConceptDetailPageProps {
  concept: Concept;
  concepts: Concept[];
  initialTab?: string;
  onNavigateBack: () => void;
  onUpdateConcept: (conceptId: string, updates: Partial<Concept>) => void;
  onUpdateRelationships: (conceptId: string, relationships: { conceptId: string; type: 'prerequisite' | 'related' }[]) => void;
  onChangeParent: (conceptId: string, newParentId?: string) => void;
  onNavigateToConcept?: (conceptId: string, tab?: string) => void;
}

export function ConceptDetailPage({
  concept,
  concepts,
  initialTab = 'overview',
  onNavigateBack,
  onUpdateConcept,
  onUpdateRelationships,
  onChangeParent,
  onNavigateToConcept
}: ConceptDetailPageProps) {
  return (
    <ConceptDetail
      concept={concept}
      concepts={concepts}
      initialTab={initialTab}
      onBack={onNavigateBack}
      onUpdateConcept={onUpdateConcept}
      onUpdateRelationships={onUpdateRelationships}
      onChangeParent={onChangeParent}
      onNavigateToConcept={onNavigateToConcept}
    />
  );
}