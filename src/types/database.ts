export type UserRole = 'student' | 'teacher' | 'admin';

export type UserStatus = 'pending' | 'active' | 'suspended';

export type AssignmentStatus = 'draft' | 'published';

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
          status: UserStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: UserRole;
          status?: UserStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          status?: UserStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
          id: string;
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
        Relationships: [];
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
          id: string;
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
        Relationships: [];
      };
      teacher_subjects: {
        Row: {
          id: string;
          teacher_id: string;
          subject_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          subject_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          subject_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      enrollments: {
        Row: {
          id: string;
          student_id: string;
          subject_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          subject_id?: string;
          created_at?: string;
        };
        Relationships: [];
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
          status: AssignmentStatus;
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
          status?: AssignmentStatus;
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
          status?: AssignmentStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          subject_id: string;
          topic_id: string;
          teacher_id: string | null;
          concept: string;
          question: string;
          code_snippet: string | null;
          options: string[]; // Exactly 4 entries
          correct_index: number; // 0-3
          wrong_reasons: string[];
          explanation: string;
          difficulty: DifficultyLevel;
          status: QuestionStatus;
          created_at: string;
        };
        Insert: {
          id: string;
          subject_id: string;
          topic_id: string;
          teacher_id?: string | null;
          concept: string;
          question: string;
          code_snippet?: string | null;
          options: string[];
          correct_index: number;
          wrong_reasons?: string[];
          explanation: string;
          difficulty?: DifficultyLevel;
          status?: QuestionStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          topic_id?: string;
          teacher_id?: string | null;
          concept?: string;
          question?: string;
          code_snippet?: string | null;
          options?: string[];
          correct_index?: number;
          wrong_reasons?: string[];
          explanation?: string;
          difficulty?: DifficultyLevel;
          status?: QuestionStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      attempts: {
        Row: {
          id: string;
          student_id: string;
          subject_id: string;
          topic_id: string;
          question_id: string;
          assignment_id: string | null;
          selected_answer: number; // 0-3
          is_correct: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject_id: string;
          topic_id: string;
          question_id: string;
          assignment_id?: string | null;
          selected_answer: number;
          is_correct: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          subject_id?: string;
          topic_id?: string;
          question_id?: string;
          assignment_id?: string | null;
          selected_answer?: number;
          is_correct?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          subject: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email: string;
          subject: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          email?: string;
          subject?: string;
          message?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      student_questions: {
        Row: {
          id: string;
          subject_id: string;
          topic_id: string;
          concept: string;
          question: string;
          code_snippet: string | null;
          options: string[];
          difficulty: DifficultyLevel;
          created_at: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      submit_attempt: {
        Args: {
          p_question_id: string;
          p_selected_answer: number;
          p_assignment_id?: string | null;
        };
        Returns: {
          attempt_id: string;
          is_correct: boolean;
          correct_index: number;
          explanation: string;
          wrong_reason: string | null;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Subject = Database['public']['Tables']['subjects']['Row'];
export type Topic = Database['public']['Tables']['topics']['Row'];
export type TeacherSubject = Database['public']['Tables']['teacher_subjects']['Row'];
export type Enrollment = Database['public']['Tables']['enrollments']['Row'];
export type Assignment = Database['public']['Tables']['assignments']['Row'];
export type DbQuestion = Database['public']['Tables']['questions']['Row'];
export type StudentQuestion = Database['public']['Views']['student_questions']['Row'];
export type Attempt = Database['public']['Tables']['attempts']['Row'];
export type ContactMessage = Database['public']['Tables']['contact_messages']['Row'];
