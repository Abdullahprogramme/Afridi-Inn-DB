import React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-semibold text-[#1C1917]"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-md border border-[#D6CEC2] bg-white px-3 py-2 text-base text-[#1C1917]',
            'focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:border-transparent',
            'disabled:cursor-not-allowed disabled:bg-[#F3EEE6] disabled:text-[#78716C]',
            error && 'border-[#B91C1C] focus:ring-[#B91C1C]',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs font-medium text-[#B91C1C]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
