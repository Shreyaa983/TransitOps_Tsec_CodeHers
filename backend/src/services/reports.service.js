import Vehicle from '../models/vehicle.model.js';
import Trip from '../models/trip.model.js';
import MaintenanceLog from '../models/maintenanceLog.model.js';
import FuelLog from '../models/fuelLog.model.js';
import Expense from '../models/expense.model.js';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FREIGHT_RATE_PER_KM_KG = 0.012;

function round(n, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

function tripDistance(trip) {
  return trip.actualDistance || trip.plannedDistance || 0;
}

function estimateTripRevenue(trip) {
  const distance = tripDistance(trip);
  if (distance <= 0 || !trip.cargoWeight) return 0;
  return distance * trip.cargoWeight * FREIGHT_RATE_PER_KM_KG;
}

export async function getReportsAnalytics() {
  const [vehicles, trips, fuelLogs, maintenanceLogs, expenses] = await Promise.all([
    Vehicle.find().select('name registrationNumber acquisitionCost status type').lean(),
    Trip.find().select('vehicle status actualDistance plannedDistance fuelConsumed cargoWeight completionTime dispatchTime').lean(),
    FuelLog.find().select('vehicle liters cost date').lean(),
    MaintenanceLog.find().select('vehicle cost status openedAt closedAt').lean(),
    Expense.find().select('vehicle category amount date').lean(),
  ]);

  const activeFleet = vehicles.filter((v) => v.status !== 'RETIRED');
  const onTrip = activeFleet.filter((v) => v.status === 'ON_TRIP').length;
  const fleetUtilizationPct =
    activeFleet.length > 0 ? round((onTrip / activeFleet.length) * 100, 1) : 0;

  const completedTrips = trips.filter((t) => t.status === 'COMPLETED');
  const totalDistance = completedTrips.reduce((sum, t) => sum + tripDistance(t), 0);
  const totalFuelLiters = fuelLogs.reduce((sum, f) => sum + f.liters, 0);
  const tripFuelLiters = completedTrips.reduce((sum, t) => sum + (t.fuelConsumed || 0), 0);
  const fuelForEfficiency = totalFuelLiters > 0 ? totalFuelLiters : tripFuelLiters;

  const fuelEfficiencyKmPerLiter =
    fuelForEfficiency > 0 ? round(totalDistance / fuelForEfficiency, 2) : null;

  const fuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const maintenanceCost = maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
  const otherExpenseCost = expenses
    .filter((e) => e.category !== 'FUEL' && e.category !== 'MAINTENANCE')
    .reduce((sum, e) => sum + e.amount, 0);
  const operationalCost = Math.round(fuelCost + maintenanceCost + otherExpenseCost);

  const costBreakdown = [
    { category: 'Fuel', amount: Math.round(fuelCost) },
    { category: 'Maintenance', amount: Math.round(maintenanceCost) },
    { category: 'Tolls & Other', amount: Math.round(otherExpenseCost) },
  ];

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyOperationalCost = [];
  for (let i = 0; i < 6; i += 1) {
    const monthStart = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59);

    const fuelMonth = fuelLogs
      .filter((f) => f.date >= monthStart && f.date <= monthEnd)
      .reduce((sum, f) => sum + f.cost, 0);
    const maintMonth = maintenanceLogs
      .filter((m) => {
        const d = m.closedAt || m.openedAt;
        return d && d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, m) => sum + m.cost, 0);
    const expenseMonth = expenses
      .filter((e) => e.date >= monthStart && e.date <= monthEnd && e.category !== 'FUEL' && e.category !== 'MAINTENANCE')
      .reduce((sum, e) => sum + e.amount, 0);

    monthlyOperationalCost.push({
      month: MONTH_LABELS[monthStart.getMonth()],
      amount: Math.round(fuelMonth + maintMonth + expenseMonth),
    });
  }

  const fuelByMonth = [];
  for (let i = 0; i < 6; i += 1) {
    const monthStart = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59);

    const monthTrips = completedTrips.filter(
      (t) => t.completionTime && t.completionTime >= monthStart && t.completionTime <= monthEnd,
    );
    const monthDistance = monthTrips.reduce((sum, t) => sum + tripDistance(t), 0);
    const monthFuel = fuelLogs
      .filter((f) => f.date >= monthStart && f.date <= monthEnd)
      .reduce((sum, f) => sum + f.liters, 0);

    fuelByMonth.push({
      month: MONTH_LABELS[monthStart.getMonth()],
      efficiency: monthFuel > 0 ? round(monthDistance / monthFuel, 2) : 0,
      distanceKm: Math.round(monthDistance),
      fuelLiters: Math.round(monthFuel),
    });
  }

  const vehicleRoi = vehicles
    .filter((v) => v.status !== 'RETIRED')
    .map((vehicle) => {
      const vehicleId = String(vehicle._id);

      const vehicleTrips = completedTrips.filter((t) => String(t.vehicle) === vehicleId);
      const revenue = Math.round(vehicleTrips.reduce((sum, t) => sum + estimateTripRevenue(t), 0));

      const fuel = Math.round(
        fuelLogs.filter((f) => String(f.vehicle) === vehicleId).reduce((sum, f) => sum + f.cost, 0),
      );
      const maintenance = Math.round(
        maintenanceLogs.filter((m) => String(m.vehicle) === vehicleId).reduce((sum, m) => sum + m.cost, 0),
      );

      const acquisitionCost = vehicle.acquisitionCost || 0;
      const netReturn = revenue - maintenance - fuel;
      const roiPct = acquisitionCost > 0 ? round((netReturn / acquisitionCost) * 100, 2) : null;

      return {
        id: vehicleId,
        name: vehicle.name,
        registration: vehicle.registrationNumber,
        acquisitionCost,
        revenue,
        fuelCost: fuel,
        maintenanceCost: maintenance,
        netReturn: Math.round(netReturn),
        roiPct,
      };
    });

  const fleetStatusBreakdown = [
    { name: 'On Trip', value: vehicles.filter((v) => v.status === 'ON_TRIP').length },
    { name: 'Available', value: vehicles.filter((v) => v.status === 'AVAILABLE').length },
    { name: 'In Shop', value: vehicles.filter((v) => v.status === 'IN_SHOP').length },
    { name: 'Retired', value: vehicles.filter((v) => v.status === 'RETIRED').length },
  ];

  return {
    summary: {
      fuelEfficiencyKmPerLiter,
      totalDistanceKm: Math.round(totalDistance),
      totalFuelLiters: Math.round(fuelForEfficiency),
      fleetUtilizationPct,
      activeFleetCount: activeFleet.length,
      onTripCount: onTrip,
      operationalCost,
      totalRevenue: Math.round(vehicleRoi.reduce((sum, v) => sum + v.revenue, 0)),
      avgRoiPct:
        vehicleRoi.filter((v) => v.roiPct !== null).length > 0
          ? round(
              vehicleRoi.reduce((sum, v) => sum + (v.roiPct ?? 0), 0) /
                vehicleRoi.filter((v) => v.roiPct !== null).length,
              2,
            )
          : null,
    },
    charts: {
      fuelEfficiencyTrend: fuelByMonth,
      operationalCostTrend: monthlyOperationalCost,
      costBreakdown,
      fleetStatusBreakdown,
    },
    vehicleRoi,
    formulas: {
      fuelEfficiency: 'Distance ÷ Fuel (km/L)',
      fleetUtilization: 'Vehicles On Trip ÷ Active Fleet × 100',
      operationalCost: 'Fuel + Maintenance + Tolls & Other',
      vehicleRoi: '(Revenue − (Maintenance + Fuel)) ÷ Acquisition Cost × 100',
      revenueNote: 'Revenue estimated from completed trips (distance × cargo weight × freight rate)',
    },
  };
}
