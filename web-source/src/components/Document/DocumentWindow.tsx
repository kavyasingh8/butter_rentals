import React from 'react';
import { X } from 'lucide-react';
import { IconButton } from '../ui';
import { t } from '../../utils/locale';

interface DocumentWindowProps {
  title: string;
  icon: React.ElementType;
  widthClass: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const DocumentWindow: React.FC<DocumentWindowProps> = ({ title, icon: Icon, widthClass, onClose, children }) => (
  <div className={`w-full ${widthClass} max-h-[92vh] flex flex-col rounded-2xl border border-white/[0.08] bg-ink-900 shadow-panel overflow-hidden animate-fade-in-up`}>
    <header className="h-12 shrink-0 flex items-center justify-between pl-5 pr-3 border-b border-white/[0.06]">
      <div className="flex items-center gap-2 text-xs font-semibold text-ink-300">
        <Icon size={14} className="text-accent-300" />
        {title}
      </div>
      <IconButton icon={X} label={t('close')} onClick={onClose} />
    </header>
    <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-5">{children}</div>
  </div>
);

export const getDocumentDuration = (data: { rentalType?: 'days' | 'hours'; duration?: number; days: number; hours?: number }) => {
  const unit = data.rentalType === 'hours' ? 'hours' : 'days';
  const amount = data.duration ?? (unit === 'hours' ? data.hours : data.days) ?? 1;
  return { unit, amount } as const;
};
