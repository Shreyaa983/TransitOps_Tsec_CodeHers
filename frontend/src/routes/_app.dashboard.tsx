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
import { useTranslation, statusKey, type I18nKey, EN_TEXTS } from "@/lib/i18n";
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

const DRIVER_STATUS_OPTIONS: { value: DriverStatus; labelKey: "status_available" | "status_on_trip" | "status_off_duty" }[] = [
  { value: "AVAILABLE", labelKey: "status_available" },
  { value: "ON_TRIP", labelKey: "status_on_trip" },
  { value: "OFF_DUTY", labelKey: "status_off_duty" },
];

const INSIGHT_ICONS: Record<string, string> = {
  primary: "🚛",
  success: "📈",
  danger: "👤",
};

const TRIP_STATUS_CHART: Record<string, I18nKey> = {
  Draft: "status_draft",
  Dispatched: "status_dispatched",
  Completed: "status_completed",
  Cancelled: "status_cancelled",
};

const MAINTENANCE_CHART: Record<string, I18nKey> = {
  Open: "status_open",
  Closed: "status_closed",
};

const VEHICLE_STATUS_LABELS: Record<string, "status_available" | "status_on_trip" | "status_in_shop" | "status_retired"> = {
  AVAILABLE: "status_available",
  ON_TRIP: "status_on_trip",
  IN_SHOP: "status_in_shop",
  RETIRED: "status_retired",
};

function mapChartLabels<T extends { name: string }>(
  rows: T[],
  keyMap: Record<string, I18nKey>,
  t: (key: I18nKey) => string,
) {
  return rows.map((row) => ({
    ...row,
    name: keyMap[row.name] ? t(keyMap[row.name]) : row.name,
  }));
}

