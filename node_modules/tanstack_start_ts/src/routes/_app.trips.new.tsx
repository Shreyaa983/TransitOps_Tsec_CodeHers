import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { tripsApi } from "@/lib/trips-api";
import { driversApi } from "@/lib/drivers-api";
import { toast } from "sonner";
import { daysUntil } from "@/lib/format";

export const Route = createFileRoute("/_app/trips/new")({
  head: () => ({ meta: [{ title: "New trip — TransitOps" }] }),
  component: NewTripPage,
});

function NewTripPage() {
  const { vehicles } = useTransitStore();
  const nav = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    source: "", destination: "", vehicleId: "", driverId: "", cargoKg: 500, distanceKm: 100, dispatchDate: new Date().toISOString().slice(0, 10),
  });

  const { data: availableDrivers = [] } = useQuery({
    queryKey: ["drivers", "available"],
    queryFn: () => driversApi.getAvailable(),
  });

  const mutation = useMutation({
    mutationFn: (body: { vehicle: string; driver: string; source: string; destination: string; cargoWeight: number; plannedDistance: number }) =>
      tripsApi.create(body),
    onSuccess: (newTrip) => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success(`Trip ${newTrip.code} created`);
      nav({ to: "/trips/$tripId", params: { tripId: newTrip.id } });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create trip");
    },
  });

  // Eligible vehicles: available (not retired, not in shop, not on trip)
  const eligibleVehicles = useMemo(() => vehicles.filter((v) => v.status === "available"), [vehicles]);
  const eligibleDrivers = availableDrivers;
  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
  const cargoExceeds = selectedVehicle && form.cargoKg > selectedVehicle.capacityKg;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.source || !form.destination) return toast.error("Enter source and destination");
    if (cargoExceeds) return toast.error(`Cargo exceeds vehicle capacity (${selectedVehicle!.capacityKg}kg)`);
    if (!form.vehicleId || !form.driverId) return toast.error("Select both a vehicle and a driver");

    mutation.mutate({
      vehicle: form.vehicleId,
      driver: form.driverId,
      source: form.source,
      destination: form.destination,
      cargoWeight: Number(form.cargoKg),
      plannedDistance: Number(form.distanceKm),
    });
  };

  return (
    <div>
      <PageHeader title="Create trip" subtitle="Draft a new trip. Dispatch it from the trip detail page." />
      <form onSubmit={submit} className="brutal-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <F label="Source"><Input className="brutal-input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} required /></F>
        <F label="Destination"><Input className="brutal-input" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required /></F>
        <F label="Vehicle">
          <select className="brutal-input w-full" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
            <option value="">Select an available vehicle…</option>
            {eligibleVehicles.map((v) => (<option key={v.id} value={v.id}>{v.name} · {v.registration} · capacity {v.capacityKg}kg</option>))}
          </select>
        </F>
        <F label="Driver">
          <select className="brutal-input w-full" value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} required>
            <option value="">Select an eligible driver…</option>
            {eligibleDrivers.map((d) => (<option key={d.id} value={d.id}>{d.name} · {d.category}</option>))}
          </select>
        </F>
        <F label="Cargo (kg)">
          <Input type="number" className="brutal-input" value={form.cargoKg} onChange={(e) => setForm({ ...form, cargoKg: +e.target.value })} required />
          {cargoExceeds && <p className="text-xs text-destructive mt-1">Exceeds capacity of {selectedVehicle!.capacityKg}kg</p>}
        </F>
        <F label="Distance (km)"><Input type="number" className="brutal-input" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: +e.target.value })} required /></F>
        <F label="Dispatch date"><Input type="date" className="brutal-input" value={form.dispatchDate} onChange={(e) => setForm({ ...form, dispatchDate: e.target.value })} required /></F>
        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" className="brutal-btn bg-card" onClick={() => nav({ to: "/trips" })}>Cancel</Button>
          <Button type="submit" className="brutal-btn bg-primary text-primary-foreground hover:bg-primary/90" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Save as draft"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}</Label>{children}</div>;
}
