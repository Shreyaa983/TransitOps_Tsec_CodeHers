import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { daysUntil } from "@/lib/format";
import type { Trip } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/trips/new")({
  head: () => ({ meta: [{ title: "New trip — TransitOps" }] }),
  component: NewTripPage,
});

function NewTripPage() {
  const { t } = useTranslation();
  const { vehicles, drivers, addTrip } = useTransitStore();
  const nav = useNavigate();
  const [form, setForm] = useState({
    source: "", destination: "", vehicleId: "", driverId: "", cargoKg: 500, distanceKm: 100, dispatchDate: new Date().toISOString().slice(0, 10),
  });

  const eligibleVehicles = useMemo(() => vehicles.filter((v) => v.status === "available"), [vehicles]);
  const eligibleDrivers = useMemo(() => drivers.filter((d) => d.status !== "suspended" && daysUntil(d.licenseExpiry) >= 0), [drivers]);
  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
  const cargoExceeds = selectedVehicle && form.cargoKg > selectedVehicle.capacityKg;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.source || !form.destination) return toast.error(t("trips_source_dest_required"));
    if (cargoExceeds) return toast.error(t("trips_cargo_exceeds", { kg: selectedVehicle!.capacityKg }));
    const trip: Trip = {
      id: `t${Date.now()}`,
      code: `TR-${1000 + Math.floor(Math.random() * 9000)}`,
      source: form.source, destination: form.destination,
      vehicleId: form.vehicleId, driverId: form.driverId,
      cargoKg: Number(form.cargoKg), distanceKm: Number(form.distanceKm),
      dispatchDate: new Date(form.dispatchDate).toISOString(),
      status: "draft",
    };
    addTrip(trip);
    toast.success(t("trips_created", { code: trip.code }));
    nav({ to: "/trips/$tripId", params: { tripId: trip.id } });
  };

  return (
    <div>
      <PageHeader title={t("trips_create_title")} subtitle={t("trips_create_subtitle")} />
      <form onSubmit={submit} className="brutal-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <F label={t("trips_source")}><Input className="brutal-input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></F>
        <F label={t("trips_destination")}><Input className="brutal-input" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></F>
        <F label={t("vehicle")}>
          <select className="brutal-input w-full" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
            <option value="">{t("trips_select_vehicle")}</option>
            {eligibleVehicles.map((v) => (<option key={v.id} value={v.id}>{v.name} · {v.registration} · capacity {v.capacityKg}kg</option>))}
          </select>
        </F>
        <F label={t("driver")}>
          <select className="brutal-input w-full" value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
            <option value="">{t("trips_select_driver")}</option>
            {eligibleDrivers.map((d) => (<option key={d.id} value={d.id}>{d.name} · {d.category}</option>))}
          </select>
        </F>
        <F label={t("trips_cargo_kg")}>
          <Input type="number" className="brutal-input" value={form.cargoKg} onChange={(e) => setForm({ ...form, cargoKg: +e.target.value })} />
          {cargoExceeds && <p className="text-xs text-destructive mt-1">{t("trips_exceeds_capacity", { kg: selectedVehicle!.capacityKg })}</p>}
        </F>
        <F label={t("trips_distance_km")}><Input type="number" className="brutal-input" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: +e.target.value })} /></F>
        <F label={t("trips_dispatch_date")}><Input type="date" className="brutal-input" value={form.dispatchDate} onChange={(e) => setForm({ ...form, dispatchDate: e.target.value })} /></F>
        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" className="brutal-btn bg-card" onClick={() => nav({ to: "/trips" })}>{t("cancel")}</Button>
          <Button type="submit" className="brutal-btn bg-primary text-primary-foreground hover:bg-primary/90">{t("trips_save_draft")}</Button>
        </div>
      </form>
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}</Label>{children}</div>;
}
