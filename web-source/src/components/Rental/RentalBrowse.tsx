import React, { useMemo, useRef } from 'react';
import { Search } from 'lucide-react';
import { Vehicle } from '../../types';
import { VehicleCard } from '../VehicleCard';
import { t } from '../../utils/locale';

interface RentalBrowseProps {
  /** Narrow single-column layout used by the side panel. */
  compact?: boolean;
  categories: string[];
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  vehicles: Vehicle[];
  selectedId?: string;
  onSelectVehicle: (vehicle: Vehicle) => void;
}

export const RentalBrowse: React.FC<RentalBrowseProps> = ({
  compact = false, categories, filterCategory, setFilterCategory, searchQuery, setSearchQuery, vehicles, selectedId, onSelectVehicle,
}) => {
  const tabs = useMemo(() => ['All', ...categories.filter(c => c.toLowerCase() !== 'all')], [categories]);
  const tabLabel = (cat: string) => (cat === 'All' ? t('all') : cat);
  const tabsRef = useRef<HTMLDivElement>(null);

  const onTabsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = tabsRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft += e.deltaY + e.deltaX;
  };

  const padX = compact ? 'px-5' : 'px-6';

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className={`${padX} pt-4 flex ${compact ? 'flex-col gap-3' : 'items-end gap-6 border-b border-white/[0.06]'}`}>
        <div className={`relative ${compact ? '' : 'order-last w-56 shrink-0 mb-1.5'}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" size={14} />
          <input
            type="text"
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md bg-white/[0.04] text-[13px] text-white placeholder:text-ink-500 focus:outline-none focus:bg-white/[0.06] transition-colors"
          />
        </div>

        <div ref={tabsRef} onWheel={onTabsWheel} className={`flex-1 min-w-0 flex gap-5 overflow-x-auto no-scrollbar ${compact ? 'border-b border-white/[0.06]' : ''}`}>
          {tabs.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`relative h-9 shrink-0 text-[13px] whitespace-nowrap transition-colors ${
                filterCategory === cat ? 'text-white font-medium' : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              {tabLabel(cat)}
              {filterCategory === cat && <span className="absolute bottom-0 left-0 right-0 h-px bg-white" />}
            </button>
          ))}
        </div>
      </div>

      <div className={`flex-1 min-h-0 overflow-y-auto custom-scroll ${padX} py-4`}>
        {vehicles.length > 0 ? (
          <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {vehicles.map(v => (
              <VehicleCard key={v.id} vehicle={v} compact={compact} selected={v.id === selectedId} onSelect={onSelectVehicle} />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <p className="text-[13px] text-ink-200">{t('no_vehicles_found')}</p>
            <p className="text-xs text-ink-500 mt-1">{t('try_different_search')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
