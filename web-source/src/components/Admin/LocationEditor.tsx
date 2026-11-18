import React, { useState } from 'react';
import { Check, Copy, Crosshair, Flag, MapPin, Navigation, Plus, ScanLine, Tag, Trash2, UserRound } from 'lucide-react';
import { AdminLocation, Coords } from '../../types';
import { Button, Card, Field, IconButton, Input, Switch } from '../ui';
import { adminApi, coordsToVector, copyText, PlacementKind } from './adminApi';
import { LocationOverview } from './LocationOverview';
import { BLIP_COLORS, BLIP_SPRITES, PED_MODELS, PED_SCENARIOS, SPAWN_PREVIEWS } from './presets';
import { VehicleList } from './VehicleList';

export type EditorTab = 'overview' | 'details' | 'agent' | 'spawns' | 'fleet';

export interface SectionProps {
  location: AdminLocation;
  onChange: (location: AdminLocation) => void;
}

const COORD_AXES = ['x', 'y', 'z', 'w'] as const;
const MAX_SPAWN_POINTS = 20;

const CopyButton: React.FC<{ coords: Coords }> = ({ coords }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    copyText(coordsToVector(coords));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return <IconButton icon={copied ? Check : Copy} label={copied ? 'Copied' : 'Copy as vector4'} onClick={copy} />;
};

/** Runs the in-game placement and hands back every confirmed point. */
const usePlacement = () => {
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const place = async (kind: PlacementKind, model: string, limit = 1): Promise<Coords[]> => {
    setPlacing(true);
    setError(null);
    try {
      const result = await adminApi.startPlacement(kind, model, limit);
      if (result.message) setError(result.message);
      return result.success ? result.points ?? [] : [];
    } finally {
      setPlacing(false);
    }
  };

  return { placing, error, place };
};

export const CoordsRow: React.FC<{ label: string; coords: Coords; onRemove?: () => void }> = ({ label, coords, onRemove }) => (
  <div className="flex items-center gap-3 h-12 pl-3 pr-1.5 rounded-lg bg-ink-950 border border-white/[0.06]">
    <span className="w-7 h-7 shrink-0 rounded-md bg-accent-500/10 text-accent-300 flex items-center justify-center">
      <MapPin size={13} />
    </span>
    <span className="text-xs font-medium text-ink-200 w-20 shrink-0 truncate">{label}</span>
    <div className="flex-1 grid grid-cols-4 gap-3 min-w-0">
      {COORD_AXES.map(axis => (
        <span key={axis} className="text-xs font-mono text-ink-100 truncate">
          <span className="text-ink-500 mr-1.5">{axis === 'w' ? 'H' : axis.toUpperCase()}</span>
          {axis === 'w' ? `${Math.round(coords.w)}°` : coords[axis].toFixed(2)}
        </span>
      ))}
    </div>
    <CopyButton coords={coords} />
    <IconButton icon={Navigation} label="Teleport here" onClick={() => adminApi.teleport(coords)} />
    {onRemove && <IconButton icon={Trash2} label="Remove" tone="danger" onClick={onRemove} />}
  </div>
);

export const EmptyHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="h-12 px-3 flex items-center rounded-lg border border-dashed border-amber-400/25 bg-amber-500/[0.04] text-xs text-amber-200/90">
    {children}
  </div>
);

const Suggestions: React.FC<{ id: string; values: string[] }> = ({ id, values }) => (
  <datalist id={id}>
    {values.map(value => <option key={value} value={value} />)}
  </datalist>
);

