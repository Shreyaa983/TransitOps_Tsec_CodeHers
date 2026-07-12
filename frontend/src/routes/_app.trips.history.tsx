import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import { useTransitStore } from "@/lib/store";
import { shortDate, km, kg } from "@/lib/format";

export const Route = createFileRoute("/_app/trips/history")({
  head: () => ({ meta: [{ title: "Trip history — TransitOps" }] }),
  component: TripHistory,
});
function TripHistory() {
  const trips = useTransitStore((s) => s.trips).filter((t) => t.status === "completed" || t.status === "cancelled");
  return (
    <div>
      <PageHeader title="Trip history" subtitle="Completed and cancelled trips." />
      <div className="brutal-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr className="text-left">
              {["Code", "Route", "Cargo", "Distance", "Date", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t.id} className="border-t border-border-soft hover:bg-muted/40">
                <td className="px-4 py-3"><Link to="/trips/$tripId" params={{ tripId: t.id }} className="font-mono font-semibold text-primary">{t.code}</Link></td>
                <td className="px-4 py-3">{t.source} → {t.destination}</td>
                <td className="px-4 py-3">{kg(t.cargoKg)}</td>
                <td className="px-4 py-3">{km(t.distanceKm)}</td>
                <td className="px-4 py-3">{shortDate(t.dispatchDate)}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
