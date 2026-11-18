import { AdminLocation, ReceiptData } from '../types';
import { RentalData } from '../components/Rental/RentalPanel';

const image = (model: string) => `https://raw.githubusercontent.com/MericcaN41/gta5carimages/main/images/${model}.png`;

const vehicle = (id: string, name: string, category: string, pricePerDay: number, seats: number) => ({
  id, name, category, pricePerDay, seats,
  pricePerHour: Math.ceil(pricePerDay * 0.15),
  image: image(id),
  minRentalDays: 1, maxRentalDays: 7, minRentalHours: 1, maxRentalHours: 24,
  fuelLevel: 100,
});

export const MOCK_RENTAL: RentalData = {
  locationLabel: 'Downtown Rentals',
  serviceFee: 100,
  categories: ['Super', 'Sport', 'Muscle', 'Coupe'],
  vehicles: [
    vehicle('adder', 'Adder', 'Super', 800, 2),
    vehicle('asterope', 'Asterope', 'Sport', 300, 4),
    vehicle('sultan', 'Sultan', 'Sport', 450, 4),
    vehicle('buffalo', 'Buffalo', 'Muscle', 400, 4),
    vehicle('f620', 'F620', 'Coupe', 350, 2),
  ],
};

export const MOCK_RECEIPT: ReceiptData = {
  transactionId: '#TRX-48213',
  date: '2026-10-27',
  time: '14:30',
  vehicleName: 'Adder',
  vehicleClass: 'Rental',
  plate: '4AB123CD',
  ownerName: 'John Doe',
  rentalType: 'days',
  duration: 3,
  days: 3,
  hours: 0,
  dailyRate: 800,
  rentalRate: 800,
  serviceFee: 100,
  total: 2500,
  paymentMethod: 'bank',
};

export const MOCK_ADMIN_LOCATIONS: AdminLocation[] = [
  {
    id: 'Downtown Rentals',
    source: 'config',
    label: 'Downtown Rentals',
    blip: { use: true, sprite: 198, color: 22, scale: 0.6, label: 'Downtown Rentals' },
    ped: { model: '-1234567', coords: { x: -1246.33, y: -239.75, z: 39.93, w: 293.58 }, scenario: 'WORLD_HUMAN_CLIPBOARD' },
    vehicles: MOCK_RENTAL.vehicles.map((v, i) => ({
      key: `mock${i}`,
      model: v.id,
      label: v.name,
      category: v.category,
      rentalCost: v.pricePerDay,
      hourlyCost: null,
      minRentalDays: 1,
      maxRentalDays: 7,
      minRentalHours: 1,
      maxRentalHours: 24,
      fuelLevel: 100,
      image: v.image ?? '',
    })),
    spawncoords: [
      { x: -1270.44, y: -250.75, z: 42.1, w: 212.91 },
      { x: -1273.58, y: -253.15, z: 42.1, w: 214.42 },
    ],
  },
];
