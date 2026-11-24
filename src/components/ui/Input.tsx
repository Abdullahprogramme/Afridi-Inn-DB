import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-[#1C1917]"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-md border border-[#D6CEC2] bg-white px-3 py-2 text-base text-[#1C1917]',
            'placeholder:text-[#78716C] focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:border-transparent',
            'disabled:cursor-not-allowed disabled:bg-[#F3EEE6] disabled:text-[#78716C]',
            error && 'border-[#B91C1C] focus:ring-[#B91C1C]',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs font-medium text-[#B91C1C]">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#78716C]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
