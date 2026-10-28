import type {
  TopicId,
  TopicConfig,
  Question,
  UserAnswer,
  TopicMastery,
  Recommendation,
  RecommendationType,
} from '../types';
import { calculateTopicMastery } from './mastery';

/**
 * Canonical ordering of topics used for deterministic tie-breaking.
 */
export const CANONICAL_TOPIC_ORDER: TopicId[] = [
  'arrays',
  'loops',
  'pointers',
  'data_structures',
];

const DIFFICULTY_WEIGHT: Record<string, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/**
 * Returns available questions for a given topic that have not yet been answered correctly.
 */
export function getAvailableQuestionsForTopic(
  topicId: TopicId,
  allQuestions: Question[],
  answers: UserAnswer[]
): Question[] {
  const correctlyAnsweredIds = new Set(
    answers.filter((a) => a.isCorrect).map((a) => a.questionId)
  );

  return allQuestions.filter(
    (q) => q.topic === topicId && !correctlyAnsweredIds.has(q.id)
  );
}

/**
 * Deterministically chooses the best question within a selected topic.
 * 1. Prioritizes unattempted questions over previously failed questions.
 * 2. Sorts by difficulty: easy -> medium -> hard.
 * 3. Ties broken deterministically by question ID alphabetical sort.
 */
export function pickDeterministicQuestion(
  topicQuestions: Question[],
  answers: UserAnswer[]
): Question {
  const attemptedIds = new Set(answers.map((a) => a.questionId));

  const unattempted = topicQuestions.filter((q) => !attemptedIds.has(q.id));
  const pool = unattempted.length > 0 ? unattempted : topicQuestions;

  return [...pool].sort((a, b) => {
    const diffA = DIFFICULTY_WEIGHT[a.difficulty] || 2;
    const diffB = DIFFICULTY_WEIGHT[b.difficulty] || 2;
    if (diffA !== diffB) return diffA - diffB;
    return a.id.localeCompare(b.id);
  })[0];
}

/**
 * Generates an individualized diagnostic explanation grounded in the student's recorded answers.
 */
export function generateRecommendationExplanation(
  _targetTopic: TopicId,
  mastery: TopicMastery,
  question: Question,
  type: RecommendationType
): string {
  if (type === 'new_topic_diagnostic') {
    return `Diagnostic Baseline: You have not yet answered any questions in ${mastery.topicTitle}. Solving this will map your starting proficiency.`;
  }

  const accuracy = mastery.accuracyPercentage ?? 0;
  const attempts = mastery.totalAttempts;
  const correct = mastery.correctAttempts;
  const incorrect = mastery.incorrectAttempts;

  const conceptNote =
    mastery.failedConcepts.length > 0
      ? ` Recent recorded difficulty with: "${mastery.failedConcepts.slice(0, 2).join('", "')}".`
      : '';

  if (type === 'weak_targeted') {
    return `Targeting Weakest Assessed Area: In ${mastery.topicTitle}, you scored ${correct} of ${attempts} (${accuracy}% accuracy, ${incorrect} incorrect).${conceptNote} Practicing "${question.concept}" will remediate this gap.`;
  }

  if (type === 'developing_targeted') {
    return `Elevating Developing Skill: In ${mastery.topicTitle}, you scored ${correct} of ${attempts} (${accuracy}% accuracy, Developing status).${conceptNote} Targeted practice on "${question.concept}" will push you into the Strong mastery bracket.`;
  }

  if (type === 'spaced_reinforcement') {
    return `Retention Reinforcement: All assessed weak spots are currently addressed. Reinforcing "${mastery.topicTitle}" (${accuracy}% accuracy) via "${question.concept}" to maintain high recall.`;
  }

  return `Adaptive Practice: Recommended question on ${mastery.topicTitle} targeting "${question.concept}".`;
}

/**
 * Pure recommendation engine function:
 * 1. Computes topic masteries.
 * 2. Filters assessed topics that still have available questions.
 * 3. Identifies the weakest assessed topic deterministically.
 *    - Tie-breaking: lowest accuracy% -> highest incorrect count -> highest total attempts -> canonical order.
 * 4. If no weak assessed topics have available questions:
 *    - Evaluates 'developing' assessed topics with available questions.
 * 5. If no weak/developing assessed topics have available questions:
 *    - Looks for 'not_assessed' topics with available questions.
 * 6. If all assessed topics are 'strong', selects available questions from strong topics.
 * 7. If all questions in the entire curriculum are solved, returns null.
 */
