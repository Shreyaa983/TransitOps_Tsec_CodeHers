import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { kg, km, money, shortDate } from "@/lib/format";
import { ArrowLeft, MapPin, ArrowRight, Play, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/trips/$tripId")({
  head: () => ({ meta: [{ title: "Trip — TransitOps" }] }),
  component: TripDetail,
});

function TripDetail() {
  const { t } = useTranslation();
  const { tripId } = useParams({ from: "/_app/trips/$tripId" });
  const { trips, vehicles, drivers, dispatchTrip, completeTrip, cancelTrip } = useTransitStore();
  const trip = trips.find((x) => x.id === tripId);
  if (!trip) return <EmptyState title={t("trips_not_found")} />;
  const v = vehicles.find((x) => x.id === trip.vehicleId);
  const d = drivers.find((x) => x.id === trip.driverId);

  const timeline = [
    { key: "draft", label: t("trips_timeline_draft") },
    { key: "dispatched", label: t("trips_timeline_dispatched") },
    { key: "completed", label: t("trips_timeline_completed") },
  ];
  const activeIdx = trip.status === "cancelled" ? -1 : timeline.findIndex((s) => s.key === trip.status);

  const doDispatch = async () => {
    const res = await dispatchTrip(trip.id);
    if (!res.ok) return toast.error(res.error ?? t("trips_dispatch_failed"));
    toast.success(t("trips_dispatched", { code: trip.code }));
  };

  return (
    <div>
      <PageHeader
        title={t("trips_trip_code", { code: trip.code })}
        subtitle={`${trip.source} → ${trip.destination}`}
        actions={
          <div className="flex gap-2">
            <Link to="/trips" className="brutal-btn px-3 py-2 bg-card inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> {t("back")}</Link>
            <Link to="/trips/$tripId/edit" params={{ tripId: trip.id }} className="brutal-btn px-3 py-2 bg-card inline-flex items-center gap-1"><Pencil className="h-4 w-4" /> {t("edit")}</Link>
            {trip.status === "draft" && (
              <Button onClick={doDispatch} className="brutal-btn bg-primary text-primary-foreground hover:bg-primary/90"><Play className="h-4 w-4 mr-1" /> {t("dispatch")}</Button>
            )}
            {trip.status === "dispatched" && (
              <Button onClick={() => { completeTrip(trip.id); toast.success(t("trips_completed")); }} className="brutal-btn bg-success text-success-foreground"><CheckCircle2 className="h-4 w-4 mr-1" /> {t("complete")}</Button>
            )}
            {(trip.status === "draft" || trip.status === "dispatched") && (
              <Button variant="outline" onClick={() => { cancelTrip(trip.id); toast.success(t("trips_cancelled")); }} className="brutal-btn bg-card"><XCircle className="h-4 w-4 mr-1" /> {t("status_cancelled")}</Button>
            )}
          </div>
        }
      />

      <div className="brutal-card p-5 mb-4">
        <div className="flex items-center gap-3">
          {timeline.map((s, i) => (
            <div key={s.key} className="flex items-center gap-3 flex-1">
              <div className={`h-9 w-9 rounded-full grid place-items-center brutal-border font-bold text-xs
                ${trip.status === "cancelled" ? "bg-muted text-muted-foreground" : i <= activeIdx ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
                {i + 1}
              </div>
              <div>
                <div className="text-xs font-bold uppercase">{s.label}</div>
                <div className="text-[11px] text-muted-foreground">{i === activeIdx ? t("status_current") : i < activeIdx ? t("status_done") : t("status_pending")}</div>
              </div>
              {i < timeline.length - 1 && <div className={`flex-1 h-0.5 ${i < activeIdx ? "bg-primary" : "bg-border-soft"}`} />}
            </div>
          ))}
        </div>
        {trip.status === "cancelled" && <div className="mt-3 text-xs font-bold text-destructive">{t("trips_cancelled_msg")}</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="brutal-card p-5 lg:col-span-2">
          <h3 className="font-bold mb-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {t("vehicles_route")}</h3>
          <div className="flex items-center gap-2 text-lg font-bold">
            {trip.source} <ArrowRight className="h-4 w-4 text-muted-foreground" /> {trip.destination}
          </div>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            <Info label={t("trips_col_distance")}>{km(trip.distanceKm)}</Info>
            <Info label={t("trips_cargo")}>{kg(trip.cargoKg)}</Info>
            <Info label={t("trips_dispatch_date")}>{shortDate(trip.dispatchDate)}</Info>
            <Info label={t("trips_fuel_used")}>{trip.fuelUsedL ? `${trip.fuelUsedL} L` : "—"}</Info>
          </dl>
        </div>
        <div className="brutal-card p-5">
          <h3 className="font-bold mb-3">{t("trips_assignments")}</h3>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">{t("vehicle")}</div>
              {v ? <Link to="/vehicles/$vehicleId" params={{ vehicleId: v.id }} className="font-semibold hover:text-primary">{v.name} · {v.registration}</Link> : "—"}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t("driver")}</div>
              {d ? <Link to="/drivers/$driverId" params={{ driverId: d.id }} className="font-semibold hover:text-primary">{d.name}</Link> : "—"}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t("trips_estimated_cost")}</div>
              <div className="font-semibold">{money(trip.costUSD ?? Math.round(trip.distanceKm * 1.6))}</div>
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
