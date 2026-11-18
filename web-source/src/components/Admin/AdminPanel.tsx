import React, { useState } from 'react';
import { CarFront, MapPin, MapPinned, Navigation, Plus, RotateCcw, Save, Search, Trash2, Undo2, X } from 'lucide-react';
import { AdminLocation, AdminResult, LocationSource } from '../../types';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { formatMoney } from '../../utils/format';
import { Badge, BadgeTone, Button, ConfirmDialog, IconButton, Input, Tabs } from '../ui';
import { adminApi, withKeys } from './adminApi';
import { LocationCreator } from './LocationCreator';
import { EditorTab, LocationEditor } from './LocationEditor';
import { getLocationIssues, getLocationStats } from './locationInfo';

interface AdminPanelProps {
  initialLocations: AdminLocation[];
  onClose: () => void;
}

type Notice = { tone: 'success' | 'error'; text: string } | null;
type SourceFilter = LocationSource | 'all';

interface PendingConfirm {
  title: string;
  description?: string;
  confirmLabel: string;
  onConfirm: () => void;
}

const SOURCE_BADGE: Record<LocationSource, { label: string; tone: BadgeTone }> = {
  config: { label: 'Config', tone: 'neutral' },
  custom: { label: 'Custom', tone: 'accent' },
  override: { label: 'Edited', tone: 'warning' },
};

const FILTERS: { value: SourceFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'config', label: 'Config' },
  { value: 'custom', label: 'Custom' },
  { value: 'override', label: 'Edited' },
];

/** Used when the response has no list, e.g. in the browser preview, so the saved draft still shows. */
const upsert = (locations: AdminLocation[], location: AdminLocation) =>
  locations.some(l => l.id === location.id)
    ? locations.map(l => (l.id === location.id ? location : l))
    : [...locations, location];

const HeaderStat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex flex-col items-end">
    <span className="text-sm font-semibold text-white tabular-nums">{value}</span>
    <span className="text-[10px] text-ink-500 uppercase tracking-wider">{label}</span>
  </div>
);

