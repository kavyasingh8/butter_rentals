import { PhoneData } from './types';

const image = (model: string) => `https://raw.githubusercontent.com/MericcaN41/gta5carimages/main/images/${model}.png`;

export const MOCK_PHONE_DATA: PhoneData = {
  extendPaymentMethod: 'bank',
  rentals: [
    {
      plate: '4AB123CD', vehicleName: 'Sultan', unit: 'days', duration: 3, remaining: 190000, price: 1450,
      canExtend: true, image: image('sultan'), category: 'Sport', locationLabel: 'Downtown Rentals', rate: 450, maxExtend: 7,
    },
    {
      plate: '7KD552LM', vehicleName: 'Dinghy', unit: 'hours', duration: 2, remaining: 1500, price: 190,
      canExtend: false, image: image('dinghy'), category: 'Boat', locationLabel: 'Del Perro Marina', rate: 45, maxExtend: 0,
    },
  ],
  locations: [
    {
      id: 'Downtown Rentals', label: 'Downtown Rentals', categories: ['Super', 'Sport'],
      vehicles: [
        { name: 'Adder', category: 'Super', pricePerDay: 800, pricePerHour: 120, image: image('adder'), seats: 2 },
        { name: 'Sultan', category: 'Sport', pricePerDay: 450, pricePerHour: 68, image: image('sultan'), seats: 4 },
      ],
    },
    {
      id: 'Boat Rental', label: 'Del Perro Marina', categories: ['Boat'],
      vehicles: [{ name: 'Dinghy', category: 'Boat', pricePerDay: 300, pricePerHour: 45, image: image('dinghy'), seats: 4 }],
    },
  ],
};
