import { createFileRoute } from "@tanstack/react-router";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useTransitStore } from "@/lib/store";
import { money } from "@/lib/format";
export const Route = createFileRoute("/_app/reports/expenses")({
  component: () => {
    const { expenses } = useTransitStore();
    const cats = ["fuel", "maintenance", "tolls", "insurance", "other"].map((c) => ({ c, v: expenses.filter((e) => e.category === c).reduce((a, e) => a + e.amount, 0) }));
    return (
      <div className="brutal-card p-5">
        <h3 className="font-bold mb-3">Monthly cost by category</h3>
        <div className="h-72"><ResponsiveContainer><BarChart data={cats}><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="c" fontSize={11} /><YAxis fontSize={11} tickFormatter={(v) => `$${v}`} /><Tooltip formatter={(v: number) => money(v)} /><Bar dataKey="v" fill="var(--secondary)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </div>
    );
  },
});
