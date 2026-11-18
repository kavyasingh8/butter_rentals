import React from 'react';
import { Vehicle } from '../types';
import { formatMoney } from '../utils/format';
import { t } from '../utils/locale';
import { VehicleImage } from './ui';

interface VehicleCardProps {
  vehicle: Vehicle;
  selected: boolean;
  /** Narrow card for the side panel, with the price on its own line. */
  compact?: boolean;
  onSelect: (vehicle: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, selected, compact = false, onSelect }) => {
  const price = (
    <p className="text-[13px] text-white tabular-nums whitespace-nowrap">
      {formatMoney(vehicle.pricePerDay)}<span className="text-ink-500"> {t('per_day')}</span>
    </p>
  );

  return (
    <button
      onClick={() => onSelect(vehicle)}
      className={`flex flex-col text-left rounded-lg border overflow-hidden transition-colors ${
        selected ? 'border-white/30 bg-ink-800' : 'border-white/[0.06] bg-ink-850 hover:border-white/[0.12] hover:bg-ink-800'
      }`}
    >
      <div className={`${compact ? 'h-24' : 'h-28'} w-full bg-white/[0.02] flex items-center justify-center px-3 py-2`}>
        <VehicleImage src={vehicle.image} alt={vehicle.name} className="max-w-full max-h-full" />
      </div>
      <div className="flex items-start justify-between gap-3 px-3 pt-2.5 pb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-white truncate" title={vehicle.name}>{vehicle.name}</h3>
          <p className="text-xs text-ink-400 mt-0.5 truncate">{vehicle.category} · {t('seats', vehicle.seats)}</p>
          {compact && <div className="mt-2">{price}</div>}
        </div>
        {!compact && price}
      </div>
    </button>
  );
};
