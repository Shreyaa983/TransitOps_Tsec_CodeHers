import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { vehiclesApi } from "@/lib/vehicles-api";
import { useTransitStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/vehicles/new")({
  head: () => ({ meta: [{ title: "Add vehicle — TransitOps" }] }),
  component: NewVehiclePage,
});

function NewVehiclePage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    registrationNumber: "",
    name: "",
    model: "",
    type: "Van",
    maxLoadCapacity: 1000,
    odometer: 0,
    acquisitionCost: 0,
  });

  const mutation = useMutation({
    mutationFn: () =>
      vehiclesApi.create({
        registrationNumber: form.registrationNumber.trim().toUpperCase(),
        name: form.name.trim(),
        model: form.model.trim(),
        type: form.type,
        maxLoadCapacity: Number(form.maxLoadCapacity),
        odometer: Number(form.odometer),
        acquisitionCost: Number(form.acquisitionCost),
        status: "AVAILABLE",
      }),
    onSuccess: (v) => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      useTransitStore.getState().syncWithBackend();
      toast.success(`${v.name} added to fleet`);
      nav({ to: "/vehicles" });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to add vehicle"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.registrationNumber.trim() || !form.name.trim()) {
      return toast.error("Registration number and name are required");
    }
    if (!form.model.trim()) return toast.error("Model is required");
    mutation.mutate();
  };

  return (
    <div>
      <PageHeader title="Add vehicle" subtitle="Register a new vehicle to your fleet." />
      <form onSubmit={submit} className="brutal-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <Field label="Registration #">
          <Input className="brutal-input" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} placeholder="e.g. KDA-481X" />
        </Field>
        <Field label="Vehicle Name">
          <Input className="brutal-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Model">
          <Input className="brutal-input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        </Field>
        <Field label="Type">
          <select className="brutal-input w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option>Van</option><option>Truck</option><option>Pickup</option><option>Trailer</option>
          </select>
        </Field>
        <Field label="Max Load Capacity (kg)">
          <Input type="number" min={0} className="brutal-input" value={form.maxLoadCapacity} onChange={(e) => setForm({ ...form, maxLoadCapacity: +e.target.value })} />
        </Field>
        <Field label="Odometer (km)">
          <Input type="number" min={0} className="brutal-input" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: +e.target.value })} />
        </Field>
        <Field label="Acquisition Cost ($)">
          <Input type="number" min={0} className="brutal-input" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: +e.target.value })} />
        </Field>
        <div className="md:col-span-2 flex gap-2 justify-end pt-2">
          <Button type="button" variant="outline" onClick={() => nav({ to: "/vehicles" })} className="brutal-btn bg-card">Cancel</Button>
          <Button type="submit" className="brutal-btn bg-primary text-primary-foreground hover:bg-primary/90" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save vehicle"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}</Label>{children}</div>;
}
