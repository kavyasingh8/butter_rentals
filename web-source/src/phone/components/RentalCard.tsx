import React from 'react';
import { CalendarPlus, ChevronRight, LocateFixed } from 'lucide-react';
import { VehicleImage } from '../../components/ui';
import { formatDuration, formatMoney, formatRemaining } from '../../utils/format';
import { getProgress, getRentalStatus, STATUS_STYLE } from '../rental';
import { ui } from '../styles';
import { t } from '../../utils/locale';
import { PhoneRental } from '../types';

interface RentalCardProps {
  rental: PhoneRental;
  remaining: number;
  busy: boolean;
  onOpen: () => void;
  onLocate: () => void;
  onExtend: () => void;
}

export const RentalCard: React.FC<RentalCardProps> = ({ rental, remaining, busy, onOpen, onLocate, onExtend }) => {
  const status = STATUS_STYLE[getRentalStatus(remaining)];

  return (
    <div className={`rounded-2xl overflow-hidden ${ui.card}`}>
      <button onClick={onOpen} className={`w-full text-left ${ui.pressable}`}>
        <div className="flex items-center gap-3 p-4 pb-3">
          <div className={`w-20 h-14 shrink-0 rounded-xl flex items-center justify-center p-1.5 ${ui.well}`}>
            <VehicleImage src={rental.image} alt={rental.vehicleName} className="max-w-full max-h-full" iconSize={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[15px] font-semibold truncate">{rental.vehicleName}</p>
              <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${status.pill}`}>{t(status.label)}</span>
            </div>
            <p className={`text-xs truncate ${ui.muted}`}>
              {[rental.category, rental.locationLabel].filter(Boolean).join(' · ') || t('rental_vehicle')}
            </p>
            <span className={`inline-block mt-1.5 font-mono text-[11px] px-1.5 py-0.5 rounded-md ${ui.well}`}>{rental.plate}</span>
          </div>
          <ChevronRight size={18} className={ui.muted} />
        </div>

        <div className="px-4 pb-4">
          <div className="flex justify-between items-baseline text-xs mb-1.5">
            <span className={`text-sm font-semibold ${status.text}`}>{formatRemaining(remaining)}</span>
            <span className={ui.muted}>
              {formatDuration(rental.duration, rental.unit)} · {formatMoney(rental.price)}
            </span>
          </div>
          <div className={`h-1.5 rounded-full overflow-hidden ${ui.well}`}>
            <div className={`h-full rounded-full ${status.bar}`} style={{ width: `${getProgress(rental, remaining) * 100}%` }} />
          </div>
        </div>
      </button>

      <div className={`grid grid-cols-2 border-t ${ui.divider}`}>
        <button
          onClick={onLocate}
          disabled={busy}
          className={`h-11 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-accent-500 disabled:opacity-40 ${ui.pressable}`}
        >
          <LocateFixed size={15} /> {t('locate')}
        </button>
        <button
          onClick={onExtend}
          disabled={busy || !rental.canExtend}
          className={`h-11 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-accent-500 border-l disabled:opacity-40 ${ui.divider} ${ui.pressable}`}
        >
          <CalendarPlus size={15} /> {t('extend')}
        </button>
      </div>
    </div>
  );
};
