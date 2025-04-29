
import React from 'react';
import { cn } from '@/lib/utils';

interface PulseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const PulseButton: React.FC<PulseButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-urbanPulse-green text-urbanPulse-black hover:bg-urbanPulse-darkGreen',
    secondary: 'bg-urbanPulse-darkGray text-urbanPulse-white hover:bg-urbanPulse-black border border-urbanPulse-green',
    danger: 'bg-red-600 text-urbanPulse-white hover:bg-red-700',
  };
  
  const sizeClasses = {
    sm: 'text-sm px-3 py-1',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  };
  
  return (
    <button
      className={cn(
        'rounded-full font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-urbanPulse-green focus:ring-offset-2 focus:ring-offset-urbanPulse-black',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default PulseButton;
