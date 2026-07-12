import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Truck, CheckCircle2, Wrench, Route as RouteIcon, Clock, Users,
  TrendingUp, AlertTriangle, Sparkles, Filter, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { useAuth, type AuthUser } from "@/lib/store";
import { driversApi, type DriverStatus } from "@/lib/drivers-api";
import {
  dashboardApi,
  type DashboardFilters,
  type OperationsDashboard,
} from "@/lib/dashboard-api";
import { PageHeader } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { daysUntil } from "@/lib/format";
import { toast } from "sonner";

const DRIVER_STATUS_OPTIONS: { value: DriverStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Available" },
  { value: "ON_TRIP", label: "On Trip" },
  { value: "OFF_DUTY", label: "Off Duty" },
];

const INSIGHT_ICONS: Record<string, string> = {
  primary: "🚛",
  success: "📈",
  danger: "👤",
};

const VEHICLE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  IN_SHOP: "In Shop",
  RETIRED: "Retired",
};

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TransitOps" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const user = useAuth((s) => s.user);

  if (user?.role === "driver") {
    return <DriverConsole user={user} />;
  }

  return <OperationsDashboardView />;
}

function OperationsDashboardView() {
  const [filters, setFilters] = useState<DashboardFilters>({});

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["dashboard", filters],
    queryFn: () => dashboardApi.getOperations(filters),
    staleTime: 30_000,
  });

  const updateFilter = (key: keyof DashboardFilters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (!value || value === "all") {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading dashboard…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="brutal-card p-8 text-center text-destructive">
        {error instanceof Error ? error.message : "Failed to load dashboard data."}
      </div>
    );
  }

  const kpis = buildKpiCards(data);

  return (
    <div>
      <PageHeader
        title="Operations dashboard"
        subtitle="Live overview of your fleet, drivers, and trips."
      />

      <DashboardFiltersBar
        data={data}
        filters={filters}
        isFetching={isFetching}
        onFilterChange={updateFilter}
        onClear={() => setFilters({})}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="brutal-card p-4"
          >
            <div className="flex items-center justify-between">
              <k.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-2xl font-black tracking-tight">{k.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{k.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {data.insights.map((insight) => (
          <div key={insight.text} className="brutal-card p-4 flex items-start gap-3">
            <div className="text-xl">{INSIGHT_ICONS[insight.tone] ?? "💡"}</div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Insight
              </div>
              <div className="text-sm font-medium mt-1">{insight.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="brutal-card p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Vehicles by Type</h3>
            <Truck className="h-4 w-4 text-primary" />
          </div>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={data.charts.vehiclesByType}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="brutal-card p-5 lg:col-span-1">
          <h3 className="font-bold mb-3">Trip Status</h3>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={data.charts.tripStatus}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="brutal-card p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Trip Activity (7 days)</h3>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="h-52">
            <ResponsiveContainer>
              <LineChart data={data.charts.tripsWeekly}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="trips" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="brutal-card p-5 lg:col-span-2">
          <h3 className="font-bold mb-3">Maintenance Overview</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={data.charts.maintenanceStatus}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--warning)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="brutal-card p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" /> Alerts
          </h3>
          <ul className="space-y-3 text-sm">
            {data.alerts.expiringLicenses.map((d) => (
              <li key={d.id} className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-xs text-muted-foreground">
                    License expires in {daysUntil(d.licenseExpiry)}d
                  </div>
                </div>
                <StatusBadge status={d.status} />
              </li>
            ))}
            {data.alerts.vehiclesInShop.map((v) => (
              <li key={v.id} className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{v.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {v.registration} · in maintenance
                  </div>
                </div>
                <StatusBadge status="IN_SHOP" />
              </li>
            ))}
            {data.alerts.openMaintenance.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{m.vehicleName}</div>
                  <div className="text-xs text-muted-foreground">{m.issue}</div>
                </div>
                <StatusBadge status="open" />
              </li>
            ))}
            {data.alerts.expiringLicenses.length === 0 &&
              data.alerts.vehiclesInShop.length === 0 &&
              data.alerts.openMaintenance.length === 0 && (
                <li className="text-xs text-muted-foreground text-center py-4">No active alerts.</li>
              )}
          </ul>
          <Link to="/notifications" className="block text-center text-xs font-semibold text-primary hover:underline mt-4">
            View all alerts →
          </Link>
        </div>
      </div>

      <div className="brutal-card p-5 mt-6">
        <h3 className="font-bold mb-4">Recent activity</h3>
        <ol className="relative border-l-2 border-border-soft ml-3 space-y-4 pl-6">
          {data.recentActivity.map((t) => (
            <li key={t.id} className="relative">
              <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-primary brutal-border" />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">
                    Trip {t.code} · {t.source} → {t.destination}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.vehicleName} · {t.driverName} · {t.distanceKm} km
                  </div>
                </div>
                <StatusBadge status={t.status.toLowerCase()} />
              </div>
            </li>
          ))}
          {data.recentActivity.length === 0 && (
            <li className="text-xs text-muted-foreground">No recent trips match the current filters.</li>
          )}
        </ol>
      </div>
    </div>
  );
}

