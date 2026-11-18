import React from 'react';
import { ReceiptData, Vehicle } from '../../types';
import { formatDuration, formatMoney } from '../../utils/format';
import { t } from '../../utils/locale';
import { Button } from '../ui';

interface RentalConfirmationProps {
  vehicle: Vehicle | null;
  receiptData: ReceiptData | null;
  onRentAnother: () => void;
  onClose: () => void;
}

export const RentalConfirmation: React.FC<RentalConfirmationProps> = ({ vehicle, receiptData, onRentAnother, onClose }) => {
  const unit = receiptData?.rentalType ?? 'days';
  const duration = receiptData?.duration ?? receiptData?.days ?? 1;

  const rows = [
    { label: t('transaction'), value: receiptData?.transactionId ?? '-' },
    { label: t('plate'), value: receiptData?.plate ?? '-' },
    { label: t('duration'), value: formatDuration(duration, unit) },
    { label: t('paid_with'), value: receiptData?.paymentMethod === 'bank' ? t('bank') : t('cash') },
  ];

  return (
    <div className="h-full flex flex-col px-5 pt-6 pb-5 animate-fade-in">
      <div className="flex-1">
        <p className="text-xs text-emerald-400">{t('confirmed')}</p>
        <h2 className="text-base font-semibold text-white mt-1">{t('vehicle_is_ready', vehicle?.name ?? t('your_vehicle'))}</h2>
        <p className="text-[13px] text-ink-400 mt-1.5 leading-relaxed">
          {t('keep_documents_hint')}
        </p>

        <dl className="mt-6 flex flex-col gap-2.5 text-[13px]">
          {rows.map(row => (
            <div key={row.label} className="flex justify-between">
              <dt className="text-ink-400">{row.label}</dt>
              <dd className="text-ink-100 tabular-nums">{row.value}</dd>
            </div>
          ))}
          <div className="flex justify-between items-baseline pt-3 mt-1 border-t border-white/[0.06]">
            <dt className="text-ink-200">{t('total_paid')}</dt>
            <dd className="text-lg font-semibold text-white tabular-nums">{formatMoney(receiptData?.total ?? 0)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex gap-2 shrink-0">
        <Button variant="secondary" className="flex-1" onClick={onRentAnother}>{t('rent_another')}</Button>
        <Button className="flex-1" onClick={onClose}>{t('done')}</Button>
      </div>
    </div>
  );
};
