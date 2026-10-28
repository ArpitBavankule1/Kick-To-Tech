import React from 'react';
import { RotateCcw, Brain, Zap, Target } from 'lucide-react';
import type { LearningStats } from '../types';

interface NavbarProps {
  stats: LearningStats;
  onOpenResetModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ stats, onOpenResetModal }) => {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand">
          <div className="brand-icon-box" aria-hidden="true">
            <Brain size={24} />
          </div>
          <div>
            <h1 className="brand-title">RecallLoop AI</h1>
            <p className="brand-subtitle">Adaptive Learning Assistant</p>
          </div>
        </div>

        <div className="nav-actions">
          {stats.totalAnswers > 0 && (
            <div className="pill-tag" style={{ border: '1px solid rgba(6, 182, 212, 0.4)' }}>
              <Zap size={14} style={{ color: '#06b6d4' }} />
              <span>{stats.totalAnswers} Solved</span>
              <span style={{ color: '#64748b' }}>•</span>
              <Target size={14} style={{ color: '#10b981' }} />
              <span>{stats.overallAccuracy}% Accuracy</span>
            </div>
          )}

          <button
            type="button"
            className="reset-btn"
            onClick={onOpenResetModal}
            title="Reset study progress"
          >
            <RotateCcw size={14} />
            <span>Reset Progress</span>
          </button>
        </div>
      </div>
    </header>
  );
};
