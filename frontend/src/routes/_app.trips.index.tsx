import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTransitStore } from "@/lib/store";
import { tripsApi, type TripStatus } from "@/lib/trips-api";
import { Plus, Search, MapPin, ArrowRight } from "lucide-react";
import { kg, shortDate, km } from "@/lib/format";

export const Route = createFileRoute("/_app/trips/")({
  head: () => ({ meta: [{ title: "Trips — TransitOps" }] }),
  component: TripsPage,
});

const statuses: (TripStatus | "all")[] = ["all", "draft", "dispatched", "completed", "cancelled"];

function TripsPage() {
  const { vehicles, drivers } = useTransitStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<TripStatus | "all">("all");

  const { data: trips = [], isLoading, isError } = useQuery({
    queryKey: ["trips", filter],
    queryFn: () => {
      switch (filter) {
        case "draft": return tripsApi.getDrafts();
        case "dispatched": return tripsApi.getActive();
        case "completed": return tripsApi.getCompleted();
        case "cancelled": return tripsApi.getCancelled();
        default: return tripsApi.list();
      }
    },
  });

  const rows = trips.filter((t) => !q || `${t.code} ${t.source} ${t.destination}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Trip management"
        subtitle="Dispatch, monitor and complete trips."
        actions={
          <div className="flex gap-2">
            <Link to="/trips/history" className="brutal-btn px-3 py-2 bg-card">History</Link>
            <Link to="/trips/new"><Button className="brutal-btn bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" /> New trip</Button></Link>
          </div>
        }
      />

      <div className="brutal-card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search trip code, origin, destination…" className="pl-9 brutal-input" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg brutal-border ${filter === s ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading trips…</div>}
      {isError && <div className="text-sm text-destructive">Failed to load trips. Make sure you are signed in and the backend is running.</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map((t) => {
          const v = vehicles.find((x) => x.id === t.vehicleId);
          const d = drivers.find((x) => x.id === t.driverId);
          return (
            <Link key={t.id} to="/trips/$tripId" params={{ tripId: t.id }} className="block">
              <div className="brutal-card brutal-card-hover p-5">
                <div className="flex items-center justify-between">
                  <div className="font-mono font-bold text-primary">{t.code}</div>
                  <StatusBadge status={t.status} />
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-semibold">{t.source}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="font-semibold">{t.destination}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div><div>Vehicle</div><div className="text-foreground font-semibold">{v?.name ?? "—"}</div></div>
                  <div><div>Driver</div><div className="text-foreground font-semibold">{d?.name ?? "—"}</div></div>
                  <div><div>Cargo</div><div className="text-foreground font-semibold">{kg(t.cargoKg)}</div></div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{km(t.distanceKm)}</span>
                  <span>{shortDate(t.dispatchDate)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
