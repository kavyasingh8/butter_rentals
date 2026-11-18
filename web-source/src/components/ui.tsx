import React, { useState } from 'react';
import { CarFront, Loader2 } from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent-500 hover:bg-accent-400 text-white disabled:bg-ink-750 disabled:text-ink-500',
  secondary: 'bg-ink-800 hover:bg-ink-750 text-ink-100 border border-white/[0.08] disabled:text-ink-500',
  ghost: 'text-ink-300 hover:text-white hover:bg-white/[0.04] disabled:text-ink-600',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/25 disabled:opacity-50',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', loading, icon: Icon, className = '', children, disabled, ...rest
}) => {
  const sizes = { sm: 'h-8 px-3 text-xs gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-11 px-5 text-sm gap-2' };
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center shrink-0 whitespace-nowrap rounded-lg font-semibold transition-colors disabled:cursor-not-allowed ${sizes[size]} ${BUTTON_VARIANTS[variant]} ${className}`}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : Icon && <Icon size={size === 'sm' ? 13 : 15} />}
      {children}
    </button>
  );
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ElementType;
  label: string;
  tone?: 'default' | 'danger';
}

export const IconButton: React.FC<IconButtonProps> = ({ icon: Icon, label, tone = 'default', className = '', ...rest }) => (
  <button
    {...rest}
    title={label}
    aria-label={label}
    className={`w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-lg text-ink-400 transition-colors disabled:opacity-40 ${
      tone === 'danger' ? 'hover:text-red-300 hover:bg-red-500/10' : 'hover:text-white hover:bg-white/[0.06]'
    } ${className}`}
  >
    <Icon size={15} />
  </button>
);

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="flex p-1 rounded-lg bg-ink-950 border border-white/[0.06]">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`flex-1 h-8 rounded-md text-xs font-semibold transition-colors ${
            value === option.value ? 'bg-ink-750 text-white shadow-sm' : 'text-ink-400 hover:text-ink-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, hint, className = '', children }) => (
  <label className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
    <span className="text-[11px] font-medium text-ink-400">{label}</span>
    {children}
    {hint && <span className="text-[10px] text-ink-500">{hint}</span>}
  </label>
);

export const inputClass =
  'w-full h-9 px-3 rounded-lg bg-ink-950 border border-white/[0.08] text-sm text-white placeholder:text-ink-600 focus:outline-none focus:border-accent-400/60 transition-colors';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...rest }, ref) => <input ref={ref} {...rest} className={`${inputClass} ${className}`} />,
);

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export const Badge: React.FC<{ children: React.ReactNode; tone?: BadgeTone }> = ({ children, tone = 'neutral' }) => {
  const tones = {
    neutral: 'bg-white/[0.05] text-ink-300 border-white/[0.08]',
    accent: 'bg-accent-500/10 text-accent-300 border-accent-400/20',
    success: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-400/20',
    danger: 'bg-red-500/10 text-red-300 border-red-400/20',
  };
  return (
    <span className={`inline-flex items-center h-5 px-1.5 rounded-md border text-[10px] font-semibold whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
};

export const VehicleImage: React.FC<{ src?: string; alt: string; className?: string; iconSize?: number }> = ({
  src, alt, className = '', iconSize = 28,
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center text-ink-600 ${className}`}>
        <CarFront size={iconSize} strokeWidth={1.25} />
      </div>
    );
  }

  return <img src={src} alt={alt} onError={() => setFailed(true)} className={`object-contain ${className}`} />;
};

interface CardProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, description, icon: Icon, action, className = '', children }) => (
  <section className={`rounded-xl border border-white/[0.06] bg-ink-900 ${className}`}>
    {title && (
      <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-white/[0.05]">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <span className="w-8 h-8 shrink-0 rounded-lg bg-white/[0.04] border border-white/[0.06] text-ink-300 flex items-center justify-center">
              <Icon size={15} />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {description && <p className="text-xs text-ink-500 mt-0.5 leading-relaxed">{description}</p>}
          </div>
        </div>
        {action}
      </header>
    )}
    <div className="p-5">{children}</div>
  </section>
);

interface StatTileProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  hint?: string;
}

export const StatTile: React.FC<StatTileProps> = ({ icon: Icon, label, value, hint }) => (
  <div className="rounded-xl border border-white/[0.06] bg-ink-900 px-4 py-3.5">
    <div className="flex items-center gap-2 text-ink-400">
      <Icon size={13} />
      <span className="text-[11px] font-medium">{label}</span>
    </div>
    <p className="text-lg font-semibold text-white tabular-nums mt-1.5 truncate">{value}</p>
    {hint && <p className="text-[11px] text-ink-500 truncate">{hint}</p>}
  </div>
);

interface ConfirmDialogProps {
  title: string;
  description?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title, description = 'This cannot be undone.', confirmLabel, onConfirm, onCancel,
}) => {
  useEscapeKey(onCancel);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="w-[360px] rounded-xl border border-white/[0.08] bg-ink-850 p-5 shadow-panel">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-ink-400 mt-1">{description}</p>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
};

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="inline-flex items-center gap-2.5 text-sm text-ink-200"
  >
    <span className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-accent-500' : 'bg-ink-700'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </span>
    {label}
  </button>
);

interface TabsProps<T extends string> {
  value: T;
  tabs: { value: T; label: string; count?: number }[];
  onChange: (value: T) => void;
}

export function Tabs<T extends string>({ value, tabs, onChange }: TabsProps<T>) {
  return (
    <div className="flex gap-6 border-b border-white/[0.06]">
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`relative h-10 flex items-center gap-2 text-[13px] font-medium transition-colors ${
            value === tab.value ? 'text-white' : 'text-ink-400 hover:text-ink-200'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`min-w-5 h-5 px-1.5 rounded-md text-[11px] flex items-center justify-center ${
              value === tab.value ? 'bg-accent-500/15 text-accent-300' : 'bg-white/[0.05] text-ink-400'
            }`}>
              {tab.count}
            </span>
          )}
          {value === tab.value && <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-accent-400" />}
        </button>
      ))}
    </div>
  );
}
