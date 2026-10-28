import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Assignment } from '../types/database';

export const assignmentsService = {
  /**
   * Fetches today's assignment for a subject.
   */
  async getTodayAssignment(subjectId: string, date: string): Promise<Assignment | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('assigned_date', date)
      .maybeSingle();

    if (error) {
      console.error('Error fetching assignment:', error);
      throw error;
    }

    return data;
  },

  /**
   * Creates a daily topic assignment.
   * Database uniquely enforces UNIQUE(subject_id, assigned_date).
   */
  async createAssignment(assignment: Omit<Assignment, 'id' | 'created_at'>): Promise<Assignment | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data, error } = await supabase
      .from('assignments')
      .insert([assignment] as never)
      .select()
      .single();

    if (error) {
      console.error('Error creating assignment (Rule 7 Unique Constraint):', error);
      throw error;
    }

    return (data as unknown as Assignment) || null;
  },
};
