/**
 * Service for managing difficulty levels across domains
 * Supports both legacy numeric levels and new foreign key references
 */

import { supabase } from '@/integrations/supabase/client';

export interface DomainDifficultyLevel {
  id: string;
  domain_id: string;
  level_number: number;
  level_name: string;
  description?: string;
  color_code?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface ConceptWithDifficulty {
  id: string;
  name: string;
  description?: string;
  domain_id: string;
  difficulty_level?: number; // Legacy numeric field
  difficulty_level_id?: string; // New FK reference
  difficulty_level_details?: DomainDifficultyLevel; // Joined data
  learning_goals?: any[];
}

export class DifficultyService {
  /**
   * Get all difficulty levels for a domain
   */
  async getDomainDifficultyLevels(domainId: string): Promise<DomainDifficultyLevel[]> {
    const { data, error } = await supabase
      .from('domain_difficulty_levels')
      .select('*')
      .eq('domain_id', domainId)
      .order('level_number', { ascending: true });

    if (error) {
      console.error('Error fetching domain difficulty levels:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get concepts by difficulty range (supports both old and new structure)
   */
  async getConceptsByDifficultyRange(
    domainId: string,
    minLevel: number,
    maxLevel: number
  ): Promise<ConceptWithDifficulty[]> {
    try {
      // First, try to get concepts using the new structure with foreign keys
      const { data: conceptsWithFK, error: fkError } = await supabase
        .from('concepts')
        .select(`
          *,
          difficulty_level_details:domain_difficulty_levels!difficulty_level_id(
            id,
            level_number,
            level_name,
            color_code
          ),
          learning_goals (
            id,
            name,
            description
          )
        `)
        .eq('domain_id', domainId)
        .gte('difficulty_level_details.level_number', minLevel)
        .lte('difficulty_level_details.level_number', maxLevel)
        .order('difficulty_level_details.level_number', { ascending: true });

      // If the query succeeds and returns data, use it
      if (!fkError && conceptsWithFK && conceptsWithFK.length > 0) {
        return conceptsWithFK;
      }

      // Fallback to legacy numeric difficulty_level field
      const { data: conceptsNumeric, error: numericError } = await supabase
        .from('concepts')
        .select(`
          *,
          learning_goals (
            id,
            name,
            description
          )
        `)
        .eq('domain_id', domainId)
        .gte('difficulty_level', minLevel)
        .lte('difficulty_level', maxLevel)
        .order('difficulty_level', { ascending: true });

      if (numericError) {
        console.error('Error fetching concepts by difficulty:', numericError);
        throw numericError;
      }

      // If using numeric levels, try to enrich with difficulty level details
      if (conceptsNumeric && conceptsNumeric.length > 0) {
        const difficultyLevels = await this.getDomainDifficultyLevels(domainId);
        
        return conceptsNumeric.map(concept => {
          const level = difficultyLevels.find(dl => dl.level_number === concept.difficulty_level);
          return {
            ...concept,
            difficulty_level_details: level || undefined
          };
        });
      }

      return [];
    } catch (error) {
      console.error('Error in getConceptsByDifficultyRange:', error);
      throw error;
    }
  }

  /**
   * Get the effective difficulty level for a concept
   */
  async getConceptDifficultyLevel(conceptId: string): Promise<number | null> {
    const { data: concept, error } = await supabase
      .from('concepts')
      .select(`
        difficulty_level,
        difficulty_level_id,
        difficulty_level_details:domain_difficulty_levels!difficulty_level_id(
          level_number
        )
      `)
      .eq('id', conceptId)
      .single();

    if (error) {
      console.error('Error fetching concept difficulty:', error);
      return null;
    }

    // Prefer the foreign key reference if available
    if (concept?.difficulty_level_details?.level_number) {
      return concept.difficulty_level_details.level_number;
    }

    // Fallback to numeric field
    return concept?.difficulty_level || null;
  }

  /**
   * Get class difficulty level (supports both old and new structure)
   */
  async getClassDifficultyLevel(classId: string): Promise<number | null> {
    // First check if class has difficulty_level_id (FK to domain_difficulty_levels)
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        difficulty_level,
        difficulty_level_id,
        difficulty_level_details:domain_difficulty_levels!difficulty_level_id(
          level_number
        )
      `)
      .eq('id', classId)
      .single();

    if (!classError && classData) {
      // Prefer FK reference if available
      if (classData.difficulty_level_details?.level_number) {
        return classData.difficulty_level_details.level_number;
      }
      
      // Fallback to numeric field
      if (classData.difficulty_level) {
        return classData.difficulty_level;
      }
    }

    // Check class_difficulty_levels junction table
    const { data: classDiffLevels, error: junctionError } = await supabase
      .from('class_difficulty_levels')
      .select(`
        difficulty_level_id,
        domain_difficulty_levels!difficulty_level_id(
          level_number
        )
      `)
      .eq('class_id', classId)
      .order('sequence_order', { ascending: true })
      .limit(1);

    if (!junctionError && classDiffLevels && classDiffLevels.length > 0) {
      return classDiffLevels[0].domain_difficulty_levels?.level_number || null;
    }

    // Try to calculate from assigned concepts
    const { data: classConcepts, error: conceptsError } = await supabase
      .from('class_concepts')
      .select(`
        concepts!concept_id(
          difficulty_level,
          difficulty_level_id,
          difficulty_level_details:domain_difficulty_levels!difficulty_level_id(
            level_number
          )
        )
      `)
      .eq('class_id', classId)
      .eq('status', 'active');

    if (!conceptsError && classConcepts && classConcepts.length > 0) {
      const levels = classConcepts
        .map(cc => {
          const concept = cc.concepts;
          if (concept?.difficulty_level_details?.level_number) {
            return concept.difficulty_level_details.level_number;
          }
          return concept?.difficulty_level || null;
        })
        .filter(level => level !== null);

      if (levels.length > 0) {
        // Return the median difficulty level
        levels.sort((a, b) => a - b);
        const mid = Math.floor(levels.length / 2);
        return levels.length % 2 !== 0 
          ? levels[mid] 
          : Math.round((levels[mid - 1] + levels[mid]) / 2);
      }
    }

    return null;
  }

  /**
   * Create default difficulty levels for a domain
   */
  async createDefaultDifficultyLevels(domainId: string): Promise<void> {
    const defaultLevels = [
      { level: 1, name: 'Beginner', color: '#22c55e', desc: 'Foundation level - basic concepts and skills' },
      { level: 2, name: 'Elementary', color: '#34d399', desc: 'Building on basics with simple applications' },
      { level: 3, name: 'Intermediate', color: '#fbbf24', desc: 'Developing competency with moderate complexity' },
      { level: 4, name: 'Advanced Intermediate', color: '#f59e0b', desc: 'Approaching advanced concepts' },
      { level: 5, name: 'Advanced', color: '#fb923c', desc: 'Complex concepts and applications' },
      { level: 6, name: 'Proficient', color: '#f87171', desc: 'High-level mastery of concepts' },
      { level: 7, name: 'Expert', color: '#ef4444', desc: 'Expert-level understanding and application' },
      { level: 8, name: 'Master', color: '#dc2626', desc: 'Mastery of advanced techniques' },
      { level: 9, name: 'Professional', color: '#b91c1c', desc: 'Professional-level expertise' },
      { level: 10, name: 'Specialist', color: '#991b1b', desc: 'Specialist knowledge and skills' }
    ];

    const levels = defaultLevels.map(l => ({
      domain_id: domainId,
      level_number: l.level,
      level_name: l.name,
      description: l.desc,
      color_code: l.color
    }));

    const { error } = await supabase
      .from('domain_difficulty_levels')
      .insert(levels);

    if (error) {
      console.error('Error creating default difficulty levels:', error);
      throw error;
    }
  }

  /**
   * Migrate concept from numeric to FK difficulty level
   */
  async migrateConceptDifficulty(conceptId: string): Promise<boolean> {
    const { data: concept, error: fetchError } = await supabase
      .from('concepts')
      .select('domain_id, difficulty_level, difficulty_level_id')
      .eq('id', conceptId)
      .single();

    if (fetchError || !concept) {
      console.error('Error fetching concept:', fetchError);
      return false;
    }

    // Skip if already has FK reference
    if (concept.difficulty_level_id) {
      return true;
    }

    // Skip if no numeric level to migrate
    if (!concept.difficulty_level) {
      return false;
    }

    // Find matching difficulty level in domain
    const { data: difficultyLevel, error: levelError } = await supabase
      .from('domain_difficulty_levels')
      .select('id')
      .eq('domain_id', concept.domain_id)
      .eq('level_number', concept.difficulty_level)
      .single();

    if (levelError || !difficultyLevel) {
      console.error('Error finding difficulty level:', levelError);
      return false;
    }

    // Update concept with FK reference
    const { error: updateError } = await supabase
      .from('concepts')
      .update({ difficulty_level_id: difficultyLevel.id })
      .eq('id', conceptId);

    if (updateError) {
      console.error('Error updating concept:', updateError);
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const difficultyService = new DifficultyService();