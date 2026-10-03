import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type AlertVariant = 'error' | 'success' | 'warning' | 'info';

interface StatusAlertProps {
  variant?: AlertVariant;
  type?: AlertVariant;
  message: string;
  onClose?: () => void;
  className?: string;
}

const variantStyles: Record<AlertVariant, { container: string; text: string; icon: any; iconColor: string }> = {
  error: {
    container: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    icon: AlertCircle,
    iconColor: 'text-red-600',
  },
  success: {
    container: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
  },
  warning: {
    container: 'bg-amber-50 border-amber-300',
    text: 'text-amber-800',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
  },
  info: {
    container: 'bg-uemg-blue-50 border-uemg-blue-200',
    text: 'text-uemg-blue-800',
    icon: Info,
    iconColor: 'text-uemg-blue-600',
  },
};

export function StatusAlert({ variant, type, message, onClose, className = '' }: StatusAlertProps) {
  if (!message) return null;

  const activeVariant = variant || type || 'info';
  const style = variantStyles[activeVariant];
  const IconComponent = style.icon;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition-all ${style.container} ${style.text} ${className}`}
    >
      <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.iconColor}`} aria-hidden="true" />
      <div className="flex-1 font-medium leading-relaxed">{message}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar alerta"
          className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
