import { describe, it, expect } from 'vitest';
import {
  getTrend,
  getStreak,
  getMistakePatterns,
  getRecentActivity,
} from './insights';
import type { BaseAttempt } from './mastery';
import type { EngineQuestion } from './recommend';

describe('engine/insights', () => {
  describe('getTrend', () => {
    it('returns insufficient_data when attempts count is less than 6', () => {
      const attempts: BaseAttempt[] = [
        { is_correct: true, created_at: '2026-10-28T01:00:00Z' },
        { is_correct: false, created_at: '2026-10-28T02:00:00Z' },
        { is_correct: true, created_at: '2026-10-28T03:00:00Z' },
      ];
      const result = getTrend(attempts);
      expect(result.available).toBe(false);
      expect(result.trend).toBe('insufficient_data');
      expect(result.message).toContain('Need at least 6 attempts');
    });

    it('detects improving trend when last 5 accuracy exceeds previous 5', () => {
      // Previous: 2 attempts, both incorrect (0%)
      // Last 5: 4 correct out of 5 (80%)
      const attempts: BaseAttempt[] = [
        { is_correct: false, created_at: '2026-10-28T01:00:00Z' },
        { is_correct: false, created_at: '2026-10-28T02:00:00Z' },
        // Last 5:
        { is_correct: true, created_at: '2026-10-28T03:00:00Z' },
        { is_correct: true, created_at: '2026-10-28T04:00:00Z' },
        { is_correct: true, created_at: '2026-10-28T05:00:00Z' },
        { is_correct: true, created_at: '2026-10-28T06:00:00Z' },
        { is_correct: false, created_at: '2026-10-28T07:00:00Z' },
      ];

      const result = getTrend(attempts);
      expect(result.available).toBe(true);
      expect(result.trend).toBe('improving');
      expect(result.last5Accuracy).toBe(80);
      expect(result.prev5Accuracy).toBe(0);
      expect(result.delta).toBe(80);
      expect(result.message).toContain('+80%');
    });

    it('detects declining trend when last 5 accuracy drops below previous', () => {
      // Previous 2: both correct (100%)
      // Last 5: 1 correct out of 5 (20%)
      const attempts: BaseAttempt[] = [
        { is_correct: true, created_at: '2026-10-28T01:00:00Z' },
        { is_correct: true, created_at: '2026-10-28T02:00:00Z' },
        // Last 5:
        { is_correct: false, created_at: '2026-10-28T03:00:00Z' },
        { is_correct: false, created_at: '2026-10-28T04:00:00Z' },
        { is_correct: false, created_at: '2026-10-28T05:00:00Z' },
        { is_correct: false, created_at: '2026-10-28T06:00:00Z' },
        { is_correct: true, created_at: '2026-10-28T07:00:00Z' },
      ];

      const result = getTrend(attempts);
      expect(result.available).toBe(true);
      expect(result.trend).toBe('declining');
      expect(result.delta).toBe(-80);
      expect(result.message).toContain('-80%');
    });

    it('detects stable trend when accuracies match exactly', () => {
      // Previous 5: 3/5 = 60%
      // Last 5: 3/5 = 60%
      const attempts: BaseAttempt[] = [
        { is_correct: true, created_at: '2026-10-28T01:00:00Z' },
        { is_correct: true, created_at: '2026-10-28T02:00:00Z' },
        { is_correct: true, created_at: '2026-10-28T03:00:00Z' },
        { is_correct: false, created_at: '2026-10-28T04:00:00Z' },
        { is_correct: false, created_at: '2026-10-28T05:00:00Z' },
        // Last 5:
        { is_correct: true, created_at: '2026-10-28T06:00:00Z' },
        { is_correct: true, created_at: '2026-10-28T07:00:00Z' },
        { is_correct: true, created_at: '2026-10-28T08:00:00Z' },
        { is_correct: false, created_at: '2026-10-28T09:00:00Z' },
        { is_correct: false, created_at: '2026-10-28T10:00:00Z' },
      ];

      const result = getTrend(attempts);
      expect(result.available).toBe(true);
      expect(result.trend).toBe('stable');
      expect(result.delta).toBe(0);
    });
  });

  describe('getStreak', () => {
    it('returns 0 streak for empty attempts array', () => {
      const result = getStreak([]);
      expect(result.streak).toBe(0);
      expect(result.maxStreak).toBe(0);
      expect(result.activeDates).toEqual([]);
    });

    it('calculates 3-day consecutive streak timezone-safely', () => {
      const attempts: BaseAttempt[] = [
        { is_correct: true, created_at: '2026-10-26T12:00:00Z' },
        { is_correct: false, created_at: '2026-10-27T10:00:00Z' },
        { is_correct: true, created_at: '2026-10-27T18:00:00Z' },
        { is_correct: true, created_at: '2026-10-28T08:00:00Z' },
      ];

      const result = getStreak(attempts);
      expect(result.streak).toBe(3);
      expect(result.maxStreak).toBe(3);
      expect(result.activeDates).toEqual([
        '2026-10-26',
        '2026-10-27',
        '2026-10-28',
      ]);
    });

    it('handles gap in active days and reports current vs max streak', () => {
      const attempts: BaseAttempt[] = [
        // 2-day streak in past
        { is_correct: true, created_at: '2026-10-20T10:00:00Z' },
        { is_correct: true, created_at: '2026-10-21T10:00:00Z' },
        // Gap until 2026-10-28
        { is_correct: true, created_at: '2026-10-28T10:00:00Z' },
      ];

      const result = getStreak(attempts);
      expect(result.currentStreak || result.streak).toBe(1);
      expect(result.maxStreak).toBe(2);
    });
  });

  describe('getMistakePatterns', () => {
    const questions: EngineQuestion[] = [
      { id: 'q1', concept: 'Pointer Arithmetic', question: 'Q1' },
      { id: 'q2', concept: 'Pointer Arithmetic', question: 'Q2' },
      { id: 'q3', concept: 'Loop Invariants', question: 'Q3' },
      { id: 'q4', concept: 'Loop Invariants', question: 'Q4' },
      { id: 'q5', concept: 'Memory Leaks', question: 'Q5' },
      { id: 'q6', concept: 'Memory Leaks', question: 'Q6' },
      { id: 'q7', concept: 'Memory Leaks', question: 'Q7' },
      { id: 'q8', concept: 'Buffer Bounds', question: 'Q8' },
    ];

    it('filters concepts with fewer than 2 misses and sorts by most misses', () => {
      const attempts: BaseAttempt[] = [
        // Memory Leaks: 3 misses
        { question_id: 'q5', is_correct: false, topic_id: 'pointers' },
        { question_id: 'q6', is_correct: false, topic_id: 'pointers' },
        { question_id: 'q7', is_correct: false, topic_id: 'pointers' },
        // Loop Invariants: 2 misses
        { question_id: 'q3', is_correct: false, topic_id: 'loops' },
        { question_id: 'q4', is_correct: false, topic_id: 'loops' },
        // Pointer Arithmetic: 2 misses
        { question_id: 'q1', is_correct: false, topic_id: 'pointers' },
        { question_id: 'q2', is_correct: false, topic_id: 'pointers' },
        // Buffer Bounds: 1 miss (must be excluded because min 2 required)
        { question_id: 'q8', is_correct: false, topic_id: 'arrays' },
        // Correct attempt on q8: must not count as miss
        { question_id: 'q8', is_correct: true, topic_id: 'arrays' },
      ];

      const patterns = getMistakePatterns(attempts, questions);

      expect(patterns.length).toBe(3);
      expect(patterns[0].concept).toBe('Memory Leaks');
      expect(patterns[0].misses).toBe(3);

      expect(patterns.some((p) => p.concept === 'Buffer Bounds')).toBe(false);
    });

    it('returns empty array when no concepts have at least 2 misses', () => {
      const attempts: BaseAttempt[] = [
        { question_id: 'q1', is_correct: false },
        { question_id: 'q3', is_correct: false },
        { question_id: 'q8', is_correct: false },
      ];
      const patterns = getMistakePatterns(attempts, questions);
      expect(patterns).toEqual([]);
    });
  });

  describe('getRecentActivity', () => {
    it('returns empty array when attempts are empty', () => {
      expect(getRecentActivity([], 5)).toEqual([]);
    });

    it('returns top n items sorted chronologically descending', () => {
      const attempts: BaseAttempt[] = [
        { id: 'att-1', topic_id: 'arrays', is_correct: true, created_at: '2026-10-28T01:00:00Z' },
        { id: 'att-2', topic_id: 'loops', is_correct: false, created_at: '2026-10-28T02:00:00Z' },
        { id: 'att-3', topic_id: 'pointers', is_correct: true, created_at: '2026-10-28T03:00:00Z' },
      ];

      const recent = getRecentActivity(attempts, 2);
      expect(recent.length).toBe(2);
      expect(recent[0].id).toBe('att-3');
      expect(recent[1].id).toBe('att-2');
    });
  });
});
