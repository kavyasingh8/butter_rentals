import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/** Browser-only preview of the sd-phone app, framed at a typical phone screen size. */
export const PhonePreview: React.FC = () => {
  const [dark, setDark] = useState(true);

  return (
    <div className="flex flex-col items-center gap-4 animate-fade-in-up">
      <div className="relative w-[340px] h-[720px] rounded-[52px] bg-ink-950 p-3 shadow-panel ring-1 ring-white/10">
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-7 rounded-full bg-black z-10" />
        <iframe
          key={dark ? 'dark' : 'light'}
          title="Rentals phone app"
          src={`./phone.html?preview=1&theme=${dark ? 'dark' : 'light'}`}
          className="w-full h-full rounded-[40px] bg-ink-950"
        />
      </div>
      <button
        onClick={() => setDark(d => !d)}
        className="h-8 px-3 inline-flex items-center gap-2 rounded-lg bg-ink-900 border border-white/10 text-xs font-semibold text-ink-200 hover:text-white transition-colors"
      >
        {dark ? <Sun size={13} /> : <Moon size={13} />} {dark ? 'Light theme' : 'Dark theme'}
      </button>
    </div>
  );
};
