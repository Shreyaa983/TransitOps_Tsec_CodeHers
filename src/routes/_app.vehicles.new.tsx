import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { toast } from "sonner";
import type { Vehicle } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/vehicles/new")({
  head: () => ({ meta: [{ title: "Add vehicle — TransitOps" }] }),
  component: NewVehiclePage,
});

function NewVehiclePage() {
  const add = useTransitStore((s) => s.addVehicle);
  const nav = useNavigate();
  const [form, setForm] = useState({
    registration: "", name: "", model: "", type: "Van", capacityKg: 1000, odometerKm: 0, acquisitionCost: 0, fuelType: "Diesel",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.registration || !form.name) return toast.error("Registration and name are required");
    const v: Vehicle = {
      id: `v${Date.now()}`,
      registration: form.registration,
      name: form.name,
      model: form.model || "—",
      type: form.type as Vehicle["type"],
      capacityKg: Number(form.capacityKg),
      odometerKm: Number(form.odometerKm),
      acquisitionCost: Number(form.acquisitionCost),
      fuelType: form.fuelType as Vehicle["fuelType"],
      status: "available",
    };
    add(v);
    toast.success(`${v.name} added to fleet`);
    nav({ to: "/vehicles" });
  };

  return (
    <div>
      <PageHeader title="Add vehicle" subtitle="Register a new vehicle to your fleet." />
      <form onSubmit={submit} className="brutal-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <Field label="Registration #"><Input className="brutal-input" value={form.registration} onChange={(e) => setForm({ ...form, registration: e.target.value })} /></Field>
        <Field label="Vehicle Name"><Input className="brutal-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Model"><Input className="brutal-input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></Field>
        <Field label="Type">
          <select className="brutal-input w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option>Van</option><option>Truck</option><option>Pickup</option><option>Trailer</option>
          </select>
        </Field>
        <Field label="Capacity (kg)"><Input type="number" className="brutal-input" value={form.capacityKg} onChange={(e) => setForm({ ...form, capacityKg: +e.target.value })} /></Field>
        <Field label="Odometer (km)"><Input type="number" className="brutal-input" value={form.odometerKm} onChange={(e) => setForm({ ...form, odometerKm: +e.target.value })} /></Field>
        <Field label="Acquisition Cost ($)"><Input type="number" className="brutal-input" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: +e.target.value })} /></Field>
        <Field label="Fuel Type">
          <select className="brutal-input w-full" value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}>
            <option>Diesel</option><option>Petrol</option><option>Electric</option>
          </select>
        </Field>
        <div className="md:col-span-2 flex gap-2 justify-end pt-2">
          <Button type="button" variant="outline" onClick={() => nav({ to: "/vehicles" })} className="brutal-btn bg-card">Cancel</Button>
          <Button type="submit" className="brutal-btn bg-primary text-primary-foreground hover:bg-primary/90">Save vehicle</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}</Label>{children}</div>;
}
