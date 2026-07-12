import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  seedVehicles, seedDrivers, seedTrips, seedMaintenance, seedFuel, seedExpenses, seedNotifications,
  type Vehicle, type Driver, type Trip, type MaintenanceLog, type FuelLog, type Expense, type Notification,
} from "./mock-data";
import { api } from "./api";

type State = {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceLog[];
  fuel: FuelLog[];
  expenses: Expense[];
  notifications: Notification[];
};

type Actions = {
  reset: () => void;
  addVehicle: (v: Vehicle) => void;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;

  addDriver: (d: Driver) => void;
  updateDriver: (id: string, patch: Partial<Driver>) => void;
  updateDriverStatus: (id: string, status: string) => Promise<{ ok: boolean; error?: string }>;
  deleteDriver: (id: string) => void;

  syncWithBackend: () => Promise<void>;

  addTrip: (t: Trip) => void;
  updateTrip: (id: string, patch: Partial<Trip>) => void;
  dispatchTrip: (id: string) => { ok: boolean; error?: string };
  completeTrip: (id: string) => void;
  cancelTrip: (id: string) => void;

  addMaintenance: (m: MaintenanceLog) => void;
  updateMaintenance: (id: string, patch: Partial<MaintenanceLog>) => void;
  startMaintenance: (id: string) => void;
  completeMaintenance: (id: string) => void;

  addFuel: (f: FuelLog) => void;
  addExpense: (e: Expense) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
};

const initial: State = {
  vehicles: seedVehicles,
  drivers: seedDrivers,
  trips: seedTrips,
  maintenance: seedMaintenance,
  fuel: seedFuel,
  expenses: seedExpenses,
  notifications: seedNotifications,
};

