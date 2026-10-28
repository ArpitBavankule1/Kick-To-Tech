/**
 * RecallLoop AI v2 - Pure Deterministic Recommendation Engine
 *
 * Rules:
 * 1. Pure deterministic TypeScript: No LLMs in recommendation decision paths.
 * 2. Ignore not-assessed topics first.
 * 3. Pick the weakest assessed assigned topic with unanswered questions.
 * 4. Tie-break: fewer attempts, then topic ID alphabetical.
 * 5. Adaptive difficulty: lower difficulty after a miss, step up after two correct.
 * 6. Fallback 1: If no assessed topic has questions left, offer today's assigned topic.
 * 7. Fallback 2: If nothing is left, return a completion message suggesting a retry of missed questions.
 * 8. Return a plain-English reason with real numbers.
 */

import {
  type BaseAttempt,
  type TopicItem,
  getAttemptTopicId,
  getAttemptIsCorrect,
  getTopicStats,
} from './mastery';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface EngineQuestion {
  id: string;
  topic_id?: string;
  topic?: string;
  concept?: string;
  question: string;
  options?: string[];
  correct_index?: number;
  correctAnswer?: number;
  difficulty?: DifficultyLevel | string;
  code_snippet?: string | null;
  codeSnippet?: string | null;
  explanation?: string;
}

export type RecommendationType =
  | 'weak_assessed'
  | 'assigned_fallback'
  | 'all_completed';

export interface RecommendationResult {
  question: EngineQuestion | null;
  topicId: string | null;
  targetDifficulty: DifficultyLevel | null;
  reason: string;
  isComplete: boolean;
  type: RecommendationType;
  retryQuestionIds: string[];
}

/**
 * Normalizes question topic ID across v2 (topic_id) and v1 (topic).
 */
export function getQuestionTopicId(q: EngineQuestion): string {
  return q.topic_id || q.topic || '';
}

/**
 * Normalizes question difficulty (defaults to 'medium').
 */
export function getQuestionDifficulty(q: EngineQuestion): DifficultyLevel {
  const d = (q.difficulty || 'medium').toLowerCase();
  if (d === 'easy' || d === 'hard') {
    return d;
  }
  return 'medium';
}

/**
 * Determines target difficulty based on recent performance history in a topic.
 * - Lower difficulty after a miss (e.g. hard -> medium, medium -> easy).
 * - Step up difficulty after two consecutive correct answers (e.g. easy -> medium, medium -> hard).
 * - Otherwise default to medium.
 */
export function calculateAdaptiveDifficulty(
  topicAttempts: BaseAttempt[]
): { difficulty: DifficultyLevel; adjustmentReason: string } {
  if (topicAttempts.length === 0) {
    return {
      difficulty: 'medium',
      adjustmentReason: 'Starting at standard medium difficulty.',
    };
  }

  const lastAttempt = topicAttempts[topicAttempts.length - 1];
  const lastCorrect = getAttemptIsCorrect(lastAttempt);

  // Check last miss: lower difficulty
  if (!lastCorrect) {
    return {
      difficulty: 'easy',
      adjustmentReason: 'Lowering difficulty to easy after a missed question for conceptual reinforcement.',
    };
  }

  // Check last two correct in a row: step up difficulty
  if (topicAttempts.length >= 2) {
    const secondLastAttempt = topicAttempts[topicAttempts.length - 2];
    const secondLastCorrect = getAttemptIsCorrect(secondLastAttempt);

    if (lastCorrect && secondLastCorrect) {
      return {
        difficulty: 'hard',
        adjustmentReason: 'Stepping up to hard difficulty after two consecutive correct answers.',
      };
    }
  }

  return {
    difficulty: 'medium',
    adjustmentReason: 'Maintaining medium difficulty based on recent progress.',
  };
}

/**
 * Main recommendation entry point.
 */
