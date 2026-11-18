import { AdminLocation } from '../../types';
import type { EditorTab } from './LocationEditor';

export interface LocationIssue {
  tab: EditorTab;
  text: string;
}

/** Mirrors the server checks in CleanLocation so problems show before a save is attempted. */
export const getLocationIssues = (location: AdminLocation): LocationIssue[] => {
  const issues: LocationIssue[] = [];
  if (!location.label.trim()) issues.push({ tab: 'details', text: 'Location name is required.' });
  if (!location.ped.model.trim()) issues.push({ tab: 'agent', text: 'Agent ped model is required.' });
  if (!location.ped.coords) issues.push({ tab: 'agent', text: 'Agent position has not been captured.' });
  if (location.spawncoords.length === 0) issues.push({ tab: 'spawns', text: 'Add at least one vehicle spawn point.' });
  if (location.vehicles.length === 0) issues.push({ tab: 'fleet', text: 'Add at least one vehicle to the fleet.' });

  const seen = new Set<string>();
  for (const vehicle of location.vehicles) {
    const model = vehicle.model.trim().toLowerCase();
    if (seen.has(model)) {
      issues.push({ tab: 'fleet', text: `"${model}" is in the fleet more than once.` });
      break;
    }
    seen.add(model);
  }

  return issues;
};

export interface LocationStats {
  vehicles: number;
  spawns: number;
  categories: { name: string; count: number }[];
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
}

export const getLocationStats = (location: AdminLocation): LocationStats => {
  const prices = location.vehicles.map(v => v.rentalCost);
  const counts = new Map<string, number>();
  for (const v of location.vehicles) counts.set(v.category, (counts.get(v.category) ?? 0) + 1);

  return {
    vehicles: location.vehicles.length,
    spawns: location.spawncoords.length,
    categories: [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
    avgPrice: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
  };
};
