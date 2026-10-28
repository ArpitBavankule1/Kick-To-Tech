/**
 * Supabase Edge Function: generate-quiz
 *
 * RULES ENFORCED:
 * 5. Gemini key lives ONLY in Edge Function secrets (Deno.env.get('GEMINI_API_KEY')).
 *    Never in the client or git.
 * 8. Gemini output is untrusted: validate schema and answer keys; teacher must publish.
 * 9. Say "adaptive and data-driven". AI is used only for quiz generation.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface QuizGenerationRequest {
  topicName: string;
  concept: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  count?: number;
}

interface RawGeneratedQuestion {
  concept: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Rule 5: Read exclusively from Edge Function secret
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'Edge Function secret GEMINI_API_KEY is not configured.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: QuizGenerationRequest = await req.json();

    // Call Gemini API server-side
    const prompt = `You are a computer science question author. Generate a verified multiple choice question about "${body.topicName}" focusing on concept "${body.concept}". Difficulty: ${body.difficulty || 'medium'}.
Output MUST be strict JSON in the following format:
{
  "concept": "Name of concept",
  "question": "Question text",
  "codeSnippet": "Optional code or null",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Detailed pedagogical explanation of why this answer is correct and why other choices are traps",
  "difficulty": "${body.difficulty || 'medium'}"
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed: RawGeneratedQuestion = JSON.parse(rawText);

    // Rule 8: Gemini output is UNTRUSTED. Validate schema and bounds strictly:
    if (
      !parsed.question ||
      !Array.isArray(parsed.options) ||
      parsed.options.length !== 4 ||
      typeof parsed.correctAnswer !== 'number' ||
      parsed.correctAnswer < 0 ||
      parsed.correctAnswer > 3 ||
      !parsed.explanation
    ) {
      throw new Error('Gemini output failed structural schema validation.');
    }

    // Return sanitized draft question (teacher must review & publish)
    return new Response(
      JSON.stringify({
        question: {
          ...parsed,
          status: 'draft', // Rule 8: Teacher must publish
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown generation error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
