import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition-all duration-200 ${
        hoverable ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {header && (
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          {header}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          {footer}
        </div>
      )}
    </div>
  );
};
