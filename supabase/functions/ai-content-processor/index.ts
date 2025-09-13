import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openAIKey = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ProcessingRequest {
  jobId: string;
  requestType: "concept" | "learning_goal" | "exercise";
  sourceType: "file_upload" | "manual_entry" | "concept_selection";
  processingOptions: {
    refineTitle?: boolean;
    refineDescription?: boolean;
    completeList?: boolean;
    generateRelationships?: boolean;
    assignDifficulty?: boolean;
    generateBloomLevel?: boolean;
    createSequence?: boolean;
    fromConcepts?: string[];
  };
  content?: any;
  fileUrl?: string;
  domainId?: string;
  tenantId?: string;
  userId: string;
}

// Main processing pipeline
async function processContent(request: ProcessingRequest) {
  const { jobId } = request;
  
  try {
    // Update job status to processing
    await updateJobStatus(jobId, "processing");
    
    // Process based on content type
    let results;
    switch (request.requestType) {
      case "concept":
        results = await processConceptContent(request);
        break;
      case "learning_goal":
        results = await processLearningGoalContent(request);
        break;
      case "exercise":
        results = await processExerciseContent(request);
        break;
      default:
        throw new Error(`Unsupported request type: ${request.requestType}`);
    }
    
    // Store suggestions in database
    await storeSuggestions(jobId, results);
    
    // Update job status to completed
    await updateJobStatus(jobId, "completed", {
      processedItemsCount: results.length,
    });
    
    return { success: true, suggestionsCount: results.length };
  } catch (error: any) {
    console.error("Processing error:", error);
    await updateJobStatus(jobId, "failed", { errorMessage: error.message });
    throw error;
  }
}

// Process concept content
async function processConceptContent(request: ProcessingRequest) {
  const { content, processingOptions } = request;
  const suggestions = [];
  
  // Parse content (could be from file or manual entry)
  const concepts = Array.isArray(content) ? content : [content];
  
  for (const concept of concepts) {
    const processedConcept: any = { ...concept };
    
    // Refine title if requested
    if (processingOptions.refineTitle) {
      const refinedTitle = await refineConceptTitle(concept.name || concept.title);
      processedConcept.name = refinedTitle.suggestion;
      processedConcept.titleRefinementReasoning = refinedTitle.reasoning;
    }
    
    // Refine description if requested
    if (processingOptions.refineDescription) {
      const refinedDesc = await refineConceptDescription(
        concept.description,
        processedConcept.name
      );
      processedConcept.description = refinedDesc.suggestion;
      processedConcept.descriptionRefinementReasoning = refinedDesc.reasoning;
    }
    
    // Assign difficulty level if requested
    if (processingOptions.assignDifficulty) {
      const difficulty = await assignDifficultyLevel(processedConcept);
      processedConcept.difficulty_level = difficulty.level;
      processedConcept.difficultyReasoning = difficulty.reasoning;
    }
    
    // Generate relationships if requested
    if (processingOptions.generateRelationships) {
      const relationships = await generateConceptRelationships(
        processedConcept,
        concepts
      );
      processedConcept.relationships = relationships;
    }
    
    suggestions.push({
      originalContent: concept,
      suggestedContent: processedConcept,
      suggestionType: concept.id ? "refinement" : "new",
      confidenceScore: calculateConfidence(processedConcept),
    });
  }
  
  // Complete list with additional concepts if requested
  if (processingOptions.completeList) {
    const additionalConcepts = await generateAdditionalConcepts(concepts);
    for (const newConcept of additionalConcepts) {
      suggestions.push({
        originalContent: null,
        suggestedContent: newConcept,
        suggestionType: "completion",
        confidenceScore: calculateConfidence(newConcept),
      });
    }
  }
  
  return suggestions;
}

