import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log(`Clearing existing concepts for domain: ${domainId}`)

    // Delete existing concepts for this domain
    const { error: deleteError } = await supabaseClient
      .from('concepts')
      .delete()
      .eq('domain_id', domainId)

    if (deleteError) {
      throw new Error(`Failed to clear existing concepts: ${deleteError.message}`)
    }

    console.log('Existing concepts cleared, now calling import function...')

    // Call the new import function that doesn't require GCS access
    const { data: importData, error: importError } = await supabaseClient.functions.invoke('import-concepts-from-text', {
      body: { domainId }
    })

    if (importError) {
      throw new Error(`Import failed: ${importError.message}`)
    }

    console.log('Import completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Concepts cleared and re-imported successfully',
        importResult: importData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in clear and reimport:', error)
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