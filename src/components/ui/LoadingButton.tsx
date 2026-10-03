import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-uemg-blue-700 hover:bg-uemg-blue-800 disabled:bg-slate-400 text-white shadow-sm',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300',
  danger: 'bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white shadow-sm',
};

export function LoadingButton({
  isLoading = false,
  loading,
  loadingText = 'Processando...',
  variant = 'primary',
  icon,
  children,
  className = '',
  disabled,
  ...props
}: LoadingButtonProps) {
  const activeLoading = loading !== undefined ? loading : isLoading;
  return (
    <button
      {...props}
      disabled={disabled || activeLoading}
      aria-busy={activeLoading}
      className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 ${variantClasses[variant]} ${className}`}
    >
      {activeLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" aria-hidden="true" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
