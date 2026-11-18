import { LocaleKey } from '../utils/locale';
import { PhoneRental } from './types';

const ENDING_SOON = 3600;

export type RentalStatus = 'active' | 'ending' | 'expired';

export const STATUS_STYLE: Record<RentalStatus, { label: LocaleKey; pill: string; bar: string; text: string }> = {
  active: { label: 'active', pill: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300', bar: 'bg-accent-500', text: '' },
  ending: { label: 'ending_soon', pill: 'bg-amber-500/15 text-amber-600 dark:text-amber-300', bar: 'bg-amber-500', text: 'text-amber-500' },
  expired: { label: 'expired', pill: 'bg-red-500/15 text-red-600 dark:text-red-300', bar: 'bg-red-500', text: 'text-red-500' },
};

export const getRentalStatus = (remaining: number): RentalStatus =>
  remaining <= 0 ? 'expired' : remaining < ENDING_SOON ? 'ending' : 'active';

export const getTotalSeconds = (rental: PhoneRental) => rental.duration * (rental.unit === 'days' ? 86400 : 3600);

export const getProgress = (rental: PhoneRental, remaining: number) => {
  const total = getTotalSeconds(rental);
  return total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0;
};
