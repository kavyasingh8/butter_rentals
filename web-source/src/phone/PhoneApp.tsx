import React, { useCallback, useEffect, useState } from 'react';
import { CarFront, CheckCircle2, KeyRound, Loader2, MapPinned, XCircle } from 'lucide-react';
import { formatMoney, formatRemaining } from '../utils/format';
import { ExtendSheet } from './components/ExtendSheet';
import { LocationDetail } from './components/LocationDetail';
import { LocationList } from './components/LocationList';
import { RentalCard } from './components/RentalCard';
import { RentalDetail } from './components/RentalDetail';
import { getTheme, onAppOpen, onThemeChange, phoneApi } from './phoneApi';
import { applyTheme } from '../utils/theme';
import { ui } from './styles';
import { ActionResult, PhoneData, PhoneLocation, PhoneRental } from './types';
import { LocaleKey, setLocale, t } from '../utils/locale';

type Tab = 'rentals' | 'locations';

interface Toast {
  tone: 'success' | 'error';
  text: string;
}

const TABS: { id: Tab; label: LocaleKey; icon: React.ElementType }[] = [
  { id: 'rentals', label: 'my_rentals', icon: KeyRound },
  { id: 'locations', label: 'locations', icon: MapPinned },
];

const PageTitle: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-1">
    <h1 className="text-[30px] font-bold leading-tight">{title}</h1>
    <p className={`text-sm ${ui.muted}`}>{subtitle}</p>
  </div>
);

const SummaryTile: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex-1 min-w-0 px-3 py-3">
    <p className={`text-[11px] ${ui.muted}`}>{label}</p>
    <p className="text-[15px] font-semibold tabular-nums truncate">{value}</p>
  </div>
);

