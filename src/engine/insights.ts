/**
 * RecallLoop AI v2 - Pure Deterministic Insights Engine
 *
 * Rules:
 * 1. getTrend: last 5 vs previous 5, needs 6+ attempts.
 * 2. getStreak: consecutive days, timezone-safe.
 * 3. getMistakePatterns: top 3 subskills by misses, min 2 misses.
 * 4. getRecentActivity(n): chronological recent activity feed.
 */

import {
  type BaseAttempt,
  getAttemptTopicId,
  getAttemptIsCorrect,
} from './mastery';
import type { EngineQuestion } from './recommend';

export type TrendDirection = 'improving' | 'declining' | 'stable' | 'insufficient_data';

export interface TrendResult {
  available: boolean;
  trend: TrendDirection;
  delta: number;
  last5Accuracy: number | null;
  prev5Accuracy: number | null;
  message: string;
}

export interface StreakResult {
  streak: number;
  currentStreak: number;
  maxStreak: number;
  activeDates: string[];
}

export interface MistakePattern {
  concept: string;
  misses: number;
  topicId: string;
}

export interface RecentActivityItem {
  id: string;
  topicId: string;
  questionId: string;
  isCorrect: boolean;
  timestamp: string;
}

/**
 * Extracts a numeric epoch timestamp from an attempt.
 */
function getAttemptEpoch(a: BaseAttempt, defaultIndex: number): number {
  if (typeof a.timestamp === 'number') {
    return a.timestamp;
  }
  if (typeof a.timestamp === 'string') {
    const parsed = Date.parse(a.timestamp);
    if (!isNaN(parsed)) return parsed;
  }
  if (a.created_at) {
    const parsed = Date.parse(a.created_at);
    if (!isNaN(parsed)) return parsed;
  }
  return defaultIndex * 1000;
}

/**
 * Converts timestamp to a timezone-safe calendar date 'YYYY-MM-DD'.
 */
function toCalendarDate(epochMs: number): string {
  const d = new Date(epochMs);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes performance trend by comparing the last 5 attempts against the previous up to 5 attempts.
 * Invariant: Requires at least 6 attempts to compute a meaningful trend.
 */
export function getTrend(attempts: BaseAttempt[] = []): TrendResult {
  if (attempts.length < 6) {
    return {
      available: false,
      trend: 'insufficient_data',
      delta: 0,
      last5Accuracy: null,
      prev5Accuracy: null,
      message: `Need at least 6 attempts to calculate trend (recorded: ${attempts.length}).`,
    };
  }

  // Sort chronologically ascending
  const sorted = [...attempts].sort(
    (a, b) => getAttemptEpoch(a, 0) - getAttemptEpoch(b, 0)
  );

  const last5 = sorted.slice(-5);
  const prevSlice = sorted.slice(Math.max(0, sorted.length - 10), sorted.length - 5);

  const last5Correct = last5.filter((a) => getAttemptIsCorrect(a)).length;
  const last5Accuracy = Math.round(((last5Correct / last5.length) * 100) * 10) / 10;

  const prev5Correct = prevSlice.filter((a) => getAttemptIsCorrect(a)).length;
  const prev5Accuracy = Math.round(((prev5Correct / prevSlice.length) * 100) * 10) / 10;

  const rawDelta = last5Accuracy - prev5Accuracy;
  const delta = Math.round(rawDelta * 10) / 10;

  let trend: TrendDirection = 'stable';
  let message = `Performance is stable (${last5Accuracy}% vs ${prev5Accuracy}% previously).`;

  if (delta > 0) {
    trend = 'improving';
    message = `Performance improved by +${delta}% (last 5: ${last5Accuracy}%, previous: ${prev5Accuracy}%).`;
  } else if (delta < 0) {
    trend = 'declining';
    message = `Performance declined by ${delta}% (last 5: ${last5Accuracy}%, previous: ${prev5Accuracy}%).`;
  }

  return {
    available: true,
    trend,
    delta,
    last5Accuracy,
    prev5Accuracy,
    message,
  };
}

/**
 * Calculates current and maximum consecutive day streak (timezone-safe using UTC calendar dates).
 */
export function getStreak(attempts: BaseAttempt[] = []): StreakResult {
  if (attempts.length === 0) {
    return {
      streak: 0,
      currentStreak: 0,
      maxStreak: 0,
      activeDates: [],
    };
  }

  // Extract distinct calendar dates in UTC
  const dateSet = new Set<string>();
  for (let i = 0; i < attempts.length; i++) {
    const epoch = getAttemptEpoch(attempts[i], i);
    dateSet.add(toCalendarDate(epoch));
  }

  const sortedDates = Array.from(dateSet).sort(); // YYYY-MM-DD ascending
  if (sortedDates.length === 0) {
    return { streak: 0, currentStreak: 0, maxStreak: 0, activeDates: [] };
  }

  // Calculate streaks across consecutive days (difference of 86400000 ms between dates)
  let currentStreak = 1;
  let maxStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(`${sortedDates[i - 1]}T00:00:00Z`).getTime();
    const currDate = new Date(`${sortedDates[i]}T00:00:00Z`).getTime();
    const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 1;
    }
  }

  return {
    streak: currentStreak,
    currentStreak,
    maxStreak,
    activeDates: sortedDates,
  };
}

