import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client to verify JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and check if user is admin
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const userRole = user.app_metadata?.role;
    if (userRole !== 'admin') {
      console.error('Insufficient permissions. User role:', userRole);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { domain_id, domain_slug } = await req.json();
    
    if (!domain_id || !domain_slug) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: domain_id and domain_slug' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Triggering concept structuring for domain: ${domain_slug} (${domain_id})`);

    // Get all concepts for this domain
    const { data: concepts, error: conceptsError } = await supabase
      .from('concepts')
      .select('*')
      .eq('domain_id', domain_id)
      .in('status', ['suggested', 'approved']);

    if (conceptsError) {
      console.error('Error fetching concepts:', conceptsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch concepts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${concepts.length} concepts to structure`);

    // Simple AI structuring logic - group related concepts
    const structuredConcepts = await performSimpleStructuring(concepts, supabase);

    console.log(`Structured ${structuredConcepts.length} concept relationships`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Concept structuring completed successfully',
        conceptsProcessed: concepts.length,
        relationshipsCreated: structuredConcepts.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in trigger-concept-structuring function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Simple concept structuring logic
async function performSimpleStructuring(concepts: any[], supabase: any) {
  const updates = [];
  
  // Define some basic music theory hierarchies for jazz domain
  const musicHierarchies = {
    // Foundational concepts that should be parents
    'harmony': ['non-chord tones', 'upper extensions'],
    'scales': ['C Major scale', 'modes'],
    'technique': ['two-handed coordination', 'arpeggios'],
    'improvisation': ['jazz vocabulary', 'Drone Improvisation', 'Controlled Improvisation Exercises'],
    'jazz piano': ['Licks', 'jazz vocabulary'],
    'rhythm': ['flow'],
    // Exercise types under broader categories
    'Licks': ['ii-V-I Exercises'],
    'Written Exercises': ['musical grammar'],
    'Practicing Tunes': ['Guided Listening Assignments'],
  };

  // Find concepts and create parent-child relationships
  for (const [parentName, childNames] of Object.entries(musicHierarchies)) {
    const parentConcept = concepts.find(c => 
      c.name.toLowerCase() === parentName.toLowerCase()
    );
    
    if (parentConcept) {
      for (const childName of childNames) {
        const childConcept = concepts.find(c => 
          c.name.toLowerCase() === childName.toLowerCase() &&
          !c.parent_concept_id // Only update if not already has a parent
        );
        
        if (childConcept) {
          console.log(`Setting ${childConcept.name} as child of ${parentConcept.name}`);
          
          // Only update parent_concept_id, preserve existing status
          const { error: updateError } = await supabase
            .from('concepts')
            .update({ 
              parent_concept_id: parentConcept.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', childConcept.id);
          
          if (updateError) {
            console.error(`Error updating concept ${childConcept.name}:`, updateError);
          } else {
            updates.push({ parent: parentConcept.name, child: childConcept.name });
          }
        }
      }
    }
  }

  return updates;
}