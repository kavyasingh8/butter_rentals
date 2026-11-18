import React, { useState } from 'react';
import { AdminLocation, ReceiptData } from './types';
import { useEscapeKey } from './hooks/useEscapeKey';
import { useNuiEvent } from './hooks/useNuiEvent';
import { fetchNui } from './utils/fetchNui';
import { setLocale } from './utils/locale';
import { isEnvBrowser } from './utils/misc';
import { MOCK_ADMIN_LOCATIONS, MOCK_RECEIPT, MOCK_RENTAL } from './utils/mockData';
import { ReceiptPanel } from './components/Receipt/ReceiptPanel';
import { RentalAgreement } from './components/Document/RentalAgreement';
import { RentalData, RentalPanel } from './components/Rental/RentalPanel';
import { AdminPanel } from './components/Admin/AdminPanel';
import { setImageTemplate } from './components/Admin/adminApi';
import { PhonePreview } from './components/PhonePreview';

type View =
  | { name: 'rental'; data: RentalData }
  | { name: 'admin'; locations: AdminLocation[] }
  | { name: 'receipt'; data: ReceiptData }
  | { name: 'agreement'; data: ReceiptData }
  | { name: 'phone' };

const PREVIEW_VIEWS: { label: string; view: View }[] = [
  { label: 'Side', view: { name: 'rental', data: MOCK_RENTAL } },
  { label: 'Center', view: { name: 'rental', data: { ...MOCK_RENTAL, layout: 'center' } } },
  { label: 'Admin', view: { name: 'admin', locations: MOCK_ADMIN_LOCATIONS } },
  { label: 'Receipt', view: { name: 'receipt', data: MOCK_RECEIPT } },
  { label: 'Agreement', view: { name: 'agreement', data: MOCK_RECEIPT } },
  { label: 'Phone', view: { name: 'phone' } },
];

/** The docked side panel sits over the game; everything else is centered over a dimmed backdrop. */
const isDocked = (view: View) => view.name === 'rental' && view.data.layout !== 'center';
const isModal = (view: View) => !isDocked(view) && (view.name === 'rental' || view.name === 'admin');

export default function App() {
  const [view, setView] = useState<View | null>(isEnvBrowser() ? PREVIEW_VIEWS[0].view : null);
  // Bumped on every open so panels start from a clean state.
  const [session, setSession] = useState(0);
  // Hidden, not closed, while the admin places something with the laser in game.
  const [hidden, setHidden] = useState(false);

  const open = (next: View) => {
    setSession(s => s + 1);
    setView(next);
  };

  const close = () => {
    fetchNui('closeUI');
    setView(null);
  };

  useNuiEvent<RentalData>('setRentalData', data => open({ name: 'rental', data }));
  useNuiEvent<{ locations: AdminLocation[]; imageTemplate?: string }>('openAdmin', data => {
    setImageTemplate(data.imageTemplate);
    open({ name: 'admin', locations: data.locations });
  });
  useNuiEvent<ReceiptData>('showStandaloneReceipt', data => open({ name: 'receipt', data }));
  useNuiEvent<ReceiptData>('showStandaloneAgreement', data => open({ name: 'agreement', data }));
  useNuiEvent<boolean>('setHidden', setHidden);
  // Applies from the next time a panel opens.
  useNuiEvent<Record<string, string>>('setLocale', setLocale);

  // The admin panel handles Escape itself so unsaved changes are not lost.
  useEscapeKey(close, !!view && view.name !== 'admin');

  return (
    <div className={`h-screen w-screen overflow-hidden ${hidden ? 'invisible' : ''}`}>
      {view && (
        <div className={isDocked(view) ? 'relative h-full w-full' : `h-full w-full flex items-center justify-center p-8 ${isModal(view) ? 'bg-black/40 animate-fade-in' : ''}`}>
          {view.name === 'rental' && <RentalPanel key={session} data={view.data} onClose={close} />}
          {view.name === 'admin' && <AdminPanel key={session} initialLocations={view.locations} onClose={close} />}
          {view.name === 'receipt' && <ReceiptPanel data={view.data} onClose={close} />}
          {view.name === 'agreement' && <RentalAgreement data={view.data} onClose={close} />}
          {view.name === 'phone' && <PhonePreview />}
        </div>
      )}

      {isEnvBrowser() && (
        <div className="absolute bottom-4 left-4 flex gap-1 z-50 bg-ink-900 p-1 rounded-lg border border-white/10">
          {PREVIEW_VIEWS.map(preview => (
            <button
              key={preview.label}
              onClick={() => open(preview.view)}
              className="px-3 h-7 rounded-md text-xs font-semibold text-ink-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              {preview.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