function DashboardFiltersBar({
  data,
  filters,
  isFetching,
  onFilterChange,
  onClear,
}: {
  data: OperationsDashboard;
  filters: DashboardFilters;
  isFetching: boolean;
  onFilterChange: (key: keyof DashboardFilters, value: string) => void;
  onClear: () => void;
}) {
  const hasFilters = Boolean(filters.vehicleType || filters.vehicleStatus || filters.region);

  return (
    <div className="brutal-card p-4 mb-6 flex flex-col lg:flex-row lg:items-end gap-3">
      <div className="flex items-center gap-2 text-sm font-bold">
        <Filter className="h-4 w-4" />
        Filters
        {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground">Vehicle type</label>
          <Select
            value={filters.vehicleType ?? "all"}
            onValueChange={(v) => onFilterChange("vehicleType", v)}
          >
            <SelectTrigger className="brutal-border bg-card">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {data.filters.vehicleTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground">Vehicle status</label>
          <Select
            value={filters.vehicleStatus ?? "all"}
            onValueChange={(v) => onFilterChange("vehicleStatus", v)}
          >
            <SelectTrigger className="brutal-border bg-card">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {data.filters.vehicleStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {VEHICLE_STATUS_LABELS[status] ?? status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground">Depot / Region</label>
          <Select
            value={filters.region ?? "all"}
            onValueChange={(v) => onFilterChange("region", v)}
          >
            <SelectTrigger className="brutal-border bg-card">
              <SelectValue placeholder="All regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              {data.filters.regions.map((region) => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="brutal-btn px-3 py-2 text-xs font-bold bg-card hover:bg-accent"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function buildKpiCards(data: OperationsDashboard) {
  const { kpis } = data;
  return [
    { label: "Active Vehicles", value: kpis.activeVehicles, icon: Truck, tone: "primary" },
    { label: "Available", value: kpis.availableVehicles, icon: CheckCircle2, tone: "success" },
    { label: "In Maintenance", value: kpis.vehiclesInMaintenance, icon: Wrench, tone: "warning" },
    { label: "Active Trips", value: kpis.activeTrips, icon: RouteIcon, tone: "primary" },
    { label: "Pending Trips", value: kpis.pendingTrips, icon: Clock, tone: "muted" },
    { label: "Drivers On Duty", value: kpis.driversOnDuty, icon: Users, tone: "success" },
    { label: "Completed Trips", value: kpis.completedTrips, icon: TrendingUp, tone: "success" },
  ];
}

function DriverConsole({ user }: { user: AuthUser }) {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", "driver"],
    queryFn: () => dashboardApi.getDriver(),
    enabled: !!user,
  });

  const driver = data?.driver;
  const myTrips = data?.trips ?? [];
  const assignedVehicle = data?.assignedVehicle;

  const statusMutation = useMutation({
    mutationFn: (status: DriverStatus) => driversApi.updateMyStatus(status),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["dashboard", "driver"] });
      qc.invalidateQueries({ queryKey: ["drivers"] });
      toast.success(`Status updated to ${updated.status.replace("_", " ")}`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update status"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-10">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your driver dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="brutal-card p-8 text-center text-destructive">
        {error instanceof Error ? error.message : "Failed to load your dashboard."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My dashboard"
        subtitle="Your assigned trips and vehicle details only."
      />

      <div className="brutal-card bg-gradient-to-r from-primary/15 via-primary/5 to-background p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center text-xl font-black brutal-border brutal-shadow-sm">
              <Truck className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">{driver?.name ?? user.name}</h1>
                {driver && <StatusBadge status={driver.status} />}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                License:{" "}
                <span className="font-mono font-semibold text-foreground">
                  {driver?.licenseNumber ?? "—"}
                </span>{" "}
                · Category:{" "}
                <span className="font-semibold text-foreground">
                  {driver?.licenseCategory ?? "—"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-muted-foreground mr-1">Update My Status:</span>
            {DRIVER_STATUS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                disabled={!driver || statusMutation.isPending}
                onClick={() => statusMutation.mutate(value)}
                className={`brutal-btn px-3 py-1.5 text-xs font-bold transition-all ${
                  driver?.status === value
                    ? "bg-primary text-primary-foreground brutal-shadow-sm scale-105"
                    : "bg-card hover:bg-accent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="brutal-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> Assigned Vehicle
            </h2>
            <Link to="/vehicles" className="text-xs font-bold text-primary hover:underline">
              View Vehicle Registry →
            </Link>
          </div>
          {assignedVehicle ? (
            <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border-soft">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-lg font-black">{assignedVehicle.name}</div>
                  <div className="text-xs text-muted-foreground">{assignedVehicle.model}</div>
                </div>
                <StatusBadge status={assignedVehicle.status} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-border-soft text-xs">
                <div>
                  <div className="text-muted-foreground">Reg #</div>
                  <div className="font-mono font-bold text-sm">{assignedVehicle.registration}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Max Capacity</div>
                  <div className="font-bold">{assignedVehicle.capacityKg} kg</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Odometer</div>
                  <div className="font-bold">{assignedVehicle.odometerKm.toLocaleString()} km</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground text-sm bg-muted/20 rounded-xl border border-dashed border-border-soft space-y-2">
              <p>No active vehicle assigned right now.</p>
              <Link to="/vehicles" className="inline-block text-xs font-bold text-primary hover:underline">
                Inspect master vehicle registry
              </Link>
            </div>
          )}
        </div>

        <div className="brutal-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <RouteIcon className="h-4 w-4 text-primary" /> My Trips
            </h2>
            <Link to="/trips" className="text-xs font-bold text-primary hover:underline">
              All Trips →
            </Link>
          </div>
          {myTrips.length > 0 ? (
            <div className="space-y-2">
              {myTrips.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-card border border-border-soft flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-bold">Trip {t.code}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.source} → {t.destination}
                    </div>
                  </div>
                  <StatusBadge status={t.status.toLowerCase()} />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground text-sm bg-muted/20 rounded-xl border border-dashed border-border-soft">
              No trips assigned to your profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
