import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTransitStore, useAuth } from "@/lib/store";
import { useTranslation, statusKey } from "@/lib/i18n";
import { Plus, Search, MapPin, ArrowRight } from "lucide-react";
import { kg, shortDate, km } from "@/lib/format";
import type { TripStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/trips/")({
  head: () => ({ meta: [{ title: "Trips — TransitOps" }] }),
  component: TripsPage,
});

const statuses: (TripStatus | "all")[] = ["all", "draft", "dispatched", "completed", "cancelled"];

function TripsPage() {
  const { trips, vehicles, drivers } = useTransitStore();
  const user = useAuth((s) => s.user);
  const isDriver = user?.role === "driver";
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<TripStatus | "all">("all");

  const driverProfile = isDriver ? drivers.find(d => d.name === user?.name) : null;

  const relevantTrips = isDriver ? trips.filter(t => t.driverId === driverProfile?.id) : trips;

  const rows = relevantTrips.filter((trip) => (filter === "all" || trip.status === filter) && (!q || `${trip.code} ${trip.source} ${trip.destination}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div>
      <PageHeader
        title={t("trips_title")}
        subtitle={t("trips_subtitle")}
        actions={
          <div className="flex gap-2">
            <Link to="/trips/history" className="brutal-btn px-3 py-2 bg-card">{t("history")}</Link>
            {!isDriver && (
              <Link to="/trips/new"><Button className="brutal-btn bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" /> {t("trips_new")}</Button></Link>
            )}
          </div>
        }
      />

      <div className="brutal-card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("trips_search")} className="pl-9 brutal-input" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map((s) => {
            const key = s === "all" ? null : statusKey(s);
            return (
              <button key={s} onClick={() => setFilter(s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg brutal-border ${filter === s ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}>
                {s === "all" ? t("all") : key ? t(key) : s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map((trip) => {
          const v = vehicles.find((x) => x.id === trip.vehicleId);
          const d = drivers.find((x) => x.id === trip.driverId);
          return (
            <Link key={trip.id} to="/trips/$tripId" params={{ tripId: trip.id }} className="block">
              <div className="brutal-card brutal-card-hover p-5">
                <div className="flex items-center justify-between">
                  <div className="font-mono font-bold text-primary">{trip.code}</div>
                  <StatusBadge status={trip.status} />
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-semibold">{trip.source}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="font-semibold">{trip.destination}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div><div>{t("vehicle")}</div><div className="text-foreground font-semibold">{v?.name ?? "—"}</div></div>
                  <div><div>{t("driver")}</div><div className="text-foreground font-semibold">{d?.name ?? "—"}</div></div>
                  <div><div>{t("trips_cargo")}</div><div className="text-foreground font-semibold">{kg(trip.cargoKg)}</div></div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{km(trip.distanceKm)}</span>
                  <span>{shortDate(trip.dispatchDate)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