// Process learning goal content
async function processLearningGoalContent(request: ProcessingRequest) {
  const { content, processingOptions } = request;
  const suggestions = [];
  
  // Handle generation from concepts
  if (processingOptions.fromConcepts && processingOptions.fromConcepts.length > 0) {
    const goals = await generateLearningGoalsFromConcepts(
      processingOptions.fromConcepts,
      request.domainId!
    );
    
    for (const goal of goals) {
      suggestions.push({
        originalContent: null,
        suggestedContent: goal,
        suggestionType: "new",
        confidenceScore: calculateConfidence(goal),
      });
    }
  } else {
    // Process uploaded learning goals
    const goals = Array.isArray(content) ? content : [content];
    
    for (const goal of goals) {
      const processedGoal: any = { ...goal };
      
      // Refine title if requested
      if (processingOptions.refineTitle) {
        const refinedTitle = await refineLearningGoalTitle(goal.title);
        processedGoal.title = refinedTitle.suggestion;
        processedGoal.titleRefinementReasoning = refinedTitle.reasoning;
      }
      
      // Refine description if requested
      if (processingOptions.refineDescription) {
        const refinedDesc = await refineLearningGoalDescription(
          goal.description,
          processedGoal.title
        );
        processedGoal.description = refinedDesc.suggestion;
        processedGoal.descriptionRefinementReasoning = refinedDesc.reasoning;
      }
      
      // Generate Bloom's taxonomy level
      if (processingOptions.generateBloomLevel) {
        const bloomAnalysis = await analyzeBloomLevel(processedGoal);
        processedGoal.bloom_level = bloomAnalysis.level;
        processedGoal.bloom_verbs = bloomAnalysis.verbs;
        processedGoal.cognitive_complexity = bloomAnalysis.complexity;
        processedGoal.bloomReasoning = bloomAnalysis.reasoning;
      }
      
      suggestions.push({
        originalContent: goal,
        suggestedContent: processedGoal,
        suggestionType: goal.id ? "refinement" : "new",
        confidenceScore: calculateConfidence(processedGoal),
      });
    }
  }
  
  // Create sequence if requested
  if (processingOptions.createSequence && suggestions.length > 1) {
    const sequence = await createLearningGoalSequence(
      suggestions.map(s => s.suggestedContent)
    );
    
    // Add sequence information to each goal
    suggestions.forEach((suggestion, index) => {
      const seqInfo = sequence.find(s => s.goalId === index);
      if (seqInfo) {
        suggestion.suggestedContent.sequence_order = seqInfo.order;
        suggestion.suggestedContent.prerequisites = seqInfo.prerequisites;
        suggestion.suggestedContent.relationships = seqInfo.relationships;
      }
    });
  }
  
  return suggestions;
}

// Process exercise content (placeholder for future implementation)
async function processExerciseContent(request: ProcessingRequest) {
  throw new Error("Exercise processing not yet implemented");
}

// AI Helper Functions

async function refineConceptTitle(title: string) {
  const prompt = `Refine this learning concept title to be clear, concise, and educational:
    Current title: "${title}"
    
    Requirements:
    - Clear and specific
    - Educational context appropriate
    - 3-8 words ideal length
    - Avoid jargon unless necessary
    
    Provide the refined title and brief reasoning.`;
  
  const response = await callOpenAI(prompt);
  return parseAIResponse(response);
}

async function refineConceptDescription(description: string, title: string) {
  const prompt = `Refine this concept description to be comprehensive and clear:
    Concept: "${title}"
    Current description: "${description}"
    
    Requirements:
    - Clear learning objectives
    - Appropriate detail level
    - Engaging and informative
    - 2-4 sentences ideal
    
    Provide the refined description and brief reasoning.`;
  
  const response = await callOpenAI(prompt);
  return parseAIResponse(response);
}

async function assignDifficultyLevel(concept: any) {
  const prompt = `Analyze this educational concept and assign a difficulty level (1-10):
    Concept: "${concept.name}"
    Description: "${concept.description}"
    
    Scale:
    1-2: Beginner (foundational)
    3-4: Elementary (building basics)
    5-6: Intermediate (developing competency)
    7-8: Advanced (complex applications)
    9-10: Expert (specialist level)
    
    Provide the level number and reasoning.`;
  
  const response = await callOpenAI(prompt);
  const parsed = parseAIResponse(response);
  return {
    level: parseInt(parsed.suggestion),
    reasoning: parsed.reasoning,
  };
}