export function getNextRecommendation(
  answers: UserAnswer[],
  allQuestions: Question[],
  topicConfigs: TopicConfig[]
): Recommendation | null {
  const masteries = calculateTopicMastery(answers, topicConfigs, allQuestions);

  // Helper to compare two assessed topics deterministically
  const compareAssessedTopics = (a: TopicMastery, b: TopicMastery): number => {
    const accA = a.accuracyPercentage ?? 0;
    const accB = b.accuracyPercentage ?? 0;
    if (accA !== accB) return accA - accB; // lower accuracy is weaker

    if (a.incorrectAttempts !== b.incorrectAttempts) {
      return b.incorrectAttempts - a.incorrectAttempts; // more incorrect attempts is weaker
    }

    if (a.totalAttempts !== b.totalAttempts) {
      return b.totalAttempts - a.totalAttempts; // more total attempts is weaker
    }

    // Canonical order tie-breaker
    const indexA = CANONICAL_TOPIC_ORDER.indexOf(a.topicId);
    const indexB = CANONICAL_TOPIC_ORDER.indexOf(b.topicId);
    return indexA - indexB;
  };

  // 1. Check for Weak Assessed Topics with Available Questions
  const weakTopicsWithQuestions = topicConfigs
    .map((c) => masteries[c.id])
    .filter(
      (m) =>
        m.status === 'weak' &&
        getAvailableQuestionsForTopic(m.topicId, allQuestions, answers).length > 0
    )
    .sort(compareAssessedTopics);

  if (weakTopicsWithQuestions.length > 0) {
    const chosen = weakTopicsWithQuestions[0];
    const available = getAvailableQuestionsForTopic(
      chosen.topicId,
      allQuestions,
      answers
    );
    const question = pickDeterministicQuestion(available, answers);
    return {
      question,
      targetTopic: chosen.topicId,
      topicTitle: chosen.topicTitle,
      recommendationType: 'weak_targeted',
      reason: generateRecommendationExplanation(
        chosen.topicId,
        chosen,
        question,
        'weak_targeted'
      ),
      masteryBefore: chosen.accuracyPercentage,
      statusBefore: chosen.status,
    };
  }

  // 2. Check for Developing Assessed Topics with Available Questions
  const developingTopicsWithQuestions = topicConfigs
    .map((c) => masteries[c.id])
    .filter(
      (m) =>
        m.status === 'developing' &&
        getAvailableQuestionsForTopic(m.topicId, allQuestions, answers).length > 0
    )
    .sort(compareAssessedTopics);

  if (developingTopicsWithQuestions.length > 0) {
    const chosen = developingTopicsWithQuestions[0];
    const available = getAvailableQuestionsForTopic(
      chosen.topicId,
      allQuestions,
      answers
    );
    const question = pickDeterministicQuestion(available, answers);
    return {
      question,
      targetTopic: chosen.topicId,
      topicTitle: chosen.topicTitle,
      recommendationType: 'developing_targeted',
      reason: generateRecommendationExplanation(
        chosen.topicId,
        chosen,
        question,
        'developing_targeted'
      ),
      masteryBefore: chosen.accuracyPercentage,
      statusBefore: chosen.status,
    };
  }

  // 3. Check for Unassessed Topics with Available Questions
  const unassessedTopicsWithQuestions = topicConfigs
    .map((c) => masteries[c.id])
    .filter(
      (m) =>
        m.status === 'not_assessed' &&
        getAvailableQuestionsForTopic(m.topicId, allQuestions, answers).length > 0
    )
    .sort((a, b) => {
      const idxA = CANONICAL_TOPIC_ORDER.indexOf(a.topicId);
      const idxB = CANONICAL_TOPIC_ORDER.indexOf(b.topicId);
      return idxA - idxB;
    });

  if (unassessedTopicsWithQuestions.length > 0) {
    const chosen = unassessedTopicsWithQuestions[0];
    const available = getAvailableQuestionsForTopic(
      chosen.topicId,
      allQuestions,
      answers
    );
    const question = pickDeterministicQuestion(available, answers);
    return {
      question,
      targetTopic: chosen.topicId,
      topicTitle: chosen.topicTitle,
      recommendationType: 'new_topic_diagnostic',
      reason: generateRecommendationExplanation(
        chosen.topicId,
        chosen,
        question,
        'new_topic_diagnostic'
      ),
      masteryBefore: null,
      statusBefore: 'not_assessed',
    };
  }

  // 4. Check for Strong Topics with Available Questions (Spaced Reinforcement)
  const strongTopicsWithQuestions = topicConfigs
    .map((c) => masteries[c.id])
    .filter(
      (m) =>
        m.status === 'strong' &&
        getAvailableQuestionsForTopic(m.topicId, allQuestions, answers).length > 0
    )
    .sort(compareAssessedTopics);

  if (strongTopicsWithQuestions.length > 0) {
    const chosen = strongTopicsWithQuestions[0];
    const available = getAvailableQuestionsForTopic(
      chosen.topicId,
      allQuestions,
      answers
    );
    const question = pickDeterministicQuestion(available, answers);
    return {
      question,
      targetTopic: chosen.topicId,
      topicTitle: chosen.topicTitle,
      recommendationType: 'spaced_reinforcement',
      reason: generateRecommendationExplanation(
        chosen.topicId,
        chosen,
        question,
        'spaced_reinforcement'
      ),
      masteryBefore: chosen.accuracyPercentage,
      statusBefore: chosen.status,
    };
  }

  // 5. All questions in the curriculum have been mastered
  return null;
}
