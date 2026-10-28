import { z } from "npm:zod@^3.22.4";

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface GeneratedQuestionInput {
  prompt: string;
  code_snippet?: string | null;
  options: string[];
  correct_index: number;
  explanation: string;
  wrong_reasons: Record<string | number, string> | Array<{ index: number; reason: string }> | string[];
  subskill: string;
  difficulty: QuestionDifficulty;
}

export interface NormalizedQuestion {
  prompt: string;
  code_snippet: string | null;
  options: [string, string, string, string];
  correct_index: number;
  explanation: string;
  wrong_reasons: string[]; // 4 items: empty at correct_index, reason for each of the 3 wrong indexes
  wrong_reasons_map: Record<number, string>;
  subskill: string;
  difficulty: QuestionDifficulty;
}

export interface NormalizedQuiz {
  questions: NormalizedQuestion[];
}

export const generatedQuestionSchema = z
  .object({
    prompt: z.string().trim().min(5, 'Question prompt must be at least 5 characters.'),
    code_snippet: z.string().nullable().optional(),
    options: z.array(z.string().trim()).length(4, 'Must have exactly 4 options.'),
    correct_index: z
      .number()
      .int('Correct index must be an integer.')
      .min(0, 'Correct index must be between 0 and 3.')
      .max(3, 'Correct index must be between 0 and 3.'),
    explanation: z.string().trim().min(5, 'Explanation must be at least 5 characters.'),
    wrong_reasons: z.union([
      z.record(z.string(), z.string().trim()),
      z.array(
        z.object({
          index: z.number().int().min(0).max(3),
          reason: z.string().trim().min(3),
        })
      ),
      z.array(z.string()),
    ]),
    subskill: z.string().trim().min(2, 'Subskill must be at least 2 characters.'),
    difficulty: z.enum(['easy', 'medium', 'hard']),
  })
  .superRefine((data, ctx) => {
    // 1. Check for distinct options
    const uniqueOptions = new Set(data.options.map((o) => o.toLowerCase().trim()));
    if (uniqueOptions.size !== 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Options must be 4 distinct choices without duplicates.',
        path: ['options'],
      });
    }

    // 2. Validate wrong_reasons cover exactly the 3 wrong indexes
    const expectedWrongIndexes = new Set([0, 1, 2, 3]);
    expectedWrongIndexes.delete(data.correct_index);

    const coveredIndexes = new Set<number>();

    if (Array.isArray(data.wrong_reasons)) {
      if (data.wrong_reasons.length === 4 && typeof data.wrong_reasons[0] === 'string') {
        const stringArray = data.wrong_reasons as string[];
        stringArray.forEach((reason, idx) => {
          if (idx === data.correct_index) {
            if (reason && reason.trim().length > 0) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `wrong_reasons cannot include a reason for the correct index (${data.correct_index}).`,
                path: ['wrong_reasons'],
              });
            }
          } else {
            if (reason && reason.trim().length >= 3) {
              coveredIndexes.add(idx);
            }
          }
        });
      } else {
        const itemArray = data.wrong_reasons as Array<{ index: number; reason: string }>;
        for (const item of itemArray) {
          if (item.index === data.correct_index) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `wrong_reasons cannot include a reason for the correct index (${data.correct_index}).`,
              path: ['wrong_reasons'],
            });
          }
          if (coveredIndexes.has(item.index)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Duplicate index ${item.index} in wrong_reasons.`,
              path: ['wrong_reasons'],
            });
          }
          if (item.reason && item.reason.trim().length >= 3) {
            coveredIndexes.add(item.index);
          }
        }
      }
    } else if (typeof data.wrong_reasons === 'object' && data.wrong_reasons !== null) {
      const record = data.wrong_reasons as Record<string, string>;
      for (const [key, reason] of Object.entries(record)) {
        const idx = Number(key);
        if (isNaN(idx) || idx < 0 || idx > 3) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid index "${key}" in wrong_reasons keys. Must be 0, 1, 2, or 3.`,
            path: ['wrong_reasons'],
          });
          continue;
        }
        if (idx === data.correct_index) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `wrong_reasons cannot include a reason for the correct index (${data.correct_index}).`,
            path: ['wrong_reasons'],
          });
        }
        if (coveredIndexes.has(idx)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate index ${idx} in wrong_reasons.`,
            path: ['wrong_reasons'],
          });
        }
        if (reason && reason.trim().length >= 3) {
          coveredIndexes.add(idx);
        }
      }
    }

    for (const wrongIdx of expectedWrongIndexes) {
      if (!coveredIndexes.has(wrongIdx)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `wrong_reasons is missing a pedagogical reason for wrong option index ${wrongIdx}.`,
          path: ['wrong_reasons'],
        });
      }
    }

    if (coveredIndexes.size !== 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `wrong_reasons must cover exactly the 3 wrong indexes. Covered: ${coveredIndexes.size}.`,
        path: ['wrong_reasons'],
      });
    }
  });

export const generatedQuizSchema = z
  .object({
    questions: z.array(generatedQuestionSchema).length(5, 'Quiz must contain exactly 5 questions.'),
  })
  .superRefine((data, ctx) => {
    const difficulties = data.questions.map((q) => q.difficulty);
    const easyCount = difficulties.filter((d) => d === 'easy').length;
    const mediumCount = difficulties.filter((d) => d === 'medium').length;
    const hardCount = difficulties.filter((d) => d === 'hard').length;

    if (easyCount !== 2 || mediumCount !== 2 || hardCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Quiz must contain exactly 2 easy, 2 medium, and 1 hard questions. Found: ${easyCount} easy, ${mediumCount} medium, ${hardCount} hard.`,
        path: ['questions'],
      });
    }
  });

export function validateAndNormalizeQuiz(raw: unknown): {
  success: boolean;
  data?: NormalizedQuiz;
  error?: string;
} {
  const result = generatedQuizSchema.safeParse(raw);
  if (!result.success) {
    const formattedError = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    return { success: false, error: formattedError };
  }

  const normalizedQuestions: NormalizedQuestion[] = result.data.questions.map((q) => {
    const wrongMap: Record<number, string> = {};
    const wrongArray: string[] = ['', '', '', ''];

    if (Array.isArray(q.wrong_reasons)) {
      if (q.wrong_reasons.length === 4 && typeof q.wrong_reasons[0] === 'string') {
        const arr = q.wrong_reasons as string[];
        arr.forEach((reason, idx) => {
          if (idx !== q.correct_index) {
            wrongMap[idx] = reason;
            wrongArray[idx] = reason;
          }
        });
      } else {
        const items = q.wrong_reasons as Array<{ index: number; reason: string }>;
        for (const item of items) {
          wrongMap[item.index] = item.reason;
          wrongArray[item.index] = item.reason;
        }
      }
    } else if (typeof q.wrong_reasons === 'object' && q.wrong_reasons !== null) {
      const record = q.wrong_reasons as Record<string, string>;
      for (const [key, reason] of Object.entries(record)) {
        const idx = Number(key);
        wrongMap[idx] = reason;
        wrongArray[idx] = reason;
      }
    }

    return {
      prompt: q.prompt.trim(),
      code_snippet: q.code_snippet ? q.code_snippet.trim() : null,
      options: [q.options[0], q.options[1], q.options[2], q.options[3]],
      correct_index: q.correct_index,
      explanation: q.explanation.trim(),
      wrong_reasons: wrongArray,
      wrong_reasons_map: wrongMap,
      subskill: q.subskill.trim(),
      difficulty: q.difficulty,
    };
  });

  return {
    success: true,
    data: {
      questions: normalizedQuestions,
    },
  };
}
