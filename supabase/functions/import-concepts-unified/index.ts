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

interface ImportRequest {
  domainId: string;
  source: 'hardcoded' | 'gcs' | 'text';
  conceptsText?: string; // For direct text input
  gcsPath?: string; // For GCS file download
  fileId?: string; // Optional file reference
  duplicateCheck?: boolean; // Whether to check for duplicates (default: true)
  status?: 'suggested' | 'approved'; // Default status for new concepts
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

// Sample master concept list for jazz (fallback/hardcoded data)
const JAZZ_MASTER_CONCEPTS = `## **I. Harmony**
- **Major Scale Harmonization**: Understanding how chords are built from the major scale
  - Triads and Seventh Chords: Basic chord construction and function
  - Diatonic Progressions: Common chord progressions in major keys
- **Minor Scale Harmonization**: Natural, harmonic, and melodic minor scale chords
  - Minor ii-V-I Progressions: Essential progressions in minor keys
  - Modal Interchange: Borrowing chords from parallel modes
- **Extended Harmony**: Using 9th, 11th, and 13th chords
  - Upper Structure Triads: Advanced chord voicing techniques
  - Quartal and Quintal Harmony: Non-tertian harmonic approaches

## **II. Rhythm**
- **Swing Feel**: Understanding the triplet-based subdivision in jazz
  - Eighth Note Interpretation: How to swing eighth notes properly
  - Rhythmic Displacement: Playing ahead or behind the beat
- **Complex Time Signatures**: Working with odd meters and polyrhythms
  - 5/4 and 7/4 Time: Common odd meters in jazz
  - Metric Modulation: Transitioning between different time signatures
- **Rhythmic Vocabulary**: Common jazz rhythmic patterns
  - Syncopation Patterns: Off-beat accents and rhythmic interest
  - Latin Rhythms: Bossa nova, samba, and Afro-Cuban patterns

## **III. Improvisation**
- **Scale-Chord Relationships**: Matching scales to chord types
  - Bebop Scales: Adding chromatic passing tones for linear improvisation
  - Pentatonic Applications: Using pentatonic scales in jazz contexts
- **Motivic Development**: Creating coherent improvisational lines
  - Sequence and Variation: Developing short musical ideas
  - Call and Response: Creating conversational improvisational phrases
- **Harmonic Substitution**: Advanced harmonic concepts for improvisation
  - Tritone Substitution: Replacing dominant chords with substitute dominants
  - Chromatic Approach Tones: Using leading tones to create tension`;

/**
 * Calculates similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const matrix = [];
  const len1 = s1.length;
  const len2 = s2.length;
  
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

/**
 * Downloads content from Google Cloud Storage
 */
async function downloadFromGCS(gcsPath: string): Promise<string> {
  const gcsServiceAccount = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT')
  if (!gcsServiceAccount) {
    throw new Error('Google Cloud Storage service account not configured')
  }

  const credentials = JSON.parse(gcsServiceAccount)
  
  // Parse GCS path (gs://bucket/path)
  const gcsMatch = gcsPath.match(/^gs:\/\/([^\/]+)\/(.+)$/);
  if (!gcsMatch) {
    throw new Error('Invalid GCS path format. Expected: gs://bucket/path')
  }
  
  const bucketName = gcsMatch[1];
  const filePath = gcsMatch[2];
  
  console.log(`Downloading file: ${filePath} from bucket: ${bucketName}`)

  // Create JWT token for GCS API
  const now = Math.floor(Date.now() / 1000)
  const jwtPayload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const jwtHeader = { alg: 'RS256', typ: 'JWT' }
  
  // Import the private key - handle both escaped and unescaped newlines
  let privateKeyContent = credentials.private_key;
  if (privateKeyContent.includes('\\n')) {
    privateKeyContent = privateKeyContent.replace(/\\n/g, '\n');
  }
  
  // Extract the key content between the headers
  const keyMatch = privateKeyContent.match(/-----BEGIN PRIVATE KEY-----\s*([A-Za-z0-9+/=\s]+)\s*-----END PRIVATE KEY-----/);
  if (!keyMatch) {
    throw new Error('Invalid private key format');
  }
  
  const keyData = keyMatch[1].replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
  
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Create JWT
  const encoder = new TextEncoder()
  const jwtHeaderB64 = btoa(JSON.stringify(jwtHeader)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const jwtPayloadB64 = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const jwtUnsigned = `${jwtHeaderB64}.${jwtPayloadB64}`
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(jwtUnsigned)
  )
  
  const jwtSignatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  const jwt = `${jwtUnsigned}.${jwtSignatureB64}`

  // Get access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error('Failed to get access token')
  }

  const tokenData = await tokenResponse.json()
  const accessToken = tokenData.access_token

  // Download the file from GCS
  const fileResponse = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  )

  if (!fileResponse.ok) {
    if (fileResponse.status === 404) {
      throw new Error('File not found in Google Cloud Storage')
    }
    throw new Error(`Failed to download file: ${fileResponse.statusText}`)
  }

  return await fileResponse.text()
}

/**
 * Parses markdown content to extract hierarchical concepts
 */
