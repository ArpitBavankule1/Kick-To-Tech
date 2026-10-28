import { describe, it, expect, beforeEach } from 'vitest';
import { studentService } from './student.service';
import type { DbQuestion } from '../types/database';

describe('studentService telemetry and quiz workflows', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retrieves default enrolled subjects for student when storage is empty', async () => {
    const list = await studentService.getEnrolledSubjects('std-test-1');
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].code).toBe('CS101');
    expect(list[0].name).toBe('Programming in C');
  });

  it('rejects enrollment with an invalid subject code', async () => {
    const res = await studentService.enrollInSubject('std-test-1', 'INVALID999');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/invalid|not found/i);
  });

  it('rejects duplicate enrollment in an already joined subject', async () => {
    // CS101 is already enrolled by default
    const res = await studentService.enrollInSubject('std-test-1', 'CS101');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/already enrolled/i);
  });

  it('enrolls student into a new valid subject code', async () => {
    const res = await studentService.enrollInSubject('std-test-1', 'DATA200');
    expect(res.success).toBe(true);
    expect(res.subject).toBeDefined();
    expect(res.subject?.code).toBe('DATA200');

    // Confirm it appears in enrolled list
    const updated = await studentService.getEnrolledSubjects('std-test-1');
    expect(updated.some((s) => s.code === 'DATA200')).toBe(true);
  });

  it('fetches topics ordered by order_index for a subject', async () => {
    const topics = await studentService.getSubjectTopics('subj-cs101');
    expect(topics.length).toBeGreaterThan(0);
    expect(topics[0].order_index).toBe(1);
    expect(topics[0].slug).toBe('arrays');
  });

  it('fetches today assignment strictly when status is published', async () => {
    const today = new Date().toISOString().split('T')[0];
    const asgn = await studentService.getTodayAssignment('subj-cs101', today);
    expect(asgn).not.toBeNull();
    expect(asgn?.status).toBe('published');
  });

  it('fetches assignment questions with 4 options and wrong_reasons', async () => {
    const questions = await studentService.getAssignmentQuestions(
      'asgn-1',
      'subj-cs101',
      'topic-pointers'
    );
    expect(questions.length).toBeGreaterThan(0);
    const q = questions[0];
    expect(q.options).toHaveLength(4);
    expect(q.correct_index).toBeGreaterThanOrEqual(0);
    expect(q.correct_index).toBeLessThanOrEqual(3);
    expect(Array.isArray(q.wrong_reasons)).toBe(true);
  });

  it('submits a correct quiz attempt and records it in student attempts', async () => {
    const mockQuestion: DbQuestion = {
      id: 'q-test-1',
      subject_id: 'subj-cs101',
      topic_id: 'topic-pointers',
      teacher_id: 'teacher-1',
      concept: 'Pointer Arithmetic',
      question: 'What is sizeof(int*) on a 64-bit platform?',
      code_snippet: null,
      options: ['2 bytes', '4 bytes', '8 bytes', '16 bytes'],
      correct_index: 2,
      wrong_reasons: [
        '16-bit legacy offset.',
        '32-bit architecture size.',
        'Correct.',
        'Excessive quadword offset.',
      ],
      explanation: 'Pointer addresses on 64-bit machines are 8 bytes long.',
      difficulty: 'medium',
      status: 'published',
      created_at: new Date().toISOString(),
    };

    const res = await studentService.submitQuizAttempt({
      studentId: 'std-test-1',
      subjectId: 'subj-cs101',
      topicId: 'topic-pointers',
      questionId: 'q-test-1',
      assignmentId: 'asgn-test-1',
      selectedAnswer: 2, // correct
      question: mockQuestion,
    });

    expect(res.is_correct).toBe(true);
    expect(res.attempt_id).toBeDefined();

    // Verify it is recorded in attempts table
    const attempts = await studentService.getStudentSubjectAttempts('std-test-1', 'subj-cs101');
    expect(attempts.length).toBe(1);
    expect(attempts[0].is_correct).toBe(true);
    expect(attempts[0].selected_answer).toBe(2);
  });

  it('submits an incorrect quiz attempt and returns distractor wrong_reason', async () => {
    const mockQuestion: DbQuestion = {
      id: 'q-test-2',
      subject_id: 'subj-cs101',
      topic_id: 'topic-pointers',
      teacher_id: 'teacher-1',
      concept: 'Pointer Dereference',
      question: 'What does *ptr return if ptr points to x = 42?',
      code_snippet: null,
      options: ['Memory address of x', 'The value 42', 'Null pointer', 'Undefined'],
      correct_index: 1,
      wrong_reasons: [
        'Address of operator & gives the address, while dereference * yields the value.',
        'Correct.',
        'ptr is not null.',
        'x has an initialized value.',
      ],
      explanation: 'The dereference operator * accesses the value stored at the address.',
      difficulty: 'easy',
      status: 'published',
      created_at: new Date().toISOString(),
    };

    const res = await studentService.submitQuizAttempt({
      studentId: 'std-test-1',
      subjectId: 'subj-cs101',
      topicId: 'topic-pointers',
      questionId: 'q-test-2',
      selectedAnswer: 0, // incorrect
      question: mockQuestion,
    });

    expect(res.is_correct).toBe(false);
    expect(res.wrong_reason).toContain('Address of operator & gives the address');

    const attempts = await studentService.getStudentSubjectAttempts('std-test-1', 'subj-cs101');
    expect(attempts.length).toBe(1);
    expect(attempts[0].is_correct).toBe(false);
    expect(attempts[0].selected_answer).toBe(0);
  });
});
