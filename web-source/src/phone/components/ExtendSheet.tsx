import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatDateTime, formatDuration, formatMoney } from '../../utils/format';
import { ui } from '../styles';
import { t } from '../../utils/locale';
import { PaymentMethod } from '../../types';
import { PhoneRental } from '../types';

interface ExtendSheetProps {
  rental: PhoneRental;
  remaining: number;
  now: number;
  paymentMethod: PaymentMethod;
  busy: boolean;
  onConfirm: (amount: number) => void;
  onCancel: () => void;
}

const QUICK_PICKS = [1, 2, 3, 5];

const SummaryRow: React.FC<{ label: string; children: React.ReactNode; strong?: boolean }> = ({ label, children, strong }) => (
  <div className="flex justify-between items-baseline">
    <span className={`text-sm ${ui.muted}`}>{label}</span>
    <span className={`tabular-nums ${strong ? 'text-xl font-semibold' : 'text-sm font-medium'}`}>{children}</span>
  </div>
);

export const ExtendSheet: React.FC<ExtendSheetProps> = ({ rental, remaining, now, paymentMethod, busy, onConfirm, onCancel }) => {
  const [amount, setAmount] = useState(1);
  const max = rental.maxExtend ?? 0;
  const rate = rental.rate ?? 0;
  const unitSeconds = rental.unit === 'days' ? 86400 : 3600;
  const newEnd = now + (remaining + amount * unitSeconds) * 1000;
  const picks = QUICK_PICKS.filter(n => n <= max);

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/40 animate-fade-in" onClick={onCancel}>
      <div
        onClick={e => e.stopPropagation()}
        className="rounded-t-3xl bg-white dark:bg-ink-850 px-5 pt-3 pb-10 animate-fade-in-up"
      >
        <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-ink-600 mx-auto mb-5" />
        <h2 className="text-lg font-semibold">{t('extend_rental')}</h2>
        <p className={`text-sm mt-0.5 ${ui.muted}`}>{rental.vehicleName} · {rental.plate}</p>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setAmount(a => Math.max(1, a - 1))}
            disabled={amount <= 1}
            className={`w-11 h-11 rounded-full flex items-center justify-center ${ui.secondaryButton}`}
          >
            <Minus size={18} />
          </button>
          <div className="text-center">
            <p className="text-2xl font-semibold tabular-nums">{formatDuration(amount, rental.unit)}</p>
            <p className={`text-xs ${ui.muted}`}>{t('up_to_more', formatDuration(max, rental.unit))}</p>
          </div>
          <button
            onClick={() => setAmount(a => Math.min(max, a + 1))}
            disabled={amount >= max}
            className={`w-11 h-11 rounded-full flex items-center justify-center ${ui.secondaryButton}`}
          >
            <Plus size={18} />
          </button>
        </div>

        {picks.length > 1 && (
          <div className="flex gap-1.5 justify-center mt-4">
            {picks.map(n => (
              <button
                key={n}
                onClick={() => setAmount(n)}
                className={`h-8 px-3.5 rounded-full text-[13px] font-medium ${amount === n ? ui.chipActive : ui.chip}`}
              >
                {t(rental.unit === 'days' ? 'quick_pick_days' : 'quick_pick_hours', n)}
              </button>
            ))}
          </div>
        )}

        <div className={`flex flex-col gap-2 mt-6 pt-4 border-t ${ui.divider}`}>
          <SummaryRow label={t('rate')}>{t(rental.unit === 'days' ? 'rate_per_day' : 'rate_per_hour', formatMoney(rate))}</SummaryRow>
          <SummaryRow label={t('new_end_time')}>{formatDateTime(newEnd)}</SummaryRow>
          <SummaryRow label={paymentMethod === 'bank' ? t('charged_to_bank') : t('paid_in_cash')} strong>{formatMoney(rate * amount)}</SummaryRow>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-5">
          <button onClick={onCancel} className={`h-12 rounded-xl text-[15px] font-semibold ${ui.secondaryButton}`}>{t('cancel')}</button>
          <button
            onClick={() => onConfirm(amount)}
            disabled={busy || max < 1}
            className={`h-12 rounded-xl text-[15px] font-semibold ${ui.primaryButton}`}
          >
            {busy ? t('processing') : t('pay_and_extend')}
          </button>
        </div>
      </div>
    </div>
  );
};
