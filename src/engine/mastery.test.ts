import { describe, it, expect } from 'vitest';
import {
  getStatus,
  getTopicStats,
  getSubjectStats,
  type BaseAttempt,
} from './mastery';

describe('engine/mastery', () => {
  describe('getStatus', () => {
    it('returns "not-assessed" for null or undefined mastery (no attempts)', () => {
      expect(getStatus(null)).toBe('not-assessed');
      expect(getStatus(undefined as unknown as null)).toBe('not-assessed');
    });

    it('returns "weak" for 0% with attempts (Rule 3)', () => {
      expect(getStatus(0)).toBe('weak');
    });

    it('returns "weak" for 49.9% mastery (just below improving boundary)', () => {
      expect(getStatus(49.9)).toBe('weak');
    });

    it('returns "improving" for exact boundary 50%', () => {
      expect(getStatus(50)).toBe('improving');
    });

    it('returns "improving" for 79.5% mastery (just below strong boundary)', () => {
      expect(getStatus(79.5)).toBe('improving');
    });

    it('returns "strong" for exact boundary 80%', () => {
      expect(getStatus(80)).toBe('strong');
    });

    it('returns "strong" for 100% mastery', () => {
      expect(getStatus(100)).toBe('strong');
    });
  });

  describe('getTopicStats', () => {
    it('handles no attempts: returns null mastery, confidence early, status not-assessed', () => {
      const stats = getTopicStats([], 'arrays');
      expect(stats).toEqual({
        correct: 0,
        total: 0,
        mastery: null,
        confidence: 'early',
        status: 'not-assessed',
      });
    });

    it('handles 1/1: 100% mastery, confidence early (<3 attempts), status strong', () => {
      const attempts: BaseAttempt[] = [
        { topic_id: 'loops', is_correct: true },
      ];
      const stats = getTopicStats(attempts, 'loops');
      expect(stats).toEqual({
        correct: 1,
        total: 1,
        mastery: 100,
        confidence: 'early',
        status: 'strong',
      });
    });

    it('handles 0/3: 0% mastery, confidence reliable (>=3 attempts), status weak', () => {
      const attempts: BaseAttempt[] = [
        { topic_id: 'pointers', is_correct: false },
        { topic_id: 'pointers', is_correct: false },
        { topic_id: 'pointers', is_correct: false },
      ];
      const stats = getTopicStats(attempts, 'pointers');
      expect(stats).toEqual({
        correct: 0,
        total: 3,
        mastery: 0,
        confidence: 'reliable',
        status: 'weak',
      });
    });

    it('supports legacy v1 field names (topic, isCorrect)', () => {
      const attempts: BaseAttempt[] = [
        { topic: 'arrays', isCorrect: true },
        { topic: 'arrays', isCorrect: true },
        { topic: 'arrays', isCorrect: false },
      ];
      const stats = getTopicStats(attempts, 'arrays');
      expect(stats.total).toBe(3);
      expect(stats.correct).toBe(2);
      expect(stats.mastery).toBe(66.7);
      expect(stats.confidence).toBe('reliable');
      expect(stats.status).toBe('improving');
    });

    it('handles empty input topicId cleanly', () => {
      const stats = getTopicStats([], '');
      expect(stats.status).toBe('not-assessed');
      expect(stats.mastery).toBeNull();
    });
  });

  describe('getSubjectStats', () => {
    it('handles empty input (no attempts, no topics)', () => {
      const stats = getSubjectStats([], []);
      expect(stats.totalAttempts).toBe(0);
      expect(stats.totalCorrect).toBe(0);
      expect(stats.overallMastery).toBeNull();
      expect(stats.status).toBe('not-assessed');
      expect(stats.weakTopics).toEqual([]);
      expect(stats.notAssessedTopics).toEqual([]);
    });

    it('correctly categorizes weak, improving, strong, and not-assessed topics', () => {
      const attempts: BaseAttempt[] = [
        // Arrays: 1/1 = 100% -> strong
        { topic_id: 'arrays', is_correct: true },
        // Loops: 1/2 = 50% -> improving
        { topic_id: 'loops', is_correct: true },
        { topic_id: 'loops', is_correct: false },
        // Pointers: 0/3 = 0% -> weak
        { topic_id: 'pointers', is_correct: false },
        { topic_id: 'pointers', is_correct: false },
        { topic_id: 'pointers', is_correct: false },
        // data_structures: 0 attempts -> not-assessed
      ];

      const topics = [
        { id: 'arrays', name: 'Arrays' },
        { id: 'loops', name: 'Loops' },
        { id: 'pointers', name: 'Pointers' },
        { id: 'data_structures', name: 'Data Structures' },
      ];

      const stats = getSubjectStats(attempts, topics);

      expect(stats.totalAttempts).toBe(6);
      expect(stats.totalCorrect).toBe(2);
      expect(stats.overallMastery).toBe(33.3);
      expect(stats.status).toBe('weak');

      expect(stats.strongTopics).toEqual(['arrays']);
      expect(stats.improvingTopics).toEqual(['loops']);
      expect(stats.weakTopics).toEqual(['pointers']);
      expect(stats.notAssessedTopics).toEqual(['data_structures']);

      expect(stats.topicStats['arrays'].mastery).toBe(100);
      expect(stats.topicStats['data_structures'].mastery).toBeNull();
    });
  });
});