const LocationListItem: React.FC<{ location: AdminLocation; active: boolean; onSelect: () => void }> = ({ location, active, onSelect }) => {
  const stats = getLocationStats(location);
  const ready = getLocationIssues(location).length === 0;
  const badge = SOURCE_BADGE[location.source];

  return (
    <button
      onClick={onSelect}
      className={`relative flex flex-col gap-2 px-3 py-2.5 rounded-lg text-left border transition-colors ${
        active ? 'bg-white/[0.05] border-white/[0.08]' : 'border-transparent hover:bg-white/[0.03]'
      }`}
    >
      {active && <span className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-accent-400" />}
      <div className="flex items-center gap-2.5">
        <span className={`w-8 h-8 shrink-0 rounded-md flex items-center justify-center ${active ? 'bg-accent-500/15 text-accent-300' : 'bg-white/[0.04] text-ink-400'}`}>
          <MapPin size={14} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{location.label}</p>
          <p className="text-[11px] text-ink-500 truncate">
            {stats.vehicles ? `From ${formatMoney(stats.minPrice)} / day` : 'No vehicles'}
          </p>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>
      <div className="flex items-center gap-3 pl-[42px] text-[11px] text-ink-400">
        <span className="inline-flex items-center gap-1"><CarFront size={11} /> {stats.vehicles}</span>
        <span className="inline-flex items-center gap-1"><MapPin size={11} /> {stats.spawns}</span>
        <span className={`ml-auto inline-flex items-center gap-1.5 ${ready ? 'text-emerald-300/80' : 'text-amber-300'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${ready ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {ready ? 'Ready' : 'Incomplete'}
        </span>
      </div>
    </button>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ initialLocations, onClose }) => {
  const [initial] = useState(() => withKeys(initialLocations));
  const [locations, setLocations] = useState(initial);
  const [selectedKey, setSelectedKey] = useState<string | null>(initial[0]?.id ?? null);
  const [draft, setDraft] = useState<AdminLocation | null>(initial[0] ?? null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [tab, setTab] = useState<EditorTab>('overview');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SourceFilter>('all');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const saved = locations.find(l => l.id === selectedKey) ?? null;
  const isDirty = !!draft && JSON.stringify(draft) !== JSON.stringify(saved);
  const issues = draft ? getLocationIssues(draft) : [];
  const needle = search.trim().toLowerCase();
  const visibleLocations = locations.filter(l =>
    (filter === 'all' || l.source === filter) && l.label.toLowerCase().includes(needle));
  const totalVehicles = locations.reduce((sum, l) => sum + l.vehicles.length, 0);
  const customCount = locations.filter(l => l.source !== 'config').length;

  const guardUnsaved = (action: () => void) => {
    if (!isDirty) return action();
    setPending({ title: 'Discard your unsaved changes?', confirmLabel: 'Discard', onConfirm: action });
  };

  useEscapeKey(() => guardUnsaved(onClose));

  const select = (location: AdminLocation) =>
    guardUnsaved(() => {
      setSelectedKey(location.id ?? null);
      setDraft(location);
      setNotice(null);
      setTab('overview');
    });

  const startCreating = () =>
    guardUnsaved(() => {
      setDraft(saved);
      setCreateError(null);
      setCreating(true);
    });

  /** Returns the error text when the request failed. */
  const applyResult = (result: AdminResult, successText: string, nextId?: string, fallback?: AdminLocation) => {
    if (!result.success) return result.message ?? 'Something went wrong.';
    const next = result.locations ? withKeys(result.locations) : fallback ? upsert(locations, fallback) : locations;
    const selected = next.find(l => l.id === nextId) ?? null;
    setLocations(next);
    setSelectedKey(selected?.id ?? null);
    setDraft(selected);
    setNotice({ tone: 'success', text: successText });
    return null;
  };

  const persist = async (location: AdminLocation, successText: string) => {
    setSaving(true);
    try {
      const result = await adminApi.save(location);
      return applyResult(result, successText, result.id, result.id ? { ...location, id: result.id } : undefined);
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!draft) return;
    const error = await persist(draft, 'Location saved and synced to all players.');
    if (error) setNotice({ tone: 'error', text: error });
  };

  const create = async (location: AdminLocation) => {
    setCreateError(null);
    const error = await persist(location, `"${location.label}" created and synced to all players.`);
    if (error) return setCreateError(error);
    setCreating(false);
    setTab('overview');
  };

  const remove = async (location: AdminLocation & { id: string }) => {
    const reverting = location.source === 'override';
    setSaving(true);
    try {
      const result = await adminApi.remove(location.id);
      const error = applyResult(result, reverting ? 'Location reverted to config.' : 'Location deleted.', reverting ? location.id : undefined);
      if (error) setNotice({ tone: 'error', text: error });
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = () => {
    if (!draft?.id) return;
    const location = { ...draft, id: draft.id };
    const reverting = location.source === 'override';
    setPending({
      title: reverting ? 'Revert this location to its config values?' : `Delete "${location.label}"?`,
      description: reverting ? 'Your saved edits will be removed.' : 'Players will no longer be able to rent here.',
      confirmLabel: reverting ? 'Revert' : 'Delete',
      onConfirm: () => remove(location),
    });
  };

  const status = notice
    ? { text: notice.text, className: notice.tone === 'error' ? 'text-red-300' : 'text-emerald-300' }
    : isDirty
      ? { text: 'You have unsaved changes', className: 'text-amber-300' }
      : draft?.source === 'config'
        ? { text: 'From the config file. Saving creates an editable copy.', className: 'text-ink-500' }
        : { text: 'All changes saved', className: 'text-ink-500' };

  return (
    <div className="relative w-full max-w-[1320px] h-[min(840px,92vh)] flex flex-col rounded-2xl border border-white/[0.08] bg-ink-900 shadow-panel overflow-hidden animate-fade-in-up">
      <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-white/[0.06] bg-ink-925">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-500/10 border border-accent-400/20 flex items-center justify-center text-accent-300">
            <MapPinned size={16} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Rental Manager</h1>
            <p className="text-[11px] text-ink-500">Create and manage rental locations, agents and fleets</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <HeaderStat label="Locations" value={locations.length} />
          <HeaderStat label="Vehicles" value={totalVehicles} />
          <HeaderStat label="Custom" value={customCount} />
          <span className="w-px h-8 bg-white/[0.06]" />
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-[300px_1fr]">
        <aside className="min-h-0 flex flex-col border-r border-white/[0.06] bg-ink-925">
          <div className="p-3 flex flex-col gap-2 border-b border-white/[0.06]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
              <Input className="pl-9" placeholder="Search locations" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex p-0.5 rounded-lg bg-ink-950 border border-white/[0.06]">
              {FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`flex-1 h-7 rounded-md text-[11px] font-semibold transition-colors ${
                    filter === f.value ? 'bg-ink-750 text-white' : 'text-ink-400 hover:text-ink-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <nav className="flex-1 min-h-0 overflow-y-auto custom-scroll p-2 flex flex-col gap-1">
            {visibleLocations.map(location => (
              <LocationListItem
                key={location.id}
                location={location}
                active={location.id === selectedKey}
                onSelect={() => location.id !== selectedKey && select(location)}
              />
            ))}
            {visibleLocations.length === 0 && <p className="text-xs text-ink-500 text-center py-8">No matching locations</p>}
          </nav>

          <div className="p-3 border-t border-white/[0.06]">
            <Button icon={Plus} className="w-full" onClick={startCreating}>Create location</Button>
          </div>
        </aside>

        <main className="min-h-0 flex flex-col">
          {draft ? (
            <>
              <div className="shrink-0 px-8 pt-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-semibold text-white truncate">{draft.label || 'Untitled location'}</h2>
                      <Badge tone={SOURCE_BADGE[draft.source].tone}>{SOURCE_BADGE[draft.source].label}</Badge>
                      {issues.length > 0 && <Badge tone="warning">{issues.length} to fix</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs">
                      {draft.id && <span className="font-mono text-ink-500">{draft.id}</span>}
                      {draft.id && <span className="w-0.5 h-0.5 rounded-full bg-ink-600" />}
                      <span className={`truncate ${status.className}`}>{status.text}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {draft.ped.coords && (
                      <IconButton icon={Navigation} label="Teleport to agent" onClick={() => draft.ped.coords && adminApi.teleport(draft.ped.coords)} />
                    )}
                    {draft.id && draft.source !== 'config' && (
                      <Button
                        variant="ghost"
                        icon={draft.source === 'override' ? RotateCcw : Trash2}
                        onClick={confirmRemove}
                        disabled={saving}
                      >
                        {draft.source === 'override' ? 'Revert' : 'Delete'}
                      </Button>
                    )}
                    {isDirty && (
                      <Button variant="secondary" icon={Undo2} onClick={() => setDraft(saved)} disabled={saving}>
                        Discard
                      </Button>
                    )}
                    <Button icon={Save} onClick={save} loading={saving} disabled={!isDirty || issues.length > 0}>
                      Save changes
                    </Button>
                  </div>
                </div>

                <div className="mt-5">
                  <Tabs
                    value={tab}
                    onChange={setTab}
                    tabs={[
                      { value: 'overview', label: 'Overview' },
                      { value: 'details', label: 'Details' },
                      { value: 'agent', label: 'Agent' },
                      { value: 'spawns', label: 'Spawn points', count: draft.spawncoords.length },
                      { value: 'fleet', label: 'Fleet', count: draft.vehicles.length },
                    ]}
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto custom-scroll px-8 py-6">
                <LocationEditor tab={tab} location={draft} onChange={setDraft} onNavigate={setTab} />
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-ink-500 mb-1">
                <MapPinned size={20} />
              </div>
              <p className="text-sm font-semibold text-ink-200">No location selected</p>
              <p className="text-xs text-ink-500">Pick a location on the left or create a new one.</p>
              <Button icon={Plus} size="sm" className="mt-3" onClick={startCreating}>Create location</Button>
            </div>
          )}
        </main>
      </div>

      {creating && (
        <LocationCreator saving={saving} error={createError} onCreate={create} onCancel={() => setCreating(false)} />
      )}

      {pending && (
        <ConfirmDialog
          {...pending}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            setPending(null);
            pending.onConfirm();
          }}
        />
      )}
    </div>
  );
};
