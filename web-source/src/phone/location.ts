import { PhoneLocation } from './types';

export const startingPrice = (location: PhoneLocation) =>
  location.vehicles.length ? Math.min(...location.vehicles.map(v => v.pricePerDay)) : 0;
