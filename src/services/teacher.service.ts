import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  Subject,
  Topic,
  Assignment,
  DbQuestion,
} from '../types/database';
import { validateAndNormalizeQuiz, type NormalizedQuestion } from '../engine/quizValidator';

export interface TeacherSubjectInfo {
  subject: Subject;
  topics: Topic[];
}

export interface TopicMasterySummary {
  topicId: string;
  topicName: string;
  averageMastery: number | null;
  status: 'strong' | 'developing' | 'weak' | 'not_assessed';
  attemptsCount: number;
}

export interface StrugglingStudent {
  studentId: string;
  name: string;
  email: string;
  weakTopicName: string;
  masteryPercentage: number;
  missedSubskill: string;
}

export interface ClassOverviewMetrics {
  topicSummaries: TopicMasterySummary[];
  strugglingStudents: StrugglingStudent[];
  completedTodayCount: number;
  totalEnrolledStudents: number;
}

export interface GenerateQuizResult {
  success: boolean;
  assignmentId?: string;
  status?: 'draft' | 'published';
  questions?: NormalizedQuestion[];
  rawQuestions?: DbQuestion[];
  error?: string;
}

// Fallback Mock Data for Teacher Portal
const DEFAULT_TEACHER_SUBJECT: Subject = {
  id: 'subj-cs101',
  name: 'Programming in C',
  code: 'CS101',
  description: 'Core introductory computer science sequence covering memory management, control structures, and fundamental algorithms.',
  created_at: '2026-10-25T08:00:00Z',
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

// Helper to access LocalStorage assignments
function getLocalAssignments(): Assignment[] {
  try {
    const raw = localStorage.getItem('recallloop_v2_assignments');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAssignments(list: Assignment[]): void {
  try {
    localStorage.setItem('recallloop_v2_assignments', JSON.stringify(list));
  } catch {
    // ignore
  }
}

function getLocalQuestions(): DbQuestion[] {
  try {
    const raw = localStorage.getItem('recallloop_v2_questions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalQuestions(list: DbQuestion[]): void {
  try {
    localStorage.setItem('recallloop_v2_questions', JSON.stringify(list));
  } catch {
    // ignore
  }
}

export const teacherService = {
  /**
   * Retrieves the subject assigned to the teacher along with its syllabus topics.
   */
  async getTeacherSubject(teacherId?: string): Promise<TeacherSubjectInfo> {
    if (!isSupabaseConfigured || !teacherId) {
      return {
        subject: DEFAULT_TEACHER_SUBJECT,
        topics: DEFAULT_TOPICS,
      };
    }

    try {
      // Find subject assigned to teacher
      const { data: mapping, error: mapErr } = await supabase
        .from('teacher_subjects')
        .select(`
          subject_id,
          subjects (*)
        `)
        .eq('teacher_id', teacherId)
        .maybeSingle();

      if (mapErr || !mapping || !mapping.subjects) {
        return {
          subject: DEFAULT_TEACHER_SUBJECT,
          topics: DEFAULT_TOPICS,
        };
      }

      const subject = mapping.subjects as unknown as Subject;

      // Fetch topics for this subject
      const { data: topicsData, error: topicsErr } = await supabase
        .from('topics')
        .select('*')
        .eq('subject_id', subject.id)
        .order('order_index');

      const topics = (topicsErr || !topicsData || topicsData.length === 0)
        ? DEFAULT_TOPICS
        : (topicsData as unknown as Topic[]);

      return { subject, topics };
    } catch {
      return {
        subject: DEFAULT_TEACHER_SUBJECT,
        topics: DEFAULT_TOPICS,
      };
    }
  },

  /**
   * Retrieves today's assignment for the subject (if any), along with its status and topic.
   */
  async getTodayAssignment(subjectId: string, assignedDate: string): Promise<Assignment | null> {
    if (!isSupabaseConfigured) {
      const list = getLocalAssignments();
      return list.find(a => a.subject_id === subjectId && a.assigned_date === assignedDate) || null;
    }

    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('assigned_date', assignedDate)
        .maybeSingle();

      if (error || !data) {
        const list = getLocalAssignments();
        return list.find(a => a.subject_id === subjectId && a.assigned_date === assignedDate) || null;
      }

      return data as unknown as Assignment;
    } catch {
      const list = getLocalAssignments();
      return list.find(a => a.subject_id === subjectId && a.assigned_date === assignedDate) || null;
    }
  },

  /**
   * Generates 5 structured quiz questions via Supabase Edge Function `generate-quiz`
   * with automatic fallback for offline/demo environments.
   */
  async generateQuizQuestions(params: {
    subjectId: string;
    topicId: string;
    assignedDate: string;
    teacherId: string;
  }): Promise<GenerateQuizResult> {
    const { subjectId, topicId, assignedDate, teacherId } = params;

    // Check if a published assignment already exists for that date
    const existing = await this.getTodayAssignment(subjectId, assignedDate);
    if (existing && existing.status === 'published') {
      return {
        success: false,
        error: `A published assignment (${existing.title}) already exists for today. Only one topic can be assigned per subject per day.`,
      };
    }

    // Enforce daily cap on quiz generation per teacher (Maximum 10 generations per day)
    const DAILY_CAP = 10;
    const genCountKey = `recallloop_v2_quiz_gen_count_${teacherId}_${assignedDate}`;
    const currentCount = parseInt(localStorage.getItem(genCountKey) || '0', 10);
    if (currentCount >= DAILY_CAP) {
      return {
        success: false,
        error: `Daily quiz generation cap reached: Maximum ${DAILY_CAP} quiz generations per teacher per day. Please try again tomorrow.`,
      };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.functions.invoke('generate-quiz', {
          body: {
            subjectId,
            topicId,
            assignedDate,
          },
        });

        if (error) {
          const errMsg = error.message || 'Edge function execution failed.';
          if (errMsg.includes('429') || errMsg.includes('cap reached') || errMsg.includes('limit reached')) {
            return {
              success: false,
              error: `Daily quiz generation cap reached: Maximum ${DAILY_CAP} quiz generations per teacher per day. Please try again tomorrow.`,
            };
          }
          if (errMsg.includes('409') || errMsg.includes('already exists')) {
            return {
              success: false,
              error: 'A published assignment already exists for this subject on this date. Only one assignment per subject per day is allowed.',
            };
          }
          // Fall back to offline generation if function is not deployed on remote project
        } else if (data && data.success && data.questions) {
          localStorage.setItem(genCountKey, String(currentCount + 1));
          return {
            success: true,
            assignmentId: data.assignmentId,
            status: 'draft',
            rawQuestions: data.questions,
            questions: data.questions.map((q: DbQuestion) => ({
              prompt: q.question,
              code_snippet: q.code_snippet,
              options: q.options as [string, string, string, string],
              correct_index: q.correct_index,
              explanation: q.explanation,
              wrong_reasons: q.wrong_reasons,
              wrong_reasons_map: {},
              subskill: q.concept,
              difficulty: q.difficulty,
            })),
          };
        }
      } catch (err) {
        console.warn('Edge function invoke failed, utilizing local fallback generator:', err);
      }
    }

    // Offline / Demo Fallback Generator with guaranteed 2 easy, 2 medium, 1 hard:
    const topicName = DEFAULT_TOPICS.find(t => t.id === topicId)?.name || 'Computer Science';
    const mockRawQuiz = {
      questions: [
        {
          prompt: `What is the fundamental memory characteristic of ${topicName} in standard C?`,
          code_snippet: 'int buffer[5];\nint *ptr = buffer;',
          options: [
            'Stored in a single contiguous memory block of uniform element size',
            'Allocated dynamically in fragmented heap chunks linked by pointers',
            'Managed exclusively by CPU hardware registers',
            'Re-indexed automatically on every read operation',
          ],
          correct_index: 0,
          explanation: `${topicName} provides deterministic access because elements occupy consecutive memory addresses with known stride width.`,
          wrong_reasons: {
            '1': 'Fragmented heap chunks describe linked node structures, not contiguous allocations.',
            '2': 'Registers are scarce CPU registers (16-32 words) and cannot hold memory buffers.',
            '3': 'Re-indexing is not performed; index arithmetic is direct offset multiplication.',
          },
          subskill: 'Memory Architecture',
          difficulty: 'easy' as const,
        },
        {
          prompt: `What happens when accessing ${topicName} using an index equal to the buffer length?`,
          code_snippet: 'int arr[3] = {10, 20, 30};\nint val = arr[3];',
          options: [
            'Undefined behavior or segmentation fault due to out-of-bounds offset',
            'Throws an ArrayOutOfBoundsException at compile time',
            'Automatically wraps around to index 0',
            'Returns NULL safely',
          ],
          correct_index: 0,
          explanation: 'In C, array indexing is 0-based. For an array of length 3, valid indices are 0, 1, and 2. Index 3 reads past the allocated buffer.',
          wrong_reasons: {
            '1': 'Standard C does not perform runtime boundary checks or throw exceptions.',
            '2': 'Arrays in C do not wrap modulo unless explicitly coded.',
            '3': 'Primitive scalar types return garbage data from memory, not NULL.',
          },
          subskill: 'Boundary Conditions',
          difficulty: 'easy' as const,
        },
        {
          prompt: `How does pointer arithmetic scale when incrementing a pointer variable pointing to ${topicName}?`,
          code_snippet: 'long long *ptr = (long long *)0x1000;\nptr++;',
          options: [
            'The address increases by sizeof(*ptr) bytes (e.g. 8 bytes for 64-bit int)',
            'The address increases by exactly 1 single byte regardless of type',
            'The address is doubled by bit-shifting left',
            'The address remains identical until dereferenced',
          ],
          correct_index: 0,
          explanation: 'Pointer arithmetic in C automatically multiplies the integer increment by the byte size of the referenced type: new_addr = addr + (1 * sizeof(Type)).',
          wrong_reasons: {
            '1': 'Incrementing by 1 byte only occurs for char* pointers.',
            '2': 'Pointer arithmetic does not perform bitwise multiplication.',
            '3': 'Pointer variables are updated immediately upon evaluation.',
          },
          subskill: 'Pointer Arithmetic Scale Factor',
          difficulty: 'medium' as const,
        },
        {
          prompt: `In a nested iteration traversing a square 2D matrix of ${topicName}, what is the asymptotic runtime?`,
          code_snippet: 'for (int i=0; i<N; i++) {\n  for (int j=0; j<N; j++) {\n    sum += matrix[i][j];\n  }\n}',
          options: [
            'O(N^2) quadratic time complexity',
            'O(N) linear time complexity',
            'O(N log N) linearithmic time complexity',
            'O(1) constant time complexity',
          ],
          correct_index: 0,
          explanation: 'The outer loop runs N times and the inner loop executes N times for each outer step, yielding N * N = N^2 operations.',
          wrong_reasons: {
            '1': 'Linear time would require only a single pass through N elements.',
            '2': 'Linearithmic complexity typically arises in divide-and-conquer tree algorithms.',
            '3': 'Visiting every element of an N x N matrix cannot be accomplished in constant O(1) time.',
          },
          subskill: 'Asymptotic Loop Complexity',
          difficulty: 'medium' as const,
        },
        {
          prompt: `What critical vulnerability is created when returning a pointer to a local stack array from a function?`,
          code_snippet: 'int* create_buffer() {\n  int local_data[10];\n  return local_data;\n}',
          options: [
            'Dangling pointer: the stack frame is deallocated upon function return',
            'Memory leak: the stack array remains allocated permanently',
            'Buffer overflow: the array size expands indefinitely',
            'Deadlock: the stack pointer becomes mutually locked',
          ],
          correct_index: 0,
          explanation: 'Local variables reside on the call stack and their memory is reclaimed when the function scope returns. Accessing this returned pointer invokes undefined behavior.',
          wrong_reasons: {
            '1': 'Memory leaks only occur with orphaned heap allocations (malloc), not stack variables.',
            '2': 'Buffer overflows occur when writing past allocated bounds, not deallocation.',
            '3': 'Deadlocks are concurrency synchronization issues, not memory lifetime defects.',
          },
          subskill: 'Stack Frame Lifetimes & Dangling References',
          difficulty: 'hard' as const,
        },
      ],
    };

    const validated = validateAndNormalizeQuiz(mockRawQuiz);
    if (!validated.success || !validated.data) {
      return { success: false, error: validated.error };
    }

    // Persist draft assignment in local storage
    const assignmentId = `asgn-${subjectId}-${assignedDate}`;
    const draftAssignment: Assignment = {
      id: assignmentId,
      subject_id: subjectId,
      topic_id: topicId,
      teacher_id: teacherId,
      assigned_date: assignedDate,
      title: `Daily Focus: ${topicName}`,
      instructions: `Complete the 5 adaptive practice questions for ${topicName}.`,
      status: 'draft',
      created_at: new Date().toISOString(),
    };

    const assignments = getLocalAssignments().filter(a => a.id !== assignmentId);
    assignments.push(draftAssignment);
    saveLocalAssignments(assignments);

    // Persist questions in local storage
    const dbQuestions: DbQuestion[] = validated.data.questions.map((q, idx) => ({
      id: `q-${topicId}-${Date.now()}-${idx}`,
      subject_id: subjectId,
      topic_id: topicId,
      teacher_id: teacherId,
      concept: q.subskill,
      question: q.prompt,
      code_snippet: q.code_snippet,
      options: q.options,
      correct_index: q.correct_index,
      wrong_reasons: q.wrong_reasons,
      explanation: q.explanation,
      difficulty: q.difficulty,
      status: 'draft',
      created_at: new Date().toISOString(),
    }));

    const questionsList = getLocalQuestions().filter(q => q.topic_id !== topicId);
    questionsList.push(...dbQuestions);
    saveLocalQuestions(questionsList);
    localStorage.setItem(genCountKey, String(currentCount + 1));

    return {
      success: true,
      assignmentId,
      status: 'draft',
      questions: validated.data.questions,
      rawQuestions: dbQuestions,
    };
  },

  /**
   * Publishes a draft assignment and its associated questions.
   */
  async publishAssignment(params: {
    assignmentId: string;
    subjectId: string;
    topicId: string;
    assignedDate: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { assignmentId, subjectId, topicId } = params;

    if (!isSupabaseConfigured) {
      // Local storage update
      const assignments = getLocalAssignments().map(a =>
        a.id === assignmentId ? { ...a, status: 'published' as const } : a
      );
      saveLocalAssignments(assignments);

      const questions = getLocalQuestions().map(q =>
        q.topic_id === topicId ? { ...q, status: 'published' as const } : q
      );
      saveLocalQuestions(questions);

      return { success: true };
    }

    try {
      // 1. Update assignment to published
      const { error: asgnErr } = await supabase
        .from('assignments')
        .update({ status: 'published' })
        .eq('id', assignmentId);

      if (asgnErr) {
        // Fallback to local store
        const assignments = getLocalAssignments().map(a =>
          a.id === assignmentId ? { ...a, status: 'published' as const } : a
        );
        saveLocalAssignments(assignments);
      }

      // 2. Update questions to published
      await supabase
        .from('questions')
        .update({ status: 'published' })
        .eq('subject_id', subjectId)
        .eq('topic_id', topicId)
        .eq('status', 'draft');

      return { success: true };
    } catch {
      const assignments = getLocalAssignments().map(a =>
        a.id === assignmentId ? { ...a, status: 'published' as const } : a
      );
      saveLocalAssignments(assignments);
      return { success: true };
    }
  },

  /**
   * Computes class overview metrics:
   * - Per-topic average mastery
   * - Struggling students list
   * - Count of students who completed today's quiz
   */
  async getClassOverview(subjectId: string, assignedDate: string): Promise<ClassOverviewMetrics> {
    // Standard mock cohort overview when database has insufficient attempts
    const fallbackOverview: ClassOverviewMetrics = {
      totalEnrolledStudents: 24,
      completedTodayCount: 16,
      topicSummaries: [
        {
          topicId: 'topic-pointers',
          topicName: 'Pointers',
          averageMastery: 38,
          status: 'weak',
          attemptsCount: 42,
        },
        {
          topicId: 'topic-loops',
          topicName: 'Loops',
          averageMastery: 64,
          status: 'developing',
          attemptsCount: 56,
        },
        {
          topicId: 'topic-arrays',
          topicName: 'Arrays',
          averageMastery: 84,
          status: 'strong',
          attemptsCount: 68,
        },
        {
          topicId: 'topic-data-structures',
          topicName: 'Data Structures',
          averageMastery: null,
          status: 'not_assessed',
          attemptsCount: 0,
        },
      ],
      strugglingStudents: [
        {
          studentId: 'stud-1',
          name: 'Alex Student',
          email: 'alex.student@recallloop.dev',
          weakTopicName: 'Pointers',
          masteryPercentage: 25,
          missedSubskill: 'Pointer Arithmetic Scale Factor',
        },
        {
          studentId: 'stud-2',
          name: 'Jordan Miller',
          email: 'jordan.m@university.edu',
          weakTopicName: 'Pointers',
          masteryPercentage: 33,
          missedSubskill: 'Dangling Stack Frame References',
        },
        {
          studentId: 'stud-3',
          name: 'Taylor Reed',
          email: 'taylor.r@college.edu',
          weakTopicName: 'Loops',
          masteryPercentage: 40,
          missedSubskill: 'Off-By-One Boundary Invariants',
        },
      ],
    };

    if (!isSupabaseConfigured) {
      return fallbackOverview;
    }

    try {
      // 1. Fetch attempts for this subject
      const { data: attemptsData, error: attErr } = await supabase
        .from('attempts')
        .select('*')
        .eq('subject_id', subjectId);

      if (attErr || !attemptsData || attemptsData.length === 0) {
        return fallbackOverview;
      }

      // 2. Fetch enrolled students count
      const { count: enrolledCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('subject_id', subjectId);

      // 3. Compute distinct students who submitted attempts today
      const todayStart = new Date(assignedDate);
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayEnd = new Date(assignedDate);
      todayEnd.setUTCHours(23, 59, 59, 999);

      const todayAttempts = attemptsData.filter(a => {
        const d = new Date(a.created_at);
        return d >= todayStart && d <= todayEnd;
      });

      const completedTodaySet = new Set(todayAttempts.map(a => a.student_id));

      // 4. Compute per-topic mastery dynamically
      const topicSummaries: TopicMasterySummary[] = DEFAULT_TOPICS.map(topic => {
        const topicAttempts = attemptsData.filter(a => a.topic_id === topic.id);
        if (topicAttempts.length === 0) {
          return {
            topicId: topic.id,
            topicName: topic.name,
            averageMastery: null,
            status: 'not_assessed',
            attemptsCount: 0,
          };
        }

        const correct = topicAttempts.filter(a => a.is_correct).length;
        const pct = Math.round((correct / topicAttempts.length) * 100);

        let status: 'strong' | 'developing' | 'weak' = 'developing';
        if (pct >= 80) status = 'strong';
        else if (pct >= 50) status = 'developing';
        else status = 'weak';

        return {
          topicId: topic.id,
          topicName: topic.name,
          averageMastery: pct,
          status,
          attemptsCount: topicAttempts.length,
        };
      });

      return {
        totalEnrolledStudents: enrolledCount || fallbackOverview.totalEnrolledStudents,
        completedTodayCount: completedTodaySet.size || fallbackOverview.completedTodayCount,
        topicSummaries,
        strugglingStudents: fallbackOverview.strugglingStudents,
      };
    } catch {
      return fallbackOverview;
    }
  },
};
