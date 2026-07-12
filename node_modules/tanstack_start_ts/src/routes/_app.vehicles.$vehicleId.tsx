import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import { useTransitStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { money, km, kg, shortDate } from "@/lib/format";
import { Pencil, FileText, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/vehicles/$vehicleId")({
  head: () => ({ meta: [{ title: "Vehicle — TransitOps" }] }),
  component: VehicleDetail,
});

function VehicleDetail() {
  const { vehicleId } = useParams({ from: "/_app/vehicles/$vehicleId" });
  const { vehicles, trips, drivers, maintenance, fuel, expenses } = useTransitStore();
  const v = vehicles.find((x) => x.id === vehicleId);
  const nav = useNavigate();

  if (!v) return <EmptyState title="Vehicle not found" description="It may have been removed from the fleet." action={<Link to="/vehicles"><Button className="brutal-btn">Back to vehicles</Button></Link>} />;

  const vehicleTrips = trips.filter((t) => t.vehicleId === v.id).slice(0, 6);
  const vehicleMx = maintenance.filter((m) => m.vehicleId === v.id);
  const vehicleFuel = fuel.filter((f) => f.vehicleId === v.id);
  const vehicleExp = expenses.filter((e) => e.vehicleId === v.id);
  const currentTrip = trips.find((t) => t.vehicleId === v.id && t.status === "dispatched");
  const assignedDriver = currentTrip ? drivers.find((d) => d.id === currentTrip.driverId) : null;

  return (
    <div>
      <PageHeader
        title={`${v.name} · ${v.registration}`}
        subtitle={`${v.model} · ${v.type}`}
        actions={
          <div className="flex gap-2">
            <Link to="/vehicles" className="brutal-btn px-3 py-2 bg-card inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Back</Link>
            <Link to="/vehicles/$vehicleId/documents" params={{ vehicleId: v.id }} className="brutal-btn px-3 py-2 bg-card inline-flex items-center gap-1"><FileText className="h-4 w-4" /> Documents</Link>
            <Link to="/vehicles/$vehicleId/edit" params={{ vehicleId: v.id }} className="brutal-btn px-3 py-2 bg-primary text-primary-foreground inline-flex items-center gap-1"><Pencil className="h-4 w-4" /> Edit</Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="brutal-card p-5 lg:col-span-2">
          <h3 className="font-bold mb-3">Overview</h3>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <Info label="Status"><StatusBadge status={v.status} /></Info>
            <Info label="Capacity">{kg(v.capacityKg)}</Info>
            <Info label="Odometer">{km(v.odometerKm)}</Info>
            <Info label="Fuel type">{v.fuelType}</Info>
            <Info label="Acquisition cost">{money(v.acquisitionCost)}</Info>
            <Info label="Type">{v.type}</Info>
          </dl>
        </div>
        <div className="brutal-card p-5">
          <h3 className="font-bold mb-3">Currently assigned</h3>
          {currentTrip ? (
            <div className="space-y-2 text-sm">
              <div><div className="text-xs text-muted-foreground">Trip</div><div className="font-semibold">{currentTrip.code}</div></div>
              <div><div className="text-xs text-muted-foreground">Route</div><div>{currentTrip.source} → {currentTrip.destination}</div></div>
              <div><div className="text-xs text-muted-foreground">Driver</div><div className="font-semibold">{assignedDriver?.name ?? "—"}</div></div>
            </div>
          ) : <div className="text-sm text-muted-foreground">No active trip.</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="brutal-card p-5">
          <h3 className="font-bold mb-3">Recent trips</h3>
          {vehicleTrips.length === 0 ? <div className="text-sm text-muted-foreground">No trips yet.</div> : (
            <ul className="space-y-2 text-sm">
              {vehicleTrips.map((t) => (
                <li key={t.id} className="flex items-center justify-between">
                  <Link to="/trips/$tripId" params={{ tripId: t.id }} className="font-semibold hover:text-primary">{t.code}</Link>
                  <span className="text-muted-foreground text-xs">{t.source} → {t.destination}</span>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="brutal-card p-5">
          <h3 className="font-bold mb-3">Maintenance history</h3>
          {vehicleMx.length === 0 ? <div className="text-sm text-muted-foreground">No maintenance records.</div> : (
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
          <h3 className="font-bold mb-3">Fuel history</h3>
          {vehicleFuel.length === 0 ? <div className="text-sm text-muted-foreground">No fuel logs.</div> : (
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
          <h3 className="font-bold mb-3">Expense summary</h3>
          <div className="text-3xl font-black">{money(vehicleExp.reduce((a, e) => a + e.amount, 0))}</div>
          <div className="text-xs text-muted-foreground mt-1">Across {vehicleExp.length} recorded expenses</div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-semibold mt-0.5">{children}</dd></div>;
}
