import { describe, it, expect, beforeEach } from 'vitest';
import { adminService } from './admin.service';

describe('adminService', () => {
  beforeEach(() => {
    // Clear localStorage before each test so tests are idempotent
    localStorage.clear();
  });

  describe('generateSubjectCode helper', () => {
    it('generates an acronym-based course code from multi-word titles', () => {
      const code = adminService.generateSubjectCode('Data Structures & Algorithms');
      expect(code).toBe('DSA101');
    });

    it('filters out common conjunctions and prepositions', () => {
      const code = adminService.generateSubjectCode('Principles of Operating Systems');
      expect(code).toBe('POS101');
    });

    it('increments course number if code already exists in existingCodes', () => {
      const code = adminService.generateSubjectCode('Data Structures & Algorithms', ['DSA101', 'DSA201']);
      expect(code).toBe('DSA301');
    });

    it('falls back to default prefix when string is empty or whitespace', () => {
      const code = adminService.generateSubjectCode('   ');
      expect(code).toBe('CS101');
    });

    it('handles single word titles', () => {
      const code = adminService.generateSubjectCode('Python');
      expect(code).toBe('PYT101');
    });
  });

  describe('getOverviewCounts', () => {
    it('returns positive counts for students, teachers, subjects, and attempts', async () => {
      const counts = await adminService.getOverviewCounts();
      expect(counts).toBeDefined();
      expect(counts.studentsCount).toBeGreaterThanOrEqual(1);
      expect(counts.teachersCount).toBeGreaterThanOrEqual(1);
      expect(counts.subjectsCount).toBeGreaterThanOrEqual(1);
      expect(typeof counts.attemptsTodayCount).toBe('number');
    });
  });

  describe('User Management', () => {
    it('retrieves paginated users and filters by role', async () => {
      const allResult = await adminService.getUsers({ page: 1, pageSize: 20 });
      expect(allResult.total).toBeGreaterThan(0);
      expect(allResult.users.length).toBeGreaterThan(0);

      const teachersResult = await adminService.getUsers({ role: 'teacher' });
      expect(teachersResult.users.every(u => u.role === 'teacher')).toBe(true);

      const studentsResult = await adminService.getUsers({ role: 'student' });
      expect(studentsResult.users.every(u => u.role === 'student')).toBe(true);
    });

    it('filters users by search query (name or email)', async () => {
      const searchResult = await adminService.getUsers({ search: 'Lovelace' });
      expect(searchResult.users.length).toBeGreaterThanOrEqual(1);
      expect(searchResult.users[0].full_name).toContain('Lovelace');
    });

    it('approves, suspends, and reactivates a user status', async () => {
      // Find a pending user or test on known ID
      const usersRes = await adminService.getUsers({ status: 'pending' });
      const pendingUser = usersRes.users[0];

      if (pendingUser) {
        // Approve
        const approveRes = await adminService.updateUserStatus(pendingUser.id, 'active');
        expect(approveRes.success).toBe(true);

        // Suspend
        const suspendRes = await adminService.updateUserStatus(pendingUser.id, 'suspended');
        expect(suspendRes.success).toBe(true);

        // Reactivate
        const reactivateRes = await adminService.updateUserStatus(pendingUser.id, 'active');
        expect(reactivateRes.success).toBe(true);
      }
    });
  });

  describe('Curriculum Subjects & Topics', () => {
    it('creates a new subject and rejects duplicates', async () => {
      const createRes = await adminService.createSubject({
        name: 'Database Systems',
        code: 'DBS301',
        description: 'Relational algebra, SQL, index trees, and ACID transactions.',
      });

      expect(createRes.success).toBe(true);
      expect(createRes.subject?.code).toBe('DBS301');

      // Attempt duplicate code
      const duplicateRes = await adminService.createSubject({
        name: 'Duplicate Database Systems',
        code: 'DBS301',
      });
      expect(duplicateRes.success).toBe(false);
      expect(duplicateRes.error).toContain('already exists');
    });

    it('retrieves and manages topics per subject', async () => {
      const topics = await adminService.getTopicsBySubject('subj-cs101');
      expect(topics.length).toBeGreaterThanOrEqual(1);
      expect(topics[0].order_index).toBeLessThanOrEqual(topics[topics.length - 1].order_index);

      const newTopicRes = await adminService.createTopic({
        subject_id: 'subj-cs101',
        name: 'Recursion and Stack Frames',
        slug: 'recursion',
        description: 'Base conditions, call stack memory, and tail-call recursion.',
        order_index: 5,
      });

      expect(newTopicRes.success).toBe(true);
      expect(newTopicRes.topic?.name).toBe('Recursion and Stack Frames');
    });
  });

  describe('Teacher Mappings & Student Enrollments', () => {
    it('assigns an active teacher to a subject and prevents duplicate assignment', async () => {
      const assignRes = await adminService.assignTeacherSubject('teacher-mock-1', 'subj-cs201');
      expect(assignRes.success).toBe(true);

      const duplicateRes = await adminService.assignTeacherSubject('teacher-mock-1', 'subj-cs201');
      expect(duplicateRes.success).toBe(false);
      expect(duplicateRes.error).toContain('already assigned');

      const mappings = await adminService.getTeacherMappings();
      expect(mappings.some(m => m.teacher_id === 'teacher-mock-1' && m.subject_id === 'subj-cs201')).toBe(true);
    });

    it('retrieves student enrollments with pagination and filters by subject', async () => {
      const enrollmentsRes = await adminService.getStudentEnrollments({ page: 1, pageSize: 10 });
      expect(enrollmentsRes.total).toBeGreaterThanOrEqual(1);
      expect(enrollmentsRes.enrollments.length).toBeGreaterThanOrEqual(1);

      const filteredRes = await adminService.getStudentEnrollments({ subjectId: 'subj-cs101' });
      expect(filteredRes.enrollments.every(e => e.subject_id === 'subj-cs101')).toBe(true);
    });

    it('enrolls a student in a subject and removes enrollment', async () => {
      const enrollRes = await adminService.enrollStudent('student-mock-3', 'subj-cs201');
      expect(enrollRes.success).toBe(true);

      // Verify enrolled
      const checkRes = await adminService.getStudentEnrollments({ search: 'Turing' });
      const enrollment = checkRes.enrollments.find(e => e.subject_code === 'CS201');
      expect(enrollment).toBeDefined();

      if (enrollment) {
        // Remove enrollment
        const removeRes = await adminService.removeStudentEnrollment(enrollment.id);
        expect(removeRes.success).toBe(true);
      }
    });
  });
});