export function recommendNext(
  attempts: BaseAttempt[] = [],
  assignedTopics: (TopicItem | string)[] = [],
  questions: EngineQuestion[] = []
): RecommendationResult {
  // Normalize assigned topic IDs
  const topicIds: string[] = assignedTopics
    .map((t) => (typeof t === 'string' ? t : t.id))
    .filter(Boolean);

  // Set of all attempted question IDs
  const attemptedQuestionIds = new Set<string>(
    attempts
      .map((a) => a.question_id || a.questionId)
      .filter((id): id is string => Boolean(id))
  );

  // Identify all missed question IDs for retry recommendations
  const missedQuestionIds: string[] = attempts
    .filter((a) => !getAttemptIsCorrect(a))
    .map((a) => a.question_id || a.questionId)
    .filter((id): id is string => Boolean(id));

  // If no assigned topics or questions provided at all
  if (topicIds.length === 0 || questions.length === 0) {
    return {
      question: null,
      topicId: null,
      targetDifficulty: null,
      reason: 'No curriculum topics or questions are currently assigned.',
      isComplete: true,
      type: 'all_completed',
      retryQuestionIds: Array.from(new Set(missedQuestionIds)),
    };
  }

  // Filter questions that belong to the assigned topics
  const assignedTopicSet = new Set(topicIds);
  const eligibleQuestions = questions.filter((q) =>
    assignedTopicSet.has(getQuestionTopicId(q))
  );

  // Map unanswered questions per topic
  const unansweredByTopic = new Map<string, EngineQuestion[]>();
  for (const tid of topicIds) {
    unansweredByTopic.set(tid, []);
  }

  for (const q of eligibleQuestions) {
    const tid = getQuestionTopicId(q);
    if (!attemptedQuestionIds.has(q.id)) {
      unansweredByTopic.get(tid)?.push(q);
    }
  }

  // Calculate mastery stats for each assigned topic
  interface AssessedTopicCandidate {
    topicId: string;
    mastery: number;
    total: number;
    correct: number;
    unansweredCount: number;
    topicAttempts: BaseAttempt[];
  }

  const assessedCandidates: AssessedTopicCandidate[] = [];
  const unassessedTopicIdsWithQuestions: string[] = [];

  for (const tid of topicIds) {
    const stats = getTopicStats(attempts, tid);
    const unanswered = unansweredByTopic.get(tid) || [];

    if (stats.mastery !== null) {
      // Assessed topic
      if (unanswered.length > 0) {
        const topicAttempts = attempts.filter(
          (a) => getAttemptTopicId(a) === tid
        );
        assessedCandidates.push({
          topicId: tid,
          mastery: stats.mastery,
          total: stats.total,
          correct: stats.correct,
          unansweredCount: unanswered.length,
          topicAttempts,
        });
      }
    } else {
      // Not assessed topic
      if (unanswered.length > 0) {
        unassessedTopicIdsWithQuestions.push(tid);
      }
    }
  }

  // 1. Pick the weakest assessed assigned topic with unanswered questions
  if (assessedCandidates.length > 0) {
    // Sort rules:
    // a) Weakest mastery (lowest mastery percentage)
    // b) Tie-break by fewer attempts (total ascending)
    // c) Tie-break by topic ID alphabetical (localeCompare)
    assessedCandidates.sort((a, b) => {
      if (a.mastery !== b.mastery) {
        return a.mastery - b.mastery;
      }
      if (a.total !== b.total) {
        return a.total - b.total;
      }
      return a.topicId.localeCompare(b.topicId);
    });

    const chosen = assessedCandidates[0];
    const pool = unansweredByTopic.get(chosen.topicId) || [];
    const { difficulty, adjustmentReason } = calculateAdaptiveDifficulty(
      chosen.topicAttempts
    );

    // Pick question matching difficulty if available, else pick first available
    const matchingDiffQuestions = pool.filter(
      (q) => getQuestionDifficulty(q) === difficulty
    );
    const selectedQuestion =
      matchingDiffQuestions.length > 0 ? matchingDiffQuestions[0] : pool[0];

    const reason = `You scored ${chosen.mastery}% (${chosen.correct}/${chosen.total} correct) in ${chosen.topicId}. ${adjustmentReason}`;

    return {
      question: selectedQuestion,
      topicId: chosen.topicId,
      targetDifficulty: difficulty,
      reason,
      isComplete: false,
      type: 'weak_assessed',
      retryQuestionIds: Array.from(new Set(missedQuestionIds)),
    };
  }

  // 2. Fallback 1: If no assessed topic has questions left, offer today's assigned topic
  if (unassessedTopicIdsWithQuestions.length > 0) {
    const fallbackTopicId = unassessedTopicIdsWithQuestions[0];
    const pool = unansweredByTopic.get(fallbackTopicId) || [];
    const selectedQuestion = pool[0];

    return {
      question: selectedQuestion,
      topicId: fallbackTopicId,
      targetDifficulty: 'medium',
      reason: `All questions in assessed topics are completed. Starting diagnostic practice for assigned topic "${fallbackTopicId}".`,
      isComplete: false,
      type: 'assigned_fallback',
      retryQuestionIds: Array.from(new Set(missedQuestionIds)),
    };
  }

  // 3. Fallback 2: If nothing is left, return a completion message suggesting a retry of missed questions
  const uniqueMissed = Array.from(new Set(missedQuestionIds));
  const retryReason =
    uniqueMissed.length > 0
      ? `All assigned questions are completed! You have ${uniqueMissed.length} missed question${
          uniqueMissed.length === 1 ? '' : 's'
        } available for targeted retry practice.`
      : 'All assigned curriculum questions have been completed with 100% mastery! Excellent work.';

  return {
    question: null,
    topicId: null,
    targetDifficulty: null,
    reason: retryReason,
    isComplete: true,
    type: 'all_completed',
    retryQuestionIds: uniqueMissed,
  };
}
