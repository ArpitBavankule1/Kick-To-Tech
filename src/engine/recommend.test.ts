import { describe, it, expect } from 'vitest';
import {
  recommendNext,
  calculateAdaptiveDifficulty,
  type EngineQuestion,
} from './recommend';
import type { BaseAttempt } from './mastery';

describe('engine/recommend', () => {
  const sampleQuestions: EngineQuestion[] = [
    {
      id: 'q-arr-1',
      topic_id: 'arrays',
      concept: 'Buffer Allocation',
      question: 'What is array indexing?',
      difficulty: 'easy',
    },
    {
      id: 'q-arr-2',
      topic_id: 'arrays',
      concept: 'Bounds Checking',
      question: 'What happens on buffer overflow?',
      difficulty: 'medium',
    },
    {
      id: 'q-arr-3',
      topic_id: 'arrays',
      concept: 'Pointer Offset',
      question: 'How does array decay to pointer?',
      difficulty: 'hard',
    },
    {
      id: 'q-loop-1',
      topic_id: 'loops',
      concept: 'Loop Invariants',
      question: 'What is off-by-one error?',
      difficulty: 'easy',
    },
    {
      id: 'q-loop-2',
      topic_id: 'loops',
      concept: 'While Condition',
      question: 'How to terminate loop safely?',
      difficulty: 'medium',
    },
    {
      id: 'q-ptr-1',
      topic_id: 'pointers',
      concept: 'Dereferencing',
      question: 'What does *p do?',
      difficulty: 'easy',
    },
    {
      id: 'q-ptr-2',
      topic_id: 'pointers',
      concept: 'Address Operator',
      question: 'What does &x do?',
      difficulty: 'medium',
    },
    {
      id: 'q-ds-1',
      topic_id: 'data_structures',
      concept: 'Linked List',
      question: 'How to traverse nodes?',
      difficulty: 'medium',
    },
  ];

  describe('calculateAdaptiveDifficulty', () => {
    it('defaults to medium when there are no attempts', () => {
      const result = calculateAdaptiveDifficulty([]);
      expect(result.difficulty).toBe('medium');
    });

    it('lowers difficulty to easy after a missed attempt', () => {
      const attempts: BaseAttempt[] = [
        { topic_id: 'arrays', is_correct: true },
        { topic_id: 'arrays', is_correct: false }, // Miss
      ];
      const result = calculateAdaptiveDifficulty(attempts);
      expect(result.difficulty).toBe('easy');
      expect(result.adjustmentReason).toContain('Lowering difficulty');
    });

    it('steps up difficulty to hard after two consecutive correct attempts', () => {
      const attempts: BaseAttempt[] = [
        { topic_id: 'loops', is_correct: true },
        { topic_id: 'loops', is_correct: true }, // Two in a row
      ];
      const result = calculateAdaptiveDifficulty(attempts);
      expect(result.difficulty).toBe('hard');
      expect(result.adjustmentReason).toContain('Stepping up to hard');
    });

    it('maintains medium if only 1 attempt was correct', () => {
      const attempts: BaseAttempt[] = [
        { topic_id: 'loops', is_correct: true },
      ];
      const result = calculateAdaptiveDifficulty(attempts);
      expect(result.difficulty).toBe('medium');
    });
  });

  describe('recommendNext rules', () => {
    it('handles empty input gracefully', () => {
      const result = recommendNext([], [], []);
      expect(result.isComplete).toBe(true);
      expect(result.question).toBeNull();
      expect(result.retryQuestionIds).toEqual([]);
    });

    it('Rule 1: ignores not-assessed topics first and picks weakest assessed topic', () => {
      // Arrays: 1/2 = 50%
      // data_structures: 0 attempts (not assessed)
      // Must pick Arrays over unassessed data_structures!
      const attempts: BaseAttempt[] = [
        { question_id: 'q-arr-1', topic_id: 'arrays', is_correct: true },
        { question_id: 'q-arr-2', topic_id: 'arrays', is_correct: false },
      ];

      const assignedTopics = ['arrays', 'data_structures'];
      const result = recommendNext(attempts, assignedTopics, sampleQuestions);

      expect(result.topicId).toBe('arrays');
      expect(result.question?.id).toBe('q-arr-3');
      expect(result.type).toBe('weak_assessed');
      expect(result.reason).toContain('50% (1/2 correct) in arrays');
    });

    it('Rule 2: picks the weakest assessed topic when multiple are assessed', () => {
      // Arrays: 2/2 = 100%
      // Pointers: 0/1 = 0% (weaker!)
      const attempts: BaseAttempt[] = [
        { question_id: 'q-arr-1', topic_id: 'arrays', is_correct: true },
        { question_id: 'q-arr-2', topic_id: 'arrays', is_correct: true },
        { question_id: 'q-ptr-1', topic_id: 'pointers', is_correct: false },
      ];

      const assignedTopics = ['arrays', 'pointers'];
      const result = recommendNext(attempts, assignedTopics, sampleQuestions);

      expect(result.topicId).toBe('pointers');
      expect(result.question?.id).toBe('q-ptr-2');
      expect(result.reason).toContain('0% (0/1 correct) in pointers');
    });

    it('Rule 3 (Tie-break by fewer attempts): prefers topic with fewer attempts when masteries match', () => {
      // Arrays: 1/2 = 50% (2 attempts)
      // Loops: 2/4 = 50% (4 attempts)
      // Both are 50% mastery. Arrays has fewer attempts (2 < 4), so pick Arrays!
      const attempts: BaseAttempt[] = [
        { question_id: 'q-arr-1', topic_id: 'arrays', is_correct: true },
        { question_id: 'q-arr-2', topic_id: 'arrays', is_correct: false },
        { question_id: 'q-loop-1', topic_id: 'loops', is_correct: true },
        { question_id: 'dummy-1', topic_id: 'loops', is_correct: false },
        { question_id: 'dummy-2', topic_id: 'loops', is_correct: true },
        { question_id: 'dummy-3', topic_id: 'loops', is_correct: false },
      ];

      const assignedTopics = ['arrays', 'loops'];
      const result = recommendNext(attempts, assignedTopics, sampleQuestions);

      expect(result.topicId).toBe('arrays');
      expect(result.question?.id).toBe('q-arr-3');
    });

    it('Rule 3 (Tie-break by topic ID): prefers alphabetical topic ID when mastery and attempts match', () => {
      // Arrays: 1/2 = 50% (2 attempts)
      // Loops: 1/2 = 50% (2 attempts)
      // 'arrays' < 'loops' alphabetically
      const attempts: BaseAttempt[] = [
        { question_id: 'q-loop-1', topic_id: 'loops', is_correct: true },
        { question_id: 'q-loop-2', topic_id: 'loops', is_correct: false },
        { question_id: 'q-arr-1', topic_id: 'arrays', is_correct: true },
        { question_id: 'q-arr-2', topic_id: 'arrays', is_correct: false },
      ];

      const assignedTopics = ['loops', 'arrays'];
      const result = recommendNext(attempts, assignedTopics, sampleQuestions);

      expect(result.topicId).toBe('arrays');
    });

    it('Rule 4: adapts difficulty based on streak/miss in topic', () => {
      // Loops: 2 correct attempts in a row -> steps up to hard
      // Questions available in Loops: q-loop-1 (easy), q-loop-2 (medium).
      // Since neither is 'hard', picks available question.
      const attempts: BaseAttempt[] = [
        { question_id: 'dummy-1', topic_id: 'loops', is_correct: true },
        { question_id: 'dummy-2', topic_id: 'loops', is_correct: true },
      ];

      const result = recommendNext(attempts, ['loops'], sampleQuestions);
      expect(result.targetDifficulty).toBe('hard');
      expect(result.reason).toContain('Stepping up to hard difficulty');
    });

    it('Fallback 1: offers unassessed assigned topic when assessed topics have no questions left', () => {
      // Arrays questions (q-arr-1, q-arr-2, q-arr-3) all answered!
      // data_structures is unassessed and has q-ds-1.
      const attempts: BaseAttempt[] = [
        { question_id: 'q-arr-1', topic_id: 'arrays', is_correct: true },
        { question_id: 'q-arr-2', topic_id: 'arrays', is_correct: true },
        { question_id: 'q-arr-3', topic_id: 'arrays', is_correct: true },
      ];

      const assignedTopics = ['arrays', 'data_structures'];
      const result = recommendNext(attempts, assignedTopics, sampleQuestions);

      expect(result.topicId).toBe('data_structures');
      expect(result.question?.id).toBe('q-ds-1');
      expect(result.type).toBe('assigned_fallback');
      expect(result.reason).toContain('Starting diagnostic practice for assigned topic "data_structures"');
    });

    it('Fallback 2: returns completion message and retry suggestions when all questions are exhausted', () => {
      // All questions in assigned topic 'pointers' are answered, with q-ptr-2 missed
      const attempts: BaseAttempt[] = [
        { question_id: 'q-ptr-1', topic_id: 'pointers', is_correct: true },
        { question_id: 'q-ptr-2', topic_id: 'pointers', is_correct: false },
      ];

      const assignedTopics = ['pointers'];
      // Only provide pointers questions
      const pointersQuestions = sampleQuestions.filter((q) => q.topic_id === 'pointers');

      const result = recommendNext(attempts, assignedTopics, pointersQuestions);

      expect(result.isComplete).toBe(true);
      expect(result.question).toBeNull();
      expect(result.type).toBe('all_completed');
      expect(result.retryQuestionIds).toEqual(['q-ptr-2']);
      expect(result.reason).toContain('1 missed question');
      expect(result.reason).toContain('available for targeted retry practice');
    });
  });
});
