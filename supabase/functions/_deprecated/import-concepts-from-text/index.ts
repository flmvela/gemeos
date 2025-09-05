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

// Sample master concept list for jazz
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
  - Chromatic Approach Tones: Using leading tones to create tension

## **IV. Ear Training**
- **Interval Recognition**: Identifying intervals by ear
  - Perfect and Imperfect Intervals: Training on all interval types
  - Compound Intervals: Recognizing intervals larger than an octave
- **Chord Quality Recognition**: Distinguishing between chord types
  - Triads and Seventh Chords: Basic chord quality identification
  - Extended Chords: Recognizing 9th, 11th, and 13th chords
- **Harmonic Progressions**: Hearing common chord movements
  - ii-V-I Progressions: The fundamental jazz progression
  - Circle of Fifths Movement: Root movement by descending fifths

## **V. Re-harmonization**
- **Chord Substitution**: Replacing chords while maintaining function
  - Relative Minor/Major: Using relative chords for color
  - Diminished Substitution: Using diminished chords as passing harmony
- **Voice Leading**: Smooth movement between chord voices
  - Common Tones: Maintaining notes between chords
  - Step-wise Motion: Moving voices by the smallest intervals
- **Modal Reharmonization**: Using modes to create new harmonic colors
  - Dorian and Mixolydian: Common modal applications
  - Lydian and Phrygian: More exotic modal colors

## **VI. Performance Contexts**
- **Small Ensemble Playing**: Interaction in combo settings
  - Comping Techniques: Accompaniment styles for different instruments
  - Trading Solos: Taking turns improvising in sections
- **Big Band Arranging**: Writing for larger ensembles
  - Section Writing: Arranging for saxophone, trumpet, and trombone sections
  - Ensemble Rhythms: Creating rhythmic figures for the whole band
- **Stylistic Interpretation**: Understanding different jazz styles
  - Bebop Era: Fast tempos and complex harmony
  - Cool Jazz: Relaxed tempos and sophisticated arrangements
  - Fusion Elements: Incorporating electric instruments and rock rhythms`;

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

    // Get the domain ID from the request
    const { domainId } = await req.json()

    if (!domainId) {
      throw new Error('Domain ID is required')
    }

    console.log(`Starting import for domain: ${domainId}`)

    // Use the hardcoded content for now
    const fileContent = JAZZ_MASTER_CONCEPTS
    console.log('Using hardcoded content, parsing...')

    // Parse the markdown content
    const lines = fileContent.split('\n')
    const concepts: ConceptData[] = []
    
    // Track parent concepts at each level
    let currentLevel0Parent: string | undefined = undefined
    let currentLevel1Parent: string | undefined = undefined

    console.log(`Processing ${lines.length} lines`)

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Skip empty lines
      if (!line.trim()) continue

      console.log(`Line ${i}: "${line}"`)

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
        console.log(`Added level 0 concept: "${name.trim()}" with temp ID: ${currentLevel0Parent}`)
        continue
      }

      // Level 1 (Child Concepts): Lines starting with "- " (no preceding spaces)
      if (line.match(/^- \*\*.+$/)) {
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
        console.log(`Added level 1 concept: "${name.trim()}" with parent: ${currentLevel0Parent}`)
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
        console.log(`Added level 2 concept: "${name.trim()}" with parent: ${currentLevel1Parent}`)
        continue
      }
    }

    console.log(`Parsed ${concepts.length} concepts`)
    concepts.forEach((concept, index) => {
      console.log(`${index}: "${concept.name}" (level ${concept.level}, parent: ${concept.parent_concept_id})`)
    })

    // Insert concepts into database in order (parents first)
    const insertedConcepts: Array<{ temp_id: string; actual_id: string }> = []
    
    for (let i = 0; i < concepts.length; i++) {
      const concept = concepts[i]
      
      // Resolve parent ID if it exists
      let actualParentId: string | undefined
      if (concept.parent_concept_id) {
        const parentMapping = insertedConcepts.find(c => c.temp_id === concept.parent_concept_id)
        actualParentId = parentMapping?.actual_id
        console.log(`Resolving parent for "${concept.name}": ${concept.parent_concept_id} -> ${actualParentId}`)
      }

      // Check for duplicates before inserting (basic check)
      const { data: existingConcept, error: checkError } = await supabaseClient
        .from('concepts')
        .select('id, name')
        .eq('domain_id', domainId)
        .eq('name', concept.name)
        .single();

      if (existingConcept && !checkError) {
        console.log(`Skipping duplicate concept: "${concept.name}"`);
        // Track as if inserted for parent resolution
        insertedConcepts.push({
          temp_id: `temp_${i}`,
          actual_id: existingConcept.id
        });
        continue;
      }

      // Insert the concept
      const { data: insertedConcept, error } = await supabaseClient
        .from('concepts')
        .insert({
          name: concept.name,
          description: concept.description,
          domain_id: domainId,
          parent_concept_id: actualParentId,
          status: 'approved',
          display_order: i
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

      console.log(`Inserted "${concept.name}" with ID: ${insertedConcept.id}`)
    }

    console.log(`Successfully imported ${concepts.length} concepts`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        conceptCount: concepts.length,
        message: `Successfully imported ${concepts.length} concepts with hierarchy`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error importing concepts:', error)
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