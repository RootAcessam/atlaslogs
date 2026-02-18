import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => {
  const variantStyles = {
    default: 'bg-[#1F1F1F] text-gray-300 border border-[#2A2A2A]',
    success: 'bg-green-900/30 text-green-400 border border-green-800',
    warning: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800',
    danger: 'bg-[#E11D48]/20 text-[#E11D48] border border-[#E11D48]/50',
    info: 'bg-blue-900/30 text-blue-400 border border-blue-800',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
