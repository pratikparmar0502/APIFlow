import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 bg-secondary-bg border ${
            error ? 'border-failure focus:border-failure' : 'border-border focus:border-yellow'
          } rounded-lg text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none focus:ring-1 ${
            error ? 'focus:ring-failure' : 'focus:ring-yellow'
          } transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-xs text-failure">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-text-secondary">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
