import React from 'react';
import { Target, CheckCircle2, AlertTriangle, Layers, ShieldCheck } from 'lucide-react';
import type { LearningStats } from '../types';

interface DashboardStatsProps {
  stats: LearningStats;
  totalQuestions: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  totalQuestions,
}) => {
  return (
    <div className="stats-grid">
      {/* 1. Overall Accuracy */}
      <div className="stat-card accent-cyan">
        <div className="stat-header">
          <span className="stat-label">Overall Accuracy</span>
          <Target size={18} className="stat-icon" />
        </div>
        <div className="stat-value">
          {stats.totalAnswers > 0 ? `${stats.overallAccuracy}%` : '—'}
        </div>
        <div className="stat-subtext">
          {stats.totalAnswers > 0
            ? `${stats.correctAnswers} of ${stats.totalAnswers} correct`
            : 'No answers recorded'}
        </div>
      </div>

      {/* 2. Questions Solved */}
      <div className="stat-card accent-amber">
        <div className="stat-header">
          <span className="stat-label">Questions Solved</span>
          <CheckCircle2 size={18} className="stat-icon" />
        </div>
        <div className="stat-value">
          {stats.totalAnswers}
          <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>
            / {totalQuestions}
          </span>
        </div>
        <div className="stat-subtext">
          {totalQuestions - stats.totalAnswers > 0
            ? `${totalQuestions - stats.totalAnswers} available in pool`
            : 'All questions completed'}
        </div>
      </div>

      {/* 3. Assessed Domains */}
      <div className="stat-card accent-cyan">
        <div className="stat-header">
          <span className="stat-label">Knowledge Domains</span>
          <Layers size={18} className="stat-icon" />
        </div>
        <div className="stat-value">
          {stats.assessedCount}
          <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>
            / 4
          </span>
        </div>
        <div className="stat-subtext">
          {stats.unassessedCount > 0
            ? `${stats.unassessedCount} unassessed baseline`
            : 'All 4 topics assessed'}
        </div>
      </div>

      {/* 4. Weak / Priority Focus Areas */}
      <div className="stat-card accent-rose">
        <div className="stat-header">
          <span className="stat-label">Priority Needs</span>
          <AlertTriangle size={18} className="stat-icon" />
        </div>
        <div className="stat-value" style={{ color: stats.weakCount > 0 ? '#fb7185' : 'inherit' }}>
          {stats.weakCount}
        </div>
        <div className="stat-subtext">
          {stats.weakCount > 0
            ? 'Topics requiring revision (<50%)'
            : stats.assessedCount > 0
            ? 'No critical weak spots detected'
            : 'Awaiting initial diagnostic'}
        </div>
      </div>

      {/* 5. Mastered / Strong Topics */}
      <div className="stat-card accent-emerald">
        <div className="stat-header">
          <span className="stat-label">Mastered Domains</span>
          <ShieldCheck size={18} className="stat-icon" />
        </div>
        <div className="stat-value" style={{ color: stats.strongCount > 0 ? '#34d399' : 'inherit' }}>
          {stats.strongCount}
        </div>
        <div className="stat-subtext">
          {stats.strongCount > 0
            ? 'High retention score (≥80%)'
            : 'Aim for ≥80% on each topic'}
        </div>
      </div>
    </div>
  );
};
