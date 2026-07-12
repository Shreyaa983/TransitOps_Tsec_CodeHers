import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import { useTransitStore } from "@/lib/store";
import { Progress } from "@/components/ui/progress";
import { daysUntil, shortDate } from "@/lib/format";
import { driversApi } from "@/lib/drivers-api";
import { AlertTriangle, Pencil, ArrowLeft, IdCard } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/_app/drivers/$driverId/")({
  head: () => ({ meta: [{ title: "Driver — TransitOps" }] }),
  component: DriverDetail,
});

function DriverDetail() {
  const { t } = useTranslation();
  const { driverId } = useParams({ from: "/_app/drivers/$driverId/" });
  const trips = useTransitStore((s) => s.trips);
  const vehicles = useTransitStore((s) => s.vehicles);

  const { data: d, isLoading, isError } = useQuery({
    queryKey: ["drivers", driverId],
    queryFn: () => driversApi.getOne(driverId),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">{t("drivers_loading_one")}</div>;
  if (isError || !d) return <EmptyState title={t("drivers_not_found")} />;

  const driverTrips = trips.filter((trip) => trip.driverId === d.id);
  const days = daysUntil(d.licenseExpiry);
  const expired = days < 0;

  return (
    <div>
      <PageHeader
        title={d.name}
        subtitle={t("drivers_license_info", { number: d.licenseNumber, category: d.category })}
        actions={
          <div className="flex gap-2">
            <Link to="/drivers" className="brutal-btn px-3 py-2 bg-card inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> {t("back")}</Link>
            <Link to="/drivers/$driverId/licenses" params={{ driverId: d.id }} className="brutal-btn px-3 py-2 bg-card inline-flex items-center gap-1"><IdCard className="h-4 w-4" /> {t("drivers_licenses_btn")}</Link>
            <Link to="/drivers/$driverId/edit" params={{ driverId: d.id }} className="brutal-btn px-3 py-2 bg-primary text-primary-foreground inline-flex items-center gap-1"><Pencil className="h-4 w-4" /> {t("edit")}</Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="brutal-card p-5">
          <h3 className="font-bold mb-3">{t("drivers_profile")}</h3>
          <dl className="space-y-2 text-sm">
            <Row label={t("status")}><StatusBadge status={d.status} /></Row>
            <Row label={t("drivers_phone")}>{d.phone}</Row>
            <Row label={t("drivers_license_expiry")} tone={expired ? "danger" : days < 15 ? "warning" : "default"}>
              {(expired || days < 15) && <AlertTriangle className="h-3 w-3 inline mr-1" />}{shortDate(d.licenseExpiry)}
            </Row>
          </dl>
        </div>
        <div className="brutal-card p-5 lg:col-span-2">
          <h3 className="font-bold mb-3">{t("drivers_safety_score")}</h3>
          <div className="text-5xl font-black">{d.safetyScore}<span className="text-lg text-muted-foreground">{t("drivers_score_of")}</span></div>
          <Progress value={d.safetyScore} className="mt-3 h-3" />
          <p className="text-xs text-muted-foreground mt-3">{t("drivers_score_desc")}</p>
        </div>
      </div>

      <div className="brutal-card p-5">
        <h3 className="font-bold mb-3">{t("drivers_trip_history")}</h3>
        {driverTrips.length === 0 ? <div className="text-sm text-muted-foreground">{t("drivers_no_trips")}</div> : (
          <ul className="space-y-2 text-sm">
            {driverTrips.map((trip) => {
              const v = vehicles.find((x) => x.id === trip.vehicleId);
              return (
                <li key={trip.id} className="flex items-center justify-between border-b border-border-soft last:border-0 pb-2">
                  <div>
                    <Link to="/trips/$tripId" params={{ tripId: trip.id }} className="font-semibold hover:text-primary">{trip.code}</Link>
                    <span className="text-muted-foreground ml-2">{trip.source} → {trip.destination}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{v?.name}</span>
                    <StatusBadge status={trip.status} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Row({ label, children, tone = "default" }: { label: string; children: React.ReactNode; tone?: "default" | "warning" | "danger" }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`font-semibold ${tone === "warning" ? "text-warning" : tone === "danger" ? "text-destructive" : ""}`}>{children}</dd>
    </div>
  );
}
