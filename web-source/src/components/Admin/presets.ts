/** Approximate swatches for common GTA blip colour ids, used for the picker preview. */
export const BLIP_COLORS: { id: number; name: string; hex: string }[] = [
  { id: 0, name: 'White', hex: '#f0f0f0' },
  { id: 1, name: 'Red', hex: '#e03232' },
  { id: 2, name: 'Green', hex: '#71cb71' },
  { id: 3, name: 'Blue', hex: '#5db6e5' },
  { id: 5, name: 'Yellow', hex: '#eec64e' },
  { id: 7, name: 'Purple', hex: '#9c6eaf' },
  { id: 8, name: 'Pink', hex: '#fe7ac3' },
  { id: 17, name: 'Orange', hex: '#f4a557' },
  { id: 22, name: 'Grey', hex: '#a8a8a8' },
  { id: 25, name: 'Dark green', hex: '#3d7a46' },
  { id: 38, name: 'Dark blue', hex: '#2c5aa0' },
  { id: 46, name: 'Gold', hex: '#e8c55a' },
];

export const BLIP_SPRITES: { id: number; name: string }[] = [
  { id: 225, name: 'Car' },
  { id: 523, name: 'Sports car' },
  { id: 226, name: 'Motorbike' },
  { id: 198, name: 'Taxi' },
  { id: 357, name: 'Garage' },
  { id: 410, name: 'Boat' },
  { id: 64, name: 'Helicopter' },
];

export const PED_MODELS = [
  's_m_m_highsec_01',
  's_m_y_valet_01',
  's_m_m_autoshop_01',
  'a_m_y_business_01',
  'a_f_y_business_02',
  'cs_carbuyer',
];

export const PED_SCENARIOS = [
  'WORLD_HUMAN_CLIPBOARD',
  'WORLD_HUMAN_STAND_IMPATIENT',
  'WORLD_HUMAN_STAND_MOBILE',
  'WORLD_HUMAN_AA_COFFEE',
  'WORLD_HUMAN_GUARD_STAND',
  'WORLD_HUMAN_SMOKING',
];

export const VEHICLE_CATEGORIES = [
  'Compact', 'Sedan', 'SUV', 'Coupe', 'Muscle', 'Sports Classic', 'Sports', 'Super', 'Motorcycle',
  'Off-road', 'Van', 'Cycle', 'Boat', 'Helicopter', 'Plane',
];

/** Stand-in vehicles shown by the laser when placing a spawn point, by vehicle type. */
export const SPAWN_PREVIEWS: { id: string; label: string; model: string }[] = [
  { id: 'car', label: 'Car', model: 'sultan' },
  { id: 'bike', label: 'Bike', model: 'bati' },
  { id: 'boat', label: 'Boat', model: 'dinghy' },
  { id: 'heli', label: 'Helicopter', model: 'frogger' },
  { id: 'plane', label: 'Plane', model: 'luxor' },
];

export const blipHex =(id: number) => BLIP_COLORS.find(c => c.id === id)?.hex;
