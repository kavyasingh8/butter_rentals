export interface Vehicle {
  id: string;
  name: string;
  category: string;
  pricePerDay: number;
  pricePerHour?: number;
  image?: string;
  seats: number;
  minRentalDays: number;
  maxRentalDays: number;
  minRentalHours?: number;
  maxRentalHours?: number;
  fuelLevel?: number;
}

export enum RentalStep {
  BROWSE = 'BROWSE',
  CHECKOUT = 'CHECKOUT',
  CONFIRMATION = 'CONFIRMATION'
}

export type RentalUnit = 'days' | 'hours';
export type PaymentMethod = 'cash' | 'bank';

export interface RentalState {
  step: RentalStep;
  selectedVehicle: Vehicle | null;
  rentalType: RentalUnit;
  duration: number;
  paymentMethod: PaymentMethod | null;
}

export interface ReceiptData {
  transactionId: string;
  date: string;
  time: string;
  vehicleName: string;
  vehicleClass: string;
  plate: string;
  ownerName: string;
  rentalType?: RentalUnit;
  duration?: number;
  days: number;
  hours?: number;
  dailyRate: number;
  rentalRate?: number;
  serviceFee: number;
  total: number;
  paymentMethod: string;
  locationLabel?: string;
}

export interface Coords {
  x: number;
  y: number;
  z: number;
  w: number;
}

export type LocationSource = 'config' | 'custom' | 'override';

export interface AdminVehicle {
  /** Client-only key so list rows stay stable while editing. */
  key: string;
  model: string;
  /** Custom display name. Blank falls back to the game label. */
  label?: string;
  /** Game display name, filled in by the client for display only. */
  gameLabel?: string;
  category: string;
  rentalCost: number;
  hourlyCost?: number | null;
  minRentalDays: number;
  maxRentalDays: number;
  minRentalHours: number;
  maxRentalHours: number;
  fuelLevel: number;
  image: string;
}

export interface AdminLocation {
  id?: string;
  source: LocationSource;
  label: string;
  blip: {
    use: boolean;
    sprite: number;
    color: number;
    scale: number;
    label: string;
  };
  ped: {
    model: string;
    coords: Coords | null;
    scenario: string;
  };
  vehicles: AdminVehicle[];
  spawncoords: Coords[];
}

export interface AdminResult {
  success: boolean;
  message?: string;
  id?: string;
  locations?: AdminLocation[];
}
