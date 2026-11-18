import { AdminLocation, AdminResult, AdminVehicle, Coords } from '../../types';
import { fetchNui } from '../../utils/fetchNui';

export interface ModelInfo {
  valid: boolean;
  label?: string;
  category?: string;
  image?: string;
}

export interface CatalogVehicle {
  model: string;
  label: string;
  category: string;
  image: string;
}

export interface PlacementResult {
  success: boolean;
  points?: Coords[];
  message?: string;
}

export type PlacementKind = 'vehicle' | 'ped';

let imageTemplate = 'https://raw.githubusercontent.com/MericcaN41/gta5carimages/main/images/%s.png';

/** Uses the server's DefaultImageUrl so default images can be recognised and swapped. */
export const setImageTemplate = (template: unknown) => {
  if (typeof template === 'string' && template.includes('%s')) imageTemplate = template;
};

export const imageFor = (model: string) => imageTemplate.replace('%s', model);

const MOCK_CATALOG: CatalogVehicle[] = [
  ['adder', 'Adder', 'Super'], ['asterope', 'Asterope', 'Sedan'], ['bati', 'Bati 801', 'Motorcycle'],
  ['bison', 'Bison', 'Van'], ['buzzard2', 'Buzzard', 'Helicopter'], ['dinghy', 'Dinghy', 'Boat'],
  ['dominator', 'Dominator', 'Muscle'], ['elegy2', 'Elegy RH8', 'Sports'], ['faggio', 'Faggio', 'Motorcycle'],
  ['frogger', 'Frogger', 'Helicopter'], ['jetmax', 'Jetmax', 'Boat'], ['luxor', 'Luxor', 'Plane'],
  ['mammatus', 'Mammatus', 'Plane'], ['panto', 'Panto', 'Compact'], ['sanchez', 'Sanchez', 'Motorcycle'],
  ['seashark', 'Seashark', 'Boat'], ['sultan', 'Sultan', 'Sports'], ['zentorno', 'Zentorno', 'Super'],
].map(([model, label, category]) => ({ model, label, category, image: imageFor(model) }));

let keySeed = 0;
export const nextKey = () => `v${++keySeed}`;

/** Vehicles from the server carry no client key, so give each one before it reaches the editor. */
export const withKeys = (locations: AdminLocation[]): AdminLocation[] =>
  locations.map(location => ({
    ...location,
    vehicles: location.vehicles.map(v => ({ ...v, key: v.key ?? nextKey() })),
  }));

const MOCK_POSITION: Coords = { x: -1246.33, y: -239.75, z: 39.93, w: 293.58 };

export const adminApi = {
  getPosition: () => fetchNui<Coords>('admin:getPosition', undefined, MOCK_POSITION),

  validateModel: (model: string) =>
    fetchNui<ModelInfo>('admin:validateModel', { model }, {
      valid: true,
      label: model.charAt(0).toUpperCase() + model.slice(1),
      category: 'Sports',
      image: imageFor(model),
    }),

  getVehicleCatalog: () => fetchNui<CatalogVehicle[]>('admin:getVehicleCatalog', undefined, MOCK_CATALOG),

  /** Resolves once the player finishes or cancels the placement in game. `limit` caps how many vehicles can be dropped. */
  startPlacement: (kind: PlacementKind, model: string, limit = 1) =>
    fetchNui<PlacementResult>('admin:startPlacement', { kind, model, limit }, {
      success: true,
      points: Array.from({ length: Math.min(limit, 3) }, () => ({ ...MOCK_POSITION, w: Math.random() * 360 })),
    }),

  teleport: (coords: Coords) => fetchNui('admin:teleport', coords, 'ok'),

  save: (location: AdminLocation) =>
    fetchNui<AdminResult>('admin:saveLocation', location, { success: true, id: location.id ?? 'new_location' }),

  remove: (id: string) => fetchNui<AdminResult>('admin:deleteLocation', { id }, { success: true }),
};

export const createVehicle = (model: string, info: Omit<ModelInfo, 'valid'>, label?: string): AdminVehicle => ({
  key: nextKey(),
  model,
  label,
  gameLabel: info.label,
  category: info.category ?? 'Other',
  rentalCost: 300,
  hourlyCost: null,
  minRentalDays: 1,
  maxRentalDays: 7,
  minRentalHours: 1,
  maxRentalHours: 24,
  fuelLevel: 100,
  image: info.image ?? '',
});

export const createLocation = (): AdminLocation => ({
  source: 'custom',
  label: 'New Rental Location',
  blip: { use: true, sprite: 225, color: 3, scale: 0.6, label: '' },
  ped: { model: 's_m_m_highsec_01', coords: null, scenario: 'WORLD_HUMAN_CLIPBOARD' },
  vehicles: [],
  spawncoords: [],
});

export const formatCoords = (c: Coords) => `${c.x.toFixed(1)}, ${c.y.toFixed(1)}, ${c.z.toFixed(1)}  ·  ${Math.round(c.w)}°`;

export const coordsToVector = (c: Coords) => `vector4(${c.x.toFixed(2)}, ${c.y.toFixed(2)}, ${c.z.toFixed(2)}, ${c.w.toFixed(2)})`;

/** navigator.clipboard is blocked in the game's browser, so copy through a hidden textarea. */
export const copyText = (text: string) => {
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  document.body.removeChild(area);
};
