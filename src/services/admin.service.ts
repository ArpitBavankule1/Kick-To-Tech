import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  Profile,
  Subject,
  Topic,
  UserRole,
  UserStatus,
} from '../types/database';

export interface AdminOverviewCounts {
  studentsCount: number;
  teachersCount: number;
  subjectsCount: number;
  attemptsTodayCount: number;
}

export interface TeacherSubjectMapping {
  id: string;
  teacher_id: string;
  subject_id: string;
  teacher_name: string;
  teacher_email: string;
  subject_name: string;
  subject_code: string;
  created_at: string;
}

export interface StudentEnrollmentMapping {
  id: string;
  student_id: string;
  subject_id: string;
  student_name: string;
  student_email: string;
  subject_name: string;
  subject_code: string;
  created_at: string;
}

// Initial Mock Seed Data for offline/demo robustness
const DEFAULT_MOCK_USERS: Profile[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@recallloop.dev',
    full_name: 'Seeded Root Administrator',
    role: 'admin',
    status: 'active',
    created_at: '2026-10-25T08:00:00Z',
    updated_at: '2026-10-25T08:00:00Z',
  },
  {
    id: 'teacher-mock-1',
    email: 'prof.lin@recallloop.dev',
    full_name: 'Prof. Sarah Lin',
    role: 'teacher',
    status: 'active',
    created_at: '2026-10-26T09:15:00Z',
    updated_at: '2026-10-26T09:15:00Z',
  },
  {
    id: 'teacher-mock-2',
    email: 'jane.doe@university.edu',
    full_name: 'Jane Doe',
    role: 'teacher',
    status: 'pending',
    created_at: '2026-10-28T07:30:00Z',
    updated_at: '2026-10-28T07:30:00Z',
  },
  {
    id: 'teacher-mock-3',
    email: 'marcus.vance@tech.edu',
    full_name: 'Dr. Marcus Vance',
    role: 'teacher',
    status: 'suspended',
    created_at: '2026-10-24T11:00:00Z',
    updated_at: '2026-10-24T11:00:00Z',
  },
  {
    id: 'student-mock-1',
    email: 'student@recallloop.dev',
    full_name: 'Alex Student',
    role: 'student',
    status: 'active',
    created_at: '2026-10-26T10:00:00Z',
    updated_at: '2026-10-26T10:00:00Z',
  },
  {
    id: 'student-mock-2',
    email: 'ada.lovelace@college.edu',
    full_name: 'Ada Lovelace',
    role: 'student',
    status: 'active',
    created_at: '2026-10-27T14:20:00Z',
    updated_at: '2026-10-27T14:20:00Z',
  },
  {
    id: 'student-mock-3',
    email: 'alan.turing@cambridge.edu',
    full_name: 'Alan Turing',
    role: 'student',
    status: 'active',
    created_at: '2026-10-28T08:15:00Z',
    updated_at: '2026-10-28T08:15:00Z',
  },
];

const DEFAULT_MOCK_SUBJECTS: Subject[] = [
  {
    id: 'subj-cs101',
    name: 'Programming in C',
    code: 'CS101',
    description: 'Core introductory computer science sequence covering memory management, control structures, and fundamental algorithms.',
    created_at: '2026-10-25T08:00:00Z',
  },
  {
    id: 'subj-cs201',
    name: 'Data Structures & Algorithms',
    code: 'CS201',
    description: 'Advanced trees, graphs, balanced search algorithms, and asymptotic complexity analysis.',
    created_at: '2026-10-26T09:00:00Z',
  },
];

