import { describe, it, expect, beforeEach } from 'vitest';
import { teacherService } from './teacher.service';

describe('teacherService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getTeacherSubject', () => {
    it('returns the assigned subject and its syllabus topics', async () => {
      const info = await teacherService.getTeacherSubject('teacher-mock-1');
      expect(info.subject).toBeDefined();
      expect(info.subject.code).toBe('CS101');
      expect(info.topics.length).toBeGreaterThanOrEqual(1);
      expect(info.topics.some(t => t.name === 'Pointers')).toBe(true);
    });
  });

  describe('generateQuizQuestions and publishing pipeline', () => {
    const today = new Date().toISOString().split('T')[0];

    it('generates 5 validated draft questions (2 easy, 2 medium, 1 hard)', async () => {
      const genResult = await teacherService.generateQuizQuestions({
        subjectId: 'subj-cs101',
        topicId: 'topic-pointers',
        assignedDate: today,
        teacherId: 'teacher-mock-1',
      });

      expect(genResult.success).toBe(true);
      expect(genResult.status).toBe('draft');
      expect(genResult.questions?.length).toBe(5);

      const difficulties = genResult.questions?.map(q => q.difficulty);
      expect(difficulties?.filter(d => d === 'easy').length).toBe(2);
      expect(difficulties?.filter(d => d === 'medium').length).toBe(2);
      expect(difficulties?.filter(d => d === 'hard').length).toBe(1);

      // Verify each question has 4 distinct options and correct_index in bounds
      genResult.questions?.forEach(q => {
        expect(q.options.length).toBe(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.correct_index).toBeGreaterThanOrEqual(0);
        expect(q.correct_index).toBeLessThanOrEqual(3);
        expect(q.wrong_reasons.length).toBe(4);
      });
    });

    it('publishes the draft assignment and updates status to published', async () => {
      const genResult = await teacherService.generateQuizQuestions({
        subjectId: 'subj-cs101',
        topicId: 'topic-loops',
        assignedDate: '2026-10-29',
        teacherId: 'teacher-mock-1',
      });

      expect(genResult.success).toBe(true);
      const assignmentId = genResult.assignmentId!;

      const publishResult = await teacherService.publishAssignment({
        assignmentId,
        subjectId: 'subj-cs101',
        topicId: 'topic-loops',
        assignedDate: '2026-10-29',
      });

      expect(publishResult.success).toBe(true);

      const updated = await teacherService.getTodayAssignment('subj-cs101', '2026-10-29');
      expect(updated?.status).toBe('published');
    });

    it('blocks generating a second topic for the same date when published', async () => {
      // Create and publish an assignment for a test date
      const testDate = '2026-11-01';
      const genRes = await teacherService.generateQuizQuestions({
        subjectId: 'subj-cs101',
        topicId: 'topic-arrays',
        assignedDate: testDate,
        teacherId: 'teacher-mock-1',
      });

      await teacherService.publishAssignment({
        assignmentId: genRes.assignmentId!,
        subjectId: 'subj-cs101',
        topicId: 'topic-arrays',
        assignedDate: testDate,
      });

      // Attempt to assign another topic on the same date
      const secondGenRes = await teacherService.generateQuizQuestions({
        subjectId: 'subj-cs101',
        topicId: 'topic-pointers',
        assignedDate: testDate,
        teacherId: 'teacher-mock-1',
      });

      expect(secondGenRes.success).toBe(false);
      expect(secondGenRes.error).toContain('already exists for today');
    });
  });

  describe('getClassOverview', () => {
    it('returns per-topic mastery, struggling students, and completed counts', async () => {
      const today = new Date().toISOString().split('T')[0];
      const overview = await teacherService.getClassOverview('subj-cs101', today);

      expect(overview.totalEnrolledStudents).toBeGreaterThan(0);
      expect(typeof overview.completedTodayCount).toBe('number');
      expect(overview.topicSummaries.length).toBeGreaterThanOrEqual(1);

      // Verify status mapping obeys rules (strong, developing, weak, not_assessed)
      overview.topicSummaries.forEach(ts => {
        expect(['strong', 'developing', 'weak', 'not_assessed']).toContain(ts.status);
      });

      expect(overview.strugglingStudents.length).toBeGreaterThan(0);
      expect(overview.strugglingStudents[0].weakTopicName).toBeDefined();
    });
  });
});
