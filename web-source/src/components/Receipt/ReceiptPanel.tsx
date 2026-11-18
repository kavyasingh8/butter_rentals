import React from 'react';
import { Receipt } from 'lucide-react';
import { ReceiptData } from '../../types';
import { formatDuration, formatMoney } from '../../utils/format';
import { t } from '../../utils/locale';
import { DocumentWindow, getDocumentDuration } from '../Document/DocumentWindow';

interface ReceiptPanelProps {
  data: ReceiptData;
  onClose: () => void;
}

const Row: React.FC<{ label: string; value: React.ReactNode; strong?: boolean }> = ({ label, value, strong }) => (
  <div className="flex justify-between gap-4 py-1">
    <span className="text-slate-500">{label}</span>
    <span className={`text-right ${strong ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{value}</span>
  </div>
);

export const ReceiptPanel: React.FC<ReceiptPanelProps> = ({ data, onClose }) => {
  const company = data.locationLabel ?? t('vehicle_rentals');
  const { unit, amount } = getDocumentDuration(data);
  const rate = data.rentalRate ?? data.dailyRate ?? 0;

  return (
    <DocumentWindow title={t('payment_receipt')} icon={Receipt} widthClass="max-w-[400px]" onClose={onClose}>
      <div className="bg-white rounded-lg text-[13px] text-slate-700 shadow-lg">
        <div className="px-6 pt-6 pb-5 text-center border-b border-dashed border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{t('receipt')}</p>
          <h2 className="text-lg font-semibold text-slate-900 mt-1">{company}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{t('date_at_time', data.date, data.time)}</p>
        </div>

        <div className="px-6 py-4 border-b border-dashed border-slate-200">
          <Row label={t('transaction')} value={<span className="font-mono">{data.transactionId}</span>} />
          <Row label={t('customer')} value={data.ownerName} />
          <Row label={t('vehicle')} value={data.vehicleName} strong />
          <Row label={t('plate')} value={<span className="font-mono px-1.5 py-0.5 rounded border border-slate-300">{data.plate}</span>} />
        </div>

        <div className="px-6 py-4">
          <Row label={`${formatMoney(rate)} × ${formatDuration(amount, unit)}`} value={formatMoney(rate * amount)} />
          <Row label={t('service_fee')} value={formatMoney(data.serviceFee)} />
          <Row label={t('paid_with')} value={data.paymentMethod === 'bank' ? t('bank_transfer') : t('cash')} />
          <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-slate-200">
            <span className="font-semibold text-slate-900">{t('total_paid')}</span>
            <span className="text-xl font-semibold text-slate-900 tabular-nums">{formatMoney(data.total)}</span>
          </div>
        </div>

        <p className="px-6 pb-6 text-center text-[11px] text-slate-400">
          {t('keep_receipt_hint')}
        </p>
      </div>
    </DocumentWindow>
  );
};
