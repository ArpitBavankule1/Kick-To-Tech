import { describe, it, expect } from 'vitest';
import {
  generatedQuestionSchema,
  generatedQuizSchema,
  validateAndNormalizeQuiz,
} from './quizValidator';

describe('quizValidator', () => {
  const createValidQuestion = (
    difficulty: 'easy' | 'medium' | 'hard',
    correctIndex: number = 0
  ) => ({
    prompt: `What is the time complexity of operation under difficulty ${difficulty}?`,
    code_snippet: 'int arr[] = {1, 2, 3};\nint x = arr[0];' as string | null,
    options: ['O(1) constant time', 'O(N) linear time', 'O(log N) logarithmic', 'O(N^2) quadratic'],
    correct_index: correctIndex,
    explanation: 'Array random access computes the offset in a single step.',
    wrong_reasons: {
      ...([0, 1, 2, 3]
        .filter((i) => i !== correctIndex)
        .reduce((acc, idx) => ({ ...acc, [idx]: `Reason why option ${idx} is incorrect.` }), {})),
    },
    subskill: 'Array Indexing Arithmetic',
    difficulty,
  });

  const createValidQuizPayload = () => ({
    questions: [
      createValidQuestion('easy', 0),
      createValidQuestion('easy', 1),
      createValidQuestion('medium', 2),
      createValidQuestion('medium', 3),
      createValidQuestion('hard', 0),
    ],
  });

  describe('Good Payloads', () => {
    it('validates a complete 5-question quiz with 2 easy, 2 medium, 1 hard', () => {
      const payload = createValidQuizPayload();
      const schemaResult = generatedQuizSchema.safeParse(payload);
      expect(schemaResult.success).toBe(true);

      const result = validateAndNormalizeQuiz(payload);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.questions.length).toBe(5);

      const difficulties = result.data?.questions.map((q) => q.difficulty);
      expect(difficulties?.filter((d) => d === 'easy').length).toBe(2);
      expect(difficulties?.filter((d) => d === 'medium').length).toBe(2);
      expect(difficulties?.filter((d) => d === 'hard').length).toBe(1);
    });

    it('accepts questions with null code_snippet', () => {
      const q = createValidQuestion('easy', 1);
      q.code_snippet = null;
      const parseResult = generatedQuestionSchema.safeParse(q);
      expect(parseResult.success).toBe(true);
    });

    it('accepts wrong_reasons formatted as array of { index, reason }', () => {
      const q = createValidQuestion('medium', 2);
      q.wrong_reasons = [
        { index: 0, reason: 'Option 0 is wrong because...' },
        { index: 1, reason: 'Option 1 is wrong because...' },
        { index: 3, reason: 'Option 3 is wrong because...' },
      ];
      const parseResult = generatedQuestionSchema.safeParse(q);
      expect(parseResult.success).toBe(true);
    });

    it('accepts wrong_reasons formatted as array of 4 strings with empty correct_index', () => {
      const q = createValidQuestion('hard', 3);
      q.wrong_reasons = [
        'Option 0 reason',
        'Option 1 reason',
        'Option 2 reason',
        '', // correct index 3 is empty
      ];
      const parseResult = generatedQuestionSchema.safeParse(q);
      expect(parseResult.success).toBe(true);
    });

    it('normalizes wrong_reasons correctly into both array and map', () => {
      const payload = createValidQuizPayload();
      const result = validateAndNormalizeQuiz(payload);
      expect(result.success).toBe(true);

      const firstQ = result.data?.questions[0];
      expect(firstQ).toBeDefined();
      expect(firstQ?.correct_index).toBe(0);
      expect(firstQ?.wrong_reasons[0]).toBe(''); // correct index
      expect(firstQ?.wrong_reasons[1]).toContain('option 1');
      expect(firstQ?.wrong_reasons_map[1]).toBeDefined();
    });
  });

  describe('Bad Payloads & Error Cases', () => {
    it('rejects duplicate options in a question', () => {
      const q = createValidQuestion('easy', 0);
      q.options = ['O(1)', 'O(n)', 'O(1)', 'O(n^2)']; // duplicate O(1)

      const parseResult = generatedQuestionSchema.safeParse(q);
      expect(parseResult.success).toBe(false);
      expect(parseResult.error?.issues.some((i) => i.message.includes('distinct choices'))).toBe(true);
    });

    it('rejects option lists with fewer than 4 items', () => {
      const q = createValidQuestion('easy', 0);
      q.options = ['A', 'B', 'C'] as unknown as string[];

      const parseResult = generatedQuestionSchema.safeParse(q);
      expect(parseResult.success).toBe(false);
      expect(parseResult.error?.issues.some((i) => i.message.includes('exactly 4 options'))).toBe(true);
    });

    it('rejects invalid correct_index (< 0 or > 3)', () => {
      const q = createValidQuestion('easy', 4); // out of bounds

      const parseResult = generatedQuestionSchema.safeParse(q);
      expect(parseResult.success).toBe(false);
      expect(parseResult.error?.issues.some((i) => i.path.includes('correct_index'))).toBe(true);
    });

    it('rejects wrong_reasons that include the correct index', () => {
      const q = createValidQuestion('easy', 1);
      q.wrong_reasons = {
        '0': 'Option 0 reason',
        '1': 'Incorrect because Option 1 is actually correct!', // should not be here
        '2': 'Option 2 reason',
        '3': 'Option 3 reason',
      };

      const parseResult = generatedQuestionSchema.safeParse(q);
      expect(parseResult.success).toBe(false);
      expect(parseResult.error?.issues.some((i) => i.message.includes('cannot include a reason for the correct index'))).toBe(true);
    });

    it('rejects wrong_reasons missing one of the 3 wrong indexes', () => {
      const q = createValidQuestion('easy', 0);
      q.wrong_reasons = {
        '1': 'Option 1 reason',
        '2': 'Option 2 reason',
        // missing index 3
      };

      const parseResult = generatedQuestionSchema.safeParse(q);
      expect(parseResult.success).toBe(false);
      expect(parseResult.error?.issues.some((i) => i.message.includes('missing a pedagogical reason'))).toBe(true);
    });

    it('rejects wrong_reasons containing duplicate indexes in array format', () => {
      const q = createValidQuestion('easy', 0);
      q.wrong_reasons = [
        { index: 1, reason: 'First reason for 1' },
        { index: 1, reason: 'Duplicate reason for 1' },
        { index: 2, reason: 'Reason for 2' },
      ];

      const parseResult = generatedQuestionSchema.safeParse(q);
      expect(parseResult.success).toBe(false);
      expect(parseResult.error?.issues.some((i) => i.message.includes('Duplicate index'))).toBe(true);
    });

    it('rejects a quiz with fewer than 5 questions', () => {
      const payload = {
        questions: [createValidQuestion('easy', 0), createValidQuestion('medium', 1)],
      };

      const result = validateAndNormalizeQuiz(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('exactly 5 questions');
    });

    it('rejects a quiz with wrong difficulty distribution (e.g. 3 easy, 1 medium, 1 hard)', () => {
      const payload = {
        questions: [
          createValidQuestion('easy', 0),
          createValidQuestion('easy', 1),
          createValidQuestion('easy', 2), // 3 easy instead of 2
          createValidQuestion('medium', 3),
          createValidQuestion('hard', 0),
        ],
      };

      const result = validateAndNormalizeQuiz(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('2 easy, 2 medium, and 1 hard');
    });

    it('rejects questions with empty or whitespace prompt', () => {
      const q = createValidQuestion('easy', 0);
      q.prompt = '    ';

      const parseResult = generatedQuestionSchema.safeParse(q);
      expect(parseResult.success).toBe(false);
    });
  });
});
