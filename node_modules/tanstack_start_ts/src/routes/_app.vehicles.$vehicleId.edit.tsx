import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { vehiclesApi, type VehicleStatus } from "@/lib/vehicles-api";
import { useTransitStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/vehicles/$vehicleId/edit")({
  head: () => ({ meta: [{ title: "Edit vehicle — TransitOps" }] }),
  component: EditVehiclePage,
});

type FormState = {
  registrationNumber: string;
  name: string;
  model: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
};

function EditVehiclePage() {
  const { vehicleId } = useParams({ from: "/_app/vehicles/$vehicleId/edit" });
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: vehicle, isLoading, isError } = useQuery({
    queryKey: ["vehicles", vehicleId],
    queryFn: () => vehiclesApi.getOne(vehicleId),
  });

  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (vehicle) {
      setForm({
        registrationNumber: vehicle.registrationNumber,
        name: vehicle.name,
        model: vehicle.model,
        type: vehicle.type,
        maxLoadCapacity: vehicle.maxLoadCapacity,
        odometer: vehicle.odometer,
        acquisitionCost: vehicle.acquisitionCost,
        status: vehicle.status,
      });
    }
  }, [vehicle]);

  const mutation = useMutation({
    mutationFn: (body: FormState) => vehiclesApi.update(vehicleId, {
      ...body,
      registrationNumber: body.registrationNumber.trim().toUpperCase(),
    }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.setQueryData(["vehicles", vehicleId], updated);
      useTransitStore.getState().syncWithBackend();
      toast.success("Vehicle updated");
      nav({ to: "/vehicles/$vehicleId", params: { vehicleId } });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Update failed"),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading vehicle…</div>;
  if (isError || !vehicle || !form) return <EmptyState title="Vehicle not found" />;

  return (
    <div>
      <PageHeader title={`Edit ${vehicle.name}`} subtitle={vehicle.registrationNumber} />
      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}
        className="brutal-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl"
      >
        <F label="Vehicle Name">
          <Input className="brutal-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </F>
        <F label="Registration #">
          <Input className="brutal-input" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
        </F>
        <F label="Model">
          <Input className="brutal-input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        </F>
        <F label="Type">
          <select className="brutal-input w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option>Van</option><option>Truck</option><option>Pickup</option><option>Trailer</option>
          </select>
        </F>
        <F label="Max Load Capacity (kg)">
          <Input type="number" min={0} className="brutal-input" value={form.maxLoadCapacity} onChange={(e) => setForm({ ...form, maxLoadCapacity: +e.target.value })} />
        </F>
        <F label="Odometer (km)">
          <Input type="number" min={0} className="brutal-input" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: +e.target.value })} />
        </F>
        <F label="Acquisition Cost ($)">
          <Input type="number" min={0} className="brutal-input" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: +e.target.value })} />
        </F>
        <F label="Status">
          <select className="brutal-input w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="IN_SHOP">In Shop</option>
            <option value="RETIRED">Retired</option>
          </select>
        </F>
        <div className="md:col-span-2 flex gap-2 justify-end pt-2">
          <Button type="button" variant="outline" onClick={() => nav({ to: "/vehicles/$vehicleId", params: { vehicleId } })} className="brutal-btn bg-card">Cancel</Button>
          <Button type="submit" className="brutal-btn bg-primary text-primary-foreground hover:bg-primary/90" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}</Label>{children}</div>;
}
