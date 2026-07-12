// Rich seed data for TransitOps demo.
export type VehicleStatus = "available" | "on_trip" | "in_shop" | "retired";
export type TripStatus = "draft" | "dispatched" | "completed" | "cancelled";
export type MaintenanceStatus = "open" | "in_progress" | "completed";

export type Vehicle = {
  id: string;
  registration: string;
  name: string;
  model: string;
  type: "Van" | "Truck" | "Pickup" | "Trailer";
  capacityKg: number;
  odometerKm: number;
  acquisitionCost: number;
  status: VehicleStatus;
  fuelType: "Diesel" | "Petrol" | "Electric";
};

export type Driver = {
  id: string;
  name: string;
  licenseNumber: string;
  category: "B" | "C" | "C+E" | "D";
  licenseExpiry: string; // ISO
  phone: string;
  safetyScore: number; // 0-100
  status: "on_duty" | "off_duty" | "suspended";
};

export type Trip = {
  id: string;
  code: string; // TR-1045
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoKg: number;
  distanceKm: number;
  dispatchDate: string;
  status: TripStatus;
  fuelUsedL?: number;
  costUSD?: number;
};

export type MaintenanceLog = {
  id: string;
  vehicleId: string;
  issue: string;
  description: string;
  technician: string;
  cost: number;
  status: MaintenanceStatus;
  createdAt: string;
  completedAt?: string;
};

export type FuelLog = {
  id: string;
  vehicleId: string;
  litres: number;
  pricePerL: number;
  odometer: number;
  date: string;
};

export type Expense = {
  id: string;
  vehicleId?: string;
  category: "fuel" | "maintenance" | "tolls" | "insurance" | "other";
  amount: number;
  note: string;
  date: string;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  level: "info" | "warning" | "danger" | "success";
  read: boolean;
  createdAt: string;
  actionType?: string;
  incidentPayload?: any;
};

const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => iso(new Date(Date.now() - n * 86400000));
const daysAhead = (n: number) => iso(new Date(Date.now() + n * 86400000));

export const seedVehicles: Vehicle[] = [
  { id: "v1", registration: "TX-4021", name: "Van-01", model: "Ford Transit 2022", type: "Van", capacityKg: 1400, odometerKm: 48210, acquisitionCost: 38000, status: "available", fuelType: "Diesel" },
  { id: "v2", registration: "TX-4022", name: "Van-02", model: "Mercedes Sprinter 2021", type: "Van", capacityKg: 1600, odometerKm: 71540, acquisitionCost: 45000, status: "on_trip", fuelType: "Diesel" },
  { id: "v3", registration: "TX-5510", name: "Truck-01", model: "Volvo FH16 2020", type: "Truck", capacityKg: 24000, odometerKm: 210430, acquisitionCost: 145000, status: "on_trip", fuelType: "Diesel" },
  { id: "v4", registration: "TX-5511", name: "Truck-02", model: "Scania R500 2023", type: "Truck", capacityKg: 22000, odometerKm: 15320, acquisitionCost: 168000, status: "available", fuelType: "Diesel" },
  { id: "v5", registration: "TX-3300", name: "Pickup-01", model: "Toyota Hilux 2022", type: "Pickup", capacityKg: 1000, odometerKm: 63200, acquisitionCost: 42000, status: "in_shop", fuelType: "Diesel" },
  { id: "v6", registration: "TX-3301", name: "Pickup-02", model: "Ford Ranger 2021", type: "Pickup", capacityKg: 1100, odometerKm: 89210, acquisitionCost: 39500, status: "available", fuelType: "Diesel" },
  { id: "v7", registration: "TX-7702", name: "Van-07", model: "Iveco Daily 2019", type: "Van", capacityKg: 1500, odometerKm: 142000, acquisitionCost: 32000, status: "available", fuelType: "Diesel" },
  { id: "v8", registration: "TX-9901", name: "EV-01", model: "Tesla Semi 2024", type: "Truck", capacityKg: 20000, odometerKm: 8100, acquisitionCost: 210000, status: "available", fuelType: "Electric" },
  { id: "v9", registration: "TX-1102", name: "Van-09", model: "Renault Master 2018", type: "Van", capacityKg: 1300, odometerKm: 198410, acquisitionCost: 28000, status: "retired", fuelType: "Diesel" },
  { id: "v10", registration: "TX-8801", name: "Trailer-01", model: "Krone SDP27 2020", type: "Trailer", capacityKg: 27000, odometerKm: 0, acquisitionCost: 42000, status: "available", fuelType: "Diesel" },
];

