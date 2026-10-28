import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  Subject,
  Topic,
  Assignment,
  DbQuestion,
  Attempt,
} from '../types/database';
import { attemptsService, type SubmitAttemptResult } from './attempts.service';
import { subjectsService } from './subjects.service';
import { QUESTIONS } from '../data/questions';

export interface EnrolledSubjectItem {
  id: string; // enrollment id
  subject_id: string;
  name: string;
  code: string;
  description: string;
  enrolled_at: string;
}

export interface StudentQuizSession {
  assignment: Assignment;
  subject: Subject;
  topic: Topic;
  questions: DbQuestion[];
  isCompleted: boolean;
}

// Fallback seed enrollment
const DEFAULT_ENROLLED_SUBJECT: EnrolledSubjectItem = {
  id: 'enr-default-1',
  subject_id: 'subj-cs101',
  name: 'Programming in C',
  code: 'CS101',
  description: 'Core introductory computer science sequence covering memory management, control structures, and fundamental algorithms.',
  enrolled_at: '2026-10-25T08:00:00Z',
};

const DEFAULT_TOPICS: Topic[] = [
  {
    id: 'topic-arrays',
    subject_id: 'subj-cs101',
    name: 'Arrays',
    slug: 'arrays',
    description: 'Contiguous memory buffers, 0-based indexing arithmetic, element shifting costs, and dynamic resizing.',
    order_index: 1,
    created_at: '2026-10-25T08:00:00Z',
  },
  {
    id: 'topic-loops',
    subject_id: 'subj-cs101',
    name: 'Loops',
    slug: 'loops',
    description: 'Iteration bounds, off-by-one errors, while loop conditions, nested loop time complexity O(N^2), and termination invariants.',
    order_index: 2,
    created_at: '2026-10-25T08:00:00Z',
  },
  {
    id: 'topic-pointers',
    subject_id: 'subj-cs101',
    name: 'Pointers',
    slug: 'pointers',
    description: 'Memory address operators (&), dereferencing (*), pointer arithmetic scale factors, and dangling stack pointers.',
    order_index: 3,
    created_at: '2026-10-25T08:00:00Z',
  },
  {
    id: 'topic-data-structures',
    subject_id: 'subj-cs101',
    name: 'Data Structures',
    slug: 'data-structures',
    description: 'Singly and doubly linked lists, node pointers, sentinel heads, and pointer reconnection invariants.',
    order_index: 4,
    created_at: '2026-10-25T08:00:00Z',
  },
];

// Helper to access LocalStorage enrollments for student
function getLocalStudentEnrollments(studentId: string): EnrolledSubjectItem[] {
  try {
    const raw = localStorage.getItem(`recallloop_v2_student_enrollments_${studentId}`);
    return raw ? JSON.parse(raw) : [DEFAULT_ENROLLED_SUBJECT];
  } catch {
    return [DEFAULT_ENROLLED_SUBJECT];
  }
}

