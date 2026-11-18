import React from 'react';
import { CalendarPlus, LocateFixed } from 'lucide-react';
import { VehicleImage } from '../../components/ui';
import { formatDateTime, formatDuration, formatMoney, formatRemaining } from '../../utils/format';
import { getProgress, getRentalStatus, getTotalSeconds, STATUS_STYLE } from '../rental';
import { ui } from '../styles';
import { t } from '../../utils/locale';
import { PhoneRental } from '../types';
import { BackButton } from './BackButton';

interface RentalDetailProps {
  rental: PhoneRental;
  remaining: number;
  now: number;
  busy: boolean;
  onBack: () => void;
  onLocate: () => void;
  onExtend: () => void;
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 px-4 py-3">
    <span className={`text-sm ${ui.muted}`}>{label}</span>
    <span className="text-sm font-medium text-right truncate">{children}</span>
  </div>
);

export const RentalDetail: React.FC<RentalDetailProps> = ({ rental, remaining, now, busy, onBack, onLocate, onExtend }) => {
  const status = STATUS_STYLE[getRentalStatus(remaining)];
  const progress = getProgress(rental, remaining);
  const endsAt = now + remaining * 1000;
  const startedAt = endsAt - getTotalSeconds(rental) * 1000;

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <BackButton label={t('my_rentals')} onClick={onBack} />

      <div className={`rounded-3xl overflow-hidden ${ui.card}`}>
        <div className="relative h-40 flex items-center justify-center px-6 bg-gradient-to-b from-accent-500/15 to-transparent">
          <span className={`absolute top-3 left-3 text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.pill}`}>{t(status.label)}</span>
          <span className={`absolute top-3 right-3 font-mono text-[11px] px-2 py-0.5 rounded-md ${ui.well}`}>{rental.plate}</span>
          <VehicleImage src={rental.image} alt={rental.vehicleName} className="max-w-full max-h-full" iconSize={40} />
        </div>
        <div className="px-4 pb-4">
          <h1 className="text-2xl font-bold leading-tight">{rental.vehicleName}</h1>
          <p className={`text-sm ${ui.muted}`}>{[rental.category, rental.locationLabel].filter(Boolean).join(' · ') || t('rental_vehicle')}</p>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className={`text-[11px] uppercase tracking-wider font-semibold ${ui.muted}`}>{t('time_left_label')}</p>
              <p className={`text-xl font-semibold ${status.text}`}>{formatRemaining(remaining)}</p>
            </div>
            <p className={`text-xs ${ui.muted}`}>{t('percent_remaining', Math.round(progress * 100))}</p>
          </div>
          <div className={`h-2 rounded-full overflow-hidden mt-2 ${ui.well}`}>
            <div className={`h-full rounded-full ${status.bar}`} style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onLocate}
          disabled={busy}
          className={`h-12 rounded-xl flex items-center justify-center gap-2 text-[15px] font-semibold ${ui.secondaryButton}`}
        >
          <LocateFixed size={16} /> {t('locate')}
        </button>
        <button
          onClick={onExtend}
          disabled={busy || !rental.canExtend}
          className={`h-12 rounded-xl flex items-center justify-center gap-2 text-[15px] font-semibold ${ui.primaryButton}`}
        >
          <CalendarPlus size={16} /> {t('extend')}
        </button>
      </div>

      <div>
        <p className={`text-[11px] uppercase tracking-wider font-semibold px-1 mb-1.5 ${ui.muted}`}>{t('rental_period')}</p>
        <div className={`rounded-2xl overflow-hidden divide-y ${ui.card} ${ui.divide}`}>
          <Row label={t('started')}>{formatDateTime(startedAt)}</Row>
          <Row label={t('ends')}>{formatDateTime(endsAt)}</Row>
          <Row label={t('duration')}>{formatDuration(rental.duration, rental.unit)}</Row>
          <Row label={t('billing')}>{rental.unit === 'days' ? t('daily') : t('hourly')}</Row>
        </div>
      </div>

      <div>
        <p className={`text-[11px] uppercase tracking-wider font-semibold px-1 mb-1.5 ${ui.muted}`}>{t('payment')}</p>
        <div className={`rounded-2xl overflow-hidden divide-y ${ui.card} ${ui.divide}`}>
          {rental.rate != null && <Row label={t('rate')}>{t(rental.unit === 'days' ? 'rate_per_day' : 'rate_per_hour', formatMoney(rental.rate))}</Row>}
          <Row label={t('total_paid')}>{formatMoney(rental.price)}</Row>
          <Row label={t('extensions')}>
            {rental.canExtend ? t('up_to_more', formatDuration(rental.maxExtend ?? 0, rental.unit)) : t('not_available')}
          </Row>
        </div>
      </div>

      <div>
        <p className={`text-[11px] uppercase tracking-wider font-semibold px-1 mb-1.5 ${ui.muted}`}>{t('vehicle')}</p>
        <div className={`rounded-2xl overflow-hidden divide-y ${ui.card} ${ui.divide}`}>
          <Row label={t('plate')}><span className="font-mono">{rental.plate}</span></Row>
          {rental.category && <Row label={t('class')}>{rental.category}</Row>}
          {rental.locationLabel && <Row label={t('rented_from')}>{rental.locationLabel}</Row>}
        </div>
      </div>
    </div>
  );
};
