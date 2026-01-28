import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: string;
  keyboardType?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, onChangeText, onChange, secureTextEntry, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChangeText?.(e.target.value);
      onChange?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-[#2C3E50] font-bold mb-3 text-base">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            type={secureTextEntry ? 'password' : type || 'text'}
            className={cn(
              'flex h-14 w-full rounded-2xl border-2 bg-gray-50 px-5 py-4 text-lg font-medium text-[#2C3E50] transition-all duration-200',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-0 focus:border-[#4ECDC4] focus:bg-white focus:shadow-lg focus:shadow-[#4ECDC4]/10',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-[#FF6B6B]' : 'border-gray-200',
              icon && 'pl-12',
              className
            )}
            ref={ref}
            onChange={handleChange}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 ml-1 text-sm font-medium text-[#FF6B6B] animate-in fade-in duration-200">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
