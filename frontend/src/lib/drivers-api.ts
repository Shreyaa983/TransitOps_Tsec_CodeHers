import { api } from "./api";

export type DriverStatus = "AVAILABLE" | "ON_TRIP" | "OFF_DUTY" | "SUSPENDED";

export type ApiDriver = {
  _id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  phone: string;
  safetyScore: number;
  status: DriverStatus;
};

export type Driver = {
  id: string;
  name: string;
  licenseNumber: string;
  category: string;
  licenseExpiry: string;
  phone: string;
  safetyScore: number;
  status: DriverStatus;
};

export type DriverLicense = Pick<Driver, "id" | "name" | "licenseNumber" | "category" | "licenseExpiry">;

type ApiResponse<T> = { success: boolean; data: T };

export function normalizeDriver(raw: ApiDriver): Driver {
  return {
    id: raw._id,
    name: raw.name,
    licenseNumber: raw.licenseNumber,
    category: raw.licenseCategory,
    licenseExpiry: raw.licenseExpiry,
    phone: raw.phone,
    safetyScore: raw.safetyScore,
    status: raw.status,
  };
}

function normalizeLicense(raw: ApiDriver): DriverLicense {
  return {
    id: raw._id,
    name: raw.name,
    licenseNumber: raw.licenseNumber,
    category: raw.licenseCategory,
    licenseExpiry: raw.licenseExpiry,
  };
}

export type CreateDriverInput = {
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  phone: string;
  safetyScore?: number;
  status?: DriverStatus;
};

export type UpdateDriverInput = Partial<CreateDriverInput>;

export const driversApi = {
  list: async () => {
    const res = await api.get<ApiResponse<ApiDriver[]>>("/drivers");
    return res.data.map(normalizeDriver);
  },

  getOne: async (id: string) => {
    const res = await api.get<ApiResponse<ApiDriver>>(`/drivers/${id}`);
    return normalizeDriver(res.data);
  },

  create: async (body: CreateDriverInput) => {
    const res = await api.post<ApiResponse<ApiDriver>>("/drivers", body);
    return normalizeDriver(res.data);
  },

  update: async (id: string, body: UpdateDriverInput) => {
    const res = await api.patch<ApiResponse<ApiDriver>>(`/drivers/${id}`, body);
    return normalizeDriver(res.data);
  },

  delete: async (id: string) => {
    await api.delete(`/drivers/${id}`);
  },

  updateStatus: async (id: string, status: DriverStatus) => {
    const res = await api.patch<ApiResponse<ApiDriver>>(`/drivers/${id}/status`, { status });
    return normalizeDriver(res.data);
  },

  getAvailable: async () => {
    const res = await api.get<ApiResponse<ApiDriver[]>>("/drivers/available");
    return res.data.map(normalizeDriver);
  },

  getEligible: async () => {
    const res = await api.get<ApiResponse<ApiDriver[]>>("/drivers/eligible");
    return res.data.map(normalizeDriver);
  },

  getLicenseExpiring: async (days = 30) => {
    const res = await api.get<ApiResponse<ApiDriver[]>>(`/drivers/license-expiring?days=${days}`);
    return res.data.map(normalizeDriver);
  },

  getSuspended: async () => {
    const res = await api.get<ApiResponse<ApiDriver[]>>("/drivers/suspended");
    return res.data.map(normalizeDriver);
  },

  getLicense: async (id: string) => {
    const res = await api.get<ApiResponse<ApiDriver>>(`/drivers/${id}/license`);
    return normalizeLicense(res.data);
  },
};
