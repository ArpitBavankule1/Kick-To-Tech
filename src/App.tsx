import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Map,
  BookOpen,
  History,
} from 'lucide-react';
import type { UserAnswer, Question, TopicId, Recommendation } from './types';
import { TOPIC_CONFIGS, QUESTIONS } from './data/questions';
import { calculateTopicMastery, calculateOverallStats } from './utils/mastery';
import { getNextRecommendation } from './utils/recommender';
import {
  loadAnswersFromStorage,
  saveAnswersToStorage,
  clearAnswersFromStorage,
} from './utils/storage';

import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { AdaptivePractice } from './components/AdaptivePractice';
import { KnowledgeMap } from './components/KnowledgeMap';
import { DiagnosticQuiz } from './components/DiagnosticQuiz';
import { HistoryLog } from './components/HistoryLog';
import { ResetConfirmModal } from './components/ResetConfirmModal';

export const App: React.FC = () => {
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>(() =>
    loadAnswersFromStorage()
  );
  const [activeTab, setActiveTab] = useState<
    'adaptive' | 'knowledge_map' | 'quiz' | 'history'
  >('adaptive');
  const [customActiveQuestion, setCustomActiveQuestion] =
    useState<Question | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);

  // 1. Pure Mastery Calculations
  const masteries = useMemo(
    () => calculateTopicMastery(userAnswers, TOPIC_CONFIGS, QUESTIONS),
    [userAnswers]
  );

  // 2. Aggregate Learning Statistics
  const stats = useMemo(
    () => calculateOverallStats(userAnswers, masteries),
    [userAnswers, masteries]
  );

  // 3. Pure Deterministic Recommendation
  const adaptiveRec = useMemo(
    () => getNextRecommendation(userAnswers, QUESTIONS, TOPIC_CONFIGS),
    [userAnswers]
  );

  // Active recommendation (either adaptive recommendation or direct topic practice)
  const activeRecommendation: Recommendation | null = useMemo(() => {
    if (customActiveQuestion) {
      const topicMastery = masteries[customActiveQuestion.topic];
      return {
        question: customActiveQuestion,
        targetTopic: customActiveQuestion.topic,
        topicTitle: customActiveQuestion.topicTitle,
        recommendationType:
          topicMastery.status === 'weak'
            ? 'weak_targeted'
            : topicMastery.status === 'not_assessed'
            ? 'new_topic_diagnostic'
            : 'developing_targeted',
        reason: `Direct Practice: Selected challenge targeting "${customActiveQuestion.concept}" in ${customActiveQuestion.topicTitle}.`,
        masteryBefore: topicMastery.accuracyPercentage,
        statusBefore: topicMastery.status,
      };
    }
    return adaptiveRec;
  }, [customActiveQuestion, adaptiveRec, masteries]);

  // Answer Submission Handler
  const handleAnswerSubmit = (
    question: Question,
    selectedOption: number,
    isCorrect: boolean
  ) => {
    const newAnswer: UserAnswer = {
      questionId: question.id,
      topic: question.topic,
      selectedAnswer: selectedOption,
      isCorrect,
      timestamp: Date.now(),
    };

    const updated = [...userAnswers, newAnswer];
    setUserAnswers(updated);
    saveAnswersToStorage(updated);
  };

  // Next Question Handler
  const handleNextQuestion = () => {
    setCustomActiveQuestion(null);
  };

  // Reset Progress Handler
  const handleConfirmReset = () => {
    clearAnswersFromStorage();
    setUserAnswers([]);
    setCustomActiveQuestion(null);
    setActiveTab('adaptive');
  };

  // Select Topic from Knowledge Map
  const handleSelectTopicForPractice = (topicId: TopicId) => {
    // Pick first uncompleted question from this topic
    const topicQuestions = QUESTIONS.filter((q) => q.topic === topicId);
    const solvedIds = new Set(
      userAnswers.filter((a) => a.isCorrect).map((a) => a.questionId)
    );
    const uncompleted = topicQuestions.filter((q) => !solvedIds.has(q.id));
    const target = uncompleted.length > 0 ? uncompleted[0] : topicQuestions[0];

    setCustomActiveQuestion(target);
    setActiveTab('adaptive');
  };

  // Select Question directly from Question Bank
  const handleSelectQuestion = (question: Question) => {
    setCustomActiveQuestion(question);
    setActiveTab('adaptive');
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        stats={stats}
        onOpenResetModal={() => setIsResetModalOpen(true)}
      />

      <main className="main-content">
        {/* Metric Cards Bar */}
        <DashboardStats
          stats={stats}
          totalQuestions={QUESTIONS.length}
        />

        {/* Tab Navigation */}
        <nav className="tab-navigation" aria-label="Learning Modes">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'adaptive' ? 'active' : ''}`}
            onClick={() => {
              setCustomActiveQuestion(null);
              setActiveTab('adaptive');
            }}
          >
            <Sparkles size={16} />
            <span>Adaptive Practice</span>
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'knowledge_map' ? 'active' : ''}`}
            onClick={() => setActiveTab('knowledge_map')}
          >
            <Map size={16} />
            <span>Knowledge Map</span>
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            <BookOpen size={16} />
            <span>Question Bank</span>
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={16} />
            <span>Answer History ({userAnswers.length})</span>
          </button>
        </nav>

        {/* Tab 1: Adaptive Practice */}
        {activeTab === 'adaptive' && (
          <AdaptivePractice
            recommendation={activeRecommendation}
            masteries={masteries}
            onAnswerSubmit={handleAnswerSubmit}
            onNextQuestion={handleNextQuestion}
            onNavigateToKnowledgeMap={() => setActiveTab('knowledge_map')}
            onResetProgress={() => setIsResetModalOpen(true)}
          />
        )}

        {/* Tab 2: Knowledge Map */}
        {activeTab === 'knowledge_map' && (
          <KnowledgeMap
            topicConfigs={TOPIC_CONFIGS}
            masteries={masteries}
            onSelectTopicForPractice={handleSelectTopicForPractice}
          />
        )}

        {/* Tab 3: Diagnostic Question Bank */}
        {activeTab === 'quiz' && (
          <DiagnosticQuiz
            questions={QUESTIONS}
            topicConfigs={TOPIC_CONFIGS}
            userAnswers={userAnswers}
            onSelectQuestion={handleSelectQuestion}
          />
        )}

        {/* Tab 4: Answer History */}
        {activeTab === 'history' && (
          <HistoryLog
            answers={userAnswers}
            questions={QUESTIONS}
            onStartPracticing={() => {
              setCustomActiveQuestion(null);
              setActiveTab('adaptive');
            }}
          />
        )}
      </main>

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </div>
  );
};

export default App;
