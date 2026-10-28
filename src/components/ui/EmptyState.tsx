import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 ${className}`}
    >
      <div className="p-3 mb-3.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
        {icon || <HelpCircle size={32} />}
      </div>
      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h4>
      <p className="max-w-sm mt-1 mb-5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