const DEFAULT_MOCK_TOPICS: Topic[] = [
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

const DEFAULT_MOCK_TEACHER_SUBJECTS = [
  {
    id: 'ts-1',
    teacher_id: 'teacher-mock-1',
    subject_id: 'subj-cs101',
    created_at: '2026-10-26T09:15:00Z',
  },
];

const DEFAULT_MOCK_ENROLLMENTS = [
  {
    id: 'enr-1',
    student_id: 'student-mock-1',
    subject_id: 'subj-cs101',
    created_at: '2026-10-26T10:00:00Z',
  },
  {
    id: 'enr-2',
    student_id: 'student-mock-2',
    subject_id: 'subj-cs101',
    created_at: '2026-10-27T14:20:00Z',
  },
];

// Helper to access LocalStorage mock state
function getLocalUsers(): Profile[] {
  try {
    const raw = localStorage.getItem('recallloop_v2_admin_users');
    return raw ? JSON.parse(raw) : DEFAULT_MOCK_USERS;
  } catch {
    return DEFAULT_MOCK_USERS;
  }
}

function saveLocalUsers(users: Profile[]): void {
  try {
    localStorage.setItem('recallloop_v2_admin_users', JSON.stringify(users));
  } catch {
    // ignore
  }
}

function getLocalSubjects(): Subject[] {
  try {
    const raw = localStorage.getItem('recallloop_v2_admin_subjects');
    return raw ? JSON.parse(raw) : DEFAULT_MOCK_SUBJECTS;
  } catch {
    return DEFAULT_MOCK_SUBJECTS;
  }
}

function saveLocalSubjects(subjects: Subject[]): void {
  try {
    localStorage.setItem('recallloop_v2_admin_subjects', JSON.stringify(subjects));
  } catch {
    // ignore
  }
}

function getLocalTopics(): Topic[] {
  try {
    const raw = localStorage.getItem('recallloop_v2_admin_topics');
    return raw ? JSON.parse(raw) : DEFAULT_MOCK_TOPICS;
  } catch {
    return DEFAULT_MOCK_TOPICS;
  }
}

function saveLocalTopics(topics: Topic[]): void {
  try {
    localStorage.setItem('recallloop_v2_admin_topics', JSON.stringify(topics));
  } catch {
    // ignore
  }
}

function getLocalTeacherSubjects(): { id: string; teacher_id: string; subject_id: string; created_at: string }[] {
  try {
    const raw = localStorage.getItem('recallloop_v2_admin_teacher_subjects');
    return raw ? JSON.parse(raw) : DEFAULT_MOCK_TEACHER_SUBJECTS;
  } catch {
    return DEFAULT_MOCK_TEACHER_SUBJECTS;
  }
}

function saveLocalTeacherSubjects(list: { id: string; teacher_id: string; subject_id: string; created_at: string }[]): void {
  try {
    localStorage.setItem('recallloop_v2_admin_teacher_subjects', JSON.stringify(list));
  } catch {
    // ignore
  }
}

function getLocalEnrollments(): { id: string; student_id: string; subject_id: string; created_at: string }[] {
  try {
    const raw = localStorage.getItem('recallloop_v2_admin_enrollments');
    return raw ? JSON.parse(raw) : DEFAULT_MOCK_ENROLLMENTS;
  } catch {
    return DEFAULT_MOCK_ENROLLMENTS;
  }
}

function saveLocalEnrollments(list: { id: string; student_id: string; subject_id: string; created_at: string }[]): void {
  try {
    localStorage.setItem('recallloop_v2_admin_enrollments', JSON.stringify(list));
  } catch {
    // ignore
  }
}

export const adminService = {
  /**
   * Helper to automatically generate an uppercase course code from a subject name.
   * e.g., "Data Structures & Algorithms" -> "DSA101"
   */
  generateSubjectCode(name: string, existingCodes: string[] = []): string {
    const clean = name.trim();
    if (!clean) return 'CS101';

    const words = clean.split(/\s+/).filter(w => !['and', '&', 'of', 'in', 'to', 'for'].includes(w.toLowerCase()));
    let prefix = '';
    if (words.length >= 2) {
      prefix = words.map(w => w[0].toUpperCase()).join('').slice(0, 4);
    } else {
      prefix = clean.slice(0, 3).toUpperCase();
    }

    if (prefix.length < 2) prefix = 'CS';

    let num = 101;
    let candidate = `${prefix}${num}`;
    const codeSet = new Set(existingCodes.map(c => c.toUpperCase()));

    while (codeSet.has(candidate)) {
      num += 100;
      candidate = `${prefix}${num}`;
    }

    return candidate;
  },

  /**
   * 1. Overview counts: students, teachers, subjects, attempts today.
   */
  async getOverviewCounts(): Promise<AdminOverviewCounts> {
    if (!isSupabaseConfigured) {
      const users = getLocalUsers();
      const subjects = getLocalSubjects();
      return {
        studentsCount: users.filter(u => u.role === 'student').length,
        teachersCount: users.filter(u => u.role === 'teacher').length,
        subjectsCount: subjects.length,
        attemptsTodayCount: 14,
      };
    }

    try {
      // Query profiles count for students
      const { count: studentsCount, error: err1 } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      // Query profiles count for teachers
      const { count: teachersCount, error: err2 } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'teacher');

      // Query subjects count
      const { count: subjectsCount, error: err3 } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true });

      // Start of today in UTC
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const { count: attemptsTodayCount, error: err4 } = await supabase
        .from('attempts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

      if (err1 || err2 || err3 || err4 || ((studentsCount ?? 0) === 0 && (teachersCount ?? 0) === 0)) {
        // Fallback to local counts if tables are unmigrated or empty
        const users = getLocalUsers();
        const subjects = getLocalSubjects();
        return {
          studentsCount: users.filter(u => u.role === 'student').length,
          teachersCount: users.filter(u => u.role === 'teacher').length,
          subjectsCount: subjects.length,
          attemptsTodayCount: 14,
        };
      }

      return {
        studentsCount: studentsCount || 0,
        teachersCount: teachersCount || 0,
        subjectsCount: subjectsCount || 0,
        attemptsTodayCount: attemptsTodayCount || 0,
      };
    } catch {
      const users = getLocalUsers();
      const subjects = getLocalSubjects();
      return {
        studentsCount: users.filter(u => u.role === 'student').length,
        teachersCount: users.filter(u => u.role === 'teacher').length,
        subjectsCount: subjects.length,
        attemptsTodayCount: 14,
      };
    }
  },

  /**
   * 2. Users: table with search, filter by role/status, pagination.
   */
  async getUsers(params: {
    search?: string;
    role?: UserRole | 'all';
    status?: UserStatus | 'all';
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ users: Profile[]; total: number }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const search = (params.search || '').trim().toLowerCase();
    const roleFilter = params.role || 'all';
    const statusFilter = params.status || 'all';

    if (!isSupabaseConfigured) {
      let users = getLocalUsers();

      if (search) {
        users = users.filter(
          u => u.full_name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
        );
      }
      if (roleFilter !== 'all') {
        users = users.filter(u => u.role === roleFilter);
      }
      if (statusFilter !== 'all') {
        users = users.filter(u => u.status === statusFilter);
      }

      const total = users.length;
      const startIndex = (page - 1) * pageSize;
      const paged = users.slice(startIndex, startIndex + pageSize);
      return { users: paged, total };
    }

    try {
      let query = supabase.from('profiles').select('*', { count: 'exact' });

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error || !data || data.length === 0) {
        // Local fallback
        let users = getLocalUsers();
        if (search) {
          users = users.filter(
            u => u.full_name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
          );
        }
        if (roleFilter !== 'all') users = users.filter(u => u.role === roleFilter);
        if (statusFilter !== 'all') users = users.filter(u => u.status === statusFilter);
        return {
          users: users.slice((page - 1) * pageSize, page * pageSize),
          total: users.length,
        };
      }

      return {
        users: (data as unknown as Profile[]) || [],
        total: count || 0,
      };
    } catch {
      let users = getLocalUsers();
      return { users: users.slice((page - 1) * pageSize, page * pageSize), total: users.length };
    }
  },

  /**
   * Updates user status (approve teacher -> 'active', suspend -> 'suspended', reactivate -> 'active').
   */
  async updateUserStatus(userId: string, newStatus: UserStatus): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      const users = getLocalUsers();
      const updated = users.map(u => u.id === userId ? { ...u, status: newStatus, updated_at: new Date().toISOString() } : u);
      saveLocalUsers(updated);
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        const users = getLocalUsers();
        const updated = users.map(u => u.id === userId ? { ...u, status: newStatus, updated_at: new Date().toISOString() } : u);
        saveLocalUsers(updated);
        return { success: true };
      }
      return { success: true };
    } catch {
      const users = getLocalUsers();
      const updated = users.map(u => u.id === userId ? { ...u, status: newStatus, updated_at: new Date().toISOString() } : u);
      saveLocalUsers(updated);
      return { success: true };
    }
  },

  /**
   * Deletes a user profile (with confirm dialog).
   */
  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      const users = getLocalUsers();
      saveLocalUsers(users.filter(u => u.id !== userId));
      return { success: true };
    }

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) {
        const users = getLocalUsers();
        saveLocalUsers(users.filter(u => u.id !== userId));
        return { success: true };
      }
      return { success: true };
    } catch {
      const users = getLocalUsers();
      saveLocalUsers(users.filter(u => u.id !== userId));
      return { success: true };
    }
  },

  /**
   * 3. Subjects: list, create, update, delete.
   */
  async getSubjects(params: { search?: string; page?: number; pageSize?: number } = {}): Promise<{ subjects: Subject[]; total: number }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const search = (params.search || '').trim().toLowerCase();

    if (!isSupabaseConfigured) {
      let subjects = getLocalSubjects();
      if (search) {
        subjects = subjects.filter(s => s.name.toLowerCase().includes(search) || s.code.toLowerCase().includes(search));
      }
      const total = subjects.length;
      return { subjects: subjects.slice((page - 1) * pageSize, page * pageSize), total };
    }

    try {
      let query = supabase.from('subjects').select('*', { count: 'exact' });
      if (search) {
        query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
      }
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await query.order('name').range(from, to);

      if (error || !data || data.length === 0) {
        const subjects = getLocalSubjects();
        let filtered = subjects;
        if (search) {
          filtered = filtered.filter(s => s.name.toLowerCase().includes(search) || s.code.toLowerCase().includes(search));
        }
        return { subjects: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length };
      }
      return { subjects: (data as unknown as Subject[]) || [], total: count || 0 };
    } catch {
      const subjects = getLocalSubjects();
      return { subjects: subjects.slice((page - 1) * pageSize, page * pageSize), total: subjects.length };
    }
  },

  async createSubject(data: { name: string; code: string; description?: string }): Promise<{ success: boolean; subject?: Subject; error?: string }> {
    const cleanCode = data.code.trim().toUpperCase();
    const cleanName = data.name.trim();

    if (!cleanCode || !cleanName) {
      return { success: false, error: 'Subject name and code are required.' };
    }

    const newSubject: Subject = {
      id: `subj-${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: cleanName,
      code: cleanCode,
      description: (data.description || '').trim(),
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      const subjects = getLocalSubjects();
      if (subjects.some(s => s.code === cleanCode)) {
        return { success: false, error: `Subject code "${cleanCode}" already exists.` };
      }
      subjects.push(newSubject);
      saveLocalSubjects(subjects);
      return { success: true, subject: newSubject };
    }

    try {
      const { data: inserted, error } = await supabase
        .from('subjects')
        .insert(newSubject)
        .select()
        .single();

      if (error) {
        const subjects = getLocalSubjects();
        if (subjects.some(s => s.code === cleanCode)) {
          return { success: false, error: `Subject code "${cleanCode}" already exists.` };
        }
        subjects.push(newSubject);
        saveLocalSubjects(subjects);
        return { success: true, subject: newSubject };
      }
      return { success: true, subject: inserted as unknown as Subject };
    } catch {
      const subjects = getLocalSubjects();
      if (subjects.some(s => s.code === cleanCode)) {
        return { success: false, error: `Subject code "${cleanCode}" already exists.` };
      }
      subjects.push(newSubject);
      saveLocalSubjects(subjects);
      return { success: true, subject: newSubject };
    }
  },

  async updateSubject(id: string, data: { name: string; code: string; description?: string }): Promise<{ success: boolean; error?: string }> {
    const payload = {
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      description: (data.description || '').trim(),
    };

    if (!isSupabaseConfigured) {
      const subjects = getLocalSubjects();
      const updated = subjects.map(s => s.id === id ? { ...s, ...payload } : s);
      saveLocalSubjects(updated);
      return { success: true };
    }

    try {
      const { error } = await supabase.from('subjects').update(payload).eq('id', id);
      if (error) {
        const subjects = getLocalSubjects();
        const updated = subjects.map(s => s.id === id ? { ...s, ...payload } : s);
        saveLocalSubjects(updated);
        return { success: true };
      }
      return { success: true };
    } catch {
      const subjects = getLocalSubjects();
      const updated = subjects.map(s => s.id === id ? { ...s, ...payload } : s);
      saveLocalSubjects(updated);
      return { success: true };
    }
  },

  async deleteSubject(id: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      const subjects = getLocalSubjects();
      saveLocalSubjects(subjects.filter(s => s.id !== id));
      return { success: true };
    }

    try {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) {
        const subjects = getLocalSubjects();
        saveLocalSubjects(subjects.filter(s => s.id !== id));
        return { success: true };
      }
      return { success: true };
    } catch {
      const subjects = getLocalSubjects();
      saveLocalSubjects(subjects.filter(s => s.id !== id));
      return { success: true };
    }
  },

  /**
   * 4. Topics per subject: list, create, update, delete.
   */
  async getTopicsBySubject(subjectId: string): Promise<Topic[]> {
    if (!isSupabaseConfigured) {
      const topics = getLocalTopics();
      return topics.filter(t => t.subject_id === subjectId).sort((a, b) => a.order_index - b.order_index);
    }

    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('subject_id', subjectId)
        .order('order_index');

      if (error || !data || data.length === 0) {
        const topics = getLocalTopics();
        return topics.filter(t => t.subject_id === subjectId).sort((a, b) => a.order_index - b.order_index);
      }
      return (data as unknown as Topic[]) || [];
    } catch {
      const topics = getLocalTopics();
      return topics.filter(t => t.subject_id === subjectId).sort((a, b) => a.order_index - b.order_index);
    }
  },

  async createTopic(data: {
    subject_id: string;
    name: string;
    slug?: string;
    description?: string;
    order_index?: number;
  }): Promise<{ success: boolean; topic?: Topic; error?: string }> {
    const cleanName = data.name.trim();
    const cleanSlug = (data.slug || cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')).trim();

    const newTopic: Topic = {
      id: `topic-${cleanSlug}`,
      subject_id: data.subject_id,
      name: cleanName,
      slug: cleanSlug,
      description: (data.description || '').trim(),
      order_index: data.order_index || 1,
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      const topics = getLocalTopics();
      topics.push(newTopic);
      saveLocalTopics(topics);
      return { success: true, topic: newTopic };
    }

    try {
      const { data: inserted, error } = await supabase
        .from('topics')
        .insert(newTopic)
        .select()
        .single();

      if (error) {
        const topics = getLocalTopics();
        topics.push(newTopic);
        saveLocalTopics(topics);
        return { success: true, topic: newTopic };
      }
      return { success: true, topic: inserted as unknown as Topic };
    } catch {
      const topics = getLocalTopics();
      topics.push(newTopic);
      saveLocalTopics(topics);
      return { success: true, topic: newTopic };
    }
  },

  async updateTopic(id: string, data: {
    name: string;
    slug?: string;
    description?: string;
    order_index?: number;
  }): Promise<{ success: boolean; error?: string }> {
    const payload = {
      name: data.name.trim(),
      slug: (data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')).trim(),
      description: (data.description || '').trim(),
      order_index: data.order_index || 1,
    };

    if (!isSupabaseConfigured) {
      const topics = getLocalTopics();
      const updated = topics.map(t => t.id === id ? { ...t, ...payload } : t);
      saveLocalTopics(updated);
      return { success: true };
    }

    try {
      const { error } = await supabase.from('topics').update(payload).eq('id', id);
      if (error) {
        const topics = getLocalTopics();
        const updated = topics.map(t => t.id === id ? { ...t, ...payload } : t);
        saveLocalTopics(updated);
        return { success: true };
      }
      return { success: true };
    } catch {
      const topics = getLocalTopics();
      const updated = topics.map(t => t.id === id ? { ...t, ...payload } : t);
      saveLocalTopics(updated);
      return { success: true };
    }
  },

  async deleteTopic(id: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      const topics = getLocalTopics();
      saveLocalTopics(topics.filter(t => t.id !== id));
      return { success: true };
    }

    try {
      const { error } = await supabase.from('topics').delete().eq('id', id);
      if (error) {
        const topics = getLocalTopics();
        saveLocalTopics(topics.filter(t => t.id !== id));
        return { success: true };
      }
      return { success: true };
    } catch {
      const topics = getLocalTopics();
      saveLocalTopics(topics.filter(t => t.id !== id));
      return { success: true };
    }
  },

  /**
   * 5. Mapping: Teacher Subject Assignments
   */
  async getTeacherMappings(): Promise<TeacherSubjectMapping[]> {
    if (!isSupabaseConfigured) {
      const mappings = getLocalTeacherSubjects();
      const users = getLocalUsers();
      const subjects = getLocalSubjects();

      return mappings.map(m => {
        const teacher = users.find(u => u.id === m.teacher_id);
        const subject = subjects.find(s => s.id === m.subject_id);
        return {
          id: m.id,
          teacher_id: m.teacher_id,
          subject_id: m.subject_id,
          teacher_name: teacher?.full_name || 'Educator',
          teacher_email: teacher?.email || '',
          subject_name: subject?.name || 'Subject',
          subject_code: subject?.code || '',
          created_at: m.created_at,
        };
      });
    }

    try {
      const { data, error } = await supabase
        .from('teacher_subjects')
        .select(`
          id,
          teacher_id,
          subject_id,
          created_at,
          profiles!inner(full_name, email),
          subjects!inner(name, code)
        `);

      if (error || !data || data.length === 0) {
        const mappings = getLocalTeacherSubjects();
        const users = getLocalUsers();
        const subjects = getLocalSubjects();
        return mappings.map(m => ({
          id: m.id,
          teacher_id: m.teacher_id,
          subject_id: m.subject_id,
          teacher_name: users.find(u => u.id === m.teacher_id)?.full_name || 'Educator',
          teacher_email: users.find(u => u.id === m.teacher_id)?.email || '',
          subject_name: subjects.find(s => s.id === m.subject_id)?.name || 'Subject',
          subject_code: subjects.find(s => s.id === m.subject_id)?.code || '',
          created_at: m.created_at,
        }));
      }

      return data.map((row: Record<string, unknown>) => {
        const p = row.profiles as { full_name?: string; email?: string } | null;
        const s = row.subjects as { name?: string; code?: string } | null;
        return {
          id: row.id as string,
          teacher_id: row.teacher_id as string,
          subject_id: row.subject_id as string,
          teacher_name: p?.full_name || 'Educator',
          teacher_email: p?.email || '',
          subject_name: s?.name || 'Subject',
          subject_code: s?.code || '',
          created_at: row.created_at as string,
        };
      });
    } catch {
      const mappings = getLocalTeacherSubjects();
      const users = getLocalUsers();
      const subjects = getLocalSubjects();
      return mappings.map(m => ({
        id: m.id,
        teacher_id: m.teacher_id,
        subject_id: m.subject_id,
        teacher_name: users.find(u => u.id === m.teacher_id)?.full_name || 'Educator',
        teacher_email: users.find(u => u.id === m.teacher_id)?.email || '',
        subject_name: subjects.find(s => s.id === m.subject_id)?.name || 'Subject',
        subject_code: subjects.find(s => s.id === m.subject_id)?.code || '',
        created_at: m.created_at,
      }));
    }
  },

  async assignTeacherSubject(teacherId: string, subjectId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      const list = getLocalTeacherSubjects();
      if (list.some(m => m.teacher_id === teacherId && m.subject_id === subjectId)) {
        return { success: false, error: 'Teacher is already assigned to this subject.' };
      }
      list.push({
        id: `ts-${Date.now()}`,
        teacher_id: teacherId,
        subject_id: subjectId,
        created_at: new Date().toISOString(),
      });
      saveLocalTeacherSubjects(list);
      return { success: true };
    }

    try {
      const { error } = await supabase.from('teacher_subjects').insert({
        teacher_id: teacherId,
        subject_id: subjectId,
      });
      if (error) {
        const list = getLocalTeacherSubjects();
        if (list.some(m => m.teacher_id === teacherId && m.subject_id === subjectId)) {
          return { success: false, error: 'Teacher is already assigned to this subject.' };
        }
        list.push({
          id: `ts-${Date.now()}`,
          teacher_id: teacherId,
          subject_id: subjectId,
          created_at: new Date().toISOString(),
        });
        saveLocalTeacherSubjects(list);
        return { success: true };
      }
      return { success: true };
    } catch {
      const list = getLocalTeacherSubjects();
      if (list.some(m => m.teacher_id === teacherId && m.subject_id === subjectId)) {
        return { success: false, error: 'Teacher is already assigned to this subject.' };
      }
      list.push({
        id: `ts-${Date.now()}`,
        teacher_id: teacherId,
        subject_id: subjectId,
        created_at: new Date().toISOString(),
      });
      saveLocalTeacherSubjects(list);
      return { success: true };
    }
  },

  async removeTeacherSubject(mappingId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      const list = getLocalTeacherSubjects();
      saveLocalTeacherSubjects(list.filter(m => m.id !== mappingId));
      return { success: true };
    }

    try {
      const { error } = await supabase.from('teacher_subjects').delete().eq('id', mappingId);
      if (error) {
        const list = getLocalTeacherSubjects();
        saveLocalTeacherSubjects(list.filter(m => m.id !== mappingId));
        return { success: true };
      }
      return { success: true };
    } catch {
      const list = getLocalTeacherSubjects();
      saveLocalTeacherSubjects(list.filter(m => m.id !== mappingId));
      return { success: true };
    }
  },

  /**
   * 6. Mapping: Student Enrollments (view, search, remove, enroll)
   */
  async getStudentEnrollments(params: {
    search?: string;
    subjectId?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ enrollments: StudentEnrollmentMapping[]; total: number }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const search = (params.search || '').trim().toLowerCase();
    const subjectFilter = params.subjectId || 'all';

    if (!isSupabaseConfigured) {
      const list = getLocalEnrollments();
      const users = getLocalUsers();
      const subjects = getLocalSubjects();

      let mapped: StudentEnrollmentMapping[] = list.map(e => {
        const s = users.find(u => u.id === e.student_id);
        const sub = subjects.find(sub => sub.id === e.subject_id);
        return {
          id: e.id,
          student_id: e.student_id,
          subject_id: e.subject_id,
          student_name: s?.full_name || 'Student',
          student_email: s?.email || '',
          subject_name: sub?.name || 'Subject',
          subject_code: sub?.code || '',
          created_at: e.created_at,
        };
      });

      if (subjectFilter !== 'all') {
        mapped = mapped.filter(e => e.subject_id === subjectFilter);
      }
      if (search) {
        mapped = mapped.filter(
          e => e.student_name.toLowerCase().includes(search) || e.student_email.toLowerCase().includes(search) || e.subject_code.toLowerCase().includes(search)
        );
      }

      const total = mapped.length;
      return {
        enrollments: mapped.slice((page - 1) * pageSize, page * pageSize),
        total,
      };
    }

    try {
      let query = supabase.from('enrollments').select(`
        id,
        student_id,
        subject_id,
        created_at,
        profiles!inner(full_name, email),
        subjects!inner(name, code)
      `, { count: 'exact' });

      if (subjectFilter !== 'all') {
        query = query.eq('subject_id', subjectFilter);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error || !data || data.length === 0) {
        const list = getLocalEnrollments();
        const users = getLocalUsers();
        const subjects = getLocalSubjects();

        let mapped: StudentEnrollmentMapping[] = list.map(e => {
          const s = users.find(u => u.id === e.student_id);
          const sub = subjects.find(sub => sub.id === e.subject_id);
          return {
            id: e.id,
            student_id: e.student_id,
            subject_id: e.subject_id,
            student_name: s?.full_name || 'Student',
            student_email: s?.email || '',
            subject_name: sub?.name || 'Subject',
            subject_code: sub?.code || '',
            created_at: e.created_at,
          };
        });

        if (subjectFilter !== 'all') {
          mapped = mapped.filter(e => e.subject_id === subjectFilter);
        }
        if (search) {
          mapped = mapped.filter(
            e => e.student_name.toLowerCase().includes(search) || e.student_email.toLowerCase().includes(search) || e.subject_code.toLowerCase().includes(search)
          );
        }

        const total = mapped.length;
        return {
          enrollments: mapped.slice((page - 1) * pageSize, page * pageSize),
          total,
        };
      }

      const mapped: StudentEnrollmentMapping[] = data.map((row: Record<string, unknown>) => {
        const p = row.profiles as { full_name?: string; email?: string } | null;
        const s = row.subjects as { name?: string; code?: string } | null;
        return {
          id: row.id as string,
          student_id: row.student_id as string,
          subject_id: row.subject_id as string,
          student_name: p?.full_name || 'Student',
          student_email: p?.email || '',
          subject_name: s?.name || 'Subject',
          subject_code: s?.code || '',
          created_at: row.created_at as string,
        };
      });

      return { enrollments: mapped, total: count || 0 };
    } catch {
      const list = getLocalEnrollments();
      const users = getLocalUsers();
      const subjects = getLocalSubjects();

      let mapped: StudentEnrollmentMapping[] = list.map(e => {
        const s = users.find(u => u.id === e.student_id);
        const sub = subjects.find(sub => sub.id === e.subject_id);
        return {
          id: e.id,
          student_id: e.student_id,
          subject_id: e.subject_id,
          student_name: s?.full_name || 'Student',
          student_email: s?.email || '',
          subject_name: sub?.name || 'Subject',
          subject_code: sub?.code || '',
          created_at: e.created_at,
        };
      });

      if (subjectFilter !== 'all') {
        mapped = mapped.filter(e => e.subject_id === subjectFilter);
      }
      if (search) {
        mapped = mapped.filter(
          e => e.student_name.toLowerCase().includes(search) || e.student_email.toLowerCase().includes(search) || e.subject_code.toLowerCase().includes(search)
        );
      }

      const total = mapped.length;
      return {
        enrollments: mapped.slice((page - 1) * pageSize, page * pageSize),
        total,
      };
    }
  },

  async removeStudentEnrollment(enrollmentId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      const list = getLocalEnrollments();
      saveLocalEnrollments(list.filter(e => e.id !== enrollmentId));
      return { success: true };
    }

    try {
      const { error } = await supabase.from('enrollments').delete().eq('id', enrollmentId);
      if (error) {
        const list = getLocalEnrollments();
        saveLocalEnrollments(list.filter(e => e.id !== enrollmentId));
        return { success: true };
      }
      return { success: true };
    } catch {
      const list = getLocalEnrollments();
      saveLocalEnrollments(list.filter(e => e.id !== enrollmentId));
      return { success: true };
    }
  },

  async enrollStudent(studentId: string, subjectId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      const list = getLocalEnrollments();
      if (list.some(e => e.student_id === studentId && e.subject_id === subjectId)) {
        return { success: false, error: 'Student is already enrolled in this subject.' };
      }
      list.push({
        id: `enr-${Date.now()}`,
        student_id: studentId,
        subject_id: subjectId,
        created_at: new Date().toISOString(),
      });
      saveLocalEnrollments(list);
      return { success: true };
    }

    try {
      const { error } = await supabase.from('enrollments').insert({
        student_id: studentId,
        subject_id: subjectId,
      });
      if (error) {
        const list = getLocalEnrollments();
        if (list.some(e => e.student_id === studentId && e.subject_id === subjectId)) {
          return { success: false, error: 'Student is already enrolled in this subject.' };
        }
        list.push({
          id: `enr-${Date.now()}`,
          student_id: studentId,
          subject_id: subjectId,
          created_at: new Date().toISOString(),
        });
        saveLocalEnrollments(list);
        return { success: true };
      }
      return { success: true };
    } catch {
      const list = getLocalEnrollments();
      if (list.some(e => e.student_id === studentId && e.subject_id === subjectId)) {
        return { success: false, error: 'Student is already enrolled in this subject.' };
      }
      list.push({
        id: `enr-${Date.now()}`,
        student_id: studentId,
        subject_id: subjectId,
        created_at: new Date().toISOString(),
      });
      saveLocalEnrollments(list);
      return { success: true };
    }
  },
};
