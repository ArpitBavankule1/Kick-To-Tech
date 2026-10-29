import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
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

  // 1. Empty state: when all questions are mastered or pool is exhausted
  if (!recommendation) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="p-8 sm:p-12 rounded-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur-md text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2 shadow-lg shadow-emerald-500/10">
            <Award size={36} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            All Curriculum Questions Mastered!
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Outstanding work! You have solved every available question across all topics.
            Inspect your Knowledge Map to view your complete mastery status, or reset progress
            to run a fresh diagnostic simulation.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-400 text-slate-900 font-semibold hover:bg-cyan-300 shadow-md shadow-cyan-500/20 transition-all inline-flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 text-sm"
              onClick={onNavigateToKnowledgeMap}
            >
              <Layers size={16} />
              <span>Inspect Knowledge Map</span>
            </button>
            <button
              type="button"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-600 bg-slate-900/60 text-white hover:bg-slate-800 transition-all inline-flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 text-sm font-semibold"
              onClick={onResetProgress}
            >
              <RotateCcw size={16} />
              <span>Reset Diagnostic</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { question, recommendationType, reason, topicTitle, targetTopic } =
    recommendation;

  // Safe fallback to prevent undefined errors when accessing targetTopic mastery
  const currentTopicMastery: TopicMastery = masteries?.[targetTopic] ?? {
    topicId: targetTopic,
    topicTitle: topicTitle || question?.topicTitle || 'Target Topic',
    totalAttempts: 0,
    correctAttempts: 0,
    incorrectAttempts: 0,
    accuracyPercentage: null,
    status: 'not_assessed',
    failedConcepts: [],
  };

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
      accuracy: currentTopicMastery.accuracyPercentage ?? null,
      status: currentTopicMastery.status ?? 'not_assessed',
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <AlertCircle size={14} className="shrink-0" />
            <span>Targeting Weak Area</span>
          </span>
        );
      case 'developing_targeted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <TrendingUp size={14} className="shrink-0" />
            <span>Elevating Developing Topic</span>
          </span>
        );
      case 'new_topic_diagnostic':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <HelpCircle size={14} className="shrink-0" />
            <span>Initial Baseline Diagnostic</span>
          </span>
        );
      case 'spaced_reinforcement':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <Sparkles size={14} className="shrink-0" />
            <span>Spaced Reinforcement</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Letter options A, B, C, D
  const optionLetters = ['A', 'B', 'C', 'D'];

  // Safe post-answer mastery metrics
  const postMastery = masteries?.[targetTopic];
  const postAccuracy =
    postMastery?.accuracyPercentage !== undefined
      ? postMastery.accuracyPercentage
      : currentTopicMastery.accuracyPercentage;
  const postStatus = (
    postMastery?.status ||
    currentTopicMastery.status ||
    'not_assessed'
  )
    .replace('_', ' ')
    .toUpperCase();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* 1. Recommendation Grounding Banner */}
      <div className="p-4 sm:p-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-indigo-950/40 backdrop-blur-md shadow-lg shadow-cyan-500/5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>{renderRecommendationBadge()}</div>
          <div className="text-xs sm:text-sm text-slate-300 font-medium">
            Topic Focus:{' '}
            <span className="text-white font-bold">
              {topicTitle || question?.topicTitle || 'General Topic'}
            </span>
            {currentTopicMastery.status !== 'not_assessed' &&
              currentTopicMastery.accuracyPercentage !== null && (
                <span className="text-slate-400 ml-2">
                  ({currentTopicMastery.accuracyPercentage}% Current Accuracy)
                </span>
              )}
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
          {reason}
        </p>
      </div>

      {/* 2. Interactive Question Card */}
      <div className="p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-md shadow-xl space-y-5 sm:space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
              <BookOpen size={12} className="text-cyan-400" />
              <span>{topicTitle || question?.topicTitle || 'Topic'}</span>
            </span>

            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                question.difficulty === 'easy'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : question.difficulty === 'medium'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}
            >
              <span>{question.difficulty.toUpperCase()}</span>
            </span>

            {question.concept && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
                Concept: {question.concept}
              </span>
            )}
          </div>

          <span className="text-xs font-mono text-slate-500">
            ID: {question.id}
          </span>
        </div>

        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white leading-relaxed">
          {question.question}
        </h3>

        {/* Code Snippet (if available) */}
        {question.codeSnippet && (
          <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-3.5 sm:p-4 overflow-x-auto text-xs sm:text-sm font-mono text-cyan-300 leading-relaxed shadow-inner">
            <pre>
              <code>{question.codeSnippet}</code>
            </pre>
          </div>
        )}

        {/* 4 Multiple Choice Options */}
        <div className="space-y-3 w-full">
          {question.options.map((optionText, idx) => {
            let stateStyles =
              'border-slate-700/80 bg-slate-900/50 hover:bg-slate-800/80 hover:border-slate-500 text-slate-200';
            let letterStyles = 'bg-slate-800 text-slate-400';

            if (isAnswered) {
              if (idx === question.correctAnswer) {
                stateStyles =
                  'border-emerald-500 bg-emerald-500/15 text-emerald-100 font-semibold shadow-md shadow-emerald-500/10';
                letterStyles = 'bg-emerald-500 text-white';
              } else if (idx === selectedOption) {
                stateStyles =
                  'border-rose-500 bg-rose-500/15 text-rose-100 font-semibold shadow-md shadow-rose-500/10';
                letterStyles = 'bg-rose-500 text-white';
              } else {
                stateStyles = 'border-slate-800/60 bg-slate-950/40 text-slate-500 opacity-60';
              }
            } else if (selectedOption === idx) {
              stateStyles =
                'border-cyan-400 bg-cyan-500/15 text-white shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/50';
              letterStyles = 'bg-cyan-400 text-slate-950 font-bold';
            }

            return (
              <button
                key={idx}
                type="button"
                className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-150 flex items-start gap-3 sm:gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 min-h-[48px] ${stateStyles}`}
                onClick={() => handleSelect(idx)}
                disabled={isAnswered}
              >
                <span
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-colors ${letterStyles}`}
                >
                  {optionLetters[idx]}
                </span>
                <span className="text-xs sm:text-sm leading-relaxed pt-0.5 sm:pt-1 break-words flex-1">
                  {optionText}
                </span>
              </button>
            );
          })}
        </div>

        {/* Submit Button (before answer submission) */}
        {!isAnswered && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-400 text-slate-900 font-semibold hover:bg-cyan-300 shadow-md shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 text-sm"
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
            className={`p-4 sm:p-6 rounded-2xl border transition-all duration-200 space-y-4 ${
              lastAnswerCorrect
                ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                : 'border-rose-500/30 bg-rose-950/20 text-rose-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                {lastAnswerCorrect ? (
                  <>
                    <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
                    <span className="text-base sm:text-lg font-bold text-white">
                      Correct Answer! Well done.
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle size={24} className="text-rose-400 shrink-0" />
                    <span className="text-base sm:text-lg font-bold text-white">
                      Incorrect Choice
                    </span>
                  </>
                )}
              </div>

              {/* Immediate Mastery Update Tag (Strictly Undefined-Safe) */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs sm:text-sm font-semibold text-cyan-300">
                <TrendingUp size={16} className="text-cyan-400 shrink-0" />
                <span>
                  {topicTitle || 'Topic'} Mastery:{' '}
                  {preAnswerMastery?.accuracy !== null &&
                  preAnswerMastery?.accuracy !== undefined
                    ? `${preAnswerMastery.accuracy}%`
                    : 'Unassessed'}{' '}
                  ➔{' '}
                  <strong className="text-cyan-200 font-bold">
                    {postAccuracy !== null && postAccuracy !== undefined
                      ? `${postAccuracy}%`
                      : 'Unassessed'}{' '}
                    ({postStatus})
                  </strong>
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <strong className="text-xs uppercase font-bold tracking-wider text-slate-300">
                Key Concept Breakdown:
              </strong>
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {question.explanation}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
              <button
                type="button"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-600 bg-slate-900/60 text-white hover:bg-slate-800 transition-all inline-flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                onClick={onNavigateToKnowledgeMap}
              >
                <Layers size={14} />
                <span>View Knowledge Map</span>
              </button>

              <button
                type="button"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-400 text-slate-900 font-semibold hover:bg-cyan-300 shadow-md shadow-cyan-500/20 transition-all inline-flex items-center justify-center gap-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
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
