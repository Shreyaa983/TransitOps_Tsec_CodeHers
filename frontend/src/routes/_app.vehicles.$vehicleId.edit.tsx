import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/vehicles/$vehicleId/edit")({
  head: () => ({ meta: [{ title: "Edit vehicle — TransitOps" }] }),
  component: EditVehiclePage,
});

function EditVehiclePage() {
  const { vehicleId } = useParams({ from: "/_app/vehicles/$vehicleId/edit" });
  const v = useTransitStore((s) => s.vehicles.find((x) => x.id === vehicleId));
  const update = useTransitStore((s) => s.updateVehicle);
  const nav = useNavigate();
  const [form, setForm] = useState(v);

  if (!v || !form) return <EmptyState title="Vehicle not found" />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    update(v.id, form);
    toast.success("Vehicle updated");
    nav({ to: "/vehicles/$vehicleId", params: { vehicleId: v.id } });
  };

  return (
    <div>
      <PageHeader title={`Edit ${v.name}`} subtitle={v.registration} />
      <form onSubmit={submit} className="brutal-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <F label="Vehicle Name"><Input className="brutal-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></F>
        <F label="Registration"><Input className="brutal-input" value={form.registration} onChange={(e) => setForm({ ...form, registration: e.target.value })} /></F>
        <F label="Model"><Input className="brutal-input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></F>
        <F label="Type">
          <select className="brutal-input w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}>
            <option>Van</option><option>Truck</option><option>Pickup</option><option>Trailer</option>
          </select>
        </F>
        <F label="Capacity (kg)"><Input type="number" className="brutal-input" value={form.capacityKg} onChange={(e) => setForm({ ...form, capacityKg: +e.target.value })} /></F>
        <F label="Odometer (km)"><Input type="number" className="brutal-input" value={form.odometerKm} onChange={(e) => setForm({ ...form, odometerKm: +e.target.value })} /></F>
        <F label="Status">
          <select className="brutal-input w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}>
            <option value="available">Available</option><option value="on_trip">On Trip</option><option value="in_shop">In Shop</option><option value="retired">Retired</option>
          </select>
        </F>
        <F label="Fuel Type">
          <select className="brutal-input w-full" value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value as typeof form.fuelType })}>
            <option>Diesel</option><option>Petrol</option><option>Electric</option>
          </select>
        </F>
        <div className="md:col-span-2 flex gap-2 justify-end pt-2">
          <Button type="button" variant="outline" onClick={() => nav({ to: "/vehicles/$vehicleId", params: { vehicleId: v.id } })} className="brutal-btn bg-card">Cancel</Button>
          <Button type="submit" className="brutal-btn bg-primary text-primary-foreground hover:bg-primary/90">Save changes</Button>
        </div>
      </form>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}</Label>{children}</div>;
}
