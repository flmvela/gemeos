export interface PlatformStats {
  totalDomains: number;
  totalConcepts: number;
  totalLearningGoals: number;
  totalExercises: number;
}

export type DomainStatus = 'active' | 'draft' | 'archived';

export interface DomainStats {
  id: string;
  name: string;
  description: string;
  status: DomainStatus;
  concepts: number;
  learningGoals: number;
  exercises: number;
  lastUpdated: string; // ISO date string
}
