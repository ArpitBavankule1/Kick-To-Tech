import { describe, it, expect } from 'vitest';
import {
  getNextRecommendation,
  pickDeterministicQuestion,
  getAvailableQuestionsForTopic,
} from './recommender';
import type { TopicConfig, Question, UserAnswer } from '../types';

const mockConfigs: TopicConfig[] = [
  { id: 'arrays', title: 'Arrays', description: '', iconName: '' },
  { id: 'loops', title: 'Loops', description: '', iconName: '' },
  { id: 'pointers', title: 'Pointers', description: '', iconName: '' },
  { id: 'data_structures', title: 'Data Structures', description: '', iconName: '' },
];

const mockQuestions: Question[] = [
  // Arrays (2)
  {
    id: 'arr-1',
    topic: 'arrays',
    topicTitle: 'Arrays',
    difficulty: 'easy',
    concept: 'Array Indexing',
    question: 'Arr Q1',
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
    question: 'Arr Q2',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 1,
    explanation: 'Exp',
  },
  // Loops (2)
  {
    id: 'loop-1',
    topic: 'loops',
    topicTitle: 'Loops',
    difficulty: 'easy',
    concept: 'Off-By-One',
    question: 'Loop Q1',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 0,
    explanation: 'Exp',
  },
  {
    id: 'loop-2',
    topic: 'loops',
    topicTitle: 'Loops',
    difficulty: 'medium',
    concept: 'While Decrement',
    question: 'Loop Q2',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 1,
    explanation: 'Exp',
  },
  // Pointers (2)
  {
    id: 'ptr-1',
    topic: 'pointers',
    topicTitle: 'Pointers',
    difficulty: 'easy',
    concept: 'Dereferencing',
    question: 'Ptr Q1',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 0,
    explanation: 'Exp',
  },
  {
    id: 'ptr-2',
    topic: 'pointers',
    topicTitle: 'Pointers',
    difficulty: 'hard',
    concept: 'Pointer Arithmetic',
    question: 'Ptr Q2',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 2,
    explanation: 'Exp',
  },
];

describe('Recommendation Engine (Deterministic Pure Logic)', () => {
  it('chooses the weakest assessed topic with available questions', () => {
    // Student answered Arrays well (1/1 = 100% strong)
    // Student answered Pointers poorly (0/1 = 0% weak)
    const answers: UserAnswer[] = [
      { questionId: 'arr-1', topic: 'arrays', selectedAnswer: 0, isCorrect: true, timestamp: 1 },
      { questionId: 'ptr-1', topic: 'pointers', selectedAnswer: 1, isCorrect: false, timestamp: 2 },
    ];

    const rec = getNextRecommendation(answers, mockQuestions, mockConfigs);

    expect(rec).not.toBeNull();
    expect(rec?.targetTopic).toBe('pointers');
    expect(rec?.recommendationType).toBe('weak_targeted');
    expect(rec?.question.id).toBe('ptr-2'); // Unattempted question in pointers is prioritized
    expect(rec?.reason).toContain('Targeting Weakest Assessed Area');
    expect(rec?.reason).toContain('0% accuracy');
  });

  it('handles ties between two weak topics deterministically', () => {
    // Arrays: 0/1 = 0% weak (1 error)
    // Loops: 0/2 = 0% weak (2 errors) -> Loops is weaker due to more errors!
    const answers: UserAnswer[] = [
      { questionId: 'arr-1', topic: 'arrays', selectedAnswer: 1, isCorrect: false, timestamp: 1 },
      { questionId: 'loop-1', topic: 'loops', selectedAnswer: 1, isCorrect: false, timestamp: 2 },
      { questionId: 'loop-2', topic: 'loops', selectedAnswer: 0, isCorrect: false, timestamp: 3 },
    ];

    const rec = getNextRecommendation(answers, mockQuestions, mockConfigs);

    expect(rec).not.toBeNull();
    expect(rec?.targetTopic).toBe('loops'); // loops had 2 errors vs 1 error in arrays
  });

  it('breaks exact ties using canonical topic ordering (no randomness)', () => {
    // Arrays: 0/1 (0%)
    // Loops: 0/1 (0%)
    // Both have identical accuracy (0%) and identical errors (1)
    // Canonical order: arrays comes before loops
    const answers: UserAnswer[] = [
      { questionId: 'arr-1', topic: 'arrays', selectedAnswer: 1, isCorrect: false, timestamp: 1 },
      { questionId: 'loop-1', topic: 'loops', selectedAnswer: 1, isCorrect: false, timestamp: 2 },
    ];

    const rec = getNextRecommendation(answers, mockQuestions, mockConfigs);

    expect(rec).not.toBeNull();
    expect(rec?.targetTopic).toBe('arrays');
  });

  it('skips a weak topic if it has NO available questions left (all answered correctly)', () => {
    // Arrays: user failed arr-1 once, but then solved both arr-1 and arr-2 correctly!
    // So Arrays has 0 available questions left.
    // Pointers: user failed ptr-1, ptr-2 is still available.
    const answers: UserAnswer[] = [
      { questionId: 'arr-1', topic: 'arrays', selectedAnswer: 1, isCorrect: false, timestamp: 1 },
      { questionId: 'arr-1', topic: 'arrays', selectedAnswer: 0, isCorrect: true, timestamp: 2 },
      { questionId: 'arr-2', topic: 'arrays', selectedAnswer: 1, isCorrect: true, timestamp: 3 },
      { questionId: 'ptr-1', topic: 'pointers', selectedAnswer: 1, isCorrect: false, timestamp: 4 },
    ];

    const availableArrays = getAvailableQuestionsForTopic('arrays', mockQuestions, answers);
    expect(availableArrays.length).toBe(0); // No questions available in arrays

    const rec = getNextRecommendation(answers, mockQuestions, mockConfigs);

    expect(rec).not.toBeNull();
    expect(rec?.targetTopic).toBe('pointers');
  });

  it('starts diagnostic with first unassessed topic if no answers recorded yet', () => {
    const answers: UserAnswer[] = [];
    const rec = getNextRecommendation(answers, mockQuestions, mockConfigs);

    expect(rec).not.toBeNull();
    expect(rec?.targetTopic).toBe('arrays');
    expect(rec?.recommendationType).toBe('new_topic_diagnostic');
    expect(rec?.statusBefore).toBe('not_assessed');
    expect(rec?.reason).toContain('Diagnostic Baseline');
  });

  it('selects easier questions first deterministically within a topic', () => {
    const questions: Question[] = [
      {
        id: 'q-hard',
        topic: 'arrays',
        topicTitle: 'Arrays',
        difficulty: 'hard',
        concept: 'C1',
        question: 'Hard Q',
        options: ['1', '2', '3', '4'],
        correctAnswer: 0,
        explanation: 'Exp',
      },
      {
        id: 'q-easy',
        topic: 'arrays',
        topicTitle: 'Arrays',
        difficulty: 'easy',
        concept: 'C2',
        question: 'Easy Q',
        options: ['1', '2', '3', '4'],
        correctAnswer: 0,
        explanation: 'Exp',
      },
    ];

    const picked = pickDeterministicQuestion(questions, []);
    expect(picked.id).toBe('q-easy');
  });
});