function buildInsights(
  data: OperationsDashboard,
  t: (key: I18nKey, vars?: Record<string, string | number>) => string,
) {
  const insights: { tone: string; text: string }[] = [];
  if (data.kpis.vehiclesInMaintenance > 0) {
    insights.push({
      tone: "primary",
      text: t("dash_insight_vehicles_in_shop", { count: data.kpis.vehiclesInMaintenance }),
    });
  }
  if (data.kpis.completedTrips > 0) {
    insights.push({
      tone: "success",
      text: t("dash_insight_trips_completed", { count: data.kpis.completedTrips }),
    });
  }
  if (data.alerts.expiringLicenses.length > 0) {
    insights.push({
      tone: "danger",
      text: t("dash_insight_licenses_expiring", { count: data.alerts.expiringLicenses.length }),
    });
  }
  return insights;
}

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
  const { t } = useTranslation();
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
        {t("dash_loading")}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="brutal-card p-8 text-center text-destructive">
        {error instanceof Error ? error.message : t("dash_load_failed")}
      </div>
    );
  }

  const kpis = buildKpiCards(data, t);
  const insights = buildInsights(data, t);
  const tripStatusChart = mapChartLabels(data.charts.tripStatus, TRIP_STATUS_CHART, t);
  const maintenanceChart = mapChartLabels(data.charts.maintenanceStatus, MAINTENANCE_CHART, t);

  return (
    <div>
      <PageHeader
        title={t("dash_ops_title")}
        subtitle={t("dash_ops_subtitle")}
      />

      <DashboardFiltersBar
        data={data}
        filters={filters}
        isFetching={isFetching}
        onFilterChange={updateFilter}
        onClear={() => setFilters({})}
        t={t}
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
        {insights.map((insight) => (
          <div key={insight.text} className="brutal-card p-4 flex items-start gap-3">
            <div className="text-xl">{INSIGHT_ICONS[insight.tone] ?? "💡"}</div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> {t("dash_insight")}
              </div>
              <div className="text-sm font-medium mt-1">{insight.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="brutal-card p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">{t("dash_chart_vehicles_by_type")}</h3>
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
          <h3 className="font-bold mb-3">{t("dash_chart_trip_status")}</h3>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={tripStatusChart}>
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
            <h3 className="font-bold">{t("dash_chart_trip_activity")}</h3>
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
          <h3 className="font-bold mb-3">{t("dash_chart_maintenance")}</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={maintenanceChart}>
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
            <AlertTriangle className="h-4 w-4 text-warning" /> {t("dash_alerts")}
          </h3>
          <ul className="space-y-3 text-sm">
            {data.alerts.expiringLicenses.map((d) => (
              <li key={d.id} className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("dash_license_expires", { days: daysUntil(d.licenseExpiry) })}
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
                    {v.registration} · {t("dash_in_maintenance")}
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
                <li className="text-xs text-muted-foreground text-center py-4">{t("dash_no_alerts")}</li>
              )}
          </ul>
          <Link to="/notifications" className="block text-center text-xs font-semibold text-primary hover:underline mt-4">
            {t("dash_view_all_alerts")}
          </Link>
        </div>
      </div>

      <div className="brutal-card p-5 mt-6">
        <h3 className="font-bold mb-4">{t("dash_recent_activity")}</h3>
        <ol className="relative border-l-2 border-border-soft ml-3 space-y-4 pl-6">
          {data.recentActivity.map((trip) => (
            <li key={trip.id} className="relative">
              <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-primary brutal-border" />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">
                    {t("dash_trip_route", { code: trip.code, source: trip.source, destination: trip.destination })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {trip.vehicleName} · {trip.driverName} · {trip.distanceKm} km
                  </div>
                </div>
                <StatusBadge status={trip.status.toLowerCase()} />
              </div>
            </li>
          ))}
          {data.recentActivity.length === 0 && (
            <li className="text-xs text-muted-foreground">{t("dash_no_recent_trips")}</li>
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
  t,
}: {
  data: OperationsDashboard;
  filters: DashboardFilters;
  isFetching: boolean;
  onFilterChange: (key: keyof DashboardFilters, value: string) => void;
  onClear: () => void;
  t: (key: I18nKey, vars?: Record<string, string | number>) => string;
}) {
  const hasFilters = Boolean(filters.vehicleType || filters.vehicleStatus || filters.region);

  return (
    <div className="brutal-card p-4 mb-6 flex flex-col lg:flex-row lg:items-end gap-3">
      <div className="flex items-center gap-2 text-sm font-bold">
        <Filter className="h-4 w-4" />
        {t("dash_filters")}
        {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground">{t("dash_vehicle_type")}</label>
          <Select
            value={filters.vehicleType ?? "all"}
            onValueChange={(v) => onFilterChange("vehicleType", v)}
          >
            <SelectTrigger className="brutal-border bg-card">
              <SelectValue placeholder={t("dash_all_types")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dash_all_types")}</SelectItem>
              {data.filters.vehicleTypes.map((type) => {
                const typeKey = (`vehicles_type_${type.toLowerCase()}`) as I18nKey;
                return (
                  <SelectItem key={type} value={type}>
                    {typeKey in EN_TEXTS ? t(typeKey) : type}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground">{t("dash_vehicle_status")}</label>
          <Select
            value={filters.vehicleStatus ?? "all"}
            onValueChange={(v) => onFilterChange("vehicleStatus", v)}
          >
            <SelectTrigger className="brutal-border bg-card">
              <SelectValue placeholder={t("dash_all_statuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dash_all_statuses")}</SelectItem>
              {data.filters.vehicleStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {VEHICLE_STATUS_LABELS[status] ? t(VEHICLE_STATUS_LABELS[status]) : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground">{t("dash_depot_region")}</label>
          <Select
            value={filters.region ?? "all"}
            onValueChange={(v) => onFilterChange("region", v)}
          >
            <SelectTrigger className="brutal-border bg-card">
              <SelectValue placeholder={t("dash_all_regions")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dash_all_regions")}</SelectItem>
              {data.filters.regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region.toLowerCase() === "all regions" ? t("dash_all_regions") : region}
                </SelectItem>
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
          {t("clear_filters")}
        </button>
      )}
    </div>
  );
}

function buildKpiCards(data: OperationsDashboard, t: (key: I18nKey) => string) {
  const { kpis } = data;
  return [
    { label: t("dash_kpi_active_vehicles"), value: kpis.activeVehicles, icon: Truck, tone: "primary" },
    { label: t("dash_kpi_available"), value: kpis.availableVehicles, icon: CheckCircle2, tone: "success" },
    { label: t("dash_kpi_in_maintenance"), value: kpis.vehiclesInMaintenance, icon: Wrench, tone: "warning" },
    { label: t("dash_kpi_active_trips"), value: kpis.activeTrips, icon: RouteIcon, tone: "primary" },
    { label: t("dash_kpi_pending_trips"), value: kpis.pendingTrips, icon: Clock, tone: "muted" },
    { label: t("dash_kpi_drivers_on_duty"), value: kpis.driversOnDuty, icon: Users, tone: "success" },
    { label: t("dash_kpi_completed_trips"), value: kpis.completedTrips, icon: TrendingUp, tone: "success" },
  ];
}

function DriverConsole({ user }: { user: AuthUser }) {
  const { t } = useTranslation();
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
      toast.success(t("dash_status_updated", { status: updated.status.replace("_", " ") }));
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t("dash_status_update_failed")),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-10">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("dash_driver_loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="brutal-card p-8 text-center text-destructive">
        {error instanceof Error ? error.message : t("dash_driver_load_failed")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dash_driver_title")}
        subtitle={t("dash_driver_subtitle")}
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
                {t("dash_license")}{" "}
                <span className="font-mono font-semibold text-foreground">
                  {driver?.licenseNumber ?? "—"}
                </span>{" "}
                · {t("dash_category")}{" "}
                <span className="font-semibold text-foreground">
                  {driver?.licenseCategory ?? "—"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted/50 border border-border-soft px-4 py-2.5 rounded-xl">
            <span className="text-xs font-bold text-muted-foreground">
              {t("dash_dispatch_managed")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="brutal-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> {t("dash_assigned_vehicle")}
            </h2>
            <Link to="/vehicles" className="text-xs font-bold text-primary hover:underline">
              {t("dash_view_registry")}
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
                  <div className="text-muted-foreground">{t("dash_reg_number")}</div>
                  <div className="font-mono font-bold text-sm">{assignedVehicle.registration}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">{t("dash_max_capacity")}</div>
                  <div className="font-bold">{assignedVehicle.capacityKg} kg</div>
                </div>
                <div>
                  <div className="text-muted-foreground">{t("dash_odometer")}</div>
                  <div className="font-bold">{assignedVehicle.odometerKm.toLocaleString()} km</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground text-sm bg-muted/20 rounded-xl border border-dashed border-border-soft space-y-2">
              <p>{t("dash_no_vehicle")}</p>
              <Link to="/vehicles" className="inline-block text-xs font-bold text-primary hover:underline">
                {t("dash_inspect_registry")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
