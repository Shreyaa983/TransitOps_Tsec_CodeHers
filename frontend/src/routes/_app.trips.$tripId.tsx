import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { tripsApi } from "@/lib/trips-api";
import { kg, km, money, shortDate } from "@/lib/format";
import { ArrowLeft, MapPin, ArrowRight, Play, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/trips/$tripId")({
  head: () => ({ meta: [{ title: "Trip — TransitOps" }] }),
  component: TripDetail,
});

function TripDetail() {
  const { tripId } = useParams({ from: "/_app/trips/$tripId" });
  const { vehicles, drivers } = useTransitStore();
  const qc = useQueryClient();

  const { data: t, isLoading, isError } = useQuery({
    queryKey: ["trips", tripId],
    queryFn: () => tripsApi.getOne(tripId),
  });

  const dispatchMutation = useMutation({
    mutationFn: () => tripsApi.dispatch(tripId),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.setQueryData(["trips", tripId], updated);
      toast.success(`Trip ${updated.code} dispatched`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Unable to dispatch");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => tripsApi.cancel(tripId),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.setQueryData(["trips", tripId], updated);
      toast.success(`Trip ${updated.code} cancelled`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to cancel trip");
    },
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading trip details…</div>;
  if (isError || !t) return <EmptyState title="Trip not found" />;

  const v = vehicles.find((x) => x.id === t.vehicleId);
  const d = drivers.find((x) => x.id === t.driverId);

  const timeline = [
    { key: "draft", label: "Draft" },
    { key: "dispatched", label: "Dispatched" },
    { key: "completed", label: "Completed" },
  ];
  const activeIdx = t.status === "cancelled" ? -1 : timeline.findIndex((s) => s.key === t.status);

  return (
    <div>
      <PageHeader
        title={`Trip ${t.code}`}
        subtitle={`${t.source} → ${t.destination}`}
        actions={
          <div className="flex gap-2">
            <Link to="/trips" className="brutal-btn px-3 py-2 bg-card inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Back</Link>
            <Link to="/trips/$tripId/edit" params={{ tripId: t.id }} className="brutal-btn px-3 py-2 bg-card inline-flex items-center gap-1"><Pencil className="h-4 w-4" /> Edit</Link>
            {t.status === "draft" && (
              <Button 
                onClick={() => dispatchMutation.mutate()} 
                disabled={dispatchMutation.isPending} 
                className="brutal-btn bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Play className="h-4 w-4 mr-1" /> Dispatch
              </Button>
            )}
            {t.status === "dispatched" && (
              <Link to="/trips/$tripId/complete" params={{ tripId: t.id }}>
                <Button className="brutal-btn bg-success text-success-foreground"><CheckCircle2 className="h-4 w-4 mr-1" /> Complete</Button>
              </Link>
            )}
            {(t.status === "draft" || t.status === "dispatched") && (
              <Button 
                variant="outline" 
                onClick={() => cancelMutation.mutate()} 
                disabled={cancelMutation.isPending} 
                className="brutal-btn bg-card"
              >
                <XCircle className="h-4 w-4 mr-1" /> Cancel
              </Button>
            )}
          </div>
        }
      />

      {/* Timeline */}
      <div className="brutal-card p-5 mb-4">
        <div className="flex items-center gap-3">
          {timeline.map((s, i) => (
            <div key={s.key} className="flex items-center gap-3 flex-1">
              <div className={`h-9 w-9 rounded-full grid place-items-center brutal-border font-bold text-xs
                ${t.status === "cancelled" ? "bg-muted text-muted-foreground" : i <= activeIdx ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
                {i + 1}
              </div>
              <div>
                <div className="text-xs font-bold uppercase">{s.label}</div>
                <div className="text-[11px] text-muted-foreground">{i === activeIdx ? "Current" : i < activeIdx ? "Done" : "Pending"}</div>
              </div>
              {i < timeline.length - 1 && <div className={`flex-1 h-0.5 ${i < activeIdx ? "bg-primary" : "bg-border-soft"}`} />}
            </div>
          ))}
        </div>
        {t.status === "cancelled" && <div className="mt-3 text-xs font-bold text-destructive">Trip cancelled.</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="brutal-card p-5 lg:col-span-2">
          <h3 className="font-bold mb-4">Route</h3>
          <div className="flex items-center gap-3 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="font-bold">{t.source}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold">{t.destination}</span>
          </div>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
            <Info label="Distance">{km(t.distanceKm)}</Info>
            <Info label="Cargo">{kg(t.cargoKg)}</Info>
            <Info label="Dispatch date">{shortDate(t.dispatchDate)}</Info>
            <Info label="Fuel used">{t.fuelUsedL ? `${t.fuelUsedL} L` : "—"}</Info>
          </dl>
        </div>
        <div className="brutal-card p-5">
          <h3 className="font-bold mb-3">Assignments</h3>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Vehicle</div>
              {v ? <Link to="/vehicles/$vehicleId" params={{ vehicleId: v.id }} className="font-semibold hover:text-primary">{v.name} · {v.registration}</Link> : "—"}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Driver</div>
              {d ? <Link to="/drivers/$driverId" params={{ driverId: d.id }} className="font-semibold hover:text-primary">{d.name}</Link> : "—"}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Estimated cost</div>
              <div className="font-semibold">{money(Math.round(t.distanceKm * 1.6))}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-semibold mt-0.5">{children}</dd></div>;
}
