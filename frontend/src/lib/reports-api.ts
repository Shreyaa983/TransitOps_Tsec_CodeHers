import { api } from "./api";

type ApiResponse<T> = { success: boolean; data: T };

export type ReportsSummary = {
  fuelEfficiencyKmPerLiter: number | null;
  totalDistanceKm: number;
  totalFuelLiters: number;
  fleetUtilizationPct: number;
  activeFleetCount: number;
  onTripCount: number;
  operationalCost: number;
  totalRevenue: number;
  avgRoiPct: number | null;
};

export type FuelEfficiencyPoint = {
  month: string;
  efficiency: number;
  distanceKm: number;
  fuelLiters: number;
};

export type CostPoint = { month: string; amount: number };
export type CategoryCost = { category: string; amount: number };
export type StatusPoint = { name: string; value: number };

export type VehicleRoiRow = {
  id: string;
  name: string;
  registration: string;
  acquisitionCost: number;
  revenue: number;
  fuelCost: number;
  maintenanceCost: number;
  netReturn: number;
  roiPct: number | null;
};

export type ReportsAnalytics = {
  summary: ReportsSummary;
  charts: {
    fuelEfficiencyTrend: FuelEfficiencyPoint[];
    operationalCostTrend: CostPoint[];
    costBreakdown: CategoryCost[];
    fleetStatusBreakdown: StatusPoint[];
  };
  vehicleRoi: VehicleRoiRow[];
  formulas: {
    fuelEfficiency: string;
    fleetUtilization: string;
    operationalCost: string;
    vehicleRoi: string;
    revenueNote: string;
  };
};

export const reportsApi = {
  getAnalytics: async () => {
    const res = await api.get<ApiResponse<ReportsAnalytics>>("/reports/analytics");
    return res.data;
  },
};
