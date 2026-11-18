import React, { useEffect, useState } from 'react';
import { CarFront, Check, Loader2, PackagePlus, Plus, Search, X } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { AdminVehicle } from '../../types';
import { Button, Field, IconButton, Input, Tabs, VehicleImage } from '../ui';
import { adminApi, CatalogVehicle, createVehicle } from './adminApi';

type PickerTab = 'game' | 'addon';

interface VehiclePickerProps {
  /** Spawn codes already in the fleet, marked as added in the list. */
  existing: Set<string>;
  onAdd: (vehicle: AdminVehicle) => void;
  onClose: () => void;
}

const CatalogCard: React.FC<{ vehicle: CatalogVehicle; added: boolean; onAdd: () => void }> = ({ vehicle, added, onAdd }) => (
  <button
    onClick={onAdd}
    className={`group relative flex flex-col rounded-lg border text-left transition-colors overflow-hidden ${
      added ? 'border-emerald-400/30 bg-emerald-500/[0.05]' : 'border-white/[0.06] bg-ink-950 hover:border-accent-400/40 hover:bg-white/[0.02]'
    }`}
  >
    <div className="h-20 flex items-center justify-center p-2 bg-ink-900">
      <VehicleImage src={vehicle.image} alt={vehicle.model} className="max-w-full max-h-full" iconSize={20} />
    </div>
    <div className="px-2.5 py-2 min-w-0">
      <p className="text-xs font-medium text-white truncate">{vehicle.label}</p>
      <p className="text-[10px] text-ink-500 font-mono truncate">{vehicle.model} · {vehicle.category}</p>
    </div>
    <span className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-md flex items-center justify-center transition-opacity ${
      added ? 'bg-emerald-500/20 text-emerald-300' : 'bg-accent-500 text-white opacity-0 group-hover:opacity-100'
    }`}>
      {added ? <Check size={13} /> : <Plus size={13} />}
    </span>
  </button>
);

const GameVehicles: React.FC<Pick<VehiclePickerProps, 'existing' | 'onAdd'>> = ({ existing, onAdd }) => {
  const [catalog, setCatalog] = useState<CatalogVehicle[] | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getVehicleCatalog().then(setCatalog);
  }, []);

  if (!catalog) {
    return (
      <div className="flex-1 flex items-center justify-center gap-2 text-xs text-ink-500">
        <Loader2 size={14} className="animate-spin" /> Loading vehicles
      </div>
    );
  }

  const categories = [...new Set(catalog.map(v => v.category))].sort();
  const needle = query.trim().toLowerCase();
  const visible = catalog.filter(v =>
    (!category || v.category === category)
    && (!needle || v.model.includes(needle) || v.label.toLowerCase().includes(needle)));

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <Input autoFocus className="pl-8" placeholder="Search by name or spawn code" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[null, ...categories].map(c => (
          <button
            key={c ?? 'all'}
            onClick={() => setCategory(c)}
            className={`h-7 px-2.5 rounded-md text-[11px] font-medium transition-colors ${
              category === c ? 'bg-accent-500/15 text-accent-200' : 'text-ink-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {c ?? 'All'}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll pr-1">
        {visible.length === 0 ? (
          <p className="py-12 text-center text-xs text-ink-500">No vehicles match this search.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2.5">
            {visible.map(vehicle => (
              <CatalogCard
                key={vehicle.model}
                vehicle={vehicle}
                added={existing.has(vehicle.model)}
                onAdd={() => !existing.has(vehicle.model) && onAdd(createVehicle(vehicle.model, vehicle))}
              />
            ))}
          </div>
        )}
      </div>
      <p className="text-[11px] text-ink-500">{visible.length} of {catalog.length} vehicles. Streamed addon vehicles are included.</p>
    </div>
  );
};

const AddonVehicle: React.FC<Pick<VehiclePickerProps, 'existing' | 'onAdd'>> = ({ existing, onAdd }) => {
  const [model, setModel] = useState('');
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const spawnCode = model.trim().toLowerCase();

  const add = async () => {
    if (existing.has(spawnCode)) {
      setError(`"${spawnCode}" is already in the fleet.`);
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const info = await adminApi.validateModel(spawnCode);
      if (!info.valid) {
        setError(`"${spawnCode}" is not loaded in game. Make sure the addon vehicle is streamed.`);
        return;
      }
      onAdd(createVehicle(spawnCode, {
        label: info.label,
        category: category.trim() || info.category,
        image: image.trim() || info.image,
      }, label.trim() || undefined));
      setModel('');
      setLabel('');
      setCategory('');
      setImage('');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 grid grid-cols-[200px_1fr] gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-32 rounded-lg bg-ink-950 border border-white/[0.06] flex items-center justify-center p-2">
          <VehicleImage src={image.trim() || undefined} alt={spawnCode || 'Addon vehicle'} className="max-w-full max-h-full" />
        </div>
        <p className="text-[11px] text-ink-500 text-center">Image preview</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Spawn code">
            <Input autoFocus value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. rmodgt63" />
          </Field>
          <Field label="Display name" hint="Shown in the rental menu and receipts">
            <Input value={label} onChange={e => setLabel(e.target.value)} maxLength={48} placeholder="e.g. Mercedes AMG GT 63" />
          </Field>
          <Field label="Category" hint="Blank uses the vehicle class">
            <Input list="vehicle-categories" value={category} onChange={e => setCategory(e.target.value)} maxLength={24} placeholder="Sports" />
          </Field>
          <Field label="Image URL" hint="Direct link to a png or jpg">
            <Input value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." />
          </Field>
        </div>
        {error && <p className="text-xs text-red-300">{error}</p>}
        <div>
          <Button icon={PackagePlus} onClick={add} loading={adding} disabled={!spawnCode}>
            Add addon vehicle
          </Button>
        </div>
      </div>
    </div>
  );
};

export const VehiclePicker: React.FC<VehiclePickerProps> = ({ existing, onAdd, onClose }) => {
  const [tab, setTab] = useState<PickerTab>('game');
  useEscapeKey(onClose);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-8 animate-fade-in" onClick={onClose}>
      <div
        className="w-[880px] max-w-full h-[640px] max-h-full flex flex-col rounded-xl border border-white/[0.08] bg-ink-850 shadow-panel"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-3">
            <CarFront size={16} className="text-accent-300" />
            <div>
              <h2 className="text-sm font-semibold text-white">Add vehicles</h2>
              <p className="text-[11px] text-ink-500">Click a vehicle to add it to the fleet. You can add as many as you like.</p>
            </div>
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </header>

        <div className="px-5 mt-2">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[{ value: 'game', label: 'Vehicle list' }, { value: 'addon', label: 'Addon vehicle' }]}
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col p-5">
          {tab === 'game' ? <GameVehicles existing={existing} onAdd={onAdd} /> : <AddonVehicle existing={existing} onAdd={onAdd} />}
        </div>
      </div>
    </div>
  );
};
