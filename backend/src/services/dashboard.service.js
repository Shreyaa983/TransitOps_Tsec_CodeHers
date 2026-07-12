import mongoose from 'mongoose';
import Vehicle from '../models/vehicle.model.js';
import Driver from '../models/driver.model.js';
import Trip from '../models/trip.model.js';
import MaintenanceLog from '../models/maintenanceLog.model.js';

const VEHICLE_STATUSES = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];
const TRIP_STATUSES = ['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const NO_MATCH_ID = new mongoose.Types.ObjectId('000000000000000000000000');

async function buildVehicleFilter({ vehicleType, vehicleStatus, region }) {
  const filter = {};

  if (vehicleType) {
    filter.type = vehicleType;
  }

  if (vehicleStatus) {
    filter.status = vehicleStatus.toUpperCase();
  }

  if (region) {
    const vehicleIds = await Trip.distinct('vehicle', { source: region });
    filter._id = { $in: vehicleIds.length > 0 ? vehicleIds : [NO_MATCH_ID] };
  }

  return filter;
}

function buildTripFilter({ region }) {
  const filter = {};
  if (region) {
    filter.source = region;
  }
  return filter;
}

function countByStatus(docs, statusField, statuses) {
  const counts = Object.fromEntries(statuses.map((s) => [s, 0]));
  for (const doc of docs) {
    const key = doc[statusField];
    if (counts[key] !== undefined) {
      counts[key] += 1;
    }
  }
  return counts;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatTripCode(id) {
  return `TR-${String(id).slice(-4).toUpperCase()}`;
}

export async function getFilterOptions() {
  const [vehicleTypes, regions] = await Promise.all([
    Vehicle.distinct('type'),
    Trip.distinct('source'),
  ]);

  return {
    vehicleTypes: vehicleTypes.sort(),
    vehicleStatuses: VEHICLE_STATUSES,
    regions: regions.sort(),
  };
}

export async function getOperationsDashboard(query = {}) {
  const vehicleFilter = await buildVehicleFilter(query);
  const tripFilter = buildTripFilter(query);

  const now = new Date();
  const licenseCutoff = new Date(now);
  licenseCutoff.setDate(licenseCutoff.getDate() + 15);

  const weekStart = startOfDay(now);
  weekStart.setDate(weekStart.getDate() - 6);

  const [
    vehicles,
    tripDocs,
    driversOnDuty,
    expiringLicenses,
    vehiclesInShop,
    openMaintenance,
    closedMaintenanceCount,
    weekTrips,
    recentTrips,
    filterOptions,
  ] = await Promise.all([
    Vehicle.find(vehicleFilter).select('status type name registrationNumber').lean(),
    Trip.find(tripFilter).select('status').lean(),
    Driver.countDocuments({ status: { $in: ['AVAILABLE', 'ON_TRIP'] } }),
    Driver.find({
      licenseExpiry: { $lte: licenseCutoff },
      status: { $ne: 'SUSPENDED' },
    })
      .select('name licenseExpiry status')
      .sort({ licenseExpiry: 1 })
      .limit(5)
      .lean(),
    Vehicle.find({ ...vehicleFilter, status: 'IN_SHOP' })
      .select('name registrationNumber status')
      .limit(5)
      .lean(),
    MaintenanceLog.find({ status: 'OPEN' })
      .populate('vehicle', 'name registrationNumber')
      .sort({ openedAt: -1 })
      .limit(5)
      .lean(),
    MaintenanceLog.countDocuments({ status: 'CLOSED' }),
    Trip.find(tripFilter)
      .select('updatedAt dispatchTime')
      .where('updatedAt')
      .gte(weekStart)
      .lean(),
    Trip.find(tripFilter)
      .populate('vehicle', 'name registrationNumber')
      .populate('driver', 'name')
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean(),
    getFilterOptions(),
  ]);

  const vehicleCounts = countByStatus(vehicles, 'status', VEHICLE_STATUSES);
  const tripCounts = countByStatus(tripDocs, 'status', TRIP_STATUSES);

  const activeFleet = vehicles.filter((v) => v.status !== 'RETIRED').length;
  const completedTrips = tripCounts.COMPLETED ?? 0;

  const tripsWeekly = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    const count = weekTrips.filter((t) => {
      const d = t.updatedAt ? new Date(t.updatedAt) : null;
      return d && d >= day && d <= dayEnd;
    }).length;
    tripsWeekly.push({
      day: DAY_LABELS[day.getDay()],
      trips: count,
    });
  }

  const vehiclesByType = Object.entries(
    vehicles.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const maintenanceStatus = [
    { name: 'Open', value: openMaintenance.length },
    { name: 'Closed', value: closedMaintenanceCount },
  ];

  const insights = [];

  if (vehiclesInShop.length > 0) {
    insights.push({
      tone: 'primary',
      text: `${vehiclesInShop.length} vehicle${vehiclesInShop.length === 1 ? '' : 's'} currently in maintenance.`,
    });
  }

  if (completedTrips > 0) {
    insights.push({
      tone: 'success',
      text: `${completedTrips} trip${completedTrips === 1 ? '' : 's'} completed in the current filter scope.`,
    });
  }

  if (expiringLicenses.length > 0) {
    insights.push({
      tone: 'danger',
      text: `${expiringLicenses.length} driver license${expiringLicenses.length === 1 ? '' : 's'} expire within 15 days.`,
    });
  }

  return {
    kpis: {
      activeVehicles: activeFleet,
      availableVehicles: vehicleCounts.AVAILABLE ?? 0,
      vehiclesInMaintenance: vehicleCounts.IN_SHOP ?? 0,
      activeTrips: tripCounts.DISPATCHED ?? 0,
      pendingTrips: tripCounts.DRAFT ?? 0,
      driversOnDuty,
      completedTrips,
    },
    charts: {
      vehiclesByType,
      tripStatus: [
        { name: 'Draft', value: tripCounts.DRAFT ?? 0 },
        { name: 'Dispatched', value: tripCounts.DISPATCHED ?? 0 },
        { name: 'Completed', value: tripCounts.COMPLETED ?? 0 },
        { name: 'Cancelled', value: tripCounts.CANCELLED ?? 0 },
      ],
      tripsWeekly,
      maintenanceStatus,
    },
    alerts: {
      expiringLicenses: expiringLicenses.map((d) => ({
        id: String(d._id),
        name: d.name,
        licenseExpiry: d.licenseExpiry,
        status: d.status,
      })),
      vehiclesInShop: vehiclesInShop.map((v) => ({
        id: String(v._id),
        name: v.name,
        registration: v.registrationNumber,
        status: v.status,
      })),
      openMaintenance: openMaintenance.map((m) => ({
        id: String(m._id),
        issue: m.issue,
        status: m.status,
        vehicleName: m.vehicle?.name ?? 'Vehicle',
        vehicleRegistration: m.vehicle?.registrationNumber ?? '',
      })),
    },
    insights,
    recentActivity: recentTrips.map((t) => ({
      id: String(t._id),
      code: formatTripCode(t._id),
      source: t.source,
      destination: t.destination,
      status: t.status,
      distanceKm: t.actualDistance || t.plannedDistance || 0,
      vehicleName: t.vehicle?.name ?? '—',
      driverName: t.driver?.name ?? '—',
    })),
    filters: filterOptions,
  };
}

export async function getDriverDashboard(user) {
  const driverId = user.driver?._id ?? user.driver;
  let driver = driverId ? await Driver.findById(driverId).lean() : null;

  if (!driver) {
    driver = await Driver.findOne({ user: user._id }).lean();
  }

  if (!driver) {
    return { driver: null, trips: [], assignedVehicle: null };
  }

  const trips = await Trip.find({ driver: driver._id })
    .populate('vehicle')
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean();

  const activeTrip = trips.find((t) => t.status === 'DISPATCHED' || t.status === 'DRAFT');
  const assignedVehicle = activeTrip?.vehicle ?? null;

  return {
    driver: {
      id: String(driver._id),
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      licenseCategory: driver.licenseCategory,
      licenseExpiry: driver.licenseExpiry,
      phone: driver.phone,
      safetyScore: driver.safetyScore,
      status: driver.status,
    },
    trips: trips.map((t) => ({
      id: String(t._id),
      code: formatTripCode(t._id),
      source: t.source,
      destination: t.destination,
      status: t.status,
      vehicleId: t.vehicle?._id ? String(t.vehicle._id) : String(t.vehicle),
    })),
    assignedVehicle: assignedVehicle
      ? {
          id: String(assignedVehicle._id),
          name: assignedVehicle.name,
          model: assignedVehicle.model,
          registration: assignedVehicle.registrationNumber,
          capacityKg: assignedVehicle.maxLoadCapacity,
          odometerKm: assignedVehicle.odometer,
          status: assignedVehicle.status,
        }
      : null,
  };
}
