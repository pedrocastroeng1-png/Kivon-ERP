import React from 'react';
import { cn } from '@/src/shared/lib/utils';

export interface InputProps extends React.ComponentProps<"input"> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-kivon-text-sec">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border border-kivon-border bg-kivon-bg px-3 py-2 text-sm text-white placeholder:text-kivon-text-sec/50 focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

