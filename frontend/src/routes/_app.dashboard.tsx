import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Truck, CheckCircle2, Wrench, Route as RouteIcon, Clock, Users, Activity, TrendingUp, AlertTriangle, Sparkles, Fuel } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { useTransitStore } from "@/lib/store";
import { PageHeader } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import { daysUntil, money } from "@/lib/format";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TransitOps" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { vehicles, drivers, trips, maintenance, expenses } = useTransitStore();

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
