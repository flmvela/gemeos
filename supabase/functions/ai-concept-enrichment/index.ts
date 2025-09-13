import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openAIKey = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ConceptEnrichmentRequest {
  concepts: Array<{
    id?: string;
    name: string;
    description?: string;
    difficulty_level?: number;
    domain_id?: string;
  }>;
  domainId: string;
  tenantId: string;
  userId: string;
  options: {
    refineTitle: boolean;
    refineDescription: boolean;
    generateRelationships: boolean;
    assignDifficulty: boolean;
    completeList: boolean;
    generateHierarchy: boolean;
  };
}

async function enrichConcepts(request: ConceptEnrichmentRequest) {
  const { concepts, domainId, options } = request;
  
  // Create processing job
  const { data: job, error: jobError } = await supabase
    .from("ai_processing_jobs")
    .insert({
      request_type: "concept",
      source_type: "manual_entry",
      processing_options: options,
      requested_by: request.userId,
      tenant_id: request.tenantId,
      domain_id: domainId,
      status: "processing",
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (jobError) throw jobError;
  
  try {
    const enrichedConcepts = [];
    const relationships = [];
    
    // Process each concept
    for (const concept of concepts) {
      let enriched = { ...concept };
      
      // Refine title
      if (options.refineTitle && concept.name) {
        const refinedTitle = await refineTitle(concept.name);
        enriched.name = refinedTitle.refined;
        enriched.titleReasoning = refinedTitle.reasoning;
      }
      
      // Refine description
      if (options.refineDescription) {
        const refinedDesc = await refineDescription(
          concept.description || "",
          enriched.name
        );
        enriched.description = refinedDesc.refined;
        enriched.descriptionReasoning = refinedDesc.reasoning;
      }
      
      // Assign difficulty level
      if (options.assignDifficulty && !concept.difficulty_level) {
        const difficulty = await assignDifficulty(enriched);
        enriched.difficulty_level = difficulty.level;
        enriched.difficultyReasoning = difficulty.reasoning;
      }
      
      enrichedConcepts.push(enriched);
    }
    
    // Generate relationships between concepts
    if (options.generateRelationships && enrichedConcepts.length > 1) {
      const generatedRelationships = await generateRelationships(enrichedConcepts);
      relationships.push(...generatedRelationships);
    }
    
    // Generate hierarchy
    if (options.generateHierarchy) {
      const hierarchy = await generateHierarchy(enrichedConcepts);
      enrichedConcepts.forEach(concept => {
        const node = hierarchy.find(h => h.conceptName === concept.name);
        if (node) {
          concept.parent_id = node.parentId;
          concept.hierarchy_level = node.level;
        }
      });
    }
    
    // Complete list with additional concepts
    let additionalConcepts = [];
    if (options.completeList) {
      additionalConcepts = await suggestAdditionalConcepts(
        enrichedConcepts,
        domainId
      );
    }
    
    // Store all suggestions
    const suggestions = [];
    
    // Store enriched existing concepts
    for (const enriched of enrichedConcepts) {
      const original = concepts.find(c => c.name === enriched.name);
      suggestions.push({
        job_id: job.id,
        content_type: "concept",
        source_content_id: enriched.id,
        suggestion_type: enriched.id ? "refinement" : "enrichment",
        original_content: original,
        suggested_content: enriched,
        confidence_score: calculateConfidence(enriched, original),
        ai_reasoning: combineReasoning(enriched),
        review_status: "pending",
      });
    }
    
    // Store additional suggested concepts
    for (const additional of additionalConcepts) {
      suggestions.push({
        job_id: job.id,
        content_type: "concept",
        suggestion_type: "completion",
        suggested_content: additional,
        confidence_score: 0.8,
        ai_reasoning: additional.reasoning,
        review_status: "pending",
      });
    }
    
    // Insert suggestions
    const { error: suggestionError } = await supabase
      .from("ai_suggestions")
      .insert(suggestions);
    
    if (suggestionError) throw suggestionError;
    
    // Store relationships
    if (relationships.length > 0) {
      const relationshipRecords = relationships.map(rel => ({
        suggestion_id: suggestions[0].id, // Link to first suggestion for now
        source_concept_id: rel.sourceId,
        target_concept_id: rel.targetId,
        relationship_type: rel.type,
        strength: rel.strength,
        confidence_score: rel.confidence,
        ai_reasoning: rel.reasoning,
        status: "suggested",
      }));
      
      const { error: relError } = await supabase
        .from("ai_concept_relationships")
        .insert(relationshipRecords);
      
      if (relError) console.error("Error storing relationships:", relError);
    }
    
    // Update job status
    await supabase
      .from("ai_processing_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        processed_items_count: enrichedConcepts.length + additionalConcepts.length,
      })
      .eq("id", job.id);
    
    return {
      jobId: job.id,
      enrichedCount: enrichedConcepts.length,
      additionalCount: additionalConcepts.length,
      relationshipsCount: relationships.length,
    };
    
  } catch (error) {
    // Update job status to failed
    await supabase
      .from("ai_processing_jobs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: error.message,
      })
      .eq("id", job.id);
    
    throw error;
  }
}

// AI Processing Functions

