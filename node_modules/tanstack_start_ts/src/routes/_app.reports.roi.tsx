import { createFileRoute } from "@tanstack/react-router";
import { useTransitStore } from "@/lib/store";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_app/reports/roi")({
  component: () => {
    const { vehicles, expenses } = useTransitStore();
    const rows = vehicles.map((v) => {
      const spent = expenses.filter((e) => e.vehicleId === v.id).reduce((a, e) => a + e.amount, 0);
      const revenue = Math.round(v.odometerKm * 0.9);
      return { v, spent, revenue, roi: revenue - v.acquisitionCost - spent };
    });
    return (
      <div className="brutal-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60"><tr className="text-left">{["Vehicle", "Acquisition", "Spend", "Est. Revenue", "ROI"].map((h) => <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{h}</th>)}</tr></thead>
          <tbody>{rows.map(({ v, spent, revenue, roi }) => (
            <tr key={v.id} className="border-t border-border-soft"><td className="px-4 py-3 font-semibold">{v.name}</td><td className="px-4 py-3">{money(v.acquisitionCost)}</td><td className="px-4 py-3">{money(spent)}</td><td className="px-4 py-3">{money(revenue)}</td><td className={`px-4 py-3 font-bold ${roi >= 0 ? "text-success" : "text-destructive"}`}>{money(roi)}</td></tr>
          ))}</tbody>
        </table>
      </div>
    );
  },
});
