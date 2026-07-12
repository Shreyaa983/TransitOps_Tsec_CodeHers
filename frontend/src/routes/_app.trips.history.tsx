import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import { tripsApi } from "@/lib/trips-api";
import { shortDate, km, kg } from "@/lib/format";

export const Route = createFileRoute("/_app/trips/history")({
  head: () => ({ meta: [{ title: "Trip history — TransitOps" }] }),
  component: TripHistory,
});

function TripHistory() {
  const { data: trips = [], isLoading, isError } = useQuery({
    queryKey: ["trips", "history"],
    queryFn: async () => {
      const all = await tripsApi.list();
      return all.filter((t) => t.status === "completed" || t.status === "cancelled");
    },
  });

  return (
    <div>
      <PageHeader title="Trip history" subtitle="Completed and cancelled trips." />
      
      {isLoading && <div className="text-sm text-muted-foreground mb-4">Loading history…</div>}
      {isError && <div className="text-sm text-destructive mb-4">Failed to load history.</div>}

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
