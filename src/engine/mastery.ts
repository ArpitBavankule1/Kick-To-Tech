/**
 * RecallLoop AI v2 - Pure Deterministic Mastery Engine
 *
 * Rules & Invariants:
 * 1. Pure deterministic TypeScript with zero side-effects.
 * 2. Mastery and trends are strictly DERIVED from the attempts table, never stored.
 * 3. Zero attempts = "not-assessed" (mastery: null).
 * 4. 0% with attempts = "weak".
 * 5. Status thresholds: >=80 strong, >=50 improving, <50 (or >0) weak, null not-assessed.
 * 6. Confidence: "early" if total < 3 else "reliable".
 */

export type MasteryConfidence = 'early' | 'reliable';

export type MasteryStatus = 'strong' | 'improving' | 'weak' | 'not-assessed';

export interface BaseAttempt {
  id?: string;
  topic_id?: string;
  topic?: string;
  is_correct?: boolean;
  isCorrect?: boolean;
  question_id?: string;
  questionId?: string;
  created_at?: string;
  timestamp?: number | string;
}

export interface TopicStats {
  correct: number;
  total: number;
  mastery: number | null; // percentage 0-100 or null if unassessed
  confidence: MasteryConfidence;
  status: MasteryStatus;
}

export interface TopicItem {
  id: string;
  name?: string;
  slug?: string;
}

export interface SubjectStats {
  totalAttempts: number;
  totalCorrect: number;
  overallMastery: number | null;
  status: MasteryStatus;
  topicStats: Record<string, TopicStats>;
  weakTopics: string[];
  improvingTopics: string[];
  strongTopics: string[];
  notAssessedTopics: string[];
}

/**
 * Normalizes attempt topic ID across v2 database rows and v1 answer objects.
 */
export function getAttemptTopicId(attempt: BaseAttempt): string {
  return attempt.topic_id || attempt.topic || '';
}

/**
 * Normalizes correctness across v2 database rows (is_correct) and v1 (isCorrect).
 */
export function getAttemptIsCorrect(attempt: BaseAttempt): boolean {
  return Boolean(attempt.is_correct ?? attempt.isCorrect ?? false);
}

/**
 * Evaluates the status for a given mastery percentage.
 * Thresholds:
 * - null: "not-assessed" (Rule 3: zero attempts = not-assessed)
 * - >= 80: "strong"
 * - >= 50: "improving"
 * - < 50 (including 0): "weak" (Rule 3: 0% with attempts = weak)
 */
export function getStatus(mastery: number | null): MasteryStatus {
  if (mastery === null || mastery === undefined || isNaN(mastery)) {
    return 'not-assessed';
  }
  if (mastery >= 80) {
    return 'strong';
  }
  if (mastery >= 50) {
    return 'improving';
  }
  return 'weak';
}

/**
 * Calculates topic statistics and confidence from a list of attempts.
 * Returns { correct, total, mastery, confidence, status }
 */
export function getTopicStats(
  attempts: BaseAttempt[] = [],
  topicId: string
): TopicStats {
  if (!topicId) {
    return {
      correct: 0,
      total: 0,
      mastery: null,
      confidence: 'early',
      status: 'not-assessed',
    };
  }

  const topicAttempts = attempts.filter(
    (a) => getAttemptTopicId(a) === topicId
  );

  const total = topicAttempts.length;
  if (total === 0) {
    return {
      correct: 0,
      total: 0,
      mastery: null,
      confidence: 'early',
      status: 'not-assessed',
    };
  }

  const correct = topicAttempts.filter((a) => getAttemptIsCorrect(a)).length;
  const rawMastery = (correct / total) * 100;
  // Round to 1 decimal place to preserve floats like 79.5 or 49.9 cleanly
  const mastery = Math.round(rawMastery * 10) / 10;
  const confidence: MasteryConfidence = total < 3 ? 'early' : 'reliable';
  const status = getStatus(mastery);

  return {
    correct,
    total,
    mastery,
    confidence,
    status,
  };
}

/**
 * Computes aggregate subject statistics and topic breakdown for a set of topics.
 */
export function getSubjectStats(
  attempts: BaseAttempt[] = [],
  topics: (TopicItem | string)[] = []
): SubjectStats {
  const topicStats: Record<string, TopicStats> = {};
  const weakTopics: string[] = [];
  const improvingTopics: string[] = [];
  const strongTopics: string[] = [];
  const notAssessedTopics: string[] = [];

  for (const t of topics) {
    const topicId = typeof t === 'string' ? t : t.id;
    if (!topicId) continue;

    const stats = getTopicStats(attempts, topicId);
    topicStats[topicId] = stats;

    switch (stats.status) {
      case 'weak':
        weakTopics.push(topicId);
        break;
      case 'improving':
        improvingTopics.push(topicId);
        break;
      case 'strong':
        strongTopics.push(topicId);
        break;
      case 'not-assessed':
        notAssessedTopics.push(topicId);
        break;
    }
  }

  const totalAttempts = attempts.length;
  const totalCorrect = attempts.filter((a) => getAttemptIsCorrect(a)).length;
  const overallMastery =
    totalAttempts > 0
      ? Math.round(((totalCorrect / totalAttempts) * 100) * 10) / 10
      : null;

  return {
    totalAttempts,
    totalCorrect,
    overallMastery,
    status: getStatus(overallMastery),
    topicStats,
    weakTopics,
    improvingTopics,
    strongTopics,
    notAssessedTopics,
  };
}