async function generateConceptRelationships(concept: any, allConcepts: any[]) {
  const prompt = `Analyze relationships between this concept and others:
    Main concept: "${concept.name}" - ${concept.description}
    
    Other concepts: ${allConcepts
      .filter(c => c.name !== concept.name)
      .map(c => `"${c.name}"`)
      .join(", ")}
    
    Identify relationships:
    - prerequisite_of: This concept is required before learning another
    - built_upon: This concept builds on another
    - related_to: Conceptually related
    - part_of: This is a sub-concept of another
    
    Return relationships as JSON array.`;
  
  const response = await callOpenAI(prompt, true);
  return JSON.parse(response);
}

async function generateAdditionalConcepts(existingConcepts: any[]) {
  const prompt = `Given these educational concepts, suggest 2-3 additional related concepts that would complete the curriculum:
    
    Existing concepts:
    ${existingConcepts.map(c => `- ${c.name}: ${c.description}`).join("\n")}
    
    Generate new concepts that:
    - Fill gaps in the curriculum
    - Provide logical progression
    - Maintain consistent difficulty range
    
    Return as JSON array with name, description, and difficulty_level.`;
  
  const response = await callOpenAI(prompt, true);
  return JSON.parse(response);
}

async function refineLearningGoalTitle(title: string) {
  const prompt = `Refine this learning goal title using Bloom's taxonomy action verbs:
    Current title: "${title}"
    
    Requirements:
    - Start with an action verb
    - Be specific and measurable
    - Clear learning outcome
    - Appropriate cognitive level
    
    Provide refined title and reasoning.`;
  
  const response = await callOpenAI(prompt);
  return parseAIResponse(response);
}

async function refineLearningGoalDescription(description: string, title: string) {
  const prompt = `Refine this learning goal description to be clear and measurable:
    Goal: "${title}"
    Current description: "${description}"
    
    Requirements:
    - Specific learning outcomes
    - Measurable criteria
    - Clear success indicators
    - Appropriate scope
    
    Provide refined description and reasoning.`;
  
  const response = await callOpenAI(prompt);
  return parseAIResponse(response);
}

async function analyzeBloomLevel(goal: any) {
  const prompt = `Analyze this learning goal and classify according to Bloom's Taxonomy:
    Goal: "${goal.title}"
    Description: "${goal.description}"
    
    Bloom's Levels:
    1. Remember: Recall facts and basic concepts
    2. Understand: Explain ideas or concepts
    3. Apply: Use information in new situations
    4. Analyze: Draw connections among ideas
    5. Evaluate: Justify a stand or decision
    6. Create: Produce new or original work
    
    Identify:
    - Primary Bloom's level
    - Action verbs used
    - Cognitive complexity (1-10)
    
    Return as JSON.`;
  
  const response = await callOpenAI(prompt, true);
  const analysis = JSON.parse(response);
  
  return {
    level: analysis.level.toLowerCase(),
    verbs: analysis.verbs,
    complexity: analysis.complexity,
    reasoning: analysis.reasoning,
  };
}

async function generateLearningGoalsFromConcepts(conceptIds: string[], domainId: string) {
  // Fetch concept details
  const { data: concepts } = await supabase
    .from("concepts")
    .select("*")
    .in("id", conceptIds);
  
  if (!concepts || concepts.length === 0) {
    throw new Error("Concepts not found");
  }
  
  const prompt = `Generate comprehensive learning goals for these educational concepts:
    
    Concepts:
    ${concepts.map(c => `- ${c.name}: ${c.description} (Level ${c.difficulty_level})`).join("\n")}
    
    Generate 3-5 learning goals per concept that:
    - Cover different Bloom's taxonomy levels
    - Build progressive learning paths
    - Include measurable outcomes
    - Maintain appropriate difficulty
    
    Return as JSON array with: title, description, concept_id, bloom_level, prerequisites.`;
  
  const response = await callOpenAI(prompt, true);
  const goals = JSON.parse(response);
  
  // Map concept references
  return goals.map((goal: any) => ({
    ...goal,
    domain_id: domainId,
  }));
}

