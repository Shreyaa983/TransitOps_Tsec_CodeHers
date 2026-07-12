import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity, BarChart3, Download, Fuel, Loader2, TrendingUp, DollarSign, Truck,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { reportsApi, type ReportsAnalytics } from "@/lib/reports-api";
import { exportReportsCsv, exportReportsPdf } from "@/lib/reports-export";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_app/reports/")({
  head: () => ({ meta: [{ title: "Reports & Analytics — TransitOps" }] }),
  component: ReportsAnalyticsPage,
});

const PIE_COLORS = ["var(--primary)", "var(--success)", "var(--warning)", "var(--muted-foreground)"];

function ReportsAnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["reports", "analytics"],
    queryFn: () => reportsApi.getAnalytics(),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading reports…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="brutal-card p-8 text-center text-destructive">
        {error instanceof Error ? error.message : "Failed to load reports data."}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Fuel efficiency, fleet utilization, operational cost, and vehicle ROI."
        actions={<ExportButtons data={data} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <SummaryCard
          icon={Fuel}
          label="Fuel Efficiency"
          value={data.summary.fuelEfficiencyKmPerLiter != null ? `${data.summary.fuelEfficiencyKmPerLiter} km/L` : "—"}
          hint={`${data.summary.totalDistanceKm.toLocaleString()} km ÷ ${data.summary.totalFuelLiters.toLocaleString()} L`}
          formula={data.formulas.fuelEfficiency}
          delay={0}
        />
        <SummaryCard
          icon={Activity}
          label="Fleet Utilization"
          value={`${data.summary.fleetUtilizationPct}%`}
          hint={`${data.summary.onTripCount} of ${data.summary.activeFleetCount} active vehicles on trip`}
          formula={data.formulas.fleetUtilization}
          delay={0.04}
        />
        <SummaryCard
          icon={DollarSign}
          label="Operational Cost"
          value={money(data.summary.operationalCost)}
          hint="Fuel + maintenance + tolls & other"
          formula={data.formulas.operationalCost}
          delay={0.08}
        />
        <SummaryCard
          icon={TrendingUp}
          label="Avg Vehicle ROI"
          value={data.summary.avgRoiPct != null ? `${data.summary.avgRoiPct}%` : "—"}
          hint={`Total revenue ${money(data.summary.totalRevenue)}`}
          formula={data.formulas.vehicleRoi}
          delay={0.12}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Fuel Efficiency Trend (km/L)" icon={Fuel}>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={data.charts.fuelEfficiencyTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip
                  formatter={(v: number, name: string) =>
                    name === "efficiency" ? [`${v} km/L`, "Efficiency"] : [v, name]
                  }
                />
                <Line type="monotone" dataKey="efficiency" stroke="var(--warning)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Operational Cost Trend" icon={BarChart3}>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.charts.operationalCostTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="var(--secondary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Cost Breakdown" icon={DollarSign}>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.charts.costBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="category" fontSize={11} width={90} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]} fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Fleet Status Distribution" icon={Truck}>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.charts.fleetStatusBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {data.charts.fleetStatusBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mt-2">
            {data.charts.fleetStatusBreakdown.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: PIE_COLORS[i] }} />
                <span className="text-muted-foreground">{item.name}</span>
                <span className="ml-auto font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="brutal-card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border-soft">
          <h3 className="font-bold">Vehicle ROI</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {data.formulas.vehicleRoi} · {data.formulas.revenueNote}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="text-left">
                {["Vehicle", "Acquisition", "Revenue", "Fuel", "Maintenance", "Net Return", "ROI %"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.vehicleRoi.map((row) => (
                <tr key={row.id} className="border-t border-border-soft">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{row.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{row.registration}</div>
                  </td>
                  <td className="px-4 py-3">{money(row.acquisitionCost)}</td>
                  <td className="px-4 py-3">{money(row.revenue)}</td>
                  <td className="px-4 py-3">{money(row.fuelCost)}</td>
                  <td className="px-4 py-3">{money(row.maintenanceCost)}</td>
                  <td className={`px-4 py-3 font-semibold ${row.netReturn >= 0 ? "text-success" : "text-destructive"}`}>
                    {money(row.netReturn)}
                  </td>
                  <td className={`px-4 py-3 font-bold ${(row.roiPct ?? 0) >= 0 ? "text-success" : "text-destructive"}`}>
                    {row.roiPct != null ? `${row.roiPct}%` : "—"}
                  </td>
                </tr>
              ))}
              {data.vehicleRoi.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No active vehicles to calculate ROI.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  formula,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  formula: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="brutal-card p-4"
    >
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-[10px] font-mono text-muted-foreground">{formula}</span>
      </div>
      <div className="mt-2 text-2xl font-black tracking-tight">{value}</div>
      <div className="text-[11px] font-semibold text-muted-foreground mt-1">{label}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>
    </motion.div>
  );
}

function ChartCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="brutal-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">{title}</h3>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      {children}
    </div>
  );
}

function ExportButtons({ data }: { data: ReportsAnalytics }) {
  const exportCsv = () => {
    exportReportsCsv(data);
    toast.success("CSV exported");
  };

  const exportPdf = () => {
    try {
      exportReportsPdf(data);
      toast.success("PDF exported");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export PDF");
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={exportCsv} className="brutal-btn bg-primary text-primary-foreground">
        <Download className="h-4 w-4 mr-1" /> Export CSV
      </Button>
      <Button variant="outline" onClick={exportPdf} className="brutal-btn bg-card">
        <Download className="h-4 w-4 mr-1" /> Export PDF
      </Button>
    </div>
  );
}
