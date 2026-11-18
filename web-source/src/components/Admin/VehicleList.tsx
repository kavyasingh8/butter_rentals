import React, { useState } from 'react';
import { CarFront, ChevronDown, Copy, Filter, LayoutGrid, Plus, Search, Trash2 } from 'lucide-react';
import { AdminVehicle } from '../../types';
import { formatMoney } from '../../utils/format';
import { Badge, Button, Card, Field, IconButton, Input, VehicleImage } from '../ui';
import { adminApi, createVehicle, imageFor, nextKey } from './adminApi';
import { VEHICLE_CATEGORIES } from './presets';
import { VehiclePicker } from './VehiclePicker';

interface VehicleListProps {
  vehicles: AdminVehicle[];
  onChange: (vehicles: AdminVehicle[]) => void;
}

const toNumber = (value: string) => (value === '' ? 0 : Number(value));

const displayName = (vehicle: AdminVehicle) => vehicle.label ?? vehicle.gameLabel ?? vehicle.model;

/** A new spawn code gets its own default image, but a custom image is kept. */
const changeModel = (vehicle: AdminVehicle, model: string): Partial<AdminVehicle> => ({
  model,
  gameLabel: undefined,
  image: vehicle.image === imageFor(vehicle.model) ? imageFor(model) : vehicle.image,
});

const COLUMNS = 'grid grid-cols-[minmax(0,1fr)_110px_90px_90px_110px_50px_100px] items-center gap-4';

const FieldGroup: React.FC<{ title: string; columns: string; children: React.ReactNode }> = ({ title, columns, children }) => (
  <div className="flex flex-col gap-2.5">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{title}</p>
    <div className={`grid gap-3 ${columns}`}>{children}</div>
  </div>
);

const VehicleFields: React.FC<{ vehicle: AdminVehicle; update: (patch: Partial<AdminVehicle>) => void }> = ({ vehicle, update }) => (
  <div className="grid grid-cols-[180px_1fr] gap-6 px-5 py-5 bg-ink-950/60 border-t border-white/[0.05]">
    <div className="flex flex-col gap-2">
      <div className="h-28 rounded-lg bg-ink-900 border border-white/[0.05] flex items-center justify-center p-2">
        <VehicleImage src={vehicle.image} alt={vehicle.model} className="max-w-full max-h-full" />
      </div>
      <p className="text-[11px] text-ink-500 text-center">Image preview</p>
    </div>

    <div className="flex flex-col gap-5 min-w-0">
      <FieldGroup title="Vehicle" columns="grid-cols-2">
        <Field label="Spawn code">
          <Input value={vehicle.model} onChange={e => update(changeModel(vehicle, e.target.value.trim().toLowerCase()))} />
        </Field>
        <Field label="Display name" hint="Blank uses the game label">
          <Input value={vehicle.label ?? ''} maxLength={48} placeholder={vehicle.gameLabel} onChange={e => update({ label: e.target.value || undefined })} />
        </Field>
        <Field label="Category">
          <Input list="vehicle-categories" value={vehicle.category} onChange={e => update({ category: e.target.value })} />
        </Field>
        <Field label="Image URL" hint="Blank uses the default image for the spawn code">
          <Input value={vehicle.image} onChange={e => update({ image: e.target.value })} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Pricing" columns="grid-cols-3">
        <Field label="Price per day">
          <Input type="number" min={0} value={vehicle.rentalCost} onChange={e => update({ rentalCost: toNumber(e.target.value) })} />
        </Field>
        <Field label="Price per hour" hint="Blank uses the default hourly rate">
          <Input
            type="number"
            min={0}
            value={vehicle.hourlyCost ?? ''}
            onChange={e => update({ hourlyCost: e.target.value === '' ? null : Number(e.target.value) })}
          />
        </Field>
        <Field label="Fuel on spawn (%)">
          <Input type="number" min={0} max={100} value={vehicle.fuelLevel} onChange={e => update({ fuelLevel: toNumber(e.target.value) })} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Rental limits" columns="grid-cols-4">
        <Field label="Min days">
          <Input type="number" min={1} value={vehicle.minRentalDays} onChange={e => update({ minRentalDays: toNumber(e.target.value) })} />
        </Field>
        <Field label="Max days">
          <Input type="number" min={1} value={vehicle.maxRentalDays} onChange={e => update({ maxRentalDays: toNumber(e.target.value) })} />
        </Field>
        <Field label="Min hours">
          <Input type="number" min={1} value={vehicle.minRentalHours} onChange={e => update({ minRentalHours: toNumber(e.target.value) })} />
        </Field>
        <Field label="Max hours">
          <Input type="number" min={1} value={vehicle.maxRentalHours} onChange={e => update({ maxRentalHours: toNumber(e.target.value) })} />
        </Field>
      </FieldGroup>
    </div>
  </div>
);