async function createLearningGoalSequence(goals: any[]) {
  const prompt = `Create an optimal learning sequence for these goals:
    
    Goals:
    ${goals.map((g, i) => `${i}. ${g.title} (${g.bloom_level})`).join("\n")}
    
    Consider:
    - Bloom's taxonomy progression
    - Prerequisite relationships
    - Parallel learning opportunities
    - Cognitive load balance
    
    Return sequence as JSON with: goalId, order, prerequisites[], relationships[].`;
  
  const response = await callOpenAI(prompt, true);
  return JSON.parse(response);
}

// OpenAI API call wrapper
async function callOpenAI(prompt: string, jsonMode = false): Promise<string> {
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
          content: jsonMode
            ? "You are an educational content expert. Always respond with valid JSON."
            : "You are an educational content expert helping to refine and generate learning materials.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: jsonMode ? { type: "json_object" } : undefined,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Parse AI response for suggestion and reasoning
function parseAIResponse(response: string): { suggestion: string; reasoning: string } {
  // Simple parsing - could be enhanced with more structured prompts
  const lines = response.split("\n").filter(l => l.trim());
  return {
    suggestion: lines[0] || response,
    reasoning: lines.slice(1).join(" ") || "AI generated suggestion",
  };
}

// Calculate confidence score based on various factors
function calculateConfidence(item: any): number {
  let confidence = 0.7; // Base confidence
  
  // Increase confidence for complete data
  if (item.name || item.title) confidence += 0.05;
  if (item.description) confidence += 0.05;
  if (item.difficulty_level) confidence += 0.05;
  if (item.bloom_level) confidence += 0.05;
  if (item.relationships || item.prerequisites) confidence += 0.1;
  
  return Math.min(confidence, 0.95);
}

// Database helper functions

async function updateJobStatus(
  jobId: string,
  status: string,
  additionalData?: any
) {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };
  
  if (status === "processing") {
    updateData.started_at = new Date().toISOString();
  } else if (status === "completed" || status === "failed") {
    updateData.completed_at = new Date().toISOString();
  }
  
  if (additionalData) {
    Object.assign(updateData, additionalData);
  }
  
  const { error } = await supabase
    .from("ai_processing_jobs")
    .update(updateData)
    .eq("id", jobId);
  
  if (error) {
    console.error("Error updating job status:", error);
    throw error;
  }
}

async function storeSuggestions(jobId: string, suggestions: any[]) {
  const records = suggestions.map(suggestion => ({
    job_id: jobId,
    content_type: getContentType(suggestion),
    suggestion_type: suggestion.suggestionType,
    suggested_content: suggestion.suggestedContent,
    original_content: suggestion.originalContent,
    confidence_score: suggestion.confidenceScore,
    ai_reasoning: suggestion.suggestedContent.titleRefinementReasoning ||
                   suggestion.suggestedContent.descriptionRefinementReasoning ||
                   suggestion.suggestedContent.difficultyReasoning ||
                   suggestion.suggestedContent.bloomReasoning ||
                   "AI generated content",
    review_status: "pending",
  }));
  
  const { error } = await supabase
    .from("ai_suggestions")
    .insert(records);
  
  if (error) {
    console.error("Error storing suggestions:", error);
    throw error;
  }
}

function getContentType(suggestion: any): string {
  if (suggestion.suggestedContent.bloom_level) {
    return "learning_goal";
  } else if (suggestion.suggestedContent.question || suggestion.suggestedContent.answer) {
    return "exercise";
  } else {
    return "concept";
  }
}

// Main server handler
serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const request: ProcessingRequest = await req.json();
    
    // Validate request
    if (!request.jobId || !request.requestType || !request.userId) {
      throw new Error("Missing required fields");
    }
    
    // Process content
    const result = await processContent(request);
    
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