import { ActionResult, PhoneData } from './types';
import { MOCK_PHONE_DATA } from './mockData';
import { t } from '../utils/locale';

interface PhoneSettings {
  theme?: 'light' | 'dark';
}

interface PhoneSdk {
  componentsLoaded?: boolean;
  settings?: PhoneSettings;
  fetchNui?: <T>(event: string, data?: unknown) => Promise<T | undefined>;
  OnSettingsChange?: (cb: (settings: PhoneSettings) => void) => void;
  OnAppOpen?: (cb: () => void) => () => void;
}

const sdk = globalThis as unknown as PhoneSdk;

/** Opened directly in a browser, or framed by the dev preview, instead of inside sd-phone, so use mock data. */
export const isStandalone = window.parent === window || new URLSearchParams(window.location.search).has('preview');

/** sd-phone injects its SDK after the page loads, so wait for it before calling anything. */
export const whenReady = () =>
  new Promise<void>(resolve => {
    if (isStandalone || sdk.componentsLoaded) return resolve();
    const poll = setInterval(() => {
      if (!sdk.componentsLoaded) return;
      clearInterval(poll);
      resolve();
    }, 50);
    window.addEventListener('message', e => {
      if (e.data !== 'componentsLoaded') return;
      clearInterval(poll);
      resolve();
    });
  });

const noResponse = (): ActionResult => ({ success: false, message: t('service_unreachable') });
const EMPTY_DATA: PhoneData = { locations: [], rentals: [], extendPaymentMethod: 'bank' };

/** Mock data is only used in a plain browser; in game a failed call resolves to `fallback`. */
async function call<T>(event: string, data: unknown, mock: T, fallback: T): Promise<T> {
  if (isStandalone) return mock;
  if (!sdk.fetchNui) return fallback;
  return (await sdk.fetchNui<T>(event, data)) ?? fallback;
}

export const phoneApi = {
  getData: () => call<PhoneData>('phone:getData', undefined, MOCK_PHONE_DATA, EMPTY_DATA),
  setWaypoint: (id: string) => call<ActionResult>('phone:setWaypoint', { id }, { success: true }, noResponse()),
  locate: (plate: string) => call<ActionResult>('phone:locate', { plate }, { success: true }, noResponse()),
  extend: (plate: string, amount: number) =>
    call<ActionResult>('phone:extend', { plate, amount }, { success: true, message: t('rental_extended') }, noResponse()),
};

const previewTheme = () => (new URLSearchParams(window.location.search).get('theme') === 'light' ? 'light' : 'dark');

export const getTheme = () => sdk.settings?.theme ?? previewTheme();

export const onThemeChange = (cb: (theme: 'light' | 'dark') => void) =>
  sdk.OnSettingsChange?.(settings => cb(settings.theme ?? 'dark'));

export const onAppOpen = (cb: () => void) => sdk.OnAppOpen?.(cb);
