import React, { useState } from 'react';
import { MapPin, Navigation, Users } from 'lucide-react';
import { VehicleImage } from '../../components/ui';
import { formatMoney } from '../../utils/format';
import { startingPrice } from '../location';
import { ui } from '../styles';
import { t } from '../../utils/locale';
import { PhoneLocation } from '../types';
import { BackButton } from './BackButton';

interface LocationDetailProps {
  location: PhoneLocation;
  onBack: () => void;
  onSetWaypoint: () => void;
}

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex-1 text-center py-3">
    <p className="text-base font-semibold tabular-nums">{value}</p>
    <p className={`text-[11px] ${ui.muted}`}>{label}</p>
  </div>
);

export const LocationDetail: React.FC<LocationDetailProps> = ({ location, onBack, onSetWaypoint }) => {
  const [category, setCategory] = useState<string | null>(null);
  const vehicles = category ? location.vehicles.filter(v => v.category === category) : location.vehicles;

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <BackButton label={t('locations')} onClick={onBack} />

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 shrink-0 rounded-2xl bg-accent-500/10 text-accent-500 flex items-center justify-center">
          <MapPin size={22} />
        </div>
        <div className="min-w-0">
          <h1 className="text-[24px] font-bold leading-tight truncate">{location.label}</h1>
          <p className={`text-sm ${ui.muted}`}>{t('vehicle_rental_location')}</p>
        </div>
      </div>

      <div className={`flex rounded-2xl divide-x ${ui.card} ${ui.divide}`}>
        <Stat label={t('vehicles')} value={location.vehicles.length} />
        <Stat label={t('categories')} value={location.categories.length} />
        <Stat label={t('from_per_day')} value={formatMoney(startingPrice(location))} />
      </div>

      <button
        onClick={onSetWaypoint}
        className={`h-12 rounded-xl flex items-center justify-center gap-2 text-[15px] font-semibold ${ui.primaryButton}`}
      >
        <Navigation size={16} /> {t('set_gps_route')}
      </button>

      {location.categories.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
          {[null, ...location.categories].map(c => (
            <button
              key={c ?? 'all'}
              onClick={() => setCategory(c)}
              className={`h-8 px-3.5 shrink-0 rounded-full text-[13px] font-medium ${category === c ? ui.chipActive : ui.chip}`}
            >
              {c ?? t('all')}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {vehicles.map(vehicle => (
          <div key={`${vehicle.name}-${vehicle.category}`} className={`flex items-center gap-3 rounded-2xl p-3 ${ui.card}`}>
            <div className={`w-20 h-14 shrink-0 rounded-xl flex items-center justify-center p-1.5 ${ui.well}`}>
              <VehicleImage src={vehicle.image} alt={vehicle.name} className="max-w-full max-h-full" iconSize={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold truncate">{vehicle.name}</p>
              <p className={`text-xs flex items-center gap-1 ${ui.muted}`}>
                {vehicle.category} · <Users size={11} /> {t(vehicle.seats === 1 ? 'seat' : 'seats', vehicle.seats)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold tabular-nums">{formatMoney(vehicle.pricePerDay)}<span className={`text-[11px] font-normal ${ui.muted}`}>{t('per_day')}</span></p>
              <p className={`text-[11px] tabular-nums ${ui.muted}`}>{formatMoney(vehicle.pricePerHour)}{t('per_hour')}</p>
            </div>
          </div>
        ))}
        {vehicles.length === 0 && <p className={`text-sm text-center py-6 ${ui.muted}`}>{t('no_vehicles_here')}</p>}
      </div>

      <p className={`text-xs text-center px-6 ${ui.muted}`}>{t('visit_agent_hint')}</p>
    </div>
  );
};