function parseConceptsFromMarkdown(content: string): ConceptData[] {
  const lines = content.split('\n')
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

  console.log(`Parsed ${concepts.length} concepts from markdown`)
  return concepts
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

    // Parse request
    const request: ImportRequest = await req.json()
    const { 
      domainId, 
      source, 
      conceptsText, 
      gcsPath, 
      fileId,
      duplicateCheck = true,
      status = 'suggested'
    } = request

    if (!domainId || !source) {
      throw new Error('Domain ID and source are required')
    }

    console.log(`Starting concept import for domain: ${domainId}, source: ${source}`)

    // Get content based on source
    let content: string;
    switch (source) {
      case 'hardcoded':
        content = JAZZ_MASTER_CONCEPTS;
        console.log('Using hardcoded jazz concepts');
        break;
        
      case 'gcs':
        if (!gcsPath) {
          throw new Error('GCS path is required for GCS source')
        }
        content = await downloadFromGCS(gcsPath);
        console.log(`Downloaded content from GCS: ${gcsPath}`);
        break;
        
      case 'text':
        if (!conceptsText) {
          throw new Error('Concepts text is required for text source')
        }
        content = conceptsText;
        console.log('Using provided text content');
        break;
        
      default:
        throw new Error(`Invalid source: ${source}. Must be 'hardcoded', 'gcs', or 'text'`)
    }

    // Parse concepts from content
    const concepts = parseConceptsFromMarkdown(content)
    
    if (concepts.length === 0) {
      throw new Error('No concepts found in the provided content')
    }

    // Fetch existing concepts for duplicate check if enabled
    let existingConcepts: Array<{id: string, name: string, status: string}> = [];
    if (duplicateCheck) {
      const { data: existing, error: existingError } = await supabaseClient
        .from('concepts')
        .select('id, name, status')
        .eq('domain_id', domainId);

      if (existingError) {
        console.error('Error fetching existing concepts:', existingError);
        throw new Error('Failed to fetch existing concepts for duplicate check');
      }

      existingConcepts = existing || [];
      console.log(`Found ${existingConcepts.length} existing concepts for duplicate check`);
    }

    // Insert concepts into database in order (parents first)
    const insertedConcepts: Array<{ temp_id: string; actual_id: string }> = []
    const skippedDuplicates: Array<{ name: string; reason: string; similarTo?: string }> = []
    
    for (let i = 0; i < concepts.length; i++) {
      const concept = concepts[i]
      
      // Check for duplicates if enabled
      if (duplicateCheck) {
        const duplicateCheckResult = await checkForDuplicateConcepts(
          concept.name,
          domainId,
          existingConcepts,
          ['rejected'], // Exclude rejected concepts from duplicate check
          0.85 // 85% similarity threshold
        );

        if (duplicateCheckResult.isDuplicate) {
          console.log(`Skipping duplicate concept: "${concept.name}"`);
          if (duplicateCheckResult.exactMatch) {
            skippedDuplicates.push({
              name: concept.name,
              reason: 'Exact match',
              similarTo: duplicateCheckResult.exactMatch
            });
          } else if (duplicateCheckResult.similarMatches && duplicateCheckResult.similarMatches.length > 0) {
            skippedDuplicates.push({
              name: concept.name,
              reason: `Similar to existing concept (${Math.round(duplicateCheckResult.similarMatches[0].similarity * 100)}% match)`,
              similarTo: duplicateCheckResult.similarMatches[0].name
            });
          }
          continue; // Skip this concept
        }
      }
      
      // Resolve parent ID if it exists
      let actualParentId: string | undefined
      if (concept.parent_concept_id) {
        const parentMapping = insertedConcepts.find(c => c.temp_id === concept.parent_concept_id)
        actualParentId = parentMapping?.actual_id
      }

      // Insert the concept
      const { data: insertedConcept, error } = await supabaseClient
        .from('concepts')
        .insert({
          name: concept.name,
          description: concept.description,
          domain_id: domainId,
          parent_concept_id: actualParentId,
          status: status,
          display_order: i,
          difficulty_level: concept.level,
          generation_source: source === 'hardcoded' || source === 'gcs' ? 'import' : 'ai',
          source: source === 'hardcoded' || source === 'gcs' ? 'import' : 'ai',
          source_file_id: fileId,
          metadata: { 
            import_source: source,
            import_timestamp: new Date().toISOString(),
            original_level: concept.level
          }
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error inserting concept:', error)
        throw new Error(`Failed to insert concept: ${concept.name} - ${error.message}`)
      }

      // Track the mapping between temp ID and actual ID
      insertedConcepts.push({
        temp_id: `temp_${i}`,
        actual_id: insertedConcept.id
      })

      console.log(`Inserted concept: "${concept.name}" with ID: ${insertedConcept.id}`)
    }

    const insertedCount = insertedConcepts.length;
    const skippedCount = skippedDuplicates.length;

    console.log(`Import completed: ${insertedCount} concepts inserted, ${skippedCount} duplicates skipped`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        conceptsInserted: insertedCount,
        duplicatesSkipped: skippedCount,
        skippedDetails: skippedDuplicates,
        source: source,
        duplicateCheck: duplicateCheck,
        message: `Successfully imported ${insertedCount} concepts from ${source} source. ${skippedCount > 0 ? `Skipped ${skippedCount} duplicates.` : ''}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in unified concept import:', error)
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