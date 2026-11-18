import { t } from './locale';

export const formatMoney = (value: number) => `$${Math.round(value).toLocaleString()}`;

export const formatDuration = (amount: number, unit: 'days' | 'hours') => {
  const one = amount === 1;
  if (unit === 'days') return t(one ? 'duration_day' : 'duration_days', amount);
  return t(one ? 'duration_hour' : 'duration_hours', amount);
};

export const formatDateTime = (ms: number) =>
  new Date(ms).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Time left as "2d 4h", or with `withSuffix` as "2d 4h left". */
export const formatRemaining = (seconds: number, withSuffix = true) => {
  if (seconds <= 0) return t('expired');
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const amount = days > 0
    ? t('remaining_days', days, hours)
    : hours > 0
      ? t('remaining_hours', hours, minutes)
      : t('remaining_minutes', Math.max(1, minutes));

  return withSuffix ? t('time_left', amount) : amount;
};
