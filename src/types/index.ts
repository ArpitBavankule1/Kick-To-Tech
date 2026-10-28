export type TopicId = 'arrays' | 'loops' | 'pointers' | 'data_structures';

export type MasteryStatus = 'not_assessed' | 'weak' | 'developing' | 'strong';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface TopicConfig {
  id: TopicId;
  title: string;
  description: string;
  iconName: string;
}

export interface Question {
  id: string;
  topic: TopicId;
  topicTitle: string;
  difficulty: Difficulty;
  concept: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctAnswer: number; // 0-based index
  explanation: string;
}

export interface UserAnswer {
  questionId: string;
  topic: TopicId;
  selectedAnswer: number;
  isCorrect: boolean;
  timestamp: number;
}

export interface TopicMastery {
  topicId: TopicId;
  topicTitle: string;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  accuracyPercentage: number | null; // null if unassessed
  status: MasteryStatus;
  failedConcepts: string[];
}

export type RecommendationType =
  | 'weak_targeted'
  | 'developing_targeted'
  | 'new_topic_diagnostic'
  | 'spaced_reinforcement'
  | 'all_completed';

export interface Recommendation {
  question: Question;
  targetTopic: TopicId;
  topicTitle: string;
  recommendationType: RecommendationType;
  reason: string;
  masteryBefore: number | null;
  statusBefore: MasteryStatus;
}

export interface LearningStats {
  totalAnswers: number;
  correctAnswers: number;
  overallAccuracy: number;
  assessedCount: number;
  weakCount: number;
  developingCount: number;
  strongCount: number;
  unassessedCount: number;
}
