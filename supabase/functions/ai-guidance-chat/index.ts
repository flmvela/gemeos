import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: Message[];
  currentContent: string;
  areaTitle: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentContent, areaTitle }: ChatRequest = await req.json();

    console.log('AI Guidance Chat request:', { 
      messagesCount: messages.length, 
      areaTitle,
      hasCurrentContent: !!currentContent 
    });

    // Build the conversation context
    const systemPrompt = `You are an AI assistant helping educators create high-quality guidance content for the "${areaTitle}" area of a learning domain. 

Current content being worked on:
"""
${currentContent || 'No content yet - starting from scratch.'}
"""

Your role is to:
1. Help improve and refine the guidance content
2. Suggest better structure, clarity, and completeness
3. Provide specific examples and recommendations
4. When requested, provide updated versions of the content

Guidelines for ${areaTitle} guidance:
- Be specific and actionable for educators
- Include concrete examples where helpful
- Maintain a clear, professional tone
- Focus on practical implementation
- Structure content logically with headings and sections

When providing updated content, format it properly with markdown and include it at the end of your response preceded by "SUGGESTED_CONTENT:" on its own line.`;

    const openAIMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10) // Keep last 10 messages for context
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openAIMessages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message.content;

    console.log('OpenAI response received, length:', assistantResponse.length);

    // Check if the response contains suggested content
    let suggestedContent = null;
    let responseContent = assistantResponse;

    const contentMarker = 'SUGGESTED_CONTENT:';
    const contentIndex = assistantResponse.indexOf(contentMarker);
    
    if (contentIndex !== -1) {
      responseContent = assistantResponse.substring(0, contentIndex).trim();
      suggestedContent = assistantResponse.substring(contentIndex + contentMarker.length).trim();
      console.log('Extracted suggested content, length:', suggestedContent.length);
    }

    return new Response(JSON.stringify({ 
      response: responseContent,
      suggestedContent: suggestedContent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-guidance-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: 'I apologize, but I encountered an error. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});