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

    // Get the Google Cloud Storage service account
    const gcsServiceAccount = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT')
    if (!gcsServiceAccount) {
      throw new Error('Google Cloud Storage service account not configured')
    }

    const credentials = JSON.parse(gcsServiceAccount)
    
    // Download the master concept list from GCS
    const bucketName = 'gemeos-guidance'
    const filePath = `${domainId}/guidance/concepts/master_concept_list.md`
    
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
        throw new Error('Master concept list file not found. Please upload the file first.')
      }
      throw new Error(`Failed to download file: ${fileResponse.statusText}`)
    }

    const fileContent = await fileResponse.text()
    console.log('File downloaded successfully, parsing content...')
    console.log('File content preview:', fileContent.substring(0, 500))

    // Parse the markdown content and build concepts with indentation-based levels
    const lines = fileContent.split('\n')
    console.log(`Total lines in file: ${lines.length}`)
    console.log('First 10 lines:', lines.slice(0, 10))
    const concepts: ConceptData[] = []
    
    // Use a dynamic parent stack to support arbitrary nesting
    // parentStack[level] holds the temp id (e.g., temp_#) of the most recent node at that level
    const parentStack: (string | undefined)[] = []

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i]
      
      // Skip empty lines
      if (!rawLine.trim()) continue

      // Normalize tabs to 2 spaces just in case
      const line = rawLine.replace(/\t/g, '  ')

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
          parent_concept_id: undefined,
        })

        // Update parent stack for level 0 and truncate deeper levels
        parentStack[0] = `temp_${concepts.length - 1}`
        parentStack.length = 1
        continue
      }

      // Bullet list items: capture indentation-based levels
      const bulletMatch = line.match(/^(\s*)-\s+(.+)$/)
      if (bulletMatch) {
        const leadingSpaces = bulletMatch[1] || ''
        let content = bulletMatch[2].trim()

        // Compute level: 1 for no leading spaces, then +1 for each 2 spaces
        const indentUnits = Math.floor(leadingSpaces.length / 2)
        const level = 1 + indentUnits

        // Clean markdown formatting
        content = content.replace(/\*\*(.*?)\*\*/g, '$1')
        const [name, ...descParts] = content.split(':')
        const description = descParts.length > 0 ? descParts.join(':').trim() : undefined

        // Determine parent temp id from stack (level-1)
        const parentTempId = level > 0 ? parentStack[level - 1] : undefined

        concepts.push({
          name: name.trim(),
          description,
          level,
          parent_concept_id: parentTempId,
        })

        // Update stack for this level and truncate deeper levels
        parentStack[level] = `temp_${concepts.length - 1}`
        parentStack.length = level + 1
        continue
      }

      // Non-matching lines are ignored
    }

    console.log(`Parsed ${concepts.length} concepts:`)
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
          display_order: i,
          difficulty_level: concept.level,
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

    }

    console.log(`Successfully imported ${concepts.length} concepts`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        conceptCount: concepts.length,
        message: `Successfully imported ${concepts.length} concepts`
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