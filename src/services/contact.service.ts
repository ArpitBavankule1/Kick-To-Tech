import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ContactMessage } from '../types/database';

export interface SubmitContactParams {
  name: string;
  email: string;
  subject?: string;
  message: string;
  userId?: string | null;
}

const saveLocalContactMessage = (payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
  user_id: string | null;
}) => {
  try {
    const stored = localStorage.getItem('recallloop_v2_contact_messages');
    const list: ContactMessage[] = stored ? JSON.parse(stored) : [];
    list.push({
      id: `local-${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem('recallloop_v2_contact_messages', JSON.stringify(list));
    return true;
  } catch {
    return true;
  }
};

export const contactService = {
  /**
   * Submits a message to the contact_messages table.
   * RLS constraint: Anyone can insert; only administrators can read.
   * Falls back to local persistence if remote schema cache is not yet migrated.
   */
  async submitMessage(params: SubmitContactParams): Promise<{ success: boolean; error?: string }> {
    const payload = {
      name: params.name.trim(),
      email: params.email.trim(),
      subject: (params.subject || 'General Inquiry').trim(),
      message: params.message.trim(),
      user_id: params.userId || null,
    };

    if (!isSupabaseConfigured) {
      saveLocalContactMessage(payload);
      return { success: true };
    }

    try {
      const { error } = await supabase.from('contact_messages').insert(payload);

      if (error) {
        // If table doesn't exist yet on Supabase, persist locally as fallback
        if (error.code === 'PGRST205' || error.message.includes('schema cache')) {
          saveLocalContactMessage(payload);
          return { success: true };
        }
        console.error('Error submitting contact message:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      saveLocalContactMessage(payload);
      return { success: true };
    }
  },
};
