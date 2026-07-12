import { api } from "./api";

export type TripStatus = "draft" | "dispatched" | "completed" | "cancelled";

export type ApiTrip = {
  _id: string;
  code: string;
  source: string;
  destination: string;
  vehicle: any; // Can be string or populated object
  driver: any;  // Can be string or populated object
  cargoWeight: number;
  plannedDistance: number;
  actualDistance?: number;
  fuelConsumed?: number;
  status: string; // Uppercase in backend
  dispatchTime?: string;
  completionTime?: string;
  createdAt: string;
};

export type Trip = {
  id: string;
  code: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoKg: number;
  distanceKm: number;
  actualDistance?: number;
  fuelUsedL?: number;
  status: TripStatus;
  dispatchDate: string;
};

type ApiResponse<T> = { success: boolean; data: T };

export function normalizeTrip(raw: ApiTrip): Trip {
  return {
    id: raw._id,
    code: raw.code || `TR-${raw._id.slice(-4).toUpperCase()}`,
    source: raw.source,
    destination: raw.destination,
    vehicleId: raw.vehicle?._id || raw.vehicle || "",
    driverId: raw.driver?._id || raw.driver || "",
    cargoKg: raw.cargoWeight,
    distanceKm: raw.plannedDistance,
    actualDistance: raw.actualDistance,
    fuelUsedL: raw.fuelConsumed,
    status: (raw.status || "DRAFT").toLowerCase() as TripStatus,
    dispatchDate: raw.dispatchTime ? new Date(raw.dispatchTime).toISOString() : new Date(raw.createdAt).toISOString(),
  };
}

export type CreateTripInput = {
  vehicle: string;
  driver: string;
  source: string;
  destination: string;
  cargoWeight: number;
  plannedDistance: number;
};

export type UpdateTripInput = Partial<CreateTripInput>;

export const tripsApi = {
  list: async () => {
    const res = await api.get<ApiResponse<ApiTrip[]>>("/trips");
    return res.data.map(normalizeTrip);
  },

  getOne: async (id: string) => {
    const res = await api.get<ApiResponse<ApiTrip>>(`/trips/${id}`);
    return normalizeTrip(res.data);
  },

  create: async (body: CreateTripInput) => {
    const res = await api.post<ApiResponse<ApiTrip>>("/trips", body);
    return normalizeTrip(res.data);
  },

  update: async (id: string, body: UpdateTripInput) => {
    const res = await api.patch<ApiResponse<ApiTrip>>(`/trips/${id}`, body);
    return normalizeTrip(res.data);
  },

  delete: async (id: string) => {
    await api.delete(`/trips/${id}`);
  },

  getActive: async () => {
    const res = await api.get<ApiResponse<ApiTrip[]>>("/trips/active");
    return res.data.map(normalizeTrip);
  },

  getDrafts: async () => {
    const res = await api.get<ApiResponse<ApiTrip[]>>("/trips/drafts");
    return res.data.map(normalizeTrip);
  },

  getCompleted: async () => {
    const res = await api.get<ApiResponse<ApiTrip[]>>("/trips/completed");
    return res.data.map(normalizeTrip);
  },

  getCancelled: async () => {
    const res = await api.get<ApiResponse<ApiTrip[]>>("/trips/cancelled");
    return res.data.map(normalizeTrip);
  },

  getToday: async () => {
    const res = await api.get<ApiResponse<ApiTrip[]>>("/trips/today");
    return res.data.map(normalizeTrip);
  },

  dispatch: async (id: string) => {
    const res = await api.patch<ApiResponse<ApiTrip>>(`/trips/${id}/dispatch`, {});
    return normalizeTrip(res.data);
  },

  complete: async (id: string, body: { actualDistance: number; fuelConsumed: number; finalOdometer: number }) => {
    const res = await api.patch<ApiResponse<ApiTrip>>(`/trips/${id}/complete`, body);
    return normalizeTrip(res.data);
  },

  cancel: async (id: string) => {
    const res = await api.patch<ApiResponse<ApiTrip>>(`/trips/${id}/cancel`, {});
    return normalizeTrip(res.data);
  },
};
