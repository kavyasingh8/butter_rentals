import React from 'react';
import { AlertTriangle, ArrowRight, CarFront, CheckCircle2, DollarSign, Flag, Layers, MapPin, Navigation, UserRound } from 'lucide-react';
import { AdminLocation } from '../../types';
import { formatMoney } from '../../utils/format';
import { Button, Card, StatTile, VehicleImage } from '../ui';
import { adminApi } from './adminApi';
import type { EditorTab } from './LocationEditor';
import { getLocationIssues, getLocationStats } from './locationInfo';
import { blipHex } from './presets';

interface LocationOverviewProps {
  location: AdminLocation;
  onNavigate: (tab: EditorTab) => void;
}

const FLEET_PREVIEW = 6;

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.04] last:border-b-0">
    <span className="text-xs text-ink-400">{label}</span>
    <span className="text-xs text-ink-100 font-medium truncate text-right">{children}</span>
  </div>
);

const Readiness: React.FC<LocationOverviewProps> = ({ location, onNavigate }) => {
  const issues = getLocationIssues(location);

  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-4 py-3">
        <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
        <p className="text-xs text-emerald-200">Ready to go. Everything this location needs is set up.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.05] px-4 py-3">
      <div className="flex items-center gap-2 text-amber-200">
        <AlertTriangle size={14} />
        <p className="text-xs font-semibold">{issues.length} thing{issues.length === 1 ? '' : 's'} to fix before saving</p>
      </div>
      <ul className="mt-2 flex flex-col gap-1">
        {issues.map(issue => (
          <li key={issue.text}>
            <button
              onClick={() => onNavigate(issue.tab)}
              className="group flex items-center gap-2 text-xs text-amber-100/80 hover:text-white"
            >
              <span className="w-1 h-1 rounded-full bg-amber-300" />
              {issue.text}
              <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const LocationOverview: React.FC<LocationOverviewProps> = ({ location, onNavigate }) => {
  const stats = getLocationStats(location);
  const swatch = blipHex(location.blip.color);
  const priceRange = stats.vehicles
    ? stats.minPrice === stats.maxPrice ? formatMoney(stats.minPrice) : `${formatMoney(stats.minPrice)} - ${formatMoney(stats.maxPrice)}`
    : '-';

  return (
    <div className="flex flex-col gap-4">
      <Readiness location={location} onNavigate={onNavigate} />

      <div className="grid grid-cols-4 gap-3">
        <StatTile icon={CarFront} label="Vehicles" value={stats.vehicles} hint="In the fleet" />
        <StatTile icon={Layers} label="Categories" value={stats.categories.length} hint="Shown as menu tabs" />
        <StatTile icon={MapPin} label="Spawn points" value={stats.spawns} hint="Concurrent rentals" />
        <StatTile icon={DollarSign} label="Daily price" value={priceRange} hint={stats.vehicles ? `Avg ${formatMoney(stats.avgPrice)} / day` : 'No vehicles yet'} />
      </div>

      <div className="grid grid-cols-[1.3fr_1fr] gap-4">
        <Card
          icon={CarFront}
          title="Fleet"
          description="A preview of the vehicles players can rent here."
          action={<Button size="sm" variant="ghost" onClick={() => onNavigate('fleet')}>Manage</Button>}
        >
          {stats.vehicles === 0 ? (
            <p className="text-xs text-ink-500 py-4 text-center">No vehicles yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {location.vehicles.slice(0, FLEET_PREVIEW).map(vehicle => (
                <div key={vehicle.key} className="rounded-lg bg-ink-950 border border-white/[0.05] p-2">
                  <div className="h-14 flex items-center justify-center">
                    <VehicleImage src={vehicle.image} alt={vehicle.model} className="max-w-full max-h-full" iconSize={18} />
                  </div>
                  <p className="text-xs font-medium text-white truncate mt-1">{vehicle.label ?? vehicle.gameLabel ?? vehicle.model}</p>
                  <p className="text-[11px] text-ink-400 tabular-nums">{formatMoney(vehicle.rentalCost)} / day</p>
                </div>
              ))}
            </div>
          )}
          {stats.vehicles > FLEET_PREVIEW && (
            <p className="text-[11px] text-ink-500 mt-2">+{stats.vehicles - FLEET_PREVIEW} more</p>
          )}
        </Card>

        <Card icon={Layers} title="Categories" description="How the fleet is split in the menu.">
          {stats.categories.length === 0 ? (
            <p className="text-xs text-ink-500 py-4 text-center">No categories yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {stats.categories.map(category => (
                <div key={category.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-ink-200">{category.name}</span>
                    <span className="text-ink-500 tabular-nums">{category.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-ink-800 overflow-hidden">
                    <div className="h-full rounded-full bg-accent-500" style={{ width: `${(category.count / stats.vehicles) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card
          icon={UserRound}
          title="Rental agent"
          action={location.ped.coords && (
            <Button size="sm" variant="ghost" icon={Navigation} onClick={() => location.ped.coords && adminApi.teleport(location.ped.coords)}>
              Go to
            </Button>
          )}
        >
          <InfoRow label="Ped model"><span className="font-mono">{location.ped.model || '-'}</span></InfoRow>
          <InfoRow label="Scenario"><span className="font-mono">{location.ped.scenario || 'None'}</span></InfoRow>
          <InfoRow label="Position">
            <span className="font-mono">
              {location.ped.coords
                ? `${location.ped.coords.x.toFixed(1)}, ${location.ped.coords.y.toFixed(1)}, ${location.ped.coords.z.toFixed(1)}`
                : 'Not captured'}
            </span>
          </InfoRow>
          <InfoRow label="Heading">{location.ped.coords ? `${Math.round(location.ped.coords.w)}°` : '-'}</InfoRow>
        </Card>

        <Card icon={Flag} title="Map blip">
          <InfoRow label="Visibility">{location.blip.use ? 'Shown on map' : 'Hidden'}</InfoRow>
          <InfoRow label="Label">{location.blip.label || location.label}</InfoRow>
          <InfoRow label="Sprite">{location.blip.sprite}</InfoRow>
          <InfoRow label="Colour">
            <span className="inline-flex items-center gap-2">
              {swatch && <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: swatch }} />}
              {location.blip.color}
            </span>
          </InfoRow>
          <InfoRow label="Scale">{location.blip.scale}</InfoRow>
        </Card>
      </div>
    </div>
  );
};
