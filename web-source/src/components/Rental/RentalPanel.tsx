import React, { useMemo, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { PaymentMethod, ReceiptData, RentalState, RentalStep, RentalUnit, Vehicle } from '../../types';
import { fetchNui } from '../../utils/fetchNui';
import { getDurationBounds, getRentalRate } from '../../utils/rental';
import { t } from '../../utils/locale';
import { IconButton } from '../ui';
import { RentalBrowse } from './RentalBrowse';
import { RentalCheckout } from './RentalCheckout';
import { RentalConfirmation } from './RentalConfirmation';

export type RentalLayout = 'side' | 'center';

export interface RentalData {
  vehicles: Vehicle[];
  categories: string[];
  locationLabel: string;
  serviceFee: number;
  layout?: RentalLayout;
}

interface RentalPanelProps {
  data: RentalData;
  onClose: () => void;
}

interface ConfirmResponse {
  success: boolean;
  receiptData?: ReceiptData;
  message?: string;
}

const INITIAL_STATE: RentalState = {
  step: RentalStep.BROWSE,
  selectedVehicle: null,
  rentalType: 'days',
  duration: 1,
  paymentMethod: null,
};

const EmptySelection = () => (
  <div className="h-full flex flex-col justify-center px-8">
    <p className="text-[13px] text-ink-200">{t('no_vehicle_selected')}</p>
    <p className="text-xs text-ink-500 mt-1 leading-relaxed">{t('pick_vehicle_hint')}</p>
  </div>
);

export const RentalPanel: React.FC<RentalPanelProps> = ({ data, onClose }) => {
  const [state, setState] = useState<RentalState>(INITIAL_STATE);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredVehicles = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return data.vehicles.filter(v =>
      (filterCategory === 'All' || v.category === filterCategory) && v.name.toLowerCase().includes(query),
    );
  }, [data.vehicles, filterCategory, searchQuery]);

  const vehicle = state.selectedVehicle;
  const total = vehicle ? getRentalRate(vehicle, state.rentalType) * state.duration + data.serviceFee : 0;

  const selectVehicle = (v: Vehicle) => {
    if (isProcessing) return;
    setState(p => ({
      ...p,
      step: RentalStep.CHECKOUT,
      selectedVehicle: v,
      rentalType: 'days',
      duration: getDurationBounds(v, 'days').min,
    }));
  };

  const setRentalType = (unit: RentalUnit) => setState(p => ({
    ...p,
    rentalType: unit,
    duration: p.selectedVehicle ? getDurationBounds(p.selectedVehicle, unit).min : 1,
  }));

  const setDuration = (next: number) => setState(p => {
    if (!p.selectedVehicle) return p;
    const { min, max } = getDurationBounds(p.selectedVehicle, p.rentalType);
    return { ...p, duration: Math.min(Math.max(next, min), max) };
  });

  const setPaymentMethod = (method: PaymentMethod) => setState(p => ({ ...p, paymentMethod: method }));

  const confirmRental = async () => {
    if (!vehicle || !state.paymentMethod) return;
    setIsProcessing(true);
    try {
      const result = await fetchNui<ConfirmResponse>('confirmRental', {
        vehicleHash: vehicle.id,
        rentalType: state.rentalType,
        duration: state.duration,
        paymentMethod: state.paymentMethod,
      }, { success: true });

      if (result.success) {
        setReceiptData(result.receiptData ?? null);
        setState(p => ({ ...p, step: RentalStep.CONFIRMATION }));
      }
    } catch {
      // Failures are reported to the player through a game notification.
    } finally {
      setIsProcessing(false);
    }
  };

  const rentAnother = () => {
    setState(INITIAL_STATE);
    setReceiptData(null);
  };

  const isSide = data.layout !== 'center';
  const canGoBack = isSide && state.step === RentalStep.CHECKOUT && !isProcessing;

  const browse = (
    <RentalBrowse
      compact={isSide}
      categories={data.categories}
      filterCategory={filterCategory}
      setFilterCategory={setFilterCategory}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      vehicles={filteredVehicles}
      selectedId={vehicle?.id}
      onSelectVehicle={selectVehicle}
    />
  );

  const checkout = vehicle && (
    <RentalCheckout
      key={vehicle.id}
      vehicle={vehicle}
      rentalType={state.rentalType}
      duration={state.duration}
      paymentMethod={state.paymentMethod}
      serviceFee={data.serviceFee}
      total={total}
      isProcessing={isProcessing}
      setRentalType={setRentalType}
      setDuration={setDuration}
      setPaymentMethod={setPaymentMethod}
      onConfirm={confirmRental}
    />
  );

  const confirmation = (
    <RentalConfirmation vehicle={vehicle} receiptData={receiptData} onRentAnother={rentAnother} onClose={onClose} />
  );

  const header = (
    <header className={`h-14 shrink-0 flex items-center justify-between gap-3 border-b border-white/[0.06] ${canGoBack ? 'pl-3 pr-4' : 'px-5'}`}>
      <div className="flex items-center gap-2 min-w-0">
        {canGoBack && (
          <IconButton icon={ArrowLeft} label={t('back')} onClick={() => setState(p => ({ ...p, step: RentalStep.BROWSE, selectedVehicle: null }))} />
        )}
        <h1 className="text-sm font-semibold text-white truncate">{data.locationLabel}</h1>
        <span className="text-sm text-ink-500 truncate">
          {isSide && state.step === RentalStep.CHECKOUT ? t('checkout') : t('rentals')}
        </span>
      </div>
      <IconButton icon={X} label={t('close')} onClick={onClose} />
    </header>
  );

  if (isSide) {
    return (
      <div className="absolute right-8 top-8 bottom-8 w-[400px] flex flex-col rounded-xl border border-white/[0.06] bg-ink-900 shadow-panel overflow-hidden animate-slide-in-right">
        {header}
        <div className="flex-1 min-h-0">
          {state.step === RentalStep.BROWSE && browse}
          {state.step === RentalStep.CHECKOUT && checkout}
          {state.step === RentalStep.CONFIRMATION && confirmation}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1080px] h-[min(700px,88vh)] flex flex-col rounded-xl border border-white/[0.06] bg-ink-900 shadow-panel overflow-hidden animate-fade-in-up">
      {header}
      <div className="flex-1 min-h-0 grid grid-cols-[1fr_340px]">
        {browse}
        <aside className="min-h-0 border-l border-white/[0.06] bg-ink-925">
          {state.step === RentalStep.BROWSE && <EmptySelection />}
          {state.step === RentalStep.CHECKOUT && checkout}
          {state.step === RentalStep.CONFIRMATION && confirmation}
        </aside>
      </div>
    </div>
  );
};
