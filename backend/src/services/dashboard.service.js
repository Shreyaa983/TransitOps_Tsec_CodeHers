import mongoose from 'mongoose';
import Vehicle from '../models/vehicle.model.js';
import Driver from '../models/driver.model.js';
import Trip from '../models/trip.model.js';
import MaintenanceLog from '../models/maintenanceLog.model.js';
import FuelLog from '../models/fuelLog.model.js';
import Expense from '../models/expense.model.js';

const VEHICLE_STATUSES = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];
const TRIP_STATUSES = ['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

  const prevWeekStart = startOfDay(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    vehicles,
    tripDocs,
    driversOnDuty,
    expiringLicenses,
    vehiclesInShop,
    openMaintenance,
    fuelThisWeek,
    fuelPrevWeek,
    monthlyExpenses,
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
    FuelLog.aggregate([
      { $match: { date: { $gte: weekStart } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          litres: { $sum: '$liters' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    FuelLog.aggregate([
      { $match: { date: { $gte: prevWeekStart, $lt: weekStart } } },
      { $group: { _id: null, litres: { $sum: '$liters' } } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
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
  const onTrip = vehicleCounts.ON_TRIP ?? 0;
  const fleetUtilizationPct =
    activeFleet > 0 ? Math.round((onTrip / activeFleet) * 100) : 0;

  const fuelWeekly = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    const key = day.toISOString().slice(0, 10);
    const match = fuelThisWeek.find((row) => row._id === key);
    fuelWeekly.push({
      day: DAY_LABELS[day.getDay()],
      litres: Math.round(match?.litres ?? 0),
    });
  }

  const expensesChart = monthlyExpenses.map((row) => ({
    month: MONTH_LABELS[row._id.month - 1],
    amount: Math.round(row.amount),
  }));

  const thisWeekFuel = fuelThisWeek.reduce((sum, row) => sum + row.litres, 0);
  const prevWeekFuel = fuelPrevWeek[0]?.litres ?? 0;
  const fuelDeltaPct =
    prevWeekFuel > 0
      ? Math.round(((thisWeekFuel - prevWeekFuel) / prevWeekFuel) * 100)
      : null;

  const insights = [];

  if (fuelDeltaPct !== null && fuelDeltaPct !== 0) {
    insights.push({
      tone: fuelDeltaPct > 0 ? 'warning' : 'success',
      text:
        fuelDeltaPct > 0
          ? `Fuel consumption increased ${fuelDeltaPct}% vs last week.`
          : `Fuel consumption decreased ${Math.abs(fuelDeltaPct)}% vs last week.`,
    });
  }

  if (vehiclesInShop.length > 0) {
    insights.push({
      tone: 'primary',
      text: `${vehiclesInShop.length} vehicle${vehiclesInShop.length === 1 ? '' : 's'} currently in maintenance.`,
    });
  }

  insights.push({
    tone: fleetUtilizationPct >= 50 ? 'success' : 'primary',
    text: `Fleet utilization is at ${fleetUtilizationPct}% across the active fleet.`,
  });

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
      fleetUtilizationPct,
    },
    charts: {
      fleetUtilization: [
        { name: 'On Trip', value: vehicleCounts.ON_TRIP ?? 0 },
        { name: 'Available', value: vehicleCounts.AVAILABLE ?? 0 },
        { name: 'In Shop', value: vehicleCounts.IN_SHOP ?? 0 },
        { name: 'Retired', value: vehicleCounts.RETIRED ?? 0 },
      ],
      tripStatus: [
        { name: 'Draft', value: tripCounts.DRAFT ?? 0 },
        { name: 'Dispatched', value: tripCounts.DISPATCHED ?? 0 },
        { name: 'Completed', value: tripCounts.COMPLETED ?? 0 },
        { name: 'Cancelled', value: tripCounts.CANCELLED ?? 0 },
      ],
      fuelWeekly,
      monthlyExpenses: expensesChart,
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
