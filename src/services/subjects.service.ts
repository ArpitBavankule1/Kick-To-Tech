import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Subject } from '../types/database';

export const FALLBACK_SUBJECTS: Subject[] = [
  {
    id: 'subj-cs101',
    code: 'CS101',
    name: 'Programming in C',
    description: 'Core introductory computer science sequence covering memory management, control structures, and fundamental algorithms.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'subj-data200',
    code: 'DATA200',
    name: 'Data Structures & Algorithms',
    description: 'Advanced data models, pointer structures, tree traversals, and amortized runtime complexities.',
    created_at: new Date().toISOString(),
  },
];

export const subjectsService = {
  /**
   * Retrieves all available subjects for student enrollment and teacher assignment.
   * Gracefully falls back to seeded default subjects if remote table is not yet migrated.
   */
  async getAvailableSubjects(): Promise<Subject[]> {
    if (!isSupabaseConfigured) {
      return FALLBACK_SUBJECTS;
    }

    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (error) {
        return FALLBACK_SUBJECTS;
      }

      return (data as unknown as Subject[]) || FALLBACK_SUBJECTS;
    } catch {
      return FALLBACK_SUBJECTS;
    }
  },

  /**
   * Validates a subject code (case-insensitive) against the database or fallback catalog.
   * Required for student self-registration constraint.
   */
  async validateSubjectCode(
    rawCode: string
  ): Promise<{ valid: boolean; subject?: Subject; error?: string }> {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      return { valid: false, error: 'Subject code is required.' };
    }

    if (!isSupabaseConfigured) {
      const match = FALLBACK_SUBJECTS.find((s) => s.code.toUpperCase() === code);
      if (match) {
        return { valid: true, subject: match };
      }
      return {
        valid: false,
        error: `Subject code "${code}" was not found. Try course code CS101.`,
      };
    }

    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .ilike('code', code)
        .maybeSingle();

      if (error) {
        // If table doesn't exist yet on remote Supabase or permissions block anon query
        const fallbackMatch = FALLBACK_SUBJECTS.find((s) => s.code.toUpperCase() === code);
        if (fallbackMatch) {
          return { valid: true, subject: fallbackMatch };
        }
        return {
          valid: false,
          error: `Subject code "${code}" was not found. Please verify with your instructor (e.g., CS101).`,
        };
      }

      const subject = data as unknown as Subject | null;
      if (!subject) {
        const fallbackMatch = FALLBACK_SUBJECTS.find((s) => s.code.toUpperCase() === code);
        if (fallbackMatch) {
          return { valid: true, subject: fallbackMatch };
        }
        return {
          valid: false,
          error: `Subject code "${code}" was not found. Please verify with your instructor (e.g., CS101).`,
        };
      }

      return { valid: true, subject };
    } catch {
      const fallbackMatch = FALLBACK_SUBJECTS.find((s) => s.code.toUpperCase() === code);
      if (fallbackMatch) {
        return { valid: true, subject: fallbackMatch };
      }
      return {
        valid: false,
        error: `Subject code "${code}" was not found. Please verify with your instructor (e.g., CS101).`,
      };
    }
  },
};
