import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Truck, CheckCircle2, Wrench, Route as RouteIcon, Clock, Users, Activity, TrendingUp, AlertTriangle, Sparkles, Fuel } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { useTransitStore, useAuth, type AuthUser } from "@/lib/store";
import { driversApi, type DriverStatus } from "@/lib/drivers-api";
import { PageHeader } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import { daysUntil, money } from "@/lib/format";
import { toast } from "sonner";

const DRIVER_STATUS_OPTIONS: { value: DriverStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Available" },
  { value: "ON_TRIP", label: "On Trip" },
  { value: "OFF_DUTY", label: "Off Duty" },
];

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TransitOps" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { vehicles, drivers, trips, maintenance, expenses } = useTransitStore();
  const user = useAuth((s) => s.user);

  if (user?.role === "driver") {
    return <DriverConsole user={user} />;
  }

  const kpis = [
    { label: "Active Vehicles", value: vehicles.filter((v) => v.status !== "retired").length, icon: Truck, tone: "primary" },
    { label: "Available", value: vehicles.filter((v) => v.status === "available").length, icon: CheckCircle2, tone: "success" },
    { label: "In Maintenance", value: vehicles.filter((v) => v.status === "in_shop").length, icon: Wrench, tone: "warning" },
    { label: "Active Trips", value: trips.filter((t) => t.status === "dispatched").length, icon: RouteIcon, tone: "primary" },
    { label: "Pending Trips", value: trips.filter((t) => t.status === "draft").length, icon: Clock, tone: "muted" },
    { label: "Drivers On Duty", value: drivers.filter((d) => d.status === "on_duty").length, icon: Users, tone: "success" },
    {
      label: "Fleet Utilization",
      value: `${Math.round((vehicles.filter((v) => v.status === "on_trip").length / Math.max(vehicles.filter((v) => v.status !== "retired").length, 1)) * 100)}%`,
      icon: Activity, tone: "secondary",
    },
  ];

  const utilData = [
    { name: "On Trip", value: vehicles.filter((v) => v.status === "on_trip").length },
    { name: "Available", value: vehicles.filter((v) => v.status === "available").length },
    { name: "In Shop", value: vehicles.filter((v) => v.status === "in_shop").length },
    { name: "Retired", value: vehicles.filter((v) => v.status === "retired").length },
  ];
  const pieColors = ["var(--primary)", "var(--success)", "var(--warning)", "var(--muted-foreground)"];

  const tripStatus = [
    { name: "Draft", value: trips.filter((t) => t.status === "draft").length },
    { name: "Dispatched", value: trips.filter((t) => t.status === "dispatched").length },
    { name: "Completed", value: trips.filter((t) => t.status === "completed").length },
    { name: "Cancelled", value: trips.filter((t) => t.status === "cancelled").length },
  ];

  const fuelWeekly = [
    { day: "Mon", litres: 420 }, { day: "Tue", litres: 380 }, { day: "Wed", litres: 510 },
    { day: "Thu", litres: 490 }, { day: "Fri", litres: 620 }, { day: "Sat", litres: 340 }, { day: "Sun", litres: 210 },
  ];
  const monthlyExpenses = [
    { m: "Jun", v: 12400 }, { m: "Jul", v: 13800 }, { m: "Aug", v: 11900 },
    { m: "Sep", v: 14200 }, { m: "Oct", v: 15100 }, { m: "Nov", v: 13650 },
  ];

  const expiring = drivers.filter((d) => daysUntil(d.licenseExpiry) <= 15);
  const inShop = vehicles.filter((v) => v.status === "in_shop");
  const upcomingMx = maintenance.filter((m) => m.status !== "completed").slice(0, 4);

  const insights = [
    { icon: "⚠", tone: "warning", text: "Fuel consumption increased 12% this week." },
    { icon: "🚛", tone: "primary", text: "Van-07 may require maintenance soon." },
    { icon: "📈", tone: "success", text: "Fleet utilization improved by 9%." },
    { icon: "👤", tone: "danger", text: `${expiring.length} driver license${expiring.length === 1 ? "" : "s"} expire within 15 days.` },
  ];

  return (
    <div>
      <PageHeader
        title="Operations dashboard"
        subtitle="Live overview of your fleet, drivers, and trips."
      />

      {/* KPI cards */}
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

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {insights.map((i) => (
          <div key={i.text} className="brutal-card p-4 flex items-start gap-3">
            <div className="text-xl">{i.icon}</div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI Insight</div>
              <div className="text-sm font-medium mt-1">{i.text}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="brutal-card p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Fleet Utilization</h3>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="h-52">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={utilData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {utilData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mt-2">
            {utilData.map((u, i) => (
              <div key={u.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: pieColors[i] }} />
                <span className="text-muted-foreground">{u.name}</span>
                <span className="ml-auto font-semibold">{u.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="brutal-card p-5 lg:col-span-1">
          <h3 className="font-bold mb-3">Trip Status</h3>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={tripStatus}>
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
            <h3 className="font-bold">Fuel Consumption (L/day)</h3>
            <Fuel className="h-4 w-4 text-warning" />
          </div>
          <div className="h-52">
            <ResponsiveContainer>
              <LineChart data={fuelWeekly}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="litres" stroke="var(--warning)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="brutal-card p-5 lg:col-span-2">
          <h3 className="font-bold mb-3">Monthly Expenses</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="m" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey="v" radius={[6, 6, 0, 0]} fill="var(--secondary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="brutal-card p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Alerts</h3>
          <ul className="space-y-3 text-sm">
            {expiring.slice(0, 3).map((d) => (
              <li key={d.id} className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-xs text-muted-foreground">License expires in {daysUntil(d.licenseExpiry)}d</div>
                </div>
                <StatusBadge status={d.status} />
              </li>
            ))}
            {inShop.map((v) => (
              <li key={v.id} className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{v.name}</div>
                  <div className="text-xs text-muted-foreground">{v.registration} · in maintenance</div>
                </div>
                <StatusBadge status="in_shop" />
              </li>
            ))}
            {upcomingMx.map((m) => {
              const v = vehicles.find((x) => x.id === m.vehicleId);
              return (
                <li key={m.id} className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{v?.name ?? "Vehicle"}</div>
                    <div className="text-xs text-muted-foreground">{m.issue}</div>
                  </div>
                  <StatusBadge status={m.status} />
                </li>
              );
            })}
          </ul>
          <Link to="/notifications" className="block text-center text-xs font-semibold text-primary hover:underline mt-4">
            View all alerts →
          </Link>
        </div>
      </div>

      {/* Recent activity */}
      <div className="brutal-card p-5 mt-6">
        <h3 className="font-bold mb-4">Recent activity</h3>
        <ol className="relative border-l-2 border-border-soft ml-3 space-y-4 pl-6">
          {trips.slice(0, 6).map((t) => {
            const v = vehicles.find((x) => x.id === t.vehicleId);
            return (
              <li key={t.id} className="relative">
                <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-primary brutal-border" />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      Trip {t.code} · {t.source} → {t.destination}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {v?.name ?? "—"} · {t.distanceKm} km · {money(t.costUSD ?? 0)}
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function DriverConsole({ user }: { user: AuthUser }) {
  const { vehicles, trips } = useTransitStore();
  const qc = useQueryClient();

  const { data: driver, isLoading } = useQuery({
    queryKey: ["drivers", "me", user.driverId],
    queryFn: () => driversApi.getOne(user.driverId!),
    enabled: !!user.driverId,
  });

  const statusMutation = useMutation({
    mutationFn: (status: DriverStatus) => driversApi.updateMyStatus(status),
    onSuccess: (updated) => {
      qc.setQueryData(["drivers", "me", user.driverId], updated);
      if (user.driverId) qc.setQueryData(["drivers", user.driverId], updated);
      qc.invalidateQueries({ queryKey: ["drivers"] });
      toast.success(`Status updated to ${updated.status.replace("_", " ")}`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update status"),
  });

  const myTrips = trips.filter((t) => t.driverId === driver?.id);
  const currentTrip = myTrips.find((t) => t.status === "dispatched" || t.status === "draft");
  const assignedVehicle = vehicles.find((v) => v.id === currentTrip?.vehicleId || v.status === "on_trip");

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading your driver profile…</div>;
  }

  return (
    <div className="space-y-6">
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
                License: <span className="font-mono font-semibold text-foreground">{driver?.licenseNumber ?? "—"}</span> · Category: <span className="font-semibold text-foreground">{driver?.category ?? "—"}</span>
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
        {/* Current Assigned Vehicle Details */}
        <div className="brutal-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> Assigned Vehicle (Registry Spec)
            </h2>
            <Link to="/vehicles" className="text-xs font-bold text-primary hover:underline">View Vehicle Registry →</Link>
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
              <Link to="/vehicles" className="inline-block text-xs font-bold text-primary hover:underline">Inspect master vehicle registry</Link>
            </div>
          )}
        </div>

        {/* Assigned Trips */}
        <div className="brutal-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <RouteIcon className="h-4 w-4 text-primary" /> My Active / Assigned Trips
            </h2>
            <Link to="/trips" className="text-xs font-bold text-primary hover:underline">All Trips →</Link>
          </div>
          {myTrips.length > 0 ? (
            <div className="space-y-2">
              {myTrips.slice(0, 3).map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-card border border-border-soft flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold">Trip {t.code}</div>
                    <div className="text-xs text-muted-foreground">{t.source} → {t.destination}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground text-sm bg-muted/20 rounded-xl border border-dashed border-border-soft">
              No pending trips assigned to your profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
