import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTransitStore } from "@/lib/store";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_app/trips/$tripId/complete")({
  head: () => ({ meta: [{ title: "Complete trip — TransitOps" }] }),
  component: CompleteAction,
});

function CompleteAction() {
  const { tripId } = useParams({ from: "/_app/trips/$tripId/complete" });
  const { trips, vehicles, completeTrip } = useTransitStore();
  const nav = useNavigate();
  const trip = trips.find((t) => t.id === tripId);
  const vehicle = vehicles.find((v) => v.id === trip?.vehicleId);

  const [finalOdo, setFinalOdo] = useState(vehicle?.odometerKm?.toString() || "");
  const [fuel, setFuel] = useState("");
  const [cost, setCost] = useState("");
  const [actDist, setActDist] = useState(trip?.distanceKm?.toString() || "");
  const [loading, setLoading] = useState(false);

  if (!trip || !vehicle) return <div>Invalid trip or vehicle.</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalOdometer = Number(finalOdo);

    if (finalOdometer < vehicle.odometerKm) {
      toast.error(`Final odometer cannot be less than current odometer (${vehicle.odometerKm})`);
      return;
    }

    setLoading(true);

    // fuelCost is a custom property. We can map it into completeTrip properly,
    // but the store signature only takes (id, actualDistance, fuelConsumed, finalOdometer).
    // Let's call completeTrip from store. (Note fuelCost might drop unless we update store.ts signature).
    const res = await completeTrip(trip.id, Number(actDist), Number(fuel), finalOdometer, Number(cost));

    setLoading(false);

    if (res.ok) {
      toast.success("Trip successfully completed!");
      nav({ to: "/trips/$tripId", params: { tripId } });
    } else {
      toast.error(res.error || "Failed to complete trip.");
    }
  };

  return (
    <div className="max-w-xl">
      <PageHeader
        title={`Complete Trip ${trip.code}`}
        subtitle="Log the final closing metrics of the trip."
        actions={<Link to="/trips/$tripId" params={{ tripId }} className="brutal-btn px-3 py-2 bg-card inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Back</Link>}
      />

      <div className="brutal-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-bold">Final Odometer (km) *</label>
            <Input type="number" required value={finalOdo} onChange={(e) => setFinalOdo(e.target.value)} min={vehicle.odometerKm} className="brutal-input" />
            <div className="text-xs text-muted-foreground">Current odometer: {vehicle.odometerKm} km</div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-bold">Actual Distance (km) *</label>
              <Input type="number" required value={actDist} onChange={(e) => setActDist(e.target.value)} className="brutal-input" />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-bold">Fuel Consumed (Liters)</label>
              <Input type="number" value={fuel} onChange={(e) => setFuel(e.target.value)} placeholder="0" className="brutal-input" />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-bold">Fuel Cost ($) (Optional)</label>
            <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Leave blank if 0" className="brutal-input" />
          </div>

          <div className="pt-4 border-t border-border-soft">
            <Button type="submit" disabled={loading} className="w-full brutal-btn bg-success text-success-foreground hover:bg-success/90">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {loading ? "Completing..." : "Confirm & Complete Trip"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
