import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/user.model.js';
import Vehicle from '../models/vehicle.model.js';
import Driver from '../models/driver.model.js';
import Trip from '../models/trip.model.js';
import MaintenanceLog from '../models/maintenanceLog.model.js';
import FuelLog from '../models/fuelLog.model.js';
import Expense from '../models/expense.model.js';

const seed = async () => {
  await connectDB();

  await Promise.all([
    Expense.deleteMany({}),
    FuelLog.deleteMany({}),
    MaintenanceLog.deleteMany({}),
    Trip.deleteMany({}),
    Driver.deleteMany({}),
    Vehicle.deleteMany({}),
    User.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash('Password123!', 12);

  const drivers = await Driver.insertMany([
    {
      name: 'Samuel Njoroge',
      licenseNumber: 'DL-77821',
      licenseCategory: 'Heavy Goods',
      licenseExpiry: new Date('2028-04-15'),
      phone: '+254700123456',
      safetyScore: 98,
      status: 'AVAILABLE',
    },
    {
      name: 'Grace Mwangi',
      licenseNumber: 'DL-66214',
      licenseCategory: 'Light Goods',
      licenseExpiry: new Date('2027-10-01'),
      phone: '+254711654321',
      safetyScore: 100,
      status: 'ON_TRIP',
    },
  ]);

  const users = await User.insertMany([
    { name: 'Amina Patel', email: 'amina@transitops.com', password: passwordHash, role: 'FLEET_MANAGER' },
    { name: 'Jonas Reed', email: 'jonas@transitops.com', password: passwordHash, role: 'DISPATCHER' },
    { name: 'Tariq Mensah', email: 'tariq@transitops.com', password: passwordHash, role: 'SAFETY_OFFICER' },
    { name: 'Leah Okafor', email: 'leah@transitops.com', password: passwordHash, role: 'FINANCIAL_ANALYST' },
    { name: 'Samuel Njoroge', email: 'samuel@transitops.com', password: passwordHash, role: 'DRIVER', driver: drivers[0]._id },
    { name: 'Grace Mwangi', email: 'grace@transitops.com', password: passwordHash, role: 'DRIVER', driver: drivers[1]._id },
  ]);

  await Promise.all([
    Driver.findByIdAndUpdate(drivers[0]._id, { user: users[4]._id }),
    Driver.findByIdAndUpdate(drivers[1]._id, { user: users[5]._id }),
  ]);

  const vehicles = await Vehicle.insertMany([
    {
      registrationNumber: 'KDA-481X',
      name: 'Volvo Prime Hauler',
      model: 'FH16',
      type: 'Truck',
      maxLoadCapacity: 24000,
      odometer: 184500,
      acquisitionCost: 178000,
      status: 'AVAILABLE',
    },
    {
      registrationNumber: 'KDB-225M',
      name: 'Mercedes Sprinter Cargo',
      model: 'Sprinter 516',
      type: 'Van',
      maxLoadCapacity: 3500,
      odometer: 92300,
      acquisitionCost: 62000,
      status: 'ON_TRIP',
    },
    {
      registrationNumber: 'KDC-907Q',
      name: 'Isuzu Delivery Rig',
      model: 'NQR 75',
      type: 'Truck',
      maxLoadCapacity: 7000,
      odometer: 141200,
      acquisitionCost: 89000,
      status: 'IN_SHOP',
    },
  ]);

  const trips = await Trip.insertMany([
    {
      vehicle: vehicles[1]._id,
      driver: drivers[1]._id,
      source: 'Nairobi Depot',
      destination: 'Mombasa Port',
      cargoWeight: 2800,
      plannedDistance: 485,
      actualDistance: 492,
      fuelConsumed: 168,
      status: 'DISPATCHED',
      dispatchTime: new Date('2026-07-10T06:30:00Z'),
    },
    {
      vehicle: vehicles[0]._id,
      driver: drivers[0]._id,
      source: 'Nairobi Warehouse',
      destination: 'Eldoret Hub',
      cargoWeight: 11800,
      plannedDistance: 310,
      actualDistance: 310,
      fuelConsumed: 94,
      status: 'COMPLETED',
      dispatchTime: new Date('2026-07-08T05:00:00Z'),
      completionTime: new Date('2026-07-08T12:15:00Z'),
    },
  ]);

  await MaintenanceLog.insertMany([
    {
      vehicle: vehicles[2]._id,
      issue: 'Brake pad wear',
      description: 'Front axle brake pads are near minimum thickness and need replacement.',
      technician: 'AutoFix Garage',
      cost: 420,
      status: 'OPEN',
      openedAt: new Date('2026-07-11T09:20:00Z'),
    },
    {
      vehicle: vehicles[0]._id,
      issue: 'Oil service',
      description: 'Routine engine oil and filter replacement completed.',
      technician: 'Prime Service Center',
      cost: 260,
      status: 'CLOSED',
      openedAt: new Date('2026-07-03T08:00:00Z'),
      closedAt: new Date('2026-07-03T11:30:00Z'),
    },
  ]);

  await FuelLog.insertMany([
    {
      vehicle: vehicles[1]._id,
      liters: 165,
      cost: 310,
      odometer: 92300,
      date: new Date('2026-07-10T04:40:00Z'),
    },
    {
      vehicle: vehicles[0]._id,
      liters: 96,
      cost: 182,
      odometer: 184500,
      date: new Date('2026-07-08T04:20:00Z'),
    },
  ]);

  await Expense.insertMany([
    {
      vehicle: vehicles[1]._id,
      trip: trips[0]._id,
      category: 'FUEL',
      amount: 310,
      description: 'Fuel top-up before Nairobi to Mombasa dispatch',
      date: new Date('2026-07-10T04:40:00Z'),
    },
    {
      vehicle: vehicles[2]._id,
      category: 'MAINTENANCE',
      amount: 420,
      description: 'Brake pad replacement estimate',
      date: new Date('2026-07-11T09:30:00Z'),
    },
    {
      vehicle: vehicles[0]._id,
      trip: trips[1]._id,
      category: 'TOLL',
      amount: 65,
      description: 'Highway tolls for Eldoret delivery',
      date: new Date('2026-07-08T09:10:00Z'),
    },
  ]);

  // eslint-disable-next-line no-console
  console.log('Seeded TransitOps sample data into MongoDB Atlas');

  await mongoose.disconnect();
};

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', error);
  process.exit(1);
});