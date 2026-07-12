import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { useTransitStore } from "@/lib/store";
import { money, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_app/fuel/history")({
  head: () => ({ meta: [{ title: "Fuel history — TransitOps" }] }),
  component: () => {
    const { fuel, vehicles } = useTransitStore();
    const total = fuel.reduce((a, f) => a + f.litres * f.pricePerL, 0);
    return (
      <div>
        <PageHeader title="Fuel history" subtitle={`Total spend: ${money(total)}`} />
        <div className="brutal-card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60"><tr className="text-left">{["Date", "Vehicle", "Litres", "Total"].map((h) => <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>{fuel.map((f) => { const v = vehicles.find((x) => x.id === f.vehicleId); return (
              <tr key={f.id} className="border-t border-border-soft"><td className="px-4 py-3">{shortDate(f.date)}</td><td className="px-4 py-3">{v?.name}</td><td className="px-4 py-3">{f.litres} L</td><td className="px-4 py-3 font-semibold">{money(f.litres * f.pricePerL)}</td></tr>
            ); })}</tbody>
          </table>
        </div>
      </div>
    );
  },
});
