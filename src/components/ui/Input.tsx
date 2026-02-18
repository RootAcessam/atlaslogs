import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2 bg-[#0A0A0A] border ${
            error ? 'border-[#E11D48]' : 'border-[#1F1F1F]'
          } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#E11D48] transition-colors ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-[#E11D48]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
