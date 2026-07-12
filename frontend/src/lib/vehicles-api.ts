import { api } from "./api";

export type VehicleStatus = "AVAILABLE" | "ON_TRIP" | "IN_SHOP" | "RETIRED";

export type ApiVehicle = {
  _id: string;
  registrationNumber: string;
  name: string;
  model: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
};

export type Vehicle = {
  id: string;
  registrationNumber: string;
  name: string;
  model: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
};

type ApiResponse<T> = { success: boolean; data: T };

export function normalizeVehicle(raw: ApiVehicle): Vehicle {
  return {
    id: raw._id,
    registrationNumber: raw.registrationNumber,
    name: raw.name,
    model: raw.model,
    type: raw.type,
    maxLoadCapacity: raw.maxLoadCapacity,
    odometer: raw.odometer,
    acquisitionCost: raw.acquisitionCost,
    status: raw.status,
  };
}

export type CreateVehicleInput = {
  registrationNumber: string;
  name: string;
  model: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status?: VehicleStatus;
};

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

export const vehiclesApi = {
  list: async () => {
    const res = await api.get<ApiResponse<ApiVehicle[]>>("/vehicles");
    return res.data.map(normalizeVehicle);
  },

  getOne: async (id: string) => {
    const res = await api.get<ApiResponse<ApiVehicle>>(`/vehicles/${id}`);
    return normalizeVehicle(res.data);
  },

  create: async (body: CreateVehicleInput) => {
    const res = await api.post<ApiResponse<ApiVehicle>>("/vehicles", body);
    return normalizeVehicle(res.data);
  },

  update: async (id: string, body: UpdateVehicleInput) => {
    const res = await api.patch<ApiResponse<ApiVehicle>>(`/vehicles/${id}`, body);
    return normalizeVehicle(res.data);
  },

  delete: async (id: string) => {
    await api.delete(`/vehicles/${id}`);
  },
};
