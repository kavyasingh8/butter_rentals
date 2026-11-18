import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { PaymentMethod, RentalUnit, Vehicle } from '../../types';
import { formatDuration, formatMoney } from '../../utils/format';
import { getDurationBounds, getRentalRate } from '../../utils/rental';
import { t } from '../../utils/locale';
import { Button, Segmented, VehicleImage } from '../ui';

interface RentalCheckoutProps {
  vehicle: Vehicle;
  rentalType: RentalUnit;
  duration: number;
  paymentMethod: PaymentMethod | null;
  serviceFee: number;
  total: number;
  isProcessing: boolean;
  setRentalType: (unit: RentalUnit) => void;
  setDuration: (duration: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  onConfirm: () => void;
}

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between text-[13px]">
    <span className="text-ink-400">{label}</span>
    <span className="text-ink-100 tabular-nums">{value}</span>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="flex flex-col gap-2.5">
    <h3 className="text-xs text-ink-400">{title}</h3>
    {children}
  </section>
);

const StepButton: React.FC<{ icon: React.ElementType; label: string; disabled: boolean; onClick: () => void }> = ({
  icon: Icon, label, disabled, onClick,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className="w-9 h-9 rounded-md flex items-center justify-center text-ink-200 hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
  >
    <Icon size={14} />
  </button>
);

export const RentalCheckout: React.FC<RentalCheckoutProps> = ({
  vehicle, rentalType, duration, paymentMethod, serviceFee, total, isProcessing,
  setRentalType, setDuration, setPaymentMethod, onConfirm,
}) => {
  const rate = getRentalRate(vehicle, rentalType);
  const { min, max } = getDurationBounds(vehicle, rentalType);

  return (
    <div className="h-full flex flex-col min-h-0 animate-fade-in">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll px-5 pt-5 pb-6 flex flex-col gap-6">
        <div>
          <div className="h-32 rounded-lg bg-white/[0.03] flex items-center justify-center p-4">
            <VehicleImage src={vehicle.image} alt={vehicle.name} className="max-w-full max-h-full" iconSize={36} />
          </div>
          <h2 className="text-base font-semibold text-white truncate mt-4">{vehicle.name}</h2>
          <p className="text-xs text-ink-400 mt-0.5">
            {vehicle.category} · {t('seats', vehicle.seats)} · {t('fuel', Math.round(vehicle.fuelLevel ?? 100))}
          </p>
        </div>

        <Section title={t('rental_period')}>
          <Segmented
            value={rentalType}
            onChange={setRentalType}
            options={[{ value: 'days', label: t('daily') }, { value: 'hours', label: t('hourly') }]}
          />
          <div className="flex items-center justify-between rounded-lg bg-ink-950 border border-white/[0.06] p-0.5">
            <StepButton icon={Minus} label={t('decrease')} disabled={duration <= min} onClick={() => setDuration(duration - 1)} />
            <span className="text-[13px] font-medium text-white tabular-nums">{formatDuration(duration, rentalType)}</span>
            <StepButton icon={Plus} label={t('increase')} disabled={duration >= max} onClick={() => setDuration(duration + 1)} />
          </div>
          {max > min && (
            <input
              type="range"
              min={min}
              max={max}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer bg-white/10 accent-white"
            />
          )}
        </Section>

        <Section title={t('payment')}>
          <Segmented<PaymentMethod | ''>
            value={paymentMethod ?? ''}
            onChange={(method) => method && setPaymentMethod(method)}
            options={[{ value: 'cash', label: t('cash') }, { value: 'bank', label: t('bank') }]}
          />
        </Section>
      </div>

      <div className="shrink-0 border-t border-white/[0.06] px-5 py-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <SummaryRow label={`${formatMoney(rate)} × ${formatDuration(duration, rentalType)}`} value={formatMoney(rate * duration)} />
          <SummaryRow label={t('service_fee')} value={formatMoney(serviceFee)} />
          <div className="flex justify-between items-baseline pt-2">
            <span className="text-[13px] text-ink-200">{t('total')}</span>
            <span className="text-lg font-semibold text-white tabular-nums">{formatMoney(total)}</span>
          </div>
        </div>
        <Button size="lg" onClick={onConfirm} disabled={!paymentMethod} loading={isProcessing}>
          {paymentMethod ? t('confirm_rental') : t('choose_payment')}
        </Button>
      </div>
    </div>
  );
};
