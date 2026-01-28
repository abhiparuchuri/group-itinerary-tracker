import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  onPress?: () => void;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, onPress, onClick, children, ...props }, ref) => {
    const handleClick = onPress || onClick;
    const isClickable = !!handleClick;

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-3xl bg-white p-5 shadow-sm transition-all duration-200',
          isClickable && 'cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99]',
          className
        )}
        onClick={handleClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export { Card };
