import { describe, it, expect } from 'vitest';
import { calculateTopicMastery, calculateOverallStats } from './mastery';
import type { TopicConfig, Question, UserAnswer } from '../types';

const mockConfigs: TopicConfig[] = [
  { id: 'arrays', title: 'Arrays', description: '', iconName: '' },
  { id: 'loops', title: 'Loops', description: '', iconName: '' },
  { id: 'pointers', title: 'Pointers', description: '', iconName: '' },
  { id: 'data_structures', title: 'Data Structures', description: '', iconName: '' },
];

const mockQuestions: Question[] = [
  {
    id: 'arr-1',
    topic: 'arrays',
    topicTitle: 'Arrays',
    difficulty: 'easy',
    concept: 'Contiguous Indexing',
    question: 'Q1',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 0,
    explanation: 'Exp',
  },
  {
    id: 'arr-2',
    topic: 'arrays',
    topicTitle: 'Arrays',
    difficulty: 'medium',
    concept: 'Array Shifting',
    question: 'Q2',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 1,
    explanation: 'Exp',
  },
  {
    id: 'ptr-1',
    topic: 'pointers',
    topicTitle: 'Pointers',
    difficulty: 'hard',
    concept: 'Pointer Arithmetic',
    question: 'Q3',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 2,
    explanation: 'Exp',
  },
];

describe('Mastery Calculations (Pure Logic)', () => {
  it('CRITICAL: must NOT label unassessed topics as weak', () => {
    const answers: UserAnswer[] = [];
    const masteries = calculateTopicMastery(answers, mockConfigs, mockQuestions);

    for (const config of mockConfigs) {
      expect(masteries[config.id].status).toBe('not_assessed');
      expect(masteries[config.id].accuracyPercentage).toBeNull();
      expect(masteries[config.id].totalAttempts).toBe(0);
      expect(masteries[config.id].status).not.toBe('weak');
    }
  });

  it('correctly categorizes partially assessed topics without contaminating unassessed topics', () => {
    const answers: UserAnswer[] = [
      { questionId: 'arr-1', topic: 'arrays', selectedAnswer: 0, isCorrect: true, timestamp: 1 },
      { questionId: 'arr-2', topic: 'arrays', selectedAnswer: 0, isCorrect: false, timestamp: 2 },
    ];

    const masteries = calculateTopicMastery(answers, mockConfigs, mockQuestions);

    // Arrays: 1/2 = 50% -> 'developing'
    expect(masteries.arrays.status).toBe('developing');
    expect(masteries.arrays.accuracyPercentage).toBe(50);
    expect(masteries.arrays.correctAttempts).toBe(1);
    expect(masteries.arrays.incorrectAttempts).toBe(1);
    expect(masteries.arrays.failedConcepts).toContain('Array Shifting');

    // Other topics must strictly remain unassessed
    expect(masteries.loops.status).toBe('not_assessed');
    expect(masteries.pointers.status).toBe('not_assessed');
    expect(masteries.data_structures.status).toBe('not_assessed');
  });

  it('categorizes weak (< 50%) accurately based on real answers', () => {
    const answers: UserAnswer[] = [
      { questionId: 'ptr-1', topic: 'pointers', selectedAnswer: 0, isCorrect: false, timestamp: 1 },
      { questionId: 'ptr-2', topic: 'pointers', selectedAnswer: 1, isCorrect: false, timestamp: 2 },
      { questionId: 'ptr-3', topic: 'pointers', selectedAnswer: 2, isCorrect: true, timestamp: 3 },
    ];

    const masteries = calculateTopicMastery(answers, mockConfigs, mockQuestions);

    // Pointers: 1/3 = 33% -> 'weak'
    expect(masteries.pointers.status).toBe('weak');
    expect(masteries.pointers.accuracyPercentage).toBe(33);
    expect(masteries.pointers.totalAttempts).toBe(3);
    expect(masteries.pointers.incorrectAttempts).toBe(2);
  });

  it('categorizes strong (>= 80%) correctly at boundary', () => {
    const answers80: UserAnswer[] = [
      { questionId: '1', topic: 'loops', selectedAnswer: 0, isCorrect: true, timestamp: 1 },
      { questionId: '2', topic: 'loops', selectedAnswer: 0, isCorrect: true, timestamp: 2 },
      { questionId: '3', topic: 'loops', selectedAnswer: 0, isCorrect: true, timestamp: 3 },
      { questionId: '4', topic: 'loops', selectedAnswer: 0, isCorrect: true, timestamp: 4 },
      { questionId: '5', topic: 'loops', selectedAnswer: 1, isCorrect: false, timestamp: 5 },
    ]; // 4/5 = 80%

    const masteries = calculateTopicMastery(answers80, mockConfigs, mockQuestions);
    expect(masteries.loops.status).toBe('strong');
    expect(masteries.loops.accuracyPercentage).toBe(80);
  });

  it('calculates overall aggregate metrics properly', () => {
    const answers: UserAnswer[] = [
      { questionId: 'arr-1', topic: 'arrays', selectedAnswer: 0, isCorrect: true, timestamp: 1 },
      { questionId: 'arr-2', topic: 'arrays', selectedAnswer: 1, isCorrect: true, timestamp: 2 },
      { questionId: 'ptr-1', topic: 'pointers', selectedAnswer: 0, isCorrect: false, timestamp: 3 },
    ];

    const masteries = calculateTopicMastery(answers, mockConfigs, mockQuestions);
    const stats = calculateOverallStats(answers, masteries);

    expect(stats.totalAnswers).toBe(3);
    expect(stats.correctAnswers).toBe(2);
    expect(stats.overallAccuracy).toBe(67);
    expect(stats.assessedCount).toBe(2); // arrays and pointers
    expect(stats.unassessedCount).toBe(2); // loops and data_structures
    expect(stats.strongCount).toBe(1); // arrays 100%
    expect(stats.weakCount).toBe(1); // pointers 0%
    expect(stats.developingCount).toBe(0);
  });
});
