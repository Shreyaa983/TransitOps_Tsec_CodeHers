import { api } from "./api";

type ApiResponse<T> = { success: boolean; data: T };

export type DashboardFilters = {
  vehicleType?: string;
  vehicleStatus?: string;
  region?: string;
};

export type DashboardKpis = {
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilizationPct: number;
};

export type ChartPoint = { name: string; value: number };
export type FuelPoint = { day: string; litres: number };
export type ExpensePoint = { month: string; amount: number };

export type DashboardInsight = {
  tone: "warning" | "primary" | "success" | "danger";
  text: string;
};

export type DashboardAlertDriver = {
  id: string;
  name: string;
  licenseExpiry: string;
  status: string;
};

export type DashboardAlertVehicle = {
  id: string;
  name: string;
  registration: string;
  status: string;
};

export type DashboardAlertMaintenance = {
  id: string;
  issue: string;
  status: string;
  vehicleName: string;
  vehicleRegistration: string;
};

export type DashboardActivity = {
  id: string;
  code: string;
  source: string;
  destination: string;
  status: string;
  distanceKm: number;
  vehicleName: string;
  driverName: string;
};

export type DashboardFilterOptions = {
  vehicleTypes: string[];
  vehicleStatuses: string[];
  regions: string[];
};

export type OperationsDashboard = {
  kpis: DashboardKpis;
  charts: {
    fleetUtilization: ChartPoint[];
    tripStatus: ChartPoint[];
    fuelWeekly: FuelPoint[];
    monthlyExpenses: ExpensePoint[];
  };
  alerts: {
    expiringLicenses: DashboardAlertDriver[];
    vehiclesInShop: DashboardAlertVehicle[];
    openMaintenance: DashboardAlertMaintenance[];
  };
  insights: DashboardInsight[];
  recentActivity: DashboardActivity[];
  filters: DashboardFilterOptions;
};

export type DriverDashboardTrip = {
  id: string;
  code: string;
  source: string;
  destination: string;
  status: string;
  vehicleId: string;
};

export type DriverDashboardVehicle = {
  id: string;
  name: string;
  model: string;
  registration: string;
  capacityKg: number;
  odometerKm: number;
  status: string;
};

export type DriverDashboard = {
  driver: {
    id: string;
    name: string;
    licenseNumber: string;
    licenseCategory: string;
    licenseExpiry: string;
    phone: string;
    safetyScore: number;
    status: string;
  } | null;
  trips: DriverDashboardTrip[];
  assignedVehicle: DriverDashboardVehicle | null;
};

function buildQuery(filters: DashboardFilters = {}) {
  const params = new URLSearchParams();
  if (filters.vehicleType) params.set("vehicleType", filters.vehicleType);
  if (filters.vehicleStatus) params.set("vehicleStatus", filters.vehicleStatus);
  if (filters.region) params.set("region", filters.region);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const dashboardApi = {
  getOperations: async (filters?: DashboardFilters) => {
    const res = await api.get<ApiResponse<OperationsDashboard>>(
      `/dashboard${buildQuery(filters)}`,
    );
    return res.data;
  },

  getDriver: async () => {
    const res = await api.get<ApiResponse<DriverDashboard>>("/dashboard");
    return res.data;
  },
};