export const VehicleList: React.FC<VehicleListProps> = ({ vehicles, onChange }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newModel, setNewModel] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [browsing, setBrowsing] = useState(false);

  const categories = [...new Set(vehicles.map(v => v.category))];
  const needle = query.trim().toLowerCase();
  const visible = vehicles.filter(v =>
    (!category || v.category === category)
    && (!needle || v.model.toLowerCase().includes(needle) || displayName(v).toLowerCase().includes(needle)));

  const update = (key: string, patch: Partial<AdminVehicle>) =>
    onChange(vehicles.map(v => (v.key === key ? { ...v, ...patch } : v)));

  const remove = (key: string) => onChange(vehicles.filter(v => v.key !== key));

  const duplicate = (vehicle: AdminVehicle) => {
    const copy = { ...vehicle, key: nextKey() };
    const index = vehicles.findIndex(v => v.key === vehicle.key);
    onChange([...vehicles.slice(0, index + 1), copy, ...vehicles.slice(index + 1)]);
    setExpanded(copy.key);
  };

  const add = async () => {
    const model = newModel.trim().toLowerCase();
    if (!model) return;
    if (vehicles.some(v => v.model === model)) {
      setError(`"${model}" is already in the fleet.`);
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const info = await adminApi.validateModel(model);
      if (!info.valid) {
        setError(`"${model}" is not a valid vehicle model.`);
        return;
      }
      addVehicle(createVehicle(model, info));
      setNewModel('');
    } finally {
      setAdding(false);
    }
  };

  const addVehicle = (vehicle: AdminVehicle) => {
    onChange([...vehicles, vehicle]);
    setExpanded(vehicle.key);
    setCategory(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {browsing && (
        <VehiclePicker existing={new Set(vehicles.map(v => v.model))} onAdd={addVehicle} onClose={() => setBrowsing(false)} />
      )}

      <datalist id="vehicle-categories">
        {[...new Set([...categories, ...VEHICLE_CATEGORIES])].map(c => <option key={c} value={c} />)}
      </datalist>

      <Card
        icon={Plus}
        title="Add a vehicle"
        description="Pick from the vehicle list, add an addon vehicle with its own name and image, or type a spawn code."
        action={<Button size="sm" icon={LayoutGrid} onClick={() => setBrowsing(true)}>Browse vehicles</Button>}
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <CarFront size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <Input
              className="pl-9"
              placeholder="Spawn code, e.g. sultan"
              value={newModel}
              onChange={e => setNewModel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
            />
          </div>
          <Button icon={Plus} onClick={add} loading={adding} disabled={!newModel.trim()} className="h-9">
            Add vehicle
          </Button>
        </div>
        {error && <p className="text-xs text-red-300 mt-2">{error}</p>}
      </Card>

      <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-ink-900">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <div className="relative w-56">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <Input className="pl-8 h-8 text-xs" placeholder="Filter fleet" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar">
            <Filter size={12} className="text-ink-500 shrink-0" />
            {[null, ...categories].map(c => (
              <button
                key={c ?? 'all'}
                onClick={() => setCategory(c)}
                className={`h-7 px-2.5 shrink-0 rounded-md text-[11px] font-medium transition-colors ${
                  category === c ? 'bg-accent-500/15 text-accent-200' : 'text-ink-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {c ?? 'All'}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-ink-500 shrink-0">{visible.length} of {vehicles.length}</span>
        </div>

        <div className={`${COLUMNS} h-9 px-4 bg-ink-925 border-b border-white/[0.06] text-[11px] font-medium text-ink-500`}>
          <span>Vehicle</span>
          <span>Category</span>
          <span className="text-right">Per day</span>
          <span className="text-right">Per hour</span>
          <span className="text-right">Limits</span>
          <span className="text-right">Fuel</span>
          <span />
        </div>

        {visible.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-2 text-center">
            <CarFront size={22} className="text-ink-600" />
            <p className="text-xs text-ink-500">{vehicles.length === 0 ? 'No vehicles yet. Add one by its spawn code.' : 'No vehicles match this filter.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {visible.map(vehicle => {
              const open = expanded === vehicle.key;
              return (
                <div key={vehicle.key}>
                  <div
                    onClick={() => setExpanded(open ? null : vehicle.key)}
                    className={`${COLUMNS} px-4 py-2 cursor-pointer transition-colors ${open ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-9 shrink-0 rounded-md bg-ink-800 flex items-center justify-center p-1">
                        <VehicleImage src={vehicle.image} alt={vehicle.model} className="max-w-full max-h-full" iconSize={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{displayName(vehicle)}</p>
                        <p className="text-[11px] text-ink-500 font-mono truncate">{vehicle.model}</p>
                      </div>
                    </div>
                    <span className="min-w-0"><Badge>{vehicle.category}</Badge></span>
                    <span className="text-sm text-ink-100 text-right tabular-nums">{formatMoney(vehicle.rentalCost)}</span>
                    <span className="text-sm text-ink-400 text-right tabular-nums">
                      {vehicle.hourlyCost != null ? formatMoney(vehicle.hourlyCost) : 'Default'}
                    </span>
                    <span className="text-[11px] text-ink-400 text-right tabular-nums leading-tight">
                      {vehicle.minRentalDays}-{vehicle.maxRentalDays} days
                      <br />
                      {vehicle.minRentalHours}-{vehicle.maxRentalHours} hours
                    </span>
                    <span className="text-xs text-ink-300 text-right tabular-nums">{Math.round(vehicle.fuelLevel)}%</span>
                    <div className="flex justify-end items-center" onClick={e => e.stopPropagation()}>
                      <IconButton icon={Copy} label="Duplicate" onClick={() => duplicate(vehicle)} />
                      <IconButton icon={Trash2} label="Remove vehicle" tone="danger" onClick={() => remove(vehicle.key)} />
                      <IconButton
                        icon={ChevronDown}
                        label={open ? 'Collapse' : 'Edit'}
                        onClick={() => setExpanded(open ? null : vehicle.key)}
                        className={open ? 'rotate-180' : ''}
                      />
                    </div>
                  </div>
                  {open && <VehicleFields vehicle={vehicle} update={patch => update(vehicle.key, patch)} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
