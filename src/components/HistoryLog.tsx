import React, { useState } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, History, Play } from 'lucide-react';
import type { UserAnswer, Question } from '../types';

interface HistoryLogProps {
  answers: UserAnswer[];
  questions: Question[];
  onStartPracticing: () => void;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({
  answers,
  questions,
  onStartPracticing,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const questionMap = new Map<string, Question>();
  for (const q of questions) {
    questionMap.set(q.id, q);
  }

  if (answers.length === 0) {
    return (
      <div className="empty-state">
        <History size={48} className="empty-icon" />
        <h3 className="empty-title">No Session History Yet</h3>
        <p className="empty-desc">
          Your answer trail and review history will be displayed here in chronological order once you begin solving questions.
        </p>
        <button type="button" className="primary-btn" onClick={onStartPracticing}>
          <Play size={16} />
          <span>Start Adaptive Practice</span>
        </button>
      </div>
    );
  }

  const sortedAnswers = [...answers].reverse();

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          Session Answer History
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Chronological audit of all {answers.length} question attempts.
          Click any entry to inspect the question, your selected option, and the concept breakdown.
        </p>
      </div>

      <div className="history-card">
        {sortedAnswers.map((item) => {
          const q = questionMap.get(item.questionId);
          const isExpanded = expandedId === `${item.questionId}-${item.timestamp}`;
          const key = `${item.questionId}-${item.timestamp}`;

          return (
            <div key={key} className="history-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  gap: '1rem',
                }}
                onClick={() => setExpandedId(isExpanded ? null : key)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  {item.isCorrect ? (
                    <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                  ) : (
                    <XCircle size={20} style={{ color: '#f43f5e', flexShrink: 0 }} />
                  )}

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span className="pill-tag">{q?.topicTitle || item.topic}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      {q?.question || `Question ${item.questionId}`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      color: item.isCorrect ? '#34d399' : '#fb7185',
                    }}
                  >
                    {item.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && q && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    <strong>Your Choice:</strong> {q.options[item.selectedAnswer]}
                  </p>
                  {!item.isCorrect && (
                    <p style={{ fontSize: '0.8125rem', color: '#34d399', marginBottom: '0.75rem' }}>
                      <strong>Correct Option:</strong> {q.options[q.correctAnswer]}
                    </p>
                  )}
                  <div style={{ fontSize: '0.8125rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
