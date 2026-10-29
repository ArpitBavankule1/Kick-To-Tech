/**
 * Supabase Edge Function: generate-quiz
 *
 * Requirements:
 * - Input: { subjectId, topicId, assignedDate }
 * - Verify caller is an active teacher of that subject.
 * - Reject if a published assignment already exists for that date.
 * - Call Gemini using secrets GEMINI_API_KEY and GEMINI_MODEL with structured JSON:
 *   5 questions (2 easy, 2 medium, 1 hard) for the topic, each with prompt,
 *   optional C-style code, 4 options, correct_index, explanation, wrong_reasons
 *   for each wrong option, subskill, difficulty.
 * - Validate with Zod (4 distinct options, index 0-3, wrong_reasons cover exactly
 *   the 3 wrong indexes, no duplicates). Retry once, then return friendly error.
 * - Save as draft and return it.
 * - Handle timeouts, quota errors, malformed JSON. Never log the key.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { validateAndNormalizeQuiz, type NormalizedQuiz } from "./validator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface GenerateQuizRequest {
  subjectId: string;
  topicId: string;
  assignedDate: string; // YYYY-MM-DD
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Read secrets
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-1.5-flash";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "Edge Function secret GEMINI_API_KEY is not configured.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({
          error: "Supabase service environment variables are missing.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse request input
    let body: GenerateQuizRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON request body." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subjectId, topicId, assignedDate } = body;
    if (!subjectId || !topicId || !assignedDate) {
      return new Response(
        JSON.stringify({
          error: "subjectId, topicId, and assignedDate are required parameters.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 4. Authenticate Caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired authorization token." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerId = authData.user.id;

    // 5. Verify caller is an active teacher of that subject
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id, role, status, full_name")
      .eq("id", callerId)
      .maybeSingle();

    if (profileErr || !profile || profile.role !== "teacher" || profile.status !== "active") {
      return new Response(
        JSON.stringify({
          error: "Forbidden: Caller must be an active, verified teacher.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: teacherSubject, error: tsErr } = await supabaseAdmin
      .from("teacher_subjects")
      .select("id")
      .eq("teacher_id", callerId)
      .eq("subject_id", subjectId)
      .maybeSingle();

    if (tsErr || !teacherSubject) {
      return new Response(
        JSON.stringify({
          error: "Forbidden: You are not assigned to teach this subject.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5.5 Enforce daily quiz generation cap per teacher (Max 10 per day)
    const DAILY_QUIZ_GEN_CAP = 10;
    const todayIso = new Date().toISOString().split("T")[0];
    const { count: dailyGenerationsCount, error: capErr } = await supabaseAdmin
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", callerId)
      .eq("assigned_date", todayIso);

    if (!capErr && dailyGenerationsCount !== null && dailyGenerationsCount >= DAILY_QUIZ_GEN_CAP) {
      return new Response(
        JSON.stringify({
          error: `Daily quiz generation cap reached: Maximum ${DAILY_QUIZ_GEN_CAP} quiz generations per teacher per day. Please try again tomorrow.`,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Reject if a published assignment already exists for that subject on that date
    const { data: existingAssignment, error: existingErr } = await supabaseAdmin
      .from("assignments")
      .select("id, status, title")
      .eq("subject_id", subjectId)
      .eq("assigned_date", assignedDate)
      .maybeSingle();

    if (existingErr && existingErr.code !== "PGRST116") {
      // ignore empty result error
    }

    if (existingAssignment && existingAssignment.status === "published") {
      return new Response(
        JSON.stringify({
          error: `A published assignment ("${existingAssignment.title}") already exists for this subject on ${assignedDate}. Only one assignment is permitted per subject per day.`,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Fetch Topic and Subject metadata for grounded prompt
    const { data: subjectData } = await supabaseAdmin
      .from("subjects")
      .select("name, code")
      .eq("id", subjectId)
      .maybeSingle();

    const { data: topicData } = await supabaseAdmin
      .from("topics")
      .select("name, description")
      .eq("id", topicId)
      .maybeSingle();

    const subjectName = subjectData?.name || "Computer Science";
    const topicName = topicData?.name || "Core Programming";
    const topicDesc = topicData?.description || "";

    // 8. Gemini Generation Function with Timeout & Retry
    const generateFromGemini = async (): Promise<unknown> => {
      const prompt = `You are a strict, pedagogical Computer Science professor creating an adaptive assessment.
Create 5 verified multiple choice questions for the topic "${topicName}" in the course "${subjectName}".
Context/Syllabus: ${topicDesc}.

REQUIREMENTS:
1. Exactly 5 questions:
   - Exactly 2 "easy" questions
   - Exactly 2 "medium" questions
   - Exactly 1 "hard" question
2. Each question MUST contain:
   - "prompt": Clear, precise question statement.
   - "code_snippet": Optional C-style code snippet if applicable, or null.
   - "options": Array of EXACTLY 4 distinct choice strings (no duplicates).
   - "correct_index": Integer (0, 1, 2, or 3) indicating the single correct option.
   - "explanation": Comprehensive pedagogical explanation of why the correct option is right.
   - "wrong_reasons": An object mapping each of the 3 WRONG option indices to the specific conceptual misconception or trap it represents. (e.g. if correct_index is 0, provide keys "1", "2", "3").
   - "subskill": Specific sub-concept being assessed (e.g. "Pointer Arithmetic", "Off-by-One Loop Bounds", "Contiguous Memory Addressing").
   - "difficulty": "easy" | "medium" | "hard"

OUTPUT FORMAT:
Return ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "prompt": "...",
      "code_snippet": "int *p = &x; ...",
      "options": ["Option 0", "Option 1", "Option 2", "Option 3"],
      "correct_index": 0,
      "explanation": "...",
      "wrong_reasons": {
        "1": "Why option 1 is a common misconception...",
        "2": "Why option 2 is incorrect...",
        "3": "Why option 3 is incorrect..."
      },
      "subskill": "...",
      "difficulty": "easy"
    }
  ]
}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

      // 15-second timeout signal
      const timeoutSignal = AbortSignal.timeout(15000);

      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: timeoutSignal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3, // Lower temperature for deterministic adherence to schema
          },
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("QUOTA_EXCEEDED");
        }
        throw new Error(`Gemini API returned status ${res.status}`);
      }

      const jsonResponse = await res.json();
      const rawText = jsonResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error("MALFORMED_OUTPUT");
      }

      return JSON.parse(rawText);
    };

    // 9. Execute with 1 Retry on Schema Validation Failure
    let validatedQuiz: NormalizedQuiz | null = null;
    let lastValidationError = "";

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const rawOutput = await generateFromGemini();
        const validationResult = validateAndNormalizeQuiz(rawOutput);

        if (validationResult.success && validationResult.data) {
          validatedQuiz = validationResult.data;
          break;
        } else {
          lastValidationError = validationResult.error || "Schema validation failed.";
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.message === "QUOTA_EXCEEDED") {
            return new Response(
              JSON.stringify({
                error: "Gemini API rate limit or quota exceeded. Please wait a few moments and try again.",
              }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (err.name === "TimeoutError") {
            return new Response(
              JSON.stringify({
                error: "Quiz generation timed out. Please try again.",
              }),
              { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
        lastValidationError = err instanceof Error ? err.message : "Generation failed.";
      }
    }

    if (!validatedQuiz) {
      return new Response(
        JSON.stringify({
          error: `AI quiz generation failed quality validation after retry. Details: ${lastValidationError}`,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 10. Save Assignment as Draft in Database
    let assignmentId: string;
    if (existingAssignment) {
      // Update existing draft
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from("assignments")
        .update({
          topic_id: topicId,
          title: `Daily Focus: ${topicName}`,
          instructions: `Review key concepts in ${topicName} and complete these 5 adaptive questions.`,
          status: "draft",
        })
        .eq("id", existingAssignment.id)
        .select()
        .single();

      if (updateErr) {
        throw new Error(`Failed to update draft assignment: ${updateErr.message}`);
      }
      assignmentId = updated.id;
    } else {
      // Insert new draft assignment
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("assignments")
        .insert({
          subject_id: subjectId,
          topic_id: topicId,
          teacher_id: callerId,
          assigned_date: assignedDate,
          title: `Daily Focus: ${topicName}`,
          instructions: `Review key concepts in ${topicName} and complete these 5 adaptive questions.`,
          status: "draft",
        })
        .select()
        .single();

      if (insertErr) {
        throw new Error(`Failed to create draft assignment: ${insertErr.message}`);
      }
      assignmentId = inserted.id;
    }

    // 11. Save 5 Questions as Draft
    const savedQuestions = [];
    for (const q of validatedQuiz.questions) {
      const questionId = `q-${topicId}-${crypto.randomUUID().slice(0, 8)}`;
      const { data: qData, error: qErr } = await supabaseAdmin
        .from("questions")
        .insert({
          id: questionId,
          subject_id: subjectId,
          topic_id: topicId,
          teacher_id: callerId,
          concept: q.subskill,
          question: q.prompt,
          code_snippet: q.code_snippet,
          options: q.options,
          correct_index: q.correct_index,
          wrong_reasons: q.wrong_reasons,
          explanation: q.explanation,
          difficulty: q.difficulty,
          status: "draft", // Rule 8: Teacher must publish
        })
        .select()
        .single();

      if (qErr) {
        throw new Error(`Failed to insert draft question: ${qErr.message}`);
      }
      savedQuestions.push(qData);
    }

    // 12. Return Draft Payload
    return new Response(
      JSON.stringify({
        success: true,
        assignmentId,
        status: "draft",
        message: "Draft quiz generated successfully. Review and publish when ready.",
        questions: savedQuestions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : "Internal server error";
    // Never expose API keys in error output
    const sanitized = rawMessage.replace(/key=[a-zA-Z0-9_-]+/g, "key=REDACTED");
    return new Response(
      JSON.stringify({ error: sanitized }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
