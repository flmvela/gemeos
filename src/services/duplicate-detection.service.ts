import { supabase } from '@/integrations/supabase/client';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarity: number;
  existingConcept?: {
    id: string;
    name: string;
    description: string | null;
    status: string;
  };
  suggestedAction: 'skip' | 'replace' | 'merge' | 'create';
}

export interface ConceptForDuplicateCheck {
  name: string;
  description?: string | null;
  domain_id: string;
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a value between 0 and 1 (1 being identical)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  
  const distance = levenshteinDistance(s1, s2);
  return 1 - (distance / maxLen);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  if (m === 0) return n;
  if (n === 0) return m;
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // deletion
          dp[i][j - 1] + 1,    // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Check if a concept is a duplicate of existing concepts in the domain
 */
export async function checkConceptDuplicate(
  concept: ConceptForDuplicateCheck,
  threshold: number = 0.9
): Promise<DuplicateCheckResult> {
  try {
    // Fetch existing concepts from the same domain
    const { data: existingConcepts, error } = await supabase
      .from('concepts')
      .select('id, name, description, status')
      .eq('domain_id', concept.domain_id);
    
    if (error) {
      console.error('Error fetching existing concepts:', error);
      return {
        isDuplicate: false,
        similarity: 0,
        suggestedAction: 'create'
      };
    }
    
    if (!existingConcepts || existingConcepts.length === 0) {
      return {
        isDuplicate: false,
        similarity: 0,
        suggestedAction: 'create'
      };
    }
    
    // Find the best match
    let bestMatch: typeof existingConcepts[0] | null = null;
    let highestSimilarity = 0;
    
    for (const existing of existingConcepts) {
      // Calculate name similarity
      const nameSimilarity = calculateStringSimilarity(concept.name, existing.name);
      
      // Calculate description similarity if both have descriptions
      let descSimilarity = 0;
      if (concept.description && existing.description) {
        descSimilarity = calculateStringSimilarity(concept.description, existing.description);
      }
      
      // Weighted average (name is more important than description)
      const totalSimilarity = concept.description && existing.description
        ? (nameSimilarity * 0.7 + descSimilarity * 0.3)
        : nameSimilarity;
      
      if (totalSimilarity > highestSimilarity) {
        highestSimilarity = totalSimilarity;
        bestMatch = existing;
      }
    }
    
    // Determine if it's a duplicate
    const isDuplicate = highestSimilarity >= threshold;
    
    // Suggest action based on similarity and status
    let suggestedAction: DuplicateCheckResult['suggestedAction'] = 'create';
    
    if (isDuplicate && bestMatch) {
      if (highestSimilarity >= 0.95) {
        // Almost identical - suggest skip
        suggestedAction = 'skip';
      } else if (bestMatch.status === 'ai_suggested' || bestMatch.status === 'pending_review') {
        // Existing is not confirmed - suggest replace
        suggestedAction = 'replace';
      } else {
        // Existing is confirmed - suggest merge (combine descriptions)
        suggestedAction = 'merge';
      }
    }
    
    return {
      isDuplicate,
      similarity: highestSimilarity,
      existingConcept: bestMatch || undefined,
      suggestedAction
    };
  } catch (error) {
    console.error('Error in duplicate detection:', error);
    return {
      isDuplicate: false,
      similarity: 0,
      suggestedAction: 'create'
    };
  }
}

/**
 * Check multiple concepts for duplicates in batch
 */
export async function checkConceptDuplicatesBatch(
  concepts: ConceptForDuplicateCheck[],
  threshold: number = 0.9
): Promise<Map<string, DuplicateCheckResult>> {
  const results = new Map<string, DuplicateCheckResult>();
  
  // First check for duplicates within the batch itself
  for (let i = 0; i < concepts.length; i++) {
    for (let j = i + 1; j < concepts.length; j++) {
      const similarity = calculateStringSimilarity(concepts[i].name, concepts[j].name);
      
      if (similarity >= threshold) {
        // Mark the second occurrence as duplicate of the first
        results.set(concepts[j].name, {
          isDuplicate: true,
          similarity,
          existingConcept: {
            id: `batch-${i}`,
            name: concepts[i].name,
            description: concepts[i].description || null,
            status: 'pending'
          },
          suggestedAction: 'skip'
        });
      }
    }
  }
  
  // Then check against existing concepts in the database
  for (const concept of concepts) {
    // Skip if already marked as duplicate within batch
    if (results.has(concept.name)) continue;
    
    const result = await checkConceptDuplicate(concept, threshold);
    results.set(concept.name, result);
  }
  
  return results;
}

/**
 * Merge two concept descriptions intelligently
 */
export function mergeConceptDescriptions(
  existing: string | null,
  incoming: string | null
): string | null {
  if (!existing) return incoming;
  if (!incoming) return existing;
  
  // If descriptions are very similar, keep the longer one
  const similarity = calculateStringSimilarity(existing, incoming);
  if (similarity > 0.8) {
    return existing.length > incoming.length ? existing : incoming;
  }
  
  // Otherwise, combine them
  return `${existing}\n\nAdditional information: ${incoming}`;
}