async function refineTitle(title: string) {
  const prompt = `As an educational content expert, refine this concept title:
    
    Current: "${title}"
    
    Guidelines:
    - Clear and specific (3-8 words ideal)
    - Academic but accessible
    - Avoid unnecessary jargon
    - Maintain core meaning
    
    Provide JSON: { "refined": "...", "reasoning": "..." }`;
  
  const response = await callOpenAI(prompt);
  return JSON.parse(response);
}

async function refineDescription(description: string, title: string) {
  const prompt = `Refine this educational concept description:
    
    Concept: "${title}"
    Current Description: "${description}"
    
    Guidelines:
    - Clear learning objectives
    - 2-4 comprehensive sentences
    - Balance detail and clarity
    - Engaging and informative
    
    Provide JSON: { "refined": "...", "reasoning": "..." }`;
  
  const response = await callOpenAI(prompt);
  return JSON.parse(response);
}

async function assignDifficulty(concept: any) {
  const prompt = `Analyze this concept and assign a difficulty level:
    
    Concept: "${concept.name}"
    Description: "${concept.description}"
    
    Scale:
    1-2: Beginner (foundational concepts)
    3-4: Elementary (building on basics)
    5-6: Intermediate (developing competency)
    7-8: Advanced (complex applications)
    9-10: Expert (specialist knowledge)
    
    Consider:
    - Prerequisite knowledge required
    - Cognitive complexity
    - Abstraction level
    - Practical application difficulty
    
    Provide JSON: { "level": number, "reasoning": "..." }`;
  
  const response = await callOpenAI(prompt);
  return JSON.parse(response);
}

async function generateRelationships(concepts: any[]) {
  const prompt = `Analyze relationships between these educational concepts:
    
    Concepts:
    ${concepts.map((c, i) => `${i}. "${c.name}": ${c.description}`).join("\n")}
    
    Identify relationships:
    - prerequisite_of: Concept A must be learned before B
    - built_upon: Concept A extends/builds on B
    - related_to: Conceptually connected
    - part_of: A is a sub-concept of B
    
    For each relationship provide:
    - sourceIndex, targetIndex
    - type (from above)
    - strength (0.0-1.0)
    - confidence (0.0-1.0)
    - reasoning
    
    Return as JSON array.`;
  
  const response = await callOpenAI(prompt);
  const relationships = JSON.parse(response);
  
  return relationships.map((rel: any) => ({
    sourceId: concepts[rel.sourceIndex]?.id,
    targetId: concepts[rel.targetIndex]?.id,
    type: rel.type,
    strength: rel.strength,
    confidence: rel.confidence,
    reasoning: rel.reasoning,
  }));
}

async function generateHierarchy(concepts: any[]) {
  const prompt = `Create a hierarchical structure for these concepts:
    
    Concepts:
    ${concepts.map(c => `- "${c.name}": ${c.description} (Level ${c.difficulty_level || "?"})`).join("\n")}
    
    Organize into:
    - Parent-child relationships
    - Hierarchy levels (1=top, 2=sub, 3=detail)
    - Logical groupings
    
    Return JSON array with:
    - conceptName
    - parentName (null for top-level)
    - level (1-3)
    - reasoning
    `;
  
  const response = await callOpenAI(prompt);
  return JSON.parse(response);
}

async function suggestAdditionalConcepts(existing: any[], domainId: string) {
  // Get domain information for context
  const { data: domain } = await supabase
    .from("domains")
    .select("name, description")
    .eq("id", domainId)
    .single();
  
  const prompt = `Suggest 2-3 additional concepts to complete this curriculum:
    
    Domain: ${domain?.name || "Unknown"}
    Existing Concepts:
    ${existing.map(c => `- ${c.name}: ${c.description} (Level ${c.difficulty_level})`).join("\n")}
    
    Identify gaps and suggest concepts that:
    - Fill knowledge gaps
    - Provide smooth progression
    - Bridge between existing concepts
    - Round out the curriculum
    
    For each suggestion provide:
    - name, description
    - difficulty_level (consistent with existing)
    - reasoning for inclusion
    - how it fits with existing concepts
    
    Return as JSON array.`;
  
  const response = await callOpenAI(prompt);
  return JSON.parse(response);
}

// Utility Functions

async function callOpenAI(prompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openAIKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content designer. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

function calculateConfidence(enriched: any, original: any): number {
  let confidence = 0.5; // Base confidence
  
  // Increase based on completeness
  if (enriched.name) confidence += 0.1;
  if (enriched.description) confidence += 0.1;
  if (enriched.difficulty_level) confidence += 0.1;
  
  // Increase if refinements were minimal
  if (original) {
    if (enriched.name === original.name) confidence += 0.05;
    if (enriched.description === original.description) confidence += 0.05;
  }
  
  // Cap at 0.95
  return Math.min(confidence + 0.1, 0.95);
}

function combineReasoning(concept: any): string {
  const reasons = [];
  
  if (concept.titleReasoning) {
    reasons.push(`Title: ${concept.titleReasoning}`);
  }
  if (concept.descriptionReasoning) {
    reasons.push(`Description: ${concept.descriptionReasoning}`);
  }
  if (concept.difficultyReasoning) {
    reasons.push(`Difficulty: ${concept.difficultyReasoning}`);
  }
  
  return reasons.join(" | ") || "AI enrichment applied";
}

// Main handler
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const request: ConceptEnrichmentRequest = await req.json();
    
    // Validate request
    if (!request.concepts || !request.domainId || !request.userId) {
      throw new Error("Missing required fields");
    }
    
    const result = await enrichConcepts(request);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});