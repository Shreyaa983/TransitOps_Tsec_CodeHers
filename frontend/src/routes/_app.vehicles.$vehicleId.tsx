import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import { useTransitStore, useAuth } from "@/lib/store";
import { vehiclesApi } from "@/lib/vehicles-api";
import { Button } from "@/components/ui/button";
import { money, km, kg, shortDate } from "@/lib/format";
import { Pencil, FileText, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/_app/vehicles/$vehicleId")({
  head: () => ({ meta: [{ title: "Vehicle — TransitOps" }] }),
  component: VehicleDetail,
});

function VehicleDetail() {
  const { t } = useTranslation();
  const { vehicleId } = useParams({ from: "/_app/vehicles/$vehicleId" });
  const { trips, drivers, maintenance, fuel, expenses } = useTransitStore();
  const user = useAuth((s) => s.user);
  const canEdit = user?.role === "fleet_manager";

  const { data: vehicle, isLoading, isError } = useQuery({
    queryKey: ["vehicles", vehicleId],
    queryFn: () => vehiclesApi.getOne(vehicleId),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">{t("loading")}</div>;
  if (isError || !vehicle) {
    return (
      <EmptyState
        title={t("vehicles_not_found")}
        description={t("vehicles_not_found_body")}
        action={<Link to="/vehicles"><Button className="brutal-btn">{t("vehicles_back")}</Button></Link>}
      />
    );
  }

  const vehicleTrips = trips.filter((trip) => trip.vehicleId === vehicle.id).slice(0, 6);
  const vehicleMx = maintenance.filter((m) => m.vehicleId === vehicle.id);
  const vehicleFuel = fuel.filter((f) => f.vehicleId === vehicle.id);
  const vehicleExp = expenses.filter((e) => e.vehicleId === vehicle.id);
  const currentTrip = trips.find((trip) => trip.vehicleId === vehicle.id && trip.status === "dispatched");
  const assignedDriver = currentTrip ? drivers.find((d) => d.id === currentTrip.driverId) : null;

  return (
    <div>
      <PageHeader
        title={`${vehicle.name} · ${vehicle.registrationNumber}`}
        subtitle={`${vehicle.model} · ${vehicle.type}`}
        actions={
          <div className="flex gap-2">
            <Link to="/vehicles" className="brutal-btn px-3 py-2 bg-card inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> {t("back")}</Link>
            <Link to="/vehicles/$vehicleId/documents" params={{ vehicleId: vehicle.id }} className="brutal-btn px-3 py-2 bg-card inline-flex items-center gap-1"><FileText className="h-4 w-4" /> {t("vehicles_documents")}</Link>
            {canEdit && (
              <Link to="/vehicles/$vehicleId/edit" params={{ vehicleId: vehicle.id }} className="brutal-btn px-3 py-2 bg-primary text-primary-foreground inline-flex items-center gap-1"><Pencil className="h-4 w-4" /> {t("edit")}</Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="brutal-card p-5 lg:col-span-2">
          <h3 className="font-bold mb-3">{t("vehicles_overview")}</h3>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <Info label={t("status")}><StatusBadge status={vehicle.status} /></Info>
            <Info label={t("vehicles_max_load_cap")}>{kg(vehicle.maxLoadCapacity)}</Info>
            <Info label={t("vehicles_col_odometer")}>{km(vehicle.odometer)}</Info>
            <Info label={t("vehicles_acquisition")}>{money(vehicle.acquisitionCost)}</Info>
            <Info label={t("type")}>{vehicle.type}</Info>
            <Info label={t("model")}>{vehicle.model}</Info>
          </dl>
        </div>
        <div className="brutal-card p-5">
          <h3 className="font-bold mb-3">{t("vehicles_assigned")}</h3>
          {currentTrip ? (
            <div className="space-y-2 text-sm">
              <div><div className="text-xs text-muted-foreground">{t("vehicles_trip")}</div><div className="font-semibold">{currentTrip.code}</div></div>
              <div><div className="text-xs text-muted-foreground">{t("vehicles_route")}</div><div>{currentTrip.source} → {currentTrip.destination}</div></div>
              <div><div className="text-xs text-muted-foreground">{t("driver")}</div><div className="font-semibold">{assignedDriver?.name ?? "—"}</div></div>
            </div>
          ) : <div className="text-sm text-muted-foreground">{t("vehicles_no_active_trip")}</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="brutal-card p-5">
          <h3 className="font-bold mb-3">{t("vehicles_recent_trips")}</h3>
          {vehicleTrips.length === 0 ? <div className="text-sm text-muted-foreground">{t("vehicles_no_trips")}</div> : (
            <ul className="space-y-2 text-sm">
              {vehicleTrips.map((trip) => (
                <li key={trip.id} className="flex items-center justify-between">
                  <Link to="/trips/$tripId" params={{ tripId: trip.id }} className="font-semibold hover:text-primary">{trip.code}</Link>
                  <span className="text-muted-foreground text-xs">{trip.source} → {trip.destination}</span>
                  <StatusBadge status={trip.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="brutal-card p-5">
          <h3 className="font-bold mb-3">{t("vehicles_maint_history")}</h3>
          {vehicleMx.length === 0 ? <div className="text-sm text-muted-foreground">{t("vehicles_no_maintenance")}</div> : (
            <ul className="space-y-2 text-sm">
              {vehicleMx.map((m) => (
                <li key={m.id} className="flex items-center justify-between">
                  <span className="font-medium">{m.issue}</span>
                  <span className="text-xs text-muted-foreground">{shortDate(m.createdAt)}</span>
                  <StatusBadge status={m.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="brutal-card p-5">
          <h3 className="font-bold mb-3">{t("vehicles_fuel_history")}</h3>
          {vehicleFuel.length === 0 ? <div className="text-sm text-muted-foreground">{t("vehicles_no_fuel")}</div> : (
            <ul className="space-y-2 text-sm">
              {vehicleFuel.map((f) => (
                <li key={f.id} className="flex items-center justify-between">
                  <span>{f.litres} L · {money(f.litres * f.pricePerL)}</span>
                  <span className="text-xs text-muted-foreground">{shortDate(f.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="brutal-card p-5">
          <h3 className="font-bold mb-3">{t("vehicles_expense_summary")}</h3>
          <div className="text-3xl font-black">{money(vehicleExp.reduce((a, e) => a + e.amount, 0))}</div>
          <div className="text-xs text-muted-foreground mt-1">{t("across_expenses", { count: vehicleExp.length })}</div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-semibold mt-0.5">{children}</dd></div>;
}