export const useTransitStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial,
      reset: () => set(initial),

      addVehicle: async (v) => {
        set((s) => ({ vehicles: [v, ...s.vehicles] }));
        if (useAuth.getState().token) {
          try {
            await api.post("/vehicles", {
              registrationNumber: v.registration,
              name: v.name,
              model: v.model,
              type: v.type,
              maxLoadCapacity: v.capacityKg,
              odometer: v.odometerKm,
              acquisitionCost: v.acquisitionCost,
              status: v.status.toUpperCase(),
            });
            await get().syncWithBackend();
          } catch {}
        }
      },
      updateVehicle: async (id, patch) => {
        set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
        if (useAuth.getState().token) {
          try {
            const backendPatch: any = {};
            if (patch.registration !== undefined) backendPatch.registrationNumber = patch.registration;
            if (patch.name !== undefined) backendPatch.name = patch.name;
            if (patch.model !== undefined) backendPatch.model = patch.model;
            if (patch.type !== undefined) backendPatch.type = patch.type;
            if (patch.capacityKg !== undefined) backendPatch.maxLoadCapacity = patch.capacityKg;
            if (patch.odometerKm !== undefined) backendPatch.odometer = patch.odometerKm;
            if (patch.acquisitionCost !== undefined) backendPatch.acquisitionCost = patch.acquisitionCost;
            if (patch.status !== undefined) backendPatch.status = patch.status.toUpperCase();
            await api.patch(`/vehicles/${id}`, backendPatch);
            await get().syncWithBackend();
          } catch {}
        }
      },
      deleteVehicle: async (id) => {
        set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) }));
        if (useAuth.getState().token) {
          try {
            await api.delete(`/vehicles/${id}`);
          } catch {}
        }
      },

      addDriver: (d) => set((s) => ({ drivers: [d, ...s.drivers] })),
      updateDriver: (id, patch) => set((s) => ({ drivers: s.drivers.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      updateDriverStatus: async (id, status) => {
        try {
          const backendStatus = status.toUpperCase();
          if (useAuth.getState().token) {
            await api.patch("/drivers/me/status", { status: backendStatus }).catch(async () => {
              await api.patch(`/drivers/${id}`, { status: backendStatus });
            });
          }
          set((s) => ({
            drivers: s.drivers.map((d) => (d.id === id ? { ...d, status: status as any } : d)),
          }));
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.message || "Failed to update status" };
        }
      },
      deleteDriver: (id) => set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) })),

      syncWithBackend: async () => {
        if (!useAuth.getState().token) return;
        try {
          const [resVehicles, resDrivers, resTrips] = await Promise.all([
            api.get<{ success: boolean; data: any[] }>("/vehicles").catch(() => null),
            api.get<{ success: boolean; data: any[] }>("/drivers").catch(() => null),
            api.get<{ success: boolean; data: any[] }>("/trips").catch(() => null),
          ]);

          if (resVehicles && resVehicles.data && Array.isArray(resVehicles.data)) {
            const mappedVehicles: Vehicle[] = resVehicles.data.map((v: any) => ({
              id: v._id || v.id,
              registration: v.registrationNumber || v.registration || "N/A",
              name: v.name || "Vehicle",
              model: v.model || "Unknown",
              type: v.type || "Truck",
              capacityKg: v.maxLoadCapacity || v.capacityKg || 0,
              odometerKm: v.odometer || v.odometerKm || 0,
              acquisitionCost: v.acquisitionCost || 0,
              status: (v.status || "AVAILABLE").toLowerCase() as any,
              fuelType: "Diesel",
            }));
            if (mappedVehicles.length > 0) {
              set({ vehicles: mappedVehicles });
            }
          }

          if (resDrivers && resDrivers.data && Array.isArray(resDrivers.data)) {
            const mappedDrivers: Driver[] = resDrivers.data.map((d: any) => ({
              id: d._id || d.id,
              name: d.name || "Driver",
              licenseNumber: d.licenseNumber || d.license || "N/A",
              category: d.licenseCategory || d.category || "C",
              licenseExpiry: d.licenseExpiry ? new Date(d.licenseExpiry).toISOString() : new Date().toISOString(),
              phone: d.phone || "",
              safetyScore: d.safetyScore ?? 100,
              status: (d.status || "AVAILABLE").toLowerCase() as any,
            }));
            if (mappedDrivers.length > 0) {
              set({ drivers: mappedDrivers });
            }
          }

          if (resTrips && resTrips.data && Array.isArray(resTrips.data)) {
            const mappedTrips: Trip[] = resTrips.data.map((t: any) => ({
              id: t._id || t.id,
              code: t.code || `TR-${(t._id || "1000").slice(-4).toUpperCase()}`,
              source: t.source || "Origin",
              destination: t.destination || "Destination",
              vehicleId: t.vehicle?._id || t.vehicle || t.vehicleId || "",
              driverId: t.driver?._id || t.driver || t.driverId || "",
              cargoKg: t.cargoWeight || t.cargoKg || 0,
              distanceKm: t.plannedDistance || t.actualDistance || t.distanceKm || 0,
              dispatchDate: t.dispatchTime ? new Date(t.dispatchTime).toISOString() : new Date().toISOString(),
              status: (t.status || "DRAFT").toLowerCase() as any,
              fuelUsedL: t.fuelConsumed || t.fuelUsedL || 0,
              costUSD: t.costUSD || 0,
            }));
            if (mappedTrips.length > 0) {
              set({ trips: mappedTrips });
            }
          }
        } catch {
          // Ignore network sync errors
        }
      },

      addTrip: (t) => set((s) => ({ trips: [t, ...s.trips] })),
      updateTrip: (id, patch) => set((s) => ({ trips: s.trips.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      dispatchTrip: (id) => {
        const { trips, vehicles, drivers } = get();
        const trip = trips.find((t) => t.id === id);
        if (!trip) return { ok: false, error: "Trip not found" };
        const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
        const driver = drivers.find((d) => d.id === trip.driverId);
        if (!vehicle) return { ok: false, error: "Assign a vehicle before dispatch." };
        if (!driver) return { ok: false, error: "Assign a driver before dispatch." };
        if (vehicle.status === "retired") return { ok: false, error: "Retired vehicles cannot be dispatched." };
        if (vehicle.status === "in_shop") return { ok: false, error: "Vehicle is currently in maintenance." };
        if (vehicle.status === "on_trip") return { ok: false, error: "Vehicle is already assigned to another trip." };
        if (new Date(driver.licenseExpiry) < new Date()) return { ok: false, error: "Driver's license is expired." };
        if (trip.cargoKg > vehicle.capacityKg) return { ok: false, error: `Cargo exceeds vehicle capacity (${vehicle.capacityKg}kg).` };
        set((s) => ({
          trips: s.trips.map((t) => (t.id === id ? { ...t, status: "dispatched" } : t)),
          vehicles: s.vehicles.map((v) => (v.id === trip.vehicleId ? { ...v, status: "on_trip" } : v)),
          drivers: s.drivers.map((d) => (d.id === trip.driverId ? { ...d, status: "on_duty" } : d)),
        }));
        return { ok: true };
      },
      completeTrip: (id) => {
        const trip = get().trips.find((t) => t.id === id);
        if (!trip) return;
        set((s) => ({
          trips: s.trips.map((t) => (t.id === id ? { ...t, status: "completed" } : t)),
          vehicles: s.vehicles.map((v) => (v.id === trip.vehicleId ? { ...v, status: "available", odometerKm: v.odometerKm + trip.distanceKm } : v)),
        }));
      },
      cancelTrip: (id) => {
        const trip = get().trips.find((t) => t.id === id);
        if (!trip) return;
        set((s) => ({
          trips: s.trips.map((t) => (t.id === id ? { ...t, status: "cancelled" } : t)),
          vehicles: s.vehicles.map((v) => (v.id === trip.vehicleId && v.status === "on_trip" ? { ...v, status: "available" } : v)),
        }));
      },

      addMaintenance: (m) => set((s) => ({ maintenance: [m, ...s.maintenance] })),
      updateMaintenance: (id, patch) => set((s) => ({ maintenance: s.maintenance.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      startMaintenance: (id) => {
        const m = get().maintenance.find((x) => x.id === id);
        if (!m) return;
        set((s) => ({
          maintenance: s.maintenance.map((x) => (x.id === id ? { ...x, status: "in_progress" } : x)),
          vehicles: s.vehicles.map((v) => (v.id === m.vehicleId ? { ...v, status: "in_shop" } : v)),
        }));
      },
      completeMaintenance: (id) => {
        const m = get().maintenance.find((x) => x.id === id);
        if (!m) return;
        set((s) => ({
          maintenance: s.maintenance.map((x) => (x.id === id ? { ...x, status: "completed", completedAt: new Date().toISOString() } : x)),
          vehicles: s.vehicles.map((v) => (v.id === m.vehicleId ? { ...v, status: "available" } : v)),
        }));
      },

      addFuel: (f) => set((s) => ({ fuel: [f, ...s.fuel] })),
      addExpense: (e) => set((s) => ({ expenses: [e, ...s.expenses] })),

      markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    }),
    { name: "transitops-data-v1" },
  ),
);

export type Role = "fleet_manager" | "dispatcher" | "safety_officer" | "financial_analyst" | "driver";
export type AuthUser = { email: string; name: string; role: Role; _id?: string; driverId?: string };

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  /** Called after a successful backend login — stores the real user + JWT. */
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
};
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: "transitops-auth-v1" },
  ),
);

