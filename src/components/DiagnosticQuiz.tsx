import React, { useState } from 'react';
import { CheckCircle2, XCircle, Circle, Play, Filter } from 'lucide-react';
import type { Question, TopicConfig, UserAnswer } from '../types';

interface DiagnosticQuizProps {
  questions: Question[];
  topicConfigs: TopicConfig[];
  userAnswers: UserAnswer[];
  onSelectQuestion: (question: Question) => void;
}

export const DiagnosticQuiz: React.FC<DiagnosticQuizProps> = ({
  questions = [],
  topicConfigs = [],
  userAnswers = [],
  onSelectQuestion,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  // Map to get the latest answer for each question
  const answerMap = new Map<string, UserAnswer>();
  for (const ans of userAnswers || []) {
    if (ans?.questionId) {
      answerMap.set(ans.questionId, ans);
    }
  }

  const safeQuestions = questions || [];
  const filteredQuestions =
    selectedTopic === 'all'
      ? safeQuestions
      : safeQuestions.filter((q) => q.topic === selectedTopic);

  const getQuestionStatus = (questionId: string) => {
    const ans = answerMap.get(questionId);
    if (!ans) return 'unattempted';
    return ans.isCorrect ? 'correct' : 'incorrect';
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Diagnostic Question Bank
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          Explore all verified questions across Arrays, Loops, Pointers, and Data Structures.
          Filter by topic or select any specific challenge to jump into targeted practice.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <button
          type="button"
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedTopic === 'all'
              ? 'bg-cyan-400 text-slate-900 shadow-sm shadow-cyan-500/20'
              : 'border border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          onClick={() => setSelectedTopic('all')}
        >
          <Filter size={12} />
          <span>All Topics ({safeQuestions.length})</span>
        </button>

        {(topicConfigs || []).map((cfg) => {
          const count = safeQuestions.filter((q) => q.topic === cfg.id).length;
          const isSelected = selectedTopic === cfg.id;
          return (
            <button
              key={cfg.id}
              type="button"
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-400 text-slate-900 shadow-sm shadow-cyan-500/20'
                  : 'border border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              onClick={() => setSelectedTopic(cfg.id)}
            >
              <span>
                {cfg.title} ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Question Cards List */}
      <div className="space-y-3 w-full">
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm border border-slate-800 rounded-2xl bg-slate-900/40">
            No questions available for the selected topic.
          </div>
        ) : (
          filteredQuestions.map((q, index) => {
            const status = getQuestionStatus(q.id);

            return (
              <div
                key={q.id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur-md shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-500/80 transition-all duration-150"
              >
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <div className="pt-0.5 sm:pt-0 shrink-0">
                    {status === 'correct' && (
                      <CheckCircle2 size={22} className="text-emerald-400" />
                    )}
                    {status === 'incorrect' && (
                      <XCircle size={22} className="text-rose-400" />
                    )}
                    {status === 'unattempted' && (
                      <Circle size={22} className="text-slate-500" />
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {q.topicTitle || q.topic}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          q.difficulty === 'easy'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : q.difficulty === 'medium'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {q.difficulty.toUpperCase()}
                      </span>
                      {q.concept && (
                        <span className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-none">
                          Concept: {q.concept}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-white text-sm sm:text-base leading-snug break-words">
                      {index + 1}. {q.question}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end sm:justify-center shrink-0">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-600 bg-slate-900/60 text-white hover:bg-slate-800 transition-all inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    onClick={() => onSelectQuestion(q)}
                  >
                    <Play size={14} className="text-cyan-400" />
                    <span>{status === 'unattempted' ? 'Solve' : 'Review'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
