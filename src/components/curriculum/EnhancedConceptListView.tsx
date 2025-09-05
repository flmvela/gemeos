import React from 'react';
import { Concept } from '@/hooks/useConcepts';
import { DragDropConceptTree } from './DragDropConceptTree';

interface EnhancedConceptListViewProps {
  concepts: Concept[];
  onConceptClick?: (concept: Concept) => void;
  onConceptReject?: (conceptId: string) => void;
  onConceptApprove?: (conceptId: string) => void;
  onConceptParentChange?: (conceptId: string, parentId: string) => void;
  onConceptDelete?: (conceptId: string) => void;
  onConceptUpdate?: (conceptId: string, updates: Partial<Pick<Concept, 'name' | 'description'>>) => void;
  adminMode?: boolean;
  showRejected?: boolean;
}

export const EnhancedConceptListView = ({
  concepts,
  onConceptClick,
  onConceptReject,
  onConceptApprove,
  onConceptParentChange,
  onConceptDelete,
  onConceptUpdate,
  adminMode = false,
  showRejected = false
}: EnhancedConceptListViewProps) => {
  return (
    <DragDropConceptTree
      concepts={concepts}
      onConceptClick={onConceptClick}
      onConceptReject={onConceptReject}
      onConceptApprove={onConceptApprove}
      onConceptParentChange={onConceptParentChange}
      onConceptDelete={onConceptDelete}
      onConceptUpdate={onConceptUpdate}
      adminMode={adminMode}
      showRejected={showRejected}
    />
  );
};