type UIState = {
  sidebarCollapsed: boolean;
  theme: "light" | "dark";
  toggleSidebar: () => void;
  setTheme: (t: "light" | "dark") => void;
};
export const useUI = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: "light",
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setTheme: (t) => set({ theme: t }),
    }),
    { name: "transitops-ui-v1" },
  ),
);

// Role → allowed top-level sections
export const roleAccess: Record<Role, string[]> = {
  fleet_manager: ["dashboard", "vehicles", "drivers", "trips", "maintenance", "fuel", "expenses", "reports", "ai-copilot", "notifications", "settings"],
  dispatcher: ["dashboard", "vehicles", "drivers", "trips", "reports", "notifications", "ai-copilot", "settings"],
  safety_officer: ["dashboard", "drivers", "maintenance", "reports", "notifications", "settings"],
  financial_analyst: ["dashboard", "fuel", "expenses", "reports", "notifications", "settings"],
  driver: ["dashboard", "vehicles", "trips", "maintenance", "fuel", "notifications", "settings"],
};
export const roleLabel: Record<Role, string> = {
  fleet_manager: "Fleet Manager",
  dispatcher: "Dispatcher",
  safety_officer: "Safety Officer",
  financial_analyst: "Financial Analyst",
  driver: "Truck Driver",
};