export const PhoneApp: React.FC = () => {
  const [data, setData] = useState<PhoneData | null>(null);
  const [fetchedAt, setFetchedAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [tab, setTab] = useState<Tab>('rentals');
  const [location, setLocation] = useState<PhoneLocation | null>(null);
  const [openPlate, setOpenPlate] = useState<string | null>(null);
  const [extending, setExtending] = useState<PhoneRental | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [theme, setTheme] = useState(getTheme());

  const load = useCallback(async () => {
    const next = await phoneApi.getData();
    applyTheme(next.theme);
    setLocale(next.locale);
    setData(next);
    setFetchedAt(Date.now());
    setNow(Date.now());
  }, []);

  useEffect(() => {
    load();
    onThemeChange(setTheme);
    return onAppOpen(load);
  }, [load]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const report = (result: ActionResult, successText: string) =>
    setToast(result.success
      ? { tone: 'success', text: result.message ?? successText }
      : { tone: 'error', text: result.message ?? t('something_wrong') });

  const run = async (action: () => Promise<ActionResult>, successText: string) => {
    setBusy(true);
    try {
      const result = await action();
      report(result, successText);
      return result;
    } finally {
      setBusy(false);
    }
  };

  const locate = (rental: PhoneRental) => run(() => phoneApi.locate(rental.plate), t('gps_vehicle_set'));

  const extend = async (rental: PhoneRental, amount: number) => {
    const result = await run(() => phoneApi.extend(rental.plate, amount), t('rental_extended'));
    if (!result.success) return;
    setExtending(null);
    if (result.rentals && data) {
      setData({ ...data, rentals: result.rentals });
      setFetchedAt(Date.now());
      setNow(Date.now());
    }
  };

  const setWaypoint = (target: PhoneLocation) => run(() => phoneApi.setWaypoint(target.id), t('gps_route_set'));

  const elapsed = Math.floor((now - fetchedAt) / 1000);
  const remainingOf = (rental: PhoneRental) => Math.max(0, rental.remaining - elapsed);
  const rentals = data?.rentals ?? [];
  const openRental = rentals.find(r => r.plate === openPlate) ?? null;
  const active = rentals.filter(r => remainingOf(r) > 0);
  const nextEnding = active.length ? Math.min(...active.map(remainingOf)) : 0;
  const totalPaid = rentals.reduce((sum, r) => sum + r.price, 0);

  const renderRentals = () => {
    if (openRental) {
      return (
        <RentalDetail
          rental={openRental}
          remaining={remainingOf(openRental)}
          now={now}
          busy={busy}
          onBack={() => setOpenPlate(null)}
          onLocate={() => locate(openRental)}
          onExtend={() => setExtending(openRental)}
        />
      );
    }

    return (
      <div className="flex flex-col gap-3">
        <PageTitle
          title={t('my_rentals')}
          subtitle={rentals.length ? t(active.length === 1 ? 'active_rental' : 'active_rentals', active.length) : t('nothing_rented')}
        />

        {rentals.length > 0 && (
          <div className={`flex rounded-2xl divide-x ${ui.card} ${ui.divide}`}>
            <SummaryTile label={t('active')} value={String(active.length)} />
            <SummaryTile label={t('next_ends')} value={active.length ? formatRemaining(nextEnding, false) : '-'} />
            <SummaryTile label={t('total_paid')} value={formatMoney(totalPaid)} />
          </div>
        )}

        {rentals.length === 0 ? (
          <div className={`rounded-2xl p-8 flex flex-col items-center text-center ${ui.card}`}>
            <div className="w-14 h-14 rounded-2xl bg-accent-500/10 text-accent-500 flex items-center justify-center">
              <CarFront size={26} />
            </div>
            <p className="text-[15px] font-semibold mt-3">{t('no_active_rentals')}</p>
            <p className={`text-sm mt-1 ${ui.muted}`}>{t('no_rentals_hint')}</p>
            <button
              onClick={() => setTab('locations')}
              className={`mt-4 h-10 px-5 rounded-xl text-sm font-semibold ${ui.primaryButton}`}
            >
              {t('browse_locations')}
            </button>
          </div>
        ) : (
          rentals.map(rental => (
            <RentalCard
              key={rental.plate}
              rental={rental}
              remaining={remainingOf(rental)}
              busy={busy}
              onOpen={() => setOpenPlate(rental.plate)}
              onLocate={() => locate(rental)}
              onExtend={() => setExtending(rental)}
            />
          ))
        )}
      </div>
    );
  };

  const renderLocations = () => {
    if (!data) return null;
    if (location) {
      return <LocationDetail location={location} onBack={() => setLocation(null)} onSetWaypoint={() => setWaypoint(location)} />;
    }
    return (
      <div className="flex flex-col gap-3">
        <PageTitle title={t('locations')} subtitle={t(data.locations.length === 1 ? 'place_to_rent' : 'places_to_rent', data.locations.length)} />
        <LocationList locations={data.locations} onSelect={setLocation} />
      </div>
    );
  };

  return (
    <div className={`relative h-screen w-screen flex flex-col overflow-hidden font-sans ${ui.page}`}>
      <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-14 pb-6">
        {!data ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className={`animate-spin ${ui.muted}`} size={22} />
          </div>
        ) : tab === 'rentals' ? renderRentals() : renderLocations()}
      </main>

      <nav className={`shrink-0 grid grid-cols-2 gap-2 px-4 pt-2 pb-7 border-t bg-white/90 dark:bg-ink-900/90 backdrop-blur ${ui.divider}`}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const selected = tab === id;
          return (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                setLocation(null);
                setOpenPlate(null);
              }}
              className={`flex flex-col items-center gap-1 py-1.5 rounded-xl text-[11px] font-medium transition-colors ${
                selected ? 'text-accent-500 bg-accent-500/10' : ui.muted
              }`}
            >
              <Icon size={21} />
              {t(label)}
            </button>
          );
        })}
      </nav>

      {toast && (
        <div className="absolute top-12 inset-x-4 z-40 animate-fade-in-up">
          <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg text-white ${
            toast.tone === 'success' ? 'bg-emerald-500' : 'bg-red-500'
          }`}>
            {toast.tone === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {toast.text}
          </div>
        </div>
      )}

      {extending && data && (
        <ExtendSheet
          key={extending.plate}
          rental={extending}
          remaining={remainingOf(extending)}
          now={now}
          paymentMethod={data.extendPaymentMethod}
          busy={busy}
          onConfirm={amount => extend(extending, amount)}
          onCancel={() => setExtending(null)}
        />
      )}
    </div>
  );
};
