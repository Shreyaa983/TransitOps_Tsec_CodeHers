import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import { useTransitStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { shortDate, km, kg } from "@/lib/format";

export const Route = createFileRoute("/_app/trips/history")({
  head: () => ({ meta: [{ title: "Trip history — TransitOps" }] }),
  component: TripHistory,
});

function TripHistory() {
  const { t } = useTranslation();
  const trips = useTransitStore((s) => s.trips).filter((trip) => trip.status === "completed" || trip.status === "cancelled");
  const headers = ["trips_col_code", "trips_col_route", "trips_cargo", "trips_col_distance", "date", "status"] as const;

  return (
    <div>
      <PageHeader title={t("trips_history_title")} subtitle={t("trips_history_subtitle")} />
      <div className="brutal-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr className="text-left">
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr key={trip.id} className="border-t border-border-soft hover:bg-muted/40">
                <td className="px-4 py-3"><Link to="/trips/$tripId" params={{ tripId: trip.id }} className="font-mono font-semibold text-primary">{trip.code}</Link></td>
                <td className="px-4 py-3">{trip.source} → {trip.destination}</td>
                <td className="px-4 py-3">{kg(trip.cargoKg)}</td>
                <td className="px-4 py-3">{km(trip.distanceKm)}</td>
                <td className="px-4 py-3">{shortDate(trip.dispatchDate)}</td>
                <td className="px-4 py-3"><StatusBadge status={trip.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
