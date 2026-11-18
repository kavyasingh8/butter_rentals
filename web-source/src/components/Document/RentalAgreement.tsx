import React from 'react';
import { FileText } from 'lucide-react';
import { ReceiptData } from '../../types';
import { formatDuration, formatMoney } from '../../utils/format';
import { t, tParts } from '../../utils/locale';
import { DocumentWindow, getDocumentDuration } from './DocumentWindow';

interface RentalAgreementProps {
  data: ReceiptData;
  onClose: () => void;
}

const Clause: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
  <section>
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
      {number}. {title}
    </h3>
    {children}
  </section>
);

const Detail: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-[11px] text-slate-500">{label}</p>
    <p className="font-semibold text-slate-900">{value}</p>
  </div>
);

export const RentalAgreement: React.FC<RentalAgreementProps> = ({ data, onClose }) => {
  const company = data.locationLabel ?? t('vehicle_rentals');
  const { unit, amount } = getDocumentDuration(data);
  const [termBefore, termAfter] = tParts('term_duration');

  return (
    <DocumentWindow title={t('rental_agreement')} icon={FileText} widthClass="max-w-[560px]" onClose={onClose}>
      <div className="bg-white rounded-lg shadow-lg px-8 py-8 text-[13px] leading-relaxed text-slate-700">
        <div className="flex items-start justify-between border-b border-slate-200 pb-5 mb-6">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{t('agreement_title')}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{company}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-mono text-slate-700">{data.transactionId}</p>
            <p>{data.date} · {data.time}</p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Clause number={1} title={t('parties')}>
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 border border-slate-200 p-4">
              <Detail label={t('lessor')} value={company} />
              <Detail label={t('lessee')} value={data.ownerName} />
            </div>
          </Clause>

          <Clause number={2} title={t('vehicle')}>
            <div className="grid grid-cols-2 gap-4">
              <Detail label={t('model')} value={data.vehicleName} />
              <Detail label={t('license_plate')} value={<span className="font-mono">{data.plate}</span>} />
            </div>
          </Clause>

          <Clause number={3} title={t('rental_term')}>
            <p>
              {termBefore}<strong className="text-slate-900">{formatDuration(amount, unit)}</strong>{termAfter}{' '}
              {t('term_return', company)}
            </p>
          </Clause>

          <Clause number={4} title={t('payment')}>
            <div className="flex justify-between items-center rounded-lg bg-slate-50 border border-slate-200 p-4">
              <Detail label={t('total_paid')} value={formatMoney(data.total)} />
              <div className="text-right">
                <Detail label={t('method')} value={data.paymentMethod === 'bank' ? t('bank_transfer') : t('cash')} />
              </div>
            </div>
          </Clause>
        </div>

        <div className="grid grid-cols-2 gap-10 mt-10">
          <div>
            <p className="h-8 flex items-end font-serif italic text-lg text-slate-600">{company}</p>
            <p className="border-t border-slate-300 pt-1 mt-1 text-[11px] text-slate-500">{t('authorized_signature')}</p>
          </div>
          <div>
            <p className="h-8 flex items-end font-serif italic text-lg text-accent-700">{data.ownerName}</p>
            <p className="border-t border-slate-300 pt-1 mt-1 text-[11px] text-slate-500">{t('lessee_signature')}</p>
          </div>
        </div>
      </div>
    </DocumentWindow>
  );
};
