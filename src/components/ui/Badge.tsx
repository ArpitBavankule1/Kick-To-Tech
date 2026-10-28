import React from 'react';

export type BadgeVariant = 'default' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[10px] px-2 py-0.5 font-semibold',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  const variantStyles: Record<BadgeVariant, string> = {
    default:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    cyan:
      'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
    emerald:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    amber:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    rose:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    slate:
      'bg-slate-200/60 text-slate-600 border-slate-300 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeStyles[size]} ${variantStyles[variant]} select-none ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
