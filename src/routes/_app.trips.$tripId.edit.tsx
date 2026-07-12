import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/trips/$tripId/edit")({
  head: () => ({ meta: [{ title: "Edit trip — TransitOps" }] }),
  component: EditTrip,
});
function EditTrip() {
  const { tripId } = useParams({ from: "/_app/trips/$tripId/edit" });
  const { trips, updateTrip, vehicles, drivers } = useTransitStore();
  const t = trips.find((x) => x.id === tripId);
  const nav = useNavigate();
  const [form, setForm] = useState(t);
  if (!t || !form) return <EmptyState title="Trip not found" />;
  return (
    <div>
      <PageHeader title={`Edit trip ${t.code}`} />
      <form
        onSubmit={(e) => { e.preventDefault(); updateTrip(t.id, form); toast.success("Trip updated"); nav({ to: "/trips/$tripId", params: { tripId: t.id } }); }}
        className="brutal-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl"
      >
        <F label="Source"><Input className="brutal-input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></F>
        <F label="Destination"><Input className="brutal-input" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></F>
        <F label="Vehicle">
          <select className="brutal-input w-full" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
            <option value="">—</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </F>
        <F label="Driver">
          <select className="brutal-input w-full" value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
            <option value="">—</option>
            {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </F>
        <F label="Cargo (kg)"><Input type="number" className="brutal-input" value={form.cargoKg} onChange={(e) => setForm({ ...form, cargoKg: +e.target.value })} /></F>
        <F label="Distance (km)"><Input type="number" className="brutal-input" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: +e.target.value })} /></F>
        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" className="brutal-btn bg-card" onClick={() => nav({ to: "/trips/$tripId", params: { tripId: t.id } })}>Cancel</Button>
          <Button type="submit" className="brutal-btn bg-primary text-primary-foreground">Save</Button>
        </div>
      </form>
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}</Label>{children}</div>;
}
