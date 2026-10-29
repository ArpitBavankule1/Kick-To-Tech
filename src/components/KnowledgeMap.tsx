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
        return <LayoutGrid size={20} className="text-cyan-400" />;
      case 'loops':
        return <Repeat size={20} className="text-blue-400" />;
      case 'pointers':
        return <Crosshair size={20} className="text-indigo-400" />;
      case 'data_structures':
        return <Layers size={20} className="text-amber-400" />;
      default:
        return <Layers size={20} className="text-cyan-400" />;
    }
  };

  const getStatusBadge = (mastery: TopicMastery) => {
    const status = mastery?.status || 'not_assessed';
    switch (status) {
      case 'strong':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={12} className="shrink-0" />
            <span>Strong (≥80%)</span>
          </span>
        );
      case 'developing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <TrendingUp size={12} className="shrink-0" />
            <span>Developing (50-79%)</span>
          </span>
        );
      case 'weak':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertTriangle size={12} className="shrink-0" />
            <span>Weak (&lt;50%)</span>
          </span>
        );
      case 'not_assessed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <HelpCircle size={12} className="shrink-0" />
            <span>Not Yet Assessed</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Knowledge Map & Topic Mastery
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          Real-time cognitive map tracking your proficiency across computer science fundamentals.
          Topics are dynamically classified as <strong className="text-white">Strong</strong>,{' '}
          <strong className="text-white">Developing</strong>, <strong className="text-white">Weak</strong>, or{' '}
          <strong className="text-white">Not Yet Assessed</strong> based strictly on verified question results.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
        {topicConfigs.map((config) => {
          // Defensive fallback so mastery is never undefined
          const mastery: TopicMastery = masteries?.[config.id] ?? {
            topicId: config.id,
            topicTitle: config.title,
            totalAttempts: 0,
            correctAttempts: 0,
            incorrectAttempts: 0,
            accuracyPercentage: null,
            status: 'not_assessed',
            failedConcepts: [],
          };

          const isAssessed = mastery.status !== 'not_assessed';
          const accuracy = mastery.accuracyPercentage ?? 0;
          const failedConcepts = mastery.failedConcepts || [];

          return (
            <div
              key={config.id}
              className="p-5 sm:p-6 rounded-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur-md shadow-lg flex flex-col justify-between gap-4 hover:border-slate-500/80 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0">
                      {getTopicIcon(config.id)}
                    </div>
                    <h3 className="font-bold text-white text-base sm:text-lg">
                      {config.title}
                    </h3>
                  </div>
                </div>

                <div>{getStatusBadge(mastery)}</div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {config.description}
                </p>

                {/* Mastery Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Topic Mastery</span>
                    <span className="text-white">
                      {isAssessed ? `${accuracy}%` : 'Awaiting baseline'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60">
                    <div
                      className={`h-full transition-all duration-500 ${
                        mastery.status === 'strong'
                          ? 'bg-emerald-400'
                          : mastery.status === 'developing'
                          ? 'bg-amber-400'
                          : mastery.status === 'weak'
                          ? 'bg-rose-400'
                          : 'bg-slate-600'
                      }`}
                      style={{ width: isAssessed ? `${accuracy}%` : '0%' }}
                    />
                  </div>
                </div>

                {/* Attempts & Accuracy Meta */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>
                    {isAssessed
                      ? `${mastery.correctAttempts} / ${mastery.totalAttempts} correct`
                      : '0 attempts'}
                  </span>
                  <span className="font-semibold text-slate-200">
                    {mastery.incorrectAttempts > 0
                      ? `${mastery.incorrectAttempts} error${mastery.incorrectAttempts > 1 ? 's' : ''}`
                      : isAssessed
                      ? '0 errors'
                      : 'Unassessed'}
                  </span>
                </div>

                {/* Recorded Error Concepts (if any) */}
                {failedConcepts.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                      Gaps Identified:
                    </div>
                    <ul className="text-xs text-slate-300 space-y-0.5 list-disc pl-4">
                      {failedConcepts.map((concept, idx) => (
                        <li key={idx}>{concept}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-900/60 text-white hover:bg-slate-800 hover:border-slate-500 transition-all inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 mt-2"
                onClick={() => onSelectTopicForPractice(config.id)}
              >
                <Play size={14} className="text-cyan-400" />
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
