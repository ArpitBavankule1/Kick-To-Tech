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
      className={`rounded-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur-md transition-all duration-200 ${
        hoverable ? 'hover:border-slate-500/80 hover:-translate-y-0.5 shadow-lg shadow-black/20' : ''
      } ${className}`}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-slate-700/60">
          {header}
        </div>
      )}
      <div className={header || footer ? 'p-6' : className.includes('p-') ? '' : 'p-6'}>{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-slate-700/60">
          {footer}
        </div>
      )}
    </div>
  );
};
