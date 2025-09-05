import { supabase } from '@/integrations/supabase/client';

/**
 * Calculates similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1;
  
  const matrix = [];
  const len1 = s1.length;
  const len2 = s2.length;
  
  // If one string is empty, similarity is 0
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // Calculate Levenshtein distance
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  const maxLength = Math.max(len1, len2);
  const distance = matrix[len1][len2];
  return 1 - (distance / maxLength);
}

/**
 * Normalizes concept names for better matching
 */
function normalizeConceptName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove common variations
    .replace(/\s*\([^)]*\)/g, '') // Remove parenthetical content
    .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/^(the|a|an)\s+/i, '') // Remove leading articles
    .trim();
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  exactMatch?: string;
  similarMatches?: Array<{
    id: string;
    name: string;
    similarity: number;
    status: string;
  }>;
}

/**
 * Checks if a concept name is a duplicate or very similar to existing concepts
 */
export async function checkForDuplicateConcepts(
  conceptName: string,
  domainId: string,
  excludeStatuses: string[] = ['rejected'],
  similarityThreshold: number = 0.85
): Promise<DuplicateCheckResult> {
  try {
    // Fetch existing concepts in the domain
    const { data: existingConcepts, error } = await supabase
      .from('concepts')
      .select('id, name, status')
      .eq('domain_id', domainId)
      .not('status', 'in', `(${excludeStatuses.map(s => `"${s}"`).join(',')})`);

    if (error) {
      console.error('Error fetching concepts for duplicate check:', error);
      return { isDuplicate: false };
    }

    if (!existingConcepts || existingConcepts.length === 0) {
      return { isDuplicate: false };
    }

    const normalizedInput = normalizeConceptName(conceptName);
    const similarMatches: Array<{
      id: string;
      name: string;
      similarity: number;
      status: string;
    }> = [];

    let exactMatch: string | undefined;

    // Check each existing concept
    for (const concept of existingConcepts) {
      const normalizedExisting = normalizeConceptName(concept.name);
      
      // Check for exact match on normalized names
      if (normalizedInput === normalizedExisting) {
        exactMatch = concept.name;
        break;
      }

      // Check similarity
      const similarity = calculateSimilarity(normalizedInput, normalizedExisting);
      if (similarity >= similarityThreshold) {
        similarMatches.push({
          id: concept.id,
          name: concept.name,
          similarity,
          status: concept.status
        });
      }
    }

    // Sort by similarity descending
    similarMatches.sort((a, b) => b.similarity - a.similarity);

    return {
      isDuplicate: !!exactMatch || similarMatches.length > 0,
      exactMatch,
      similarMatches: similarMatches.slice(0, 5) // Limit to top 5 matches
    };
  } catch (error) {
    console.error('Error in duplicate check:', error);
    return { isDuplicate: false };
  }
}

/**
 * Batch check multiple concept names for duplicates
 */
export async function batchCheckForDuplicates(
  conceptNames: string[],
  domainId: string,
  excludeStatuses: string[] = ['rejected'],
  similarityThreshold: number = 0.85
): Promise<Record<string, DuplicateCheckResult>> {
  const results: Record<string, DuplicateCheckResult> = {};
  
  // Check each concept name
  for (const name of conceptNames) {
    results[name] = await checkForDuplicateConcepts(
      name,
      domainId,
      excludeStatuses,
      similarityThreshold
    );
  }
  
  return results;
}