export const seedDrivers: Driver[] = [
  { id: "d1", name: "Marcus Reyes", licenseNumber: "DL-8842019", category: "C+E", licenseExpiry: daysAhead(240), phone: "+1 555 0142", safetyScore: 94, status: "on_duty" },
  { id: "d2", name: "Aisha Nguyen", licenseNumber: "DL-7710322", category: "C", licenseExpiry: daysAhead(8), phone: "+1 555 0155", safetyScore: 88, status: "on_duty" },
  { id: "d3", name: "David Okafor", licenseNumber: "DL-6621890", category: "C+E", licenseExpiry: daysAhead(120), phone: "+1 555 0167", safetyScore: 76, status: "off_duty" },
  { id: "d4", name: "Sofia Ivanova", licenseNumber: "DL-9930041", category: "B", licenseExpiry: daysAhead(-5), phone: "+1 555 0189", safetyScore: 82, status: "suspended" },
  { id: "d5", name: "Liam O'Brien", licenseNumber: "DL-5541092", category: "C", licenseExpiry: daysAhead(400), phone: "+1 555 0202", safetyScore: 91, status: "on_duty" },
  { id: "d6", name: "Priya Shah", licenseNumber: "DL-4482310", category: "C+E", licenseExpiry: daysAhead(60), phone: "+1 555 0231", safetyScore: 97, status: "on_duty" },
  { id: "d7", name: "Kenji Tanaka", licenseNumber: "DL-3320481", category: "D", licenseExpiry: daysAhead(15), phone: "+1 555 0244", safetyScore: 69, status: "off_duty" },
  { id: "d8", name: "Elena Rossi", licenseNumber: "DL-2210934", category: "C", licenseExpiry: daysAhead(730), phone: "+1 555 0271", safetyScore: 85, status: "on_duty" },
];

export const seedTrips: Trip[] = [
  { id: "t1", code: "TR-1045", source: "Chicago DC", destination: "Detroit Hub", vehicleId: "v2", driverId: "d1", cargoKg: 1200, distanceKm: 460, dispatchDate: daysAgo(0), status: "dispatched", fuelUsedL: 92 },
  { id: "t2", code: "TR-1046", source: "Dallas DC", destination: "Houston Depot", vehicleId: "v3", driverId: "d6", cargoKg: 18500, distanceKm: 385, dispatchDate: daysAgo(0), status: "dispatched", fuelUsedL: 145 },
  { id: "t3", code: "TR-1044", source: "Atlanta DC", destination: "Charlotte Hub", vehicleId: "v4", driverId: "d5", cargoKg: 15000, distanceKm: 400, dispatchDate: daysAgo(1), status: "completed", fuelUsedL: 158, costUSD: 640 },
  { id: "t4", code: "TR-1043", source: "Miami DC", destination: "Orlando Hub", vehicleId: "v1", driverId: "d8", cargoKg: 900, distanceKm: 380, dispatchDate: daysAgo(2), status: "completed", fuelUsedL: 71, costUSD: 285 },
  { id: "t5", code: "TR-1042", source: "Seattle DC", destination: "Portland Hub", vehicleId: "v6", driverId: "d3", cargoKg: 800, distanceKm: 280, dispatchDate: daysAgo(3), status: "completed", fuelUsedL: 55, costUSD: 220 },
  { id: "t6", code: "TR-1047", source: "Boston DC", destination: "NYC Hub", vehicleId: "", driverId: "", cargoKg: 1100, distanceKm: 350, dispatchDate: daysAhead(1), status: "draft" },
  { id: "t7", code: "TR-1041", source: "Phoenix DC", destination: "Tucson Hub", vehicleId: "v7", driverId: "d2", cargoKg: 950, distanceKm: 190, dispatchDate: daysAgo(4), status: "cancelled" },
];

