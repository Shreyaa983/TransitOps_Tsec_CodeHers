import { createFileRoute } from "@tanstack/react-router";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useTransitStore } from "@/lib/store";

export const Route = createFileRoute("/_app/reports/fleet")({
  component: () => {
    const { vehicles } = useTransitStore();
    const data = ["available", "on_trip", "in_shop", "retired"].map((s) => ({ status: s, count: vehicles.filter((v) => v.status === s).length }));
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="brutal-card p-5">
          <h3 className="font-bold mb-3">Fleet utilization</h3>
          <div className="h-64"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="status" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </div>
        <div className="brutal-card p-5">
          <h3 className="font-bold mb-3">Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Total vehicles" value={vehicles.length} />
            <Stat label="Active" value={vehicles.filter((v) => v.status !== "retired").length} />
            <Stat label="On trip now" value={vehicles.filter((v) => v.status === "on_trip").length} />
            <Stat label="In shop" value={vehicles.filter((v) => v.status === "in_shop").length} />
          </div>
        </div>
      </div>
    );
  },
});
function Stat({ label, value }: { label: string; value: number }) {
  return <div><div className="text-3xl font-black">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>;
}
