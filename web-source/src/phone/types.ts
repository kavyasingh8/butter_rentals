import { PaymentMethod, RentalUnit } from '../types';
import { Theme } from '../utils/theme';

export interface PhoneVehicle {
  name: string;
  category: string;
  pricePerDay: number;
  pricePerHour: number;
  image?: string;
  seats: number;
}

export interface PhoneLocation {
  id: string;
  label: string;
  categories: string[];
  vehicles: PhoneVehicle[];
}

export interface PhoneRental {
  plate: string;
  vehicleName: string;
  unit: RentalUnit;
  duration: number;
  /** Seconds left when the data was fetched. */
  remaining: number;
  price: number;
  canExtend: boolean;
  image?: string;
  category?: string;
  locationLabel?: string;
  rate?: number;
  maxExtend?: number;
}

export interface PhoneData {
  locations: PhoneLocation[];
  rentals: PhoneRental[];
  extendPaymentMethod: PaymentMethod;
  theme?: Partial<Theme>;
  /** UI strings for the player's language. */
  locale?: Record<string, string>;
}

export interface ActionResult {
  success: boolean;
  message?: string;
  rentals?: PhoneRental[];
}