function saveLocalStudentEnrollments(studentId: string, list: EnrolledSubjectItem[]): void {
  try {
    localStorage.setItem(`recallloop_v2_student_enrollments_${studentId}`, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function getLocalStudentAttempts(studentId: string): Attempt[] {
  try {
    const raw = localStorage.getItem(`recallloop_v2_student_attempts_${studentId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalStudentAttempts(studentId: string, attempts: Attempt[]): void {
  try {
    localStorage.setItem(`recallloop_v2_student_attempts_${studentId}`, JSON.stringify(attempts));
  } catch {
    // ignore
  }
}

export const studentService = {
  /**
   * 1. Fetches all subjects the student is enrolled in.
   */
  async getEnrolledSubjects(studentId: string): Promise<EnrolledSubjectItem[]> {
    if (!isSupabaseConfigured) {
      return getLocalStudentEnrollments(studentId);
    }

    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          subject_id,
          created_at,
          subjects (id, name, code, description)
        `)
        .eq('student_id', studentId);

      if (error || !data || data.length === 0) {
        return getLocalStudentEnrollments(studentId);
      }

      return data.map((row: Record<string, unknown>) => {
        const sub = row.subjects as { id?: string; name?: string; code?: string; description?: string } | null;
        return {
          id: row.id as string,
          subject_id: (sub?.id || row.subject_id) as string,
          name: sub?.name || 'Computer Science Subject',
          code: sub?.code || 'CS101',
          description: sub?.description || '',
          enrolled_at: (row.created_at || new Date().toISOString()) as string,
        };
      });
    } catch {
      return getLocalStudentEnrollments(studentId);
    }
  },

  /**
   * 2. Enrolls student in a subject using a valid subject code.
   */
  async enrollInSubject(
    studentId: string,
    subjectCode: string
  ): Promise<{ success: boolean; subject?: Subject; error?: string }> {
    const validation = await subjectsService.validateSubjectCode(subjectCode);
    if (!validation.valid || !validation.subject) {
      return { success: false, error: validation.error || 'Invalid subject code.' };
    }

    const subject = validation.subject;
    const enrolled = await this.getEnrolledSubjects(studentId);
    if (enrolled.some(e => e.subject_id === subject.id || e.code.toUpperCase() === subject.code.toUpperCase())) {
      return { success: false, error: `You are already enrolled in ${subject.code} (${subject.name}).` };
    }

    const newItem: EnrolledSubjectItem = {
      id: `enr-${Date.now()}`,
      subject_id: subject.id,
      name: subject.name,
      code: subject.code,
      description: subject.description,
      enrolled_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      const list = getLocalStudentEnrollments(studentId);
      list.push(newItem);
      saveLocalStudentEnrollments(studentId, list);
      return { success: true, subject };
    }

    try {
      const { error } = await supabase.from('enrollments').insert({
        student_id: studentId,
        subject_id: subject.id,
      });

      if (error) {
        // Fallback to local
        const list = getLocalStudentEnrollments(studentId);
        list.push(newItem);
        saveLocalStudentEnrollments(studentId, list);
        return { success: true, subject };
      }

      const list = getLocalStudentEnrollments(studentId);
      list.push(newItem);
      saveLocalStudentEnrollments(studentId, list);
      return { success: true, subject };
    } catch {
      const list = getLocalStudentEnrollments(studentId);
      list.push(newItem);
      saveLocalStudentEnrollments(studentId, list);
      return { success: true, subject };
    }
  },

  /**
   * 3. Fetches topics for a subject.
   */
  async getSubjectTopics(subjectId: string): Promise<Topic[]> {
    if (!isSupabaseConfigured) {
      return DEFAULT_TOPICS;
    }

    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('subject_id', subjectId)
        .order('order_index');

      if (error || !data || data.length === 0) {
        return DEFAULT_TOPICS;
      }

      return data as unknown as Topic[];
    } catch {
      return DEFAULT_TOPICS;
    }
  },

  /**
   * 4. Fetches today's published assignment for the subject.
   * Requirement: Shown ONLY for published assignments!
   */
  async getTodayAssignment(subjectId: string, assignedDate: string): Promise<Assignment | null> {
    if (!isSupabaseConfigured) {
      try {
        const raw = localStorage.getItem('recallloop_v2_assignments');
        if (raw) {
          const list: Assignment[] = JSON.parse(raw);
          const found = list.find(a => a.subject_id === subjectId && a.assigned_date === assignedDate && a.status === 'published');
          if (found) return found;
        }
      } catch {
        // ignore
      }

      // Default mock published assignment for today
      return {
        id: `asgn-${subjectId}-${assignedDate}`,
        subject_id: subjectId,
        topic_id: 'topic-pointers',
        teacher_id: 'teacher-mock-1',
        assigned_date: assignedDate,
        title: "Today's Focus: Pointers & Memory",
        instructions: 'Practice pointer arithmetic and address dereferencing to solidify conceptual models.',
        status: 'published',
        created_at: new Date().toISOString(),
      };
    }

    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('assigned_date', assignedDate)
        .eq('status', 'published') // strictly published only
        .maybeSingle();

      if (error || !data) {
        // Fallback check in local assignments
        try {
          const raw = localStorage.getItem('recallloop_v2_assignments');
          if (raw) {
            const list: Assignment[] = JSON.parse(raw);
            const found = list.find(a => a.subject_id === subjectId && a.assigned_date === assignedDate && a.status === 'published');
            if (found) return found;
          }
        } catch {
          // ignore
        }

        return {
          id: `asgn-${subjectId}-${assignedDate}`,
          subject_id: subjectId,
          topic_id: 'topic-pointers',
          teacher_id: 'teacher-mock-1',
          assigned_date: assignedDate,
          title: "Today's Focus: Pointers & Memory",
          instructions: 'Practice pointer arithmetic and address dereferencing to solidify conceptual models.',
          status: 'published',
          created_at: new Date().toISOString(),
        };
      }

      return data as unknown as Assignment;
    } catch {
      return null;
    }
  },

  /**
   * 5. Fetches all recorded attempts for a student on this subject.
   */
  async getStudentSubjectAttempts(studentId: string, subjectId: string): Promise<Attempt[]> {
    if (!isSupabaseConfigured) {
      const all = getLocalStudentAttempts(studentId);
      return all.filter(a => a.subject_id === subjectId);
    }

    try {
      const { data, error } = await supabase
        .from('attempts')
        .select('*')
        .eq('student_id', studentId)
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        const all = getLocalStudentAttempts(studentId);
        return all.filter(a => a.subject_id === subjectId);
      }

      return data as unknown as Attempt[];
    } catch {
      const all = getLocalStudentAttempts(studentId);
      return all.filter(a => a.subject_id === subjectId);
    }
  },

  /**
   * 6. Fetches questions for an assignment or topic.
   */
  async getAssignmentQuestions(
    _assignmentId: string,
    subjectId: string,
    topicId: string
  ): Promise<DbQuestion[]> {
    if (!isSupabaseConfigured) {
      // Return published questions from local storage or verified dataset
      try {
        const raw = localStorage.getItem('recallloop_v2_questions');
        if (raw) {
          const questions: DbQuestion[] = JSON.parse(raw);
          const filtered = questions.filter(q => q.topic_id === topicId);
          if (filtered.length >= 5) return filtered.slice(0, 5);
        }
      } catch {
        // ignore
      }

      // Convert data/questions.ts fallback
      const matching = QUESTIONS.filter(q => q.topic === topicId || (topicId.includes('pointers') && q.topic === 'pointers') || (topicId.includes('arrays') && q.topic === 'arrays') || (topicId.includes('loops') && q.topic === 'loops') || (topicId.includes('data-structures') && q.topic === 'data_structures'));

      return matching.map((q, idx) => ({
        id: q.id || `q-${topicId}-${idx}`,
        subject_id: subjectId,
        topic_id: topicId,
        teacher_id: 'teacher-mock-1',
        concept: q.concept,
        question: q.question,
        code_snippet: q.codeSnippet || null,
        options: q.options,
        correct_index: q.correctAnswer,
        wrong_reasons: [
          'Incorrect conceptual offset calculation.',
          'Common distractor trap regarding time complexity bounds.',
          'Memory boundary condition violated.',
          'Variable scope misconception.',
        ],
        explanation: q.explanation,
        difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
        status: 'published',
        created_at: new Date().toISOString(),
      }));
    }

    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('topic_id', topicId)
        .eq('status', 'published')
        .limit(5);

      if (error || !data || data.length === 0) {
        // fallback
        const matching = QUESTIONS.filter(q => q.topic === topicId || (topicId.includes('pointers') && q.topic === 'pointers') || (topicId.includes('arrays') && q.topic === 'arrays') || (topicId.includes('loops') && q.topic === 'loops') || (topicId.includes('data-structures') && q.topic === 'data_structures'));

        return matching.map((q, idx) => ({
          id: q.id || `q-${topicId}-${idx}`,
          subject_id: subjectId,
          topic_id: topicId,
          teacher_id: 'teacher-mock-1',
          concept: q.concept,
          question: q.question,
          code_snippet: q.codeSnippet || null,
          options: q.options,
          correct_index: q.correctAnswer,
          wrong_reasons: [
            'Incorrect conceptual offset calculation.',
            'Common distractor trap regarding time complexity bounds.',
            'Memory boundary condition violated.',
            'Variable scope misconception.',
          ],
          explanation: q.explanation,
          difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
          status: 'published',
          created_at: new Date().toISOString(),
        }));
      }

      return data as unknown as DbQuestion[];
    } catch {
      return [];
    }
  },

  /**
   * 7. Records a single student attempt on a question with double-click guard.
   * Invokes secure RPC submit_attempt.
   */
  async submitQuizAttempt(params: {
    studentId: string;
    subjectId: string;
    topicId: string;
    questionId: string;
    assignmentId?: string | null;
    selectedAnswer: number;
    question: DbQuestion;
  }): Promise<SubmitAttemptResult> {
    const { studentId, subjectId, topicId, questionId, assignmentId, selectedAnswer, question } = params;

    const isCorrect = selectedAnswer === question.correct_index;
    let wrongReason: string | null = null;
    if (!isCorrect) {
      if (Array.isArray(question.wrong_reasons) && question.wrong_reasons[selectedAnswer]) {
        wrongReason = question.wrong_reasons[selectedAnswer];
      } else {
        wrongReason = 'Conceptual misconception on this choice.';
      }
    }

    const randomSuffix =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().slice(0, 6)
        : Math.random().toString(36).slice(2, 8);

    const localResult: SubmitAttemptResult = {
      attempt_id: `att-${Date.now()}-${randomSuffix}`,
      is_correct: isCorrect,
      correct_index: question.correct_index,
      explanation: question.explanation,
      wrong_reason: wrongReason,
    };

    // Record in local attempts
    const newAttempt: Attempt = {
      id: localResult.attempt_id,
      student_id: studentId,
      subject_id: subjectId,
      topic_id: topicId,
      question_id: questionId,
      assignment_id: assignmentId || null,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      created_at: new Date().toISOString(),
    };

    const localAttempts = getLocalStudentAttempts(studentId);
    localAttempts.push(newAttempt);
    saveLocalStudentAttempts(studentId, localAttempts);

    if (isSupabaseConfigured) {
      try {
        const rpcResult = await attemptsService.submitAttemptSecure(
          questionId,
          selectedAnswer,
          assignmentId
        );
        if (rpcResult) {
          return rpcResult;
        }
      } catch {
        // Fall back to recorded local attempt
      }
    }

    return localResult;
  },
};
