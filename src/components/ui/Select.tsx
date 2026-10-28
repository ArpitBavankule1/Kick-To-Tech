import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, id, options, className = '', ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full px-3.5 py-2.5 rounded-lg text-sm bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-950 ${
            error
              ? 'border-rose-500 focus-visible:ring-rose-500'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