export const seedMaintenance: MaintenanceLog[] = [
  { id: "m1", vehicleId: "v5", issue: "Brake pad replacement", description: "Front pads worn below 3mm", technician: "Jorge M.", cost: 340, status: "in_progress", createdAt: daysAgo(2) },
  { id: "m2", vehicleId: "v1", issue: "Oil service", description: "Scheduled 50k service", technician: "Rita P.", cost: 180, status: "completed", createdAt: daysAgo(20), completedAt: daysAgo(19) },
  { id: "m3", vehicleId: "v7", issue: "Suspension check", description: "Uneven tire wear reported", technician: "Amir K.", cost: 0, status: "open", createdAt: daysAgo(1) },
  { id: "m4", vehicleId: "v3", issue: "Turbo inspection", description: "Loss of power at highway speed", technician: "Jorge M.", cost: 890, status: "completed", createdAt: daysAgo(40), completedAt: daysAgo(38) },
];

export const seedFuel: FuelLog[] = [
  { id: "f1", vehicleId: "v2", litres: 82, pricePerL: 1.42, odometer: 71540, date: daysAgo(1) },
  { id: "f2", vehicleId: "v3", litres: 210, pricePerL: 1.4, odometer: 210430, date: daysAgo(1) },
  { id: "f3", vehicleId: "v1", litres: 65, pricePerL: 1.45, odometer: 48210, date: daysAgo(3) },
  { id: "f4", vehicleId: "v4", litres: 190, pricePerL: 1.41, odometer: 15320, date: daysAgo(4) },
  { id: "f5", vehicleId: "v6", litres: 58, pricePerL: 1.46, odometer: 89210, date: daysAgo(5) },
  { id: "f6", vehicleId: "v7", litres: 70, pricePerL: 1.44, odometer: 142000, date: daysAgo(7) },
];

export const seedExpenses: Expense[] = [
  { id: "e1", vehicleId: "v3", category: "fuel", amount: 294, note: "Refuel Houston", date: daysAgo(1) },
  { id: "e2", vehicleId: "v5", category: "maintenance", amount: 340, note: "Brake pads", date: daysAgo(2) },
  { id: "e3", category: "insurance", amount: 4200, note: "Quarterly premium", date: daysAgo(10) },
  { id: "e4", vehicleId: "v3", category: "tolls", amount: 82, note: "I-45 corridor", date: daysAgo(1) },
  { id: "e5", vehicleId: "v1", category: "fuel", amount: 94, note: "Refuel Miami", date: daysAgo(3) },
  { id: "e6", category: "other", amount: 220, note: "Depot supplies", date: daysAgo(6) },
];

export const seedNotifications: Notification[] = [
  { id: "n1", title: "License expiring soon", body: "Aisha Nguyen's license expires in 8 days.", level: "warning", read: false, createdAt: daysAgo(0) },
  { id: "n2", title: "Vehicle due for service", body: "Van-07 is approaching its 150k km service interval.", level: "info", read: false, createdAt: daysAgo(0) },
  { id: "n3", title: "Trip completed", body: "TR-1044 delivered to Charlotte Hub.", level: "success", read: true, createdAt: daysAgo(1) },
  { id: "n4", title: "Maintenance overdue", body: "Pickup-01 has been in shop for 2 days.", level: "danger", read: false, createdAt: daysAgo(2) },
  { id: "n5", title: "Expense anomaly", body: "Fuel spend up 12% vs last week.", level: "warning", read: false, createdAt: daysAgo(1) },
];
