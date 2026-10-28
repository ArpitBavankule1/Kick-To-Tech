import React, { useState } from 'react';
import { CheckCircle, XCircle, Circle, Play, Filter } from 'lucide-react';
import type { Question, TopicConfig, UserAnswer } from '../types';

interface DiagnosticQuizProps {
  questions: Question[];
  topicConfigs: TopicConfig[];
  userAnswers: UserAnswer[];
  onSelectQuestion: (question: Question) => void;
}

export const DiagnosticQuiz: React.FC<DiagnosticQuizProps> = ({
  questions,
  topicConfigs,
  userAnswers,
  onSelectQuestion,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  // Map to get the latest answer for each question
  const answerMap = new Map<string, UserAnswer>();
  for (const ans of userAnswers) {
    answerMap.set(ans.questionId, ans);
  }

  const filteredQuestions =
    selectedTopic === 'all'
      ? questions
      : questions.filter((q) => q.topic === selectedTopic);

  const getQuestionStatus = (questionId: string) => {
    const ans = answerMap.get(questionId);
    if (!ans) return 'unattempted';
    return ans.isCorrect ? 'correct' : 'incorrect';
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          Diagnostic Question Bank
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Explore all 20 verified questions across Arrays, Loops, Pointers, and Data Structures.
          Filter by topic or select any specific challenge to jump into targeted practice.
        </p>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
        }}
      >
        <button
          type="button"
          className={`pill-tag ${selectedTopic === 'all' ? 'active' : ''}`}
          style={{
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            background:
              selectedTopic === 'all' ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.05)',
            color: selectedTopic === 'all' ? '#000' : 'var(--text-primary)',
            fontWeight: 700,
          }}
          onClick={() => setSelectedTopic('all')}
        >
          <Filter size={14} />
          <span>All Topics ({questions.length})</span>
        </button>

        {topicConfigs.map((cfg) => {
          const count = questions.filter((q) => q.topic === cfg.id).length;
          const isSelected = selectedTopic === cfg.id;
          return (
            <button
              key={cfg.id}
              type="button"
              className={`pill-tag ${isSelected ? 'active' : ''}`}
              style={{
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                background: isSelected
                  ? 'var(--accent-cyan)'
                  : 'rgba(255, 255, 255, 0.05)',
                color: isSelected ? '#000' : 'var(--text-primary)',
                fontWeight: 700,
              }}
              onClick={() => setSelectedTopic(cfg.id)}
            >
              <span>
                {cfg.title} ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Question Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredQuestions.map((q, index) => {
          const status = getQuestionStatus(q.id);

          return (
            <div
              key={q.id}
              className="history-item"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <div>
                  {status === 'correct' && (
                    <CheckCircle size={22} style={{ color: '#10b981' }} />
                  )}
                  {status === 'incorrect' && (
                    <XCircle size={22} style={{ color: '#f43f5e' }} />
                  )}
                  {status === 'unattempted' && (
                    <Circle size={22} style={{ color: '#64748b' }} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem', alignItems: 'center' }}>
                    <span className="pill-tag">{q.topicTitle}</span>
                    <span className={`pill-tag difficulty-${q.difficulty}`}>
                      {q.difficulty.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Concept: {q.concept}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                    {index + 1}. {q.question}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="secondary-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}
                onClick={() => onSelectQuestion(q)}
              >
                <Play size={14} />
                <span>{status === 'unattempted' ? 'Solve' : 'Review'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
