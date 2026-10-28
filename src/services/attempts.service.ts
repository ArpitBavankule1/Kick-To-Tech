import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Attempt } from '../types/database';

export interface SubmitAttemptResult {
  attempt_id: string;
  is_correct: boolean;
  correct_index: number;
  explanation: string;
  wrong_reason: string | null;
}

export const attemptsService = {
  /**
   * Fetches all recorded attempts for a student to dynamically derive mastery.
   * Rule 2: Mastery is DERIVED from the attempts table, never stored.
   */
  async getStudentAttempts(studentId: string): Promise<Attempt[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    const { data, error } = await supabase
      .from('attempts')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching student attempts:', error);
      throw error;
    }

    return (data as unknown as Attempt[]) || [];
  },

  /**
   * Submits an attempt via secure server-side RPC function.
   * Prevents students from inspecting `correct_index` before answering.
   */
  async submitAttemptSecure(
    questionId: string,
    selectedAnswer: number,
    assignmentId?: string | null
  ): Promise<SubmitAttemptResult | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data, error } = await supabase.rpc('submit_attempt', {
      p_question_id: questionId,
      p_selected_answer: selectedAnswer,
      p_assignment_id: assignmentId || null,
    });

    if (error) {
      console.error('Error in secure attempt submission:', error);
      throw error;
    }

    return data as unknown as SubmitAttemptResult;
  },

  /**
   * Fallback direct insert if RPC is not available in local mock mode.
   */
  async recordAttempt(attempt: Omit<Attempt, 'id' | 'created_at'>): Promise<Attempt | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data, error } = await supabase
      .from('attempts')
      .insert([attempt] as never)
      .select()
      .single();

    if (error) {
      console.error('Error recording attempt:', error);
      throw error;
    }

    return (data as unknown as Attempt) || null;
  },
};
