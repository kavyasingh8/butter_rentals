import { RentalUnit, Vehicle } from '../types';

export const getRentalRate = (vehicle: Vehicle, unit: RentalUnit) =>
  unit === 'days' ? vehicle.pricePerDay : (vehicle.pricePerHour ?? Math.ceil(vehicle.pricePerDay * 0.15));

export const getDurationBounds = (vehicle: Vehicle, unit: RentalUnit) =>
  unit === 'days'
    ? { min: vehicle.minRentalDays || 1, max: vehicle.maxRentalDays || 30 }
    : { min: vehicle.minRentalHours || 1, max: vehicle.maxRentalHours || 24 };
