import type {
  TopicId,
  TopicConfig,
  Question,
  UserAnswer,
  TopicMastery,
  LearningStats,
} from '../types';

/**
 * Calculates topic-by-topic mastery based on actual student answers.
 * PURE FUNCTION: No external side-effects, fully deterministic and testable.
 *
 * CRITICAL RULE: Unassessed topics MUST NOT be categorized as 'weak'.
 * They remain explicitly 'not_assessed' with an accuracy of null.
 */
export function calculateTopicMastery(
  answers: UserAnswer[],
  topicConfigs: TopicConfig[],
  allQuestions: Question[] = []
): Record<TopicId, TopicMastery> {
  const questionMap = new Map<string, Question>();
  for (const q of allQuestions) {
    questionMap.set(q.id, q);
  }

  const result: Partial<Record<TopicId, TopicMastery>> = {};

  for (const config of topicConfigs) {
    const topicAnswers = answers.filter((a) => a.topic === config.id);

    if (topicAnswers.length === 0) {
      // Unassessed topic - MUST NOT BE LABELED WEAK
      result[config.id] = {
        topicId: config.id,
        topicTitle: config.title,
        totalAttempts: 0,
        correctAttempts: 0,
        incorrectAttempts: 0,
        accuracyPercentage: null,
        status: 'not_assessed',
        failedConcepts: [],
      };
      continue;
    }

    const correctAttempts = topicAnswers.filter((a) => a.isCorrect).length;
    const totalAttempts = topicAnswers.length;
    const incorrectAttempts = totalAttempts - correctAttempts;
    const accuracyPercentage = Math.round((correctAttempts / totalAttempts) * 100);

    // Collect unique concepts from questions answered incorrectly
    const failedConceptsSet = new Set<string>();
    for (const ans of topicAnswers) {
      if (!ans.isCorrect) {
        const q = questionMap.get(ans.questionId);
        if (q?.concept) {
          failedConceptsSet.add(q.concept);
        }
      }
    }

    // Determine status: Strong (>=80%), Developing (50-79%), Weak (<50%)
    let status: TopicMastery['status'] = 'developing';
    if (accuracyPercentage >= 80) {
      status = 'strong';
    } else if (accuracyPercentage < 50) {
      status = 'weak';
    }

    result[config.id] = {
      topicId: config.id,
      topicTitle: config.title,
      totalAttempts,
      correctAttempts,
      incorrectAttempts,
      accuracyPercentage,
      status,
      failedConcepts: Array.from(failedConceptsSet),
    };
  }

  return result as Record<TopicId, TopicMastery>;
}

/**
 * Calculates aggregate summary metrics across all topics and answers.
 */
export function calculateOverallStats(
  answers: UserAnswer[],
  masteries: Record<TopicId, TopicMastery>
): LearningStats {
  const totalAnswers = answers.length;
  const correctAnswers = answers.filter((a) => a.isCorrect).length;
  const overallAccuracy =
    totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

  const masteryList = Object.values(masteries);
  const weakCount = masteryList.filter((m) => m.status === 'weak').length;
  const developingCount = masteryList.filter((m) => m.status === 'developing').length;
  const strongCount = masteryList.filter((m) => m.status === 'strong').length;
  const unassessedCount = masteryList.filter((m) => m.status === 'not_assessed').length;
  const assessedCount = masteryList.length - unassessedCount;

  return {
    totalAnswers,
    correctAnswers,
    overallAccuracy,
    assessedCount,
    weakCount,
    developingCount,
    strongCount,
    unassessedCount,
  };
}
