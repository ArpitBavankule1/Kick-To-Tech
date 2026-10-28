import React from 'react';
import {
  LayoutGrid,
  Repeat,
  Crosshair,
  Layers,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Play,
} from 'lucide-react';
import type { TopicConfig, TopicMastery, TopicId } from '../types';

interface KnowledgeMapProps {
  topicConfigs: TopicConfig[];
  masteries: Record<TopicId, TopicMastery>;
  onSelectTopicForPractice: (topicId: TopicId) => void;
}

export const KnowledgeMap: React.FC<KnowledgeMapProps> = ({
  topicConfigs,
  masteries,
  onSelectTopicForPractice,
}) => {
  const getTopicIcon = (id: TopicId) => {
    switch (id) {
      case 'arrays':
        return <LayoutGrid size={20} />;
      case 'loops':
        return <Repeat size={20} />;
      case 'pointers':
        return <Crosshair size={20} />;
      case 'data_structures':
        return <Layers size={20} />;
      default:
        return <Layers size={20} />;
    }
  };

  const getStatusBadge = (mastery: TopicMastery) => {
    switch (mastery.status) {
      case 'strong':
        return (
          <span className="status-badge strong">
            <CheckCircle2 size={12} />
            <span>Strong (≥80%)</span>
          </span>
        );
      case 'developing':
        return (
          <span className="status-badge developing">
            <TrendingUp size={12} />
            <span>Developing (50-79%)</span>
          </span>
        );
      case 'weak':
        return (
          <span className="status-badge weak">
            <AlertTriangle size={12} />
            <span>Weak (&lt;50%)</span>
          </span>
        );
      case 'not_assessed':
        return (
          <span className="status-badge not_assessed">
            <HelpCircle size={12} />
            <span>Not Yet Assessed</span>
          </span>
        );
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          Knowledge Map & Topic Mastery
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Real-time cognitive map tracking your proficiency across computer science fundamentals.
          Topics are dynamically classified as <strong>Strong</strong>, <strong>Developing</strong>, 
          <strong> Weak</strong>, or <strong>Not Yet Assessed</strong> based strictly on verified question results.
        </p>
      </div>

      <div className="knowledge-map-grid">
        {topicConfigs.map((config) => {
          const mastery = masteries[config.id];
          const isAssessed = mastery.status !== 'not_assessed';
          const accuracy = mastery.accuracyPercentage ?? 0;

          return (
            <div key={config.id} className="topic-card">
              <div className="topic-card-header">
                <div className="topic-card-title-group">
                  <div className="topic-icon-wrap" aria-hidden="true">
                    {getTopicIcon(config.id)}
                  </div>
                  <h3 className="topic-card-title">{config.title}</h3>
                </div>
                {getStatusBadge(mastery)}
              </div>

              <p className="topic-desc">{config.description}</p>

              {/* Mastery Progress Bar */}
              <div className="mastery-progress-section">
                <div className="progress-header">
                  <span>Topic Mastery</span>
                  <span>{isAssessed ? `${accuracy}%` : 'Awaiting baseline'}</span>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${mastery.status}`}
                    style={{ width: isAssessed ? `${accuracy}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Attempts & Accuracy Meta */}
              <div className="topic-meta-row">
                <span>
                  {isAssessed
                    ? `${mastery.correctAttempts} / ${mastery.totalAttempts} correct answers`
                    : '0 questions attempted'}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {mastery.incorrectAttempts > 0
                    ? `${mastery.incorrectAttempts} error${mastery.incorrectAttempts > 1 ? 's' : ''}`
                    : isAssessed
                    ? '0 errors'
                    : 'Unassessed'}
                </span>
              </div>

              {/* Recorded Error Concepts (if any) */}
              {mastery.failedConcepts.length > 0 && (
                <div className="topic-errors-list">
                  <div className="topic-errors-title">Gaps Identified:</div>
                  <ul className="topic-errors-items">
                    {mastery.failedConcepts.map((concept, idx) => (
                      <li key={idx}>{concept}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                className="practice-topic-btn"
                onClick={() => onSelectTopicForPractice(config.id)}
              >
                <Play size={14} />
                <span>
                  {isAssessed ? `Practice ${config.title}` : `Assess ${config.title}`}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
