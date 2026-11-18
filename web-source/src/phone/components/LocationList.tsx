import React, { useState } from 'react';
import { CarFront, ChevronRight, MapPin, Search } from 'lucide-react';
import { formatMoney } from '../../utils/format';
import { startingPrice } from '../location';
import { ui } from '../styles';
import { t } from '../../utils/locale';
import { PhoneLocation } from '../types';

interface LocationListProps {
  locations: PhoneLocation[];
  onSelect: (location: PhoneLocation) => void;
}

const MAX_CHIPS = 3;

export const LocationList: React.FC<LocationListProps> = ({ locations, onSelect }) => {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const visible = locations.filter(l =>
    !needle
    || l.label.toLowerCase().includes(needle)
    || l.vehicles.some(v => v.name.toLowerCase().includes(needle) || v.category.toLowerCase().includes(needle)));

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${ui.muted}`} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('search_locations')}
          className={`w-full h-10 pl-9 pr-3 rounded-xl text-sm ${ui.input}`}
        />
      </div>

      {visible.length === 0 && (
        <p className={`text-sm text-center py-8 ${ui.muted}`}>{locations.length ? t('no_locations_match') : t('no_locations')}</p>
      )}

      {visible.map(location => {
        const extra = location.categories.length - MAX_CHIPS;
        return (
          <button
            key={location.id}
            onClick={() => onSelect(location)}
            className={`w-full rounded-2xl p-4 text-left ${ui.card} ${ui.pressable}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-accent-500/10 text-accent-500 flex items-center justify-center">
                <MapPin size={19} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold truncate">{location.label}</p>
                <p className={`text-xs flex items-center gap-1 ${ui.muted}`}>
                  <CarFront size={12} /> {t(location.vehicles.length === 1 ? 'vehicle_count' : 'vehicles_count', location.vehicles.length)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-[10px] uppercase tracking-wider ${ui.muted}`}>{t('from')}</p>
                <p className="text-sm font-semibold tabular-nums">{formatMoney(startingPrice(location))}<span className={`text-[11px] font-normal ${ui.muted}`}>{t('per_day')}</span></p>
              </div>
              <ChevronRight size={18} className={ui.muted} />
            </div>
            {location.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pl-14">
                {location.categories.slice(0, MAX_CHIPS).map(category => (
                  <span key={category} className={`text-[11px] px-2 py-0.5 rounded-full ${ui.well}`}>{category}</span>
                ))}
                {extra > 0 && <span className={`text-[11px] px-2 py-0.5 rounded-full ${ui.well} ${ui.muted}`}>+{extra}</span>}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
