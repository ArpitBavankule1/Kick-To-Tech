import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Attempt } from '../types/database';

export const attemptsService = {
  /**
   * Fetches all recorded attempts for a student to dynamically derive mastery.
   * Rule 2: Mastery is DERIVED from the attempts table, never stored.
   */
  async getStudentAttempts(studentId: string): Promise<Attempt[]> {
    if (!isSupabaseConfigured) {
      // Local fallback
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

    return data || [];
  },

  /**
   * Records a verified student attempt.
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