export const DetailsSection: React.FC<SectionProps> = ({ location, onChange }) => {
  const setBlip = (patch: Partial<AdminLocation['blip']>) => onChange({ ...location, blip: { ...location.blip, ...patch } });

  return (
    <div className="flex flex-col gap-4">
      <Card icon={Tag} title="Location" description="The name players see in the rental menu, receipts and the phone app.">
        <Field label="Location name">
          <Input value={location.label} onChange={e => onChange({ ...location, label: e.target.value })} maxLength={48} placeholder="e.g. Downtown Rentals" />
        </Field>
      </Card>

      <Card
        icon={Flag}
        title="Map blip"
        description="How the location is marked on the map. Sprite and colour use GTA blip ids."
        action={<Switch checked={location.blip.use} onChange={use => setBlip({ use })} label="Show on map" />}
      >
        {location.blip.use ? (
          <div className="flex flex-col gap-4">
            <Field label="Blip label" hint="Leave blank to use the location name">
              <Input value={location.blip.label} onChange={e => setBlip({ label: e.target.value })} maxLength={48} placeholder={location.label} />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Sprite id">
                <Input type="number" value={location.blip.sprite} onChange={e => setBlip({ sprite: Number(e.target.value) })} />
              </Field>
              <Field label="Colour id">
                <Input type="number" value={location.blip.color} onChange={e => setBlip({ color: Number(e.target.value) })} />
              </Field>
              <Field label="Scale">
                <Input type="number" step={0.1} value={location.blip.scale} onChange={e => setBlip({ scale: Number(e.target.value) })} />
              </Field>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-medium text-ink-400">Common sprites</span>
              <div className="flex flex-wrap gap-1.5">
                {BLIP_SPRITES.map(sprite => (
                  <button
                    key={sprite.id}
                    onClick={() => setBlip({ sprite: sprite.id })}
                    className={`h-7 px-2.5 rounded-md border text-[11px] font-medium transition-colors ${
                      location.blip.sprite === sprite.id
                        ? 'border-accent-400/50 bg-accent-500/10 text-accent-200'
                        : 'border-white/[0.08] text-ink-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {sprite.name} <span className="text-ink-500 ml-1">{sprite.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-medium text-ink-400">Common colours</span>
              <div className="flex flex-wrap gap-1.5">
                {BLIP_COLORS.map(color => (
                  <button
                    key={color.id}
                    title={`${color.name} (${color.id})`}
                    onClick={() => setBlip({ color: color.id })}
                    className={`w-7 h-7 rounded-md border-2 transition-transform hover:scale-110 ${
                      location.blip.color === color.id ? 'border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-ink-500">This location is hidden from the map. Players can still find it in the phone app.</p>
        )}
      </Card>
    </div>
  );
};

export const AgentSection: React.FC<SectionProps> = ({ location, onChange }) => {
  const setPed = (patch: Partial<AdminLocation['ped']>) => onChange({ ...location, ped: { ...location.ped, ...patch } });
  const capturePosition = async () => setPed({ coords: await adminApi.getPosition() });
  const { placing, error, place } = usePlacement();
  const placeWithLaser = async () => {
    const [coords] = await place('ped', location.ped.model);
    if (coords) setPed({ coords });
  };

  return (
    <Card
      icon={UserRound}
      title="Rental agent"
      description="The ped players talk to. Aim where it should stand, or stand there yourself and capture your position."
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ped model">
            <Input list="ped-models" value={location.ped.model} onChange={e => setPed({ model: e.target.value.trim() })} placeholder="s_m_m_highsec_01" />
          </Field>
          <Field label="Scenario" hint="Optional animation the agent plays">
            <Input list="ped-scenarios" value={location.ped.scenario} onChange={e => setPed({ scenario: e.target.value.trim() })} placeholder="WORLD_HUMAN_CLIPBOARD" />
          </Field>
        </div>
        <Suggestions id="ped-models" values={PED_MODELS} />
        <Suggestions id="ped-scenarios" values={PED_SCENARIOS} />

        {location.ped.coords ? (
          <CoordsRow label="Position" coords={location.ped.coords} />
        ) : (
          <EmptyHint>No position captured yet. Walk to the spot and capture it.</EmptyHint>
        )}
        <div className="flex gap-2">
          <Button size="sm" icon={ScanLine} onClick={placeWithLaser} loading={placing} disabled={!location.ped.model}>
            Place with laser
          </Button>
          <Button size="sm" variant="secondary" icon={Crosshair} onClick={capturePosition}>
            {location.ped.coords ? 'Recapture my position' : 'Use my position'}
          </Button>
        </div>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>
    </Card>
  );
};

export const SpawnSection: React.FC<SectionProps> = ({ location, onChange }) => {
  const [previewModel, setPreviewModel] = useState(SPAWN_PREVIEWS[0].model);
  const { placing, error, place } = usePlacement();
  const full = location.spawncoords.length >= MAX_SPAWN_POINTS;
  const fleetModels = [...new Set(location.vehicles.map(v => v.model))];

  const setSpawns = (spawncoords: Coords[]) => onChange({ ...location, spawncoords });
  const addPosition = async () => setSpawns([...location.spawncoords, await adminApi.getPosition()]);
  const addWithLaser = async () => {
    const points = await place('vehicle', previewModel.trim().toLowerCase(), MAX_SPAWN_POINTS - location.spawncoords.length);
    if (points.length) setSpawns([...location.spawncoords, ...points]);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card
        icon={ScanLine}
        title="Place with laser"
        description="A see-through vehicle follows where you aim, on land or water. Click to drop as many as you need, Enter to finish, Backspace undoes the last one. Scroll rotates, C copies the coords."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium text-ink-400">Vehicle type</span>
            <div className="flex flex-wrap gap-1.5">
              {SPAWN_PREVIEWS.map(preview => (
                <button
                  key={preview.id}
                  onClick={() => setPreviewModel(preview.model)}
                  className={`h-7 px-2.5 rounded-md border text-[11px] font-medium transition-colors ${
                    previewModel === preview.model
                      ? 'border-accent-400/50 bg-accent-500/10 text-accent-200'
                      : 'border-white/[0.08] text-ink-300 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {preview.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 items-end">
            <Field label="Preview model" hint="Any spawn code, or one from this fleet" className="flex-1">
              <Input list="spawn-preview-models" value={previewModel} onChange={e => setPreviewModel(e.target.value)} placeholder="sultan" />
            </Field>
            <Suggestions id="spawn-preview-models" values={fleetModels} />
            <Button icon={ScanLine} onClick={addWithLaser} loading={placing} disabled={full || !previewModel.trim()} className="h-9">
              Place with laser
            </Button>
          </div>
          {error && <p className="text-xs text-red-300">{error}</p>}
        </div>
      </Card>

      <Card
        icon={MapPin}
        title="Vehicle spawn points"
        description="Rented vehicles appear at the first free point. Sit in a vehicle while adding your position to capture its exact heading."
        action={<Button size="sm" variant="secondary" icon={Plus} onClick={addPosition} disabled={full}>Add my position</Button>}
      >
        <div className="flex flex-col gap-2">
          {location.spawncoords.length === 0 && <EmptyHint>Add at least one spawn point before saving.</EmptyHint>}
          {location.spawncoords.map((coords, i) => (
            <CoordsRow
              key={`${coords.x}:${coords.y}:${coords.z}:${i}`}
              label={`Point ${i + 1}`}
              coords={coords}
              onRemove={() => setSpawns(location.spawncoords.filter((_, j) => j !== i))}
            />
          ))}
          {location.spawncoords.length > 0 && (
            <p className="text-[11px] text-ink-500 mt-1">
              {location.spawncoords.length} of {MAX_SPAWN_POINTS} points used. More points let more players rent at the same time.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

interface LocationEditorProps extends SectionProps {
  tab: EditorTab;
  onNavigate: (tab: EditorTab) => void;
}

export const LocationEditor: React.FC<LocationEditorProps> = ({ tab, location, onChange, onNavigate }) => {
  switch (tab) {
    case 'overview':
      return <LocationOverview location={location} onNavigate={onNavigate} />;
    case 'details':
      return <DetailsSection location={location} onChange={onChange} />;
    case 'agent':
      return <AgentSection location={location} onChange={onChange} />;
    case 'spawns':
      return <SpawnSection location={location} onChange={onChange} />;
    case 'fleet':
      return <VehicleList vehicles={location.vehicles} onChange={vehicles => onChange({ ...location, vehicles })} />;
  }
};
