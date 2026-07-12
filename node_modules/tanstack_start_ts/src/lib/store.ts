import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  seedVehicles, seedDrivers, seedTrips, seedMaintenance, seedFuel, seedExpenses, seedNotifications,
  type Vehicle, type Driver, type Trip, type MaintenanceLog, type FuelLog, type Expense, type Notification,
} from "./mock-data";

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
  deleteDriver: (id: string) => void;

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

      addVehicle: (v) => set((s) => ({ vehicles: [v, ...s.vehicles] })),
      updateVehicle: (id, patch) => set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)) })),
      deleteVehicle: (id) => set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) })),

      addDriver: (d) => set((s) => ({ drivers: [d, ...s.drivers] })),
      updateDriver: (id, patch) => set((s) => ({ drivers: s.drivers.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      deleteDriver: (id) => set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) })),

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

export type Role = "fleet_manager" | "dispatcher" | "safety_officer" | "financial_analyst";
export type AuthUser = { email: string; name: string; role: Role };

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
  dispatcher: ["dashboard", "vehicles", "drivers", "trips", "notifications", "ai-copilot", "settings"],
  safety_officer: ["dashboard", "drivers", "maintenance", "reports", "notifications", "settings"],
  financial_analyst: ["dashboard", "fuel", "expenses", "reports", "notifications", "settings"],
};
export const roleLabel: Record<Role, string> = {
  fleet_manager: "Fleet Manager",
  dispatcher: "Dispatcher",
  safety_officer: "Safety Officer",
  financial_analyst: "Financial Analyst",
};
