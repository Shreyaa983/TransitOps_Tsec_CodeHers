import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTransitStore } from "@/lib/store";
import { tripsApi } from "@/lib/trips-api";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/trips/$tripId/complete")({
  head: () => ({ meta: [{ title: "Complete trip — TransitOps" }] }),
  component: CompleteAction,
});

function CompleteAction() {
  const { tripId } = useParams({ from: "/_app/trips/$tripId/complete" });
  const { vehicles } = useTransitStore();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: t, isLoading, isError } = useQuery({
    queryKey: ["trips", tripId],
    queryFn: () => tripsApi.getOne(tripId),
  });

  const v = t ? vehicles.find((x) => x.id === t.vehicleId) : null;

  const [form, setForm] = useState({
    actualDistance: 0,
    fuelConsumed: 0,
    finalOdometer: 0,
  });

  useEffect(() => {
    if (t && v) {
      setForm({
        actualDistance: t.distanceKm,
        fuelConsumed: Math.round(t.distanceKm * 0.22),
        finalOdometer: v.odometerKm + t.distanceKm,
      });
    }
  }, [t, v]);

  const mutation = useMutation({
    mutationFn: (body: { actualDistance: number; fuelConsumed: number; finalOdometer: number }) =>
      tripsApi.complete(tripId, body),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.setQueryData(["trips", tripId], updated);
      toast.success("Trip completed successfully");
      nav({ to: "/trips/$tripId", params: { tripId } });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to complete trip");
    },
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading trip details…</div>;
  if (isError || !t || !v) return <EmptyState title="Trip or Vehicle not found" />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.finalOdometer < v.odometerKm) {
      return toast.error(`Final odometer cannot be less than current odometer (${v.odometerKm} km)`);
    }

    mutation.mutate(form);
  };

  return (
    <div>
      <PageHeader title={`Complete Trip — ${t.code}`} subtitle="Provide final travel details to release the driver and vehicle." />
      
      <form onSubmit={submit} className="brutal-card p-6 max-w-xl space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Current Odometer (km)</Label>
          <div className="brutal-input bg-muted/30 px-3 py-2 text-sm select-none border border-border-soft">{v.odometerKm} km</div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Final Odometer (km)</Label>
          <Input 
            type="number" 
            className="brutal-input" 
            value={form.finalOdometer} 
            onChange={(e) => setForm({ ...form, finalOdometer: +e.target.value })} 
            required 
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Actual Distance (km)</Label>
          <Input 
            type="number" 
            className="brutal-input" 
            value={form.actualDistance} 
            onChange={(e) => setForm({ ...form, actualDistance: +e.target.value })} 
            required 
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Fuel Consumed (Liters)</Label>
          <Input 
            type="number" 
            className="brutal-input" 
            value={form.fuelConsumed} 
            onChange={(e) => setForm({ ...form, fuelConsumed: +e.target.value })} 
            required 
          />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="outline" className="brutal-btn bg-card" onClick={() => nav({ to: "/trips/$tripId", params: { tripId } })} disabled={mutation.isPending}>Cancel</Button>
          <Button type="submit" className="brutal-btn bg-success text-success-foreground" disabled={mutation.isPending}>
            {mutation.isPending ? "Completing…" : "Complete Trip"}
          </Button>
        </div>
      </form>
    </div>
  );
}
