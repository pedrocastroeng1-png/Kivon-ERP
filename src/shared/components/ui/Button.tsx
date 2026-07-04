import React from 'react';
import { cn } from '@/src/shared/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      primary: 'bg-kivon-primary text-black hover:bg-kivon-primary-hover focus:ring-kivon-primary shadow-lg shadow-kivon-primary/20',
      secondary: 'bg-kivon-card text-white border border-kivon-border hover:bg-kivon-hover focus:ring-kivon-border',
      danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 focus:ring-red-500',
      ghost: 'bg-transparent text-kivon-text hover:bg-kivon-hover focus:ring-kivon-border',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded',
      md: 'h-10 px-4 py-2 text-sm rounded-md',
      lg: 'h-12 px-6 text-base rounded-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

