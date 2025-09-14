/**
 * Type definitions for Class Concepts System
 */

export interface ConceptDifficulty {
  conceptId: string;
  baseDifficulty: number; // 1-10 from concepts table
  effectiveDifficulty: number; // After overrides
  difficultyLabelId?: string; // Reference to difficulty_level_labels
  confidence: number; // 0-1 confidence score
}

export interface ClassConcept {
  id: string;
  class_id: string;
  concept_id: string;
  assigned_by: string;
  assigned_at: string;
  sequence_order: number;
  concept_group?: string;
  override_difficulty?: number;
  estimated_hours?: number;
  is_mandatory: boolean;
  is_prerequisite_for_next: boolean;
  status: 'active' | 'inactive' | 'completed';
  completed_at?: string;
  version: number;
  created_at: string;
  updated_at: string;
  
  // Joined data
  concept?: {
    id: string;
    name: string;
    description?: string;
    difficulty_level?: number;
    domain_id: string;
  };
}

export interface ClassDifficultyCache {
  id: string;
  class_id: string;
  min_difficulty: number;
  max_difficulty: number;
  avg_difficulty: number;
  median_difficulty: number;
  mode_difficulty?: number;
  weighted_avg_difficulty?: number;
  difficulty_distribution: Record<string, number>;
  concept_count: number;
  mandatory_concept_count: number;
  suggested_difficulty_level?: number;
  suggested_level_confidence?: number;
  calculation_method: string;
  calculated_at: string;
  expires_at: string;
}

export interface ConceptHistory {
  id: string;
  concept_id: string;
  name?: string;
  description?: string;
  difficulty_level?: number;
  metadata?: any;
  changed_by: string;
  changed_at: string;
  change_type: 'create' | 'update' | 'delete' | 'restore';
  change_reason?: string;
  version_from?: number;
  version_to?: number;
  class_id?: string;
  batch_id?: string;
}

export interface ClassConceptHistory {
  id: string;
  class_concept_id: string;
  class_id: string;
  concept_id: string;
  action: 'added' | 'removed' | 'reordered' | 'updated';
  previous_values?: any;
  new_values?: any;
  changed_by: string;
  changed_at: string;
  change_reason?: string;
}

export interface ClassDifficultyAnalysis {
  classId: string;
  minDifficulty: number;
  maxDifficulty: number;
  avgDifficulty: number;
  medianDifficulty: number;
  modeDifficulty?: number;
  weightedAvgDifficulty?: number;
  difficultyDistribution: Record<number, number>;
  conceptCount: number;
  mandatoryConceptCount: number;
  suggestedLevel: number;
  suggestedLevelConfidence: number;
  warning?: string;
  recommendation?: string;
}

export interface AssignConceptsRequest {
  classId: string;
  concepts: Array<{
    conceptId: string;
    sequenceOrder?: number;
    conceptGroup?: string;
    overrideDifficulty?: number;
    estimatedHours?: number;
    isMandatory?: boolean;
    isPrerequisiteForNext?: boolean;
  }>;
}

export interface UpdateClassConceptRequest {
  sequenceOrder?: number;
  conceptGroup?: string;
  overrideDifficulty?: number | null;
  estimatedHours?: number;
  isMandatory?: boolean;
  isPrerequisiteForNext?: boolean;
  status?: 'active' | 'inactive' | 'completed';
}

export interface ReorderConceptsRequest {
  classId: string;
  conceptOrders: Array<{
    conceptId: string;
    newOrder: number;
  }>;
}

export interface DifficultyLevel {
  value: number;
  label: string;
  description: string;
  color: string;
  icon?: string;
}

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  { value: 1, label: 'Beginner', description: 'Foundation level', color: '#10b981', icon: '🌱' },
  { value: 2, label: 'Elementary', description: 'Basic concepts', color: '#34d399', icon: '🌿' },
  { value: 3, label: 'Easy', description: 'Simple applications', color: '#6ee7b7', icon: '🍃' },
  { value: 4, label: 'Moderate', description: 'Standard level', color: '#fbbf24', icon: '⭐' },
  { value: 5, label: 'Intermediate', description: 'Complex concepts', color: '#f59e0b', icon: '🌟' },
  { value: 6, label: 'Challenging', description: 'Advanced applications', color: '#fb923c', icon: '💫' },
  { value: 7, label: 'Difficult', description: 'Expert level', color: '#f97316', icon: '🔥' },
  { value: 8, label: 'Advanced', description: 'Professional level', color: '#ef4444', icon: '🚀' },
  { value: 9, label: 'Expert', description: 'Master level', color: '#dc2626', icon: '💎' },
  { value: 10, label: 'Master', description: 'Peak difficulty', color: '#b91c1c', icon: '👑' }
];

export function getDifficultyLevel(value: number): DifficultyLevel {
  return DIFFICULTY_LEVELS[Math.min(Math.max(0, value - 1), 9)];
}

export function getDifficultyColor(value: number): string {
  return getDifficultyLevel(value).color;
}

export function getDifficultyLabel(value: number): string {
  return getDifficultyLevel(value).label;
}

export function getDifficultyWarning(min: number, max: number): string | undefined {
  const spread = max - min;
  if (spread > 5) {
    return `Critical: Concepts span ${spread} difficulty levels. Consider splitting into multiple classes.`;
  } else if (spread > 3) {
    return `Warning: Concepts span ${spread} difficulty levels. Some students may struggle.`;
  } else if (spread > 2) {
    return `Note: Concepts span ${spread} difficulty levels. Ensure proper sequencing.`;
  }
  return undefined;
}

export function getDifficultyRecommendation(analysis: ClassDifficultyAnalysis): string {
  if (analysis.conceptCount === 0) {
    return 'Add concepts to this class to establish difficulty level.';
  }
  
  if (analysis.suggestedLevelConfidence < 0.5) {
    return 'Manual review recommended: concept difficulties vary significantly.';
  }
  
  if (analysis.suggestedLevelConfidence < 0.7) {
    return 'Consider grouping concepts by difficulty or adding prerequisite markers.';
  }
  
  if (analysis.maxDifficulty - analysis.minDifficulty <= 2) {
    return 'Well-balanced class with consistent difficulty level.';
  }
  
  return 'Class difficulty is appropriately distributed.';
}