import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-base font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-[#FF6B6B] text-white shadow-lg shadow-[#FF6B6B]/30 hover:bg-[#fa5252] hover:shadow-[#FF6B6B]/40 focus-visible:ring-[#FF6B6B]',
        secondary:
          'bg-[#4ECDC4] text-white shadow-lg shadow-[#4ECDC4]/30 hover:bg-[#38b2ac] hover:shadow-[#4ECDC4]/40 focus-visible:ring-[#4ECDC4]',
        outline:
          'border-2 border-[#FF6B6B] text-[#FF6B6B] bg-transparent hover:bg-[#FF6B6B]/5 focus-visible:ring-[#FF6B6B]',
        ghost:
          'text-[#2C3E50] hover:bg-[#2C3E50]/5 focus-visible:ring-[#2C3E50]',
      },
      size: {
        sm: 'h-10 px-5 text-sm',
        md: 'h-12 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  icon?: React.ReactNode;
  onPress?: () => void;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, icon, children, onPress, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        onClick={onPress || onClick}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
