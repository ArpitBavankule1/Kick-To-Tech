import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  Layers,
  Award,
} from 'lucide-react';
import type {
  Question,
  Recommendation,
  TopicMastery,
  TopicId,
  MasteryStatus,
} from '../types';

interface AdaptivePracticeProps {
  recommendation: Recommendation | null;
  masteries: Record<TopicId, TopicMastery>;
  onAnswerSubmit: (
    question: Question,
    selectedOption: number,
    isCorrect: boolean
  ) => void;
  onNextQuestion: () => void;
  onNavigateToKnowledgeMap: () => void;
  onResetProgress: () => void;
}

export const AdaptivePractice: React.FC<AdaptivePracticeProps> = ({
  recommendation,
  masteries,
  onAnswerSubmit,
  onNextQuestion,
  onNavigateToKnowledgeMap,
  onResetProgress,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [preAnswerMastery, setPreAnswerMastery] = useState<{
    accuracy: number | null;
    status: MasteryStatus;
  } | null>(null);

  // If no recommendation exists (all questions completed or empty pool)
  if (!recommendation) {
    return (
      <div className="empty-state">
        <Award size={56} className="empty-icon" style={{ color: '#10b981' }} />
        <h2 className="empty-title">All Curriculum Questions Mastered!</h2>
        <p className="empty-desc">
          Outstanding work! You have solved every available question across all topics.
          Check your Knowledge Map to view your complete mastery status, or reset progress
          to run a fresh diagnostic simulation.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="primary-btn"
            onClick={onNavigateToKnowledgeMap}
          >
            <Layers size={16} />
            <span>Inspect Knowledge Map</span>
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={onResetProgress}
          >
            <RotateCcw size={16} />
            <span>Reset Diagnostic</span>
          </button>
        </div>
      </div>
    );
  }

  const { question, recommendationType, reason, topicTitle, targetTopic } =
    recommendation;
  const currentTopicMastery = masteries[targetTopic];

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null || isAnswered) return;

    const isCorrect = selectedOption === question.correctAnswer;
    setLastAnswerCorrect(isCorrect);
    setIsAnswered(true);

    // Save previous mastery snapshot before submitting update
    setPreAnswerMastery({
      accuracy: currentTopicMastery.accuracyPercentage,
      status: currentTopicMastery.status,
    });

    onAnswerSubmit(question, selectedOption, isCorrect);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setLastAnswerCorrect(null);
    setPreAnswerMastery(null);
    onNextQuestion();
  };

  // Status badge styling helper
  const renderRecommendationBadge = () => {
    switch (recommendationType) {
      case 'weak_targeted':
        return (
          <span className="rec-badge weak">
            <AlertCircle size={14} />
            <span>Targeting Weak Area</span>
          </span>
        );
      case 'developing_targeted':
        return (
          <span className="rec-badge developing">
            <TrendingUp size={14} />
            <span>Elevating Developing Topic</span>
          </span>
        );
      case 'new_topic_diagnostic':
        return (
          <span className="rec-badge diagnostic">
            <HelpCircle size={14} />
            <span>Initial Baseline Diagnostic</span>
          </span>
        );
      case 'spaced_reinforcement':
        return (
          <span className="rec-badge reinforcement">
            <Sparkles size={14} />
            <span>Spaced Reinforcement</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Letter options A, B, C, D
  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div>
      {/* 1. Recommendation Grounding Banner */}
      <div className="recommendation-banner">
        <div className="recommendation-top">
          {renderRecommendationBadge()}
          <div className="rec-topic">
            Topic Focus: <span>{topicTitle}</span>
            {currentTopicMastery.status !== 'not_assessed' && (
              <span style={{ color: '#94a3b8', marginLeft: '0.5rem' }}>
                ({currentTopicMastery.accuracyPercentage}% Current Accuracy)
              </span>
            )}
          </div>
        </div>
        <p className="rec-reason">{reason}</p>
      </div>

      {/* 2. Interactive Question Card */}
      <div className="question-card">
        <div className="question-meta-bar">
          <div className="meta-tags">
            <span className="pill-tag">
              <BookOpen size={12} />
              <span>{topicTitle}</span>
            </span>
            <span className={`pill-tag difficulty-${question.difficulty}`}>
              <span>{question.difficulty.toUpperCase()}</span>
            </span>
            <span className="pill-tag">
              <span>Concept: {question.concept}</span>
            </span>
          </div>

          <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>
            ID: {question.id}
          </span>
        </div>

        <h3 className="question-prompt">{question.question}</h3>

        {/* Code Snippet (if available) */}
        {question.codeSnippet && (
          <div className="code-container">
            <pre>
              <code>{question.codeSnippet}</code>
            </pre>
          </div>
        )}

        {/* 4 Multiple Choice Options */}
        <div className="options-list">
          {question.options.map((optionText, idx) => {
            let optionClass = 'option-btn';
            if (isAnswered) {
              if (idx === question.correctAnswer) {
                optionClass += ' correct';
              } else if (idx === selectedOption) {
                optionClass += ' incorrect';
              }
            } else if (selectedOption === idx) {
              optionClass += ' selected';
            }

            return (
              <button
                key={idx}
                type="button"
                className={optionClass}
                onClick={() => handleSelect(idx)}
                disabled={isAnswered}
              >
                <span className="option-letter">{optionLetters[idx]}</span>
                <span>{optionText}</span>
              </button>
            );
          })}
        </div>

        {/* Submit Button (before answer submission) */}
        {!isAnswered && (
          <div className="card-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={handleSubmit}
              disabled={selectedOption === null}
            >
              <span>Submit Answer</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* 3. Immediate Feedback & Mastery Update Section */}
        {isAnswered && (
          <div
            className={`feedback-box ${lastAnswerCorrect ? 'correct' : 'incorrect'}`}
          >
            <div className="feedback-header">
              <div className="feedback-status">
                {lastAnswerCorrect ? (
                  <>
                    <CheckCircle size={22} />
                    <span>Correct Answer! Well done.</span>
                  </>
                ) : (
                  <>
                    <XCircle size={22} />
                    <span>Incorrect Choice</span>
                  </>
                )}
              </div>

              {/* Immediate Mastery Update Tag */}
              <div className="mastery-update-tag">
                <TrendingUp size={14} style={{ color: '#06b6d4' }} />
                <span>
                  {topicTitle} Mastery:{' '}
                  {preAnswerMastery?.accuracy !== null &&
                  preAnswerMastery?.accuracy !== undefined
                    ? `${preAnswerMastery.accuracy}%`
                    : 'Unassessed'}{' '}
                  ➔{' '}
                  <strong style={{ color: '#38bdf8' }}>
                    {masteries[targetTopic].accuracyPercentage}% (
                    {masteries[targetTopic].status.toUpperCase()})
                  </strong>
                </span>
              </div>
            </div>

            <div className="feedback-explanation">
              <strong>Key Concept Breakdown:</strong>
              <p style={{ marginTop: '0.35rem', whiteSpace: 'pre-line' }}>
                {question.explanation}
              </p>
            </div>

            <div className="feedback-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={onNavigateToKnowledgeMap}
              >
                <Layers size={14} />
                <span>View Knowledge Map</span>
              </button>

              <button
                type="button"
                className="primary-btn"
                onClick={handleNext}
              >
                <span>Next Recommended Question</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
