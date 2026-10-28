import React from 'react';
import { HelpCircle, AlertTriangle, TrendingUp, ShieldCheck } from 'lucide-react';
import type { MasteryLevel } from '../../types/database';

export type SupportedStatus = MasteryLevel | 'improving' | 'not-assessed';

export interface StatusBadgeProps {
  status: SupportedStatus;
  accuracy?: number | null;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * StatusBadge enforces RULE 4 & WCAG 1.4.1:
 * Never rely on color alone: status = icon + text.
 * Rule 3: Zero attempts = "Not Assessed"; 0% with attempts = "Weak".
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  accuracy,
  size = 'md',
  className = '',
}) => {
  const iconSize = size === 'sm' ? 12 : 14;

  const normalizedStatus: MasteryLevel =
    status === 'improving' ? 'developing' : status === 'not-assessed' ? 'not_assessed' : status;

  const config: Record<
    MasteryLevel,
    {
      label: string;
      icon: React.ReactNode;
      styles: string;
    }
  > = {
    not_assessed: {
      label: 'Not Assessed',
      icon: <HelpCircle size={iconSize} className="shrink-0" aria-hidden="true" />,
      styles:
        'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    },
    weak: {
      label: 'Weak',
      icon: <AlertTriangle size={iconSize} className="shrink-0 text-rose-500" aria-hidden="true" />,
      styles:
        'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800',
    },
    developing: {
      label: 'Developing',
      icon: <TrendingUp size={iconSize} className="shrink-0 text-amber-500" aria-hidden="true" />,
      styles:
        'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800',
    },
    strong: {
      label: 'Strong',
      icon: <ShieldCheck size={iconSize} className="shrink-0 text-emerald-500" aria-hidden="true" />,
      styles:
        'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800',
    },
  };

  const item = config[normalizedStatus] || config.not_assessed;
  const sizeStyles =
    size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-2xs select-none ${sizeStyles} ${item.styles} ${className}`}
      data-testid="status-badge"
      data-status={normalizedStatus}
    >
      {item.icon}
      <span>{item.label}</span>
      {typeof accuracy === 'number' && normalizedStatus !== 'not_assessed' && (
        <span className="opacity-75 font-normal">({accuracy}%)</span>
      )}
    </span>
  );
};
