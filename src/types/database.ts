export type UserRole = 'student' | 'teacher' | 'admin';

export type QuestionStatus = 'draft' | 'published' | 'archived';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type MasteryLevel = 'not_assessed' | 'weak' | 'developing' | 'strong';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          is_approved: boolean; // Teachers must be approved by an Admin
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: UserRole;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          code: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          description?: string;
          created_at?: string;
        };
      };
      topics: {
        Row: {
          id: string;
          subject_id: string;
          name: string;
          slug: string;
          description: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          name: string;
          slug: string;
          description?: string;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          name?: string;
          slug?: string;
          description?: string;
          order_index?: number;
          created_at?: string;
        };
      };
      assignments: {
        Row: {
          id: string;
          subject_id: string;
          topic_id: string;
          teacher_id: string;
          assigned_date: string; // YYYY-MM-DD
          title: string;
          instructions: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          topic_id: string;
          teacher_id: string;
          assigned_date: string;
          title: string;
          instructions?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          topic_id?: string;
          teacher_id?: string;
          assigned_date?: string;
          title?: string;
          instructions?: string;
          created_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          topic_id: string;
          teacher_id: string | null;
          concept: string;
          question: string;
          code_snippet: string | null;
          options: string[];
          correct_answer: number; // 0-indexed
          explanation: string;
          difficulty: DifficultyLevel;
          status: QuestionStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          teacher_id?: string | null;
          concept: string;
          question: string;
          code_snippet?: string | null;
          options: string[];
          correct_answer: number;
          explanation: string;
          difficulty?: DifficultyLevel;
          status?: QuestionStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string;
          teacher_id?: string | null;
          concept?: string;
          question?: string;
          code_snippet?: string | null;
          options?: string[];
          correct_answer?: number;
          explanation?: string;
          difficulty?: DifficultyLevel;
          status?: QuestionStatus;
          created_at?: string;
        };
      };
      attempts: {
        Row: {
          id: string;
          student_id: string;
          question_id: string;
          topic_id: string;
          assignment_id: string | null;
          selected_answer: number;
          is_correct: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          question_id: string;
          topic_id: string;
          assignment_id?: string | null;
          selected_answer: number;
          is_correct: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          question_id?: string;
          topic_id?: string;
          assignment_id?: string | null;
          selected_answer?: number;
          is_correct?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Subject = Database['public']['Tables']['subjects']['Row'];
export type Topic = Database['public']['Tables']['topics']['Row'];
export type Assignment = Database['public']['Tables']['assignments']['Row'];
export type DbQuestion = Database['public']['Tables']['questions']['Row'];
export type Attempt = Database['public']['Tables']['attempts']['Row'];