/**
 * Identifies mistake patterns: Top 3 subskills/concepts by misses, with minimum 2 misses.
 */
export function getMistakePatterns(
  attempts: BaseAttempt[] = [],
  questions: EngineQuestion[] = []
): MistakePattern[] {
  const questionMap = new Map<string, EngineQuestion>();
  for (const q of questions) {
    questionMap.set(q.id, q);
  }

  // Filter only incorrect attempts
  const missedAttempts = attempts.filter((a) => !getAttemptIsCorrect(a));
  const conceptMissCount = new Map<string, { misses: number; topicId: string }>();

  for (const a of missedAttempts) {
    const qid = a.question_id || a.questionId || '';
    const q = questionMap.get(qid);
    const concept = q?.concept || 'General Concept';
    const topicId = getAttemptTopicId(a) || q?.topic_id || q?.topic || 'general';

    const existing = conceptMissCount.get(concept) || { misses: 0, topicId };
    existing.misses += 1;
    conceptMissCount.set(concept, existing);
  }

  // Filter to minimum 2 misses
  const patterns: MistakePattern[] = [];
  conceptMissCount.forEach((val, concept) => {
    if (val.misses >= 2) {
      patterns.push({
        concept,
        misses: val.misses,
        topicId: val.topicId,
      });
    }
  });

  // Sort by misses descending, then concept name alphabetically
  patterns.sort((a, b) => {
    if (b.misses !== a.misses) {
      return b.misses - a.misses;
    }
    return a.concept.localeCompare(b.concept);
  });

  // Return top 3
  return patterns.slice(0, 3);
}

/**
 * Returns the most recent n attempts with normalized details.
 */
export function getRecentActivity(
  attempts: BaseAttempt[] = [],
  n: number = 5
): RecentActivityItem[] {
  if (attempts.length === 0 || n <= 0) {
    return [];
  }

  const sorted = [...attempts].sort(
    (a, b) => getAttemptEpoch(b, 0) - getAttemptEpoch(a, 0)
  );

  return sorted.slice(0, n).map((a, idx) => ({
    id: a.id || `act-${idx}`,
    topicId: getAttemptTopicId(a),
    questionId: a.question_id || a.questionId || '',
    isCorrect: getAttemptIsCorrect(a),
    timestamp: a.created_at || (typeof a.timestamp === 'string' ? a.timestamp : new Date(getAttemptEpoch(a, idx)).toISOString()),
  }));
}
