import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConceptData {
  name: string;
  description?: string;
  level: number;
  parent_concept_id?: string;
}

interface DuplicateCheckResult {
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

/**
 * Checks if a concept name is a duplicate or very similar to existing concepts
 */
async function checkForDuplicateConcepts(
  conceptName: string,
  domainId: string,
  existingConcepts: Array<{id: string, name: string, status: string}>,
  excludeStatuses: string[] = ['rejected'],
  similarityThreshold: number = 0.85
): Promise<DuplicateCheckResult> {
  try {
    const filteredConcepts = existingConcepts.filter(
      c => !excludeStatuses.includes(c.status)
    );

    if (filteredConcepts.length === 0) {
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
    for (const concept of filteredConcepts) {
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
      similarMatches: similarMatches.slice(0, 3) // Limit to top 3 matches
    };
  } catch (error) {
    console.error('Error in duplicate check:', error);
    return { isDuplicate: false };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the request data
    const { domainId, conceptsText, fileId } = await req.json()

    if (!domainId || !conceptsText) {
      throw new Error('Domain ID and concepts text are required')
    }

    console.log(`Starting concept extraction with duplicate check for domain: ${domainId}`)

    // Fetch existing concepts to check for duplicates
    const { data: existingConcepts, error: existingError } = await supabaseClient
      .from('concepts')
      .select('id, name, status')
      .eq('domain_id', domainId);

    if (existingError) {
      console.error('Error fetching existing concepts:', existingError);
      throw new Error('Failed to fetch existing concepts for duplicate check');
    }

    console.log(`Found ${existingConcepts?.length || 0} existing concepts to check against`);

    // Parse the text content to extract concepts
    const lines = conceptsText.split('\n')
    const concepts: ConceptData[] = []
    
    // Track parent concepts at each level
    let currentLevel0Parent: string | undefined = undefined
    let currentLevel1Parent: string | undefined = undefined

    console.log(`Processing ${lines.length} lines for concept extraction`)

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Skip empty lines
      if (!line.trim()) continue

      // Level 0 (Root Concepts): Lines starting with ##
      if (line.startsWith('## ')) {
        let conceptName = line.substring(3).trim()
        
        // Remove markdown formatting like **text**
        conceptName = conceptName.replace(/\*\*(.*?)\*\*/g, '$1')
        
        // Split name and description if there's a colon
        const [name, ...descParts] = conceptName.split(':')
        const description = descParts.length > 0 ? descParts.join(':').trim() : undefined

        concepts.push({
          name: name.trim(),
          description,
          level: 0,
          parent_concept_id: undefined
        })

        // Update current Level 0 parent
        currentLevel0Parent = `temp_${concepts.length - 1}`
        currentLevel1Parent = undefined // Reset Level 1 parent
        continue
      }

      // Level 1 (Child Concepts): Lines starting with "- " 
      if (line.match(/^- .+$/) || line.match(/^- \*\*.+$/)) {
        let conceptName = line.substring(2).trim()
        
        // Remove markdown formatting like **text**
        conceptName = conceptName.replace(/\*\*(.*?)\*\*/g, '$1')
        
        // Split name and description if there's a colon
        const [name, ...descParts] = conceptName.split(':')
        const description = descParts.length > 0 ? descParts.join(':').trim() : undefined

        concepts.push({
          name: name.trim(),
          description,
          level: 1,
          parent_concept_id: currentLevel0Parent
        })

        // Update current Level 1 parent
        currentLevel1Parent = `temp_${concepts.length - 1}`
        continue
      }

      // Level 2 (Grandchild Concepts): Lines starting with "  - " (two spaces + dash + space)
      if (line.match(/^  - .+$/)) {
        let conceptName = line.substring(4).trim()
        
        // Remove markdown formatting like **text**
        conceptName = conceptName.replace(/\*\*(.*?)\*\*/g, '$1')
        
        // Split name and description if there's a colon
        const [name, ...descParts] = conceptName.split(':')
        const description = descParts.length > 0 ? descParts.join(':').trim() : undefined

        concepts.push({
          name: name.trim(),
          description,
          level: 2,
          parent_concept_id: currentLevel1Parent
        })
        continue
      }
    }

    console.log(`Parsed ${concepts.length} concepts from text`)

    // Check each concept for duplicates before insertion
    const insertedConcepts: Array<{ temp_id: string; actual_id: string }> = []
    const skippedDuplicates: Array<{ name: string; reason: string; similarTo?: string }> = []
    
    for (let i = 0; i < concepts.length; i++) {
      const concept = concepts[i]
      
      // Check for duplicates
      const duplicateCheck = await checkForDuplicateConcepts(
        concept.name,
        domainId,
        existingConcepts || [],
        ['rejected'], // Exclude rejected concepts from duplicate check
        0.85 // 85% similarity threshold
      );

      if (duplicateCheck.isDuplicate) {
        console.log(`Skipping duplicate concept: "${concept.name}"`);
        if (duplicateCheck.exactMatch) {
          skippedDuplicates.push({
            name: concept.name,
            reason: 'Exact match',
            similarTo: duplicateCheck.exactMatch
          });
        } else if (duplicateCheck.similarMatches && duplicateCheck.similarMatches.length > 0) {
          skippedDuplicates.push({
            name: concept.name,
            reason: `Similar to existing concept (${Math.round(duplicateCheck.similarMatches[0].similarity * 100)}% match)`,
            similarTo: duplicateCheck.similarMatches[0].name
          });
        }
        continue; // Skip this concept
      }
      
      // Resolve parent ID if it exists
      let actualParentId: string | undefined
      if (concept.parent_concept_id) {
        const parentMapping = insertedConcepts.find(c => c.temp_id === concept.parent_concept_id)
        actualParentId = parentMapping?.actual_id
      }

      // Insert the concept as suggested
      const { data: insertedConcept, error } = await supabaseClient
        .from('concepts')
        .insert({
          name: concept.name,
          description: concept.description,
          domain_id: domainId,
          parent_concept_id: actualParentId,
          status: 'suggested', // New concepts are suggested by default
          display_order: i,
          source_file_id: fileId,
          teacher_id: null // Allow null for AI-generated concepts
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error inserting concept:', error)
        throw new Error(`Failed to insert concept: ${concept.name}`)
      }

      // Track the mapping between temp ID and actual ID
      insertedConcepts.push({
        temp_id: `temp_${i}`,
        actual_id: insertedConcept.id
      })

      console.log(`Inserted suggested concept: "${concept.name}" with ID: ${insertedConcept.id}`)
    }

    const insertedCount = insertedConcepts.length;
    const skippedCount = skippedDuplicates.length;

    console.log(`Extraction completed: ${insertedCount} concepts inserted, ${skippedCount} duplicates skipped`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        conceptsInserted: insertedCount,
        duplicatesSkipped: skippedCount,
        skippedDetails: skippedDuplicates,
        message: `Successfully extracted ${insertedCount} new concepts. Skipped ${skippedCount} duplicates.`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error extracting concepts:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})