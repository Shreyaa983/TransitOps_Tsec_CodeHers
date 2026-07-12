import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTransitStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_app/trips/$tripId/complete")({
  head: () => ({ meta: [{ title: "Complete trip — TransitOps" }] }),
  component: CompleteAction,
});

function CompleteAction() {
  const { t } = useTranslation();
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

  if (!trip || !vehicle) return <div>{t("trips_not_found")}</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalOdometer = Number(finalOdo);

    if (finalOdometer < vehicle.odometerKm) {
      toast.error(`Final odometer cannot be less than current odometer (${vehicle.odometerKm})`);
      return;
    }

    setLoading(true);

    const res = await completeTrip(trip.id, Number(actDist), Number(fuel), finalOdometer, Number(cost));

    setLoading(false);

    if (res.ok) {
      toast.success(t("trips_completed"));
      nav({ to: "/trips/$tripId", params: { tripId } });
    } else {
      toast.error(res.error || "Failed to complete trip.");
    }
  };

  return (
    <div className="max-w-xl">
      <PageHeader
        title={t("trips_complete_title", { code: trip.code })}
        subtitle={t("trips_complete_subtitle")}
        actions={<Link to="/trips/$tripId" params={{ tripId }} className="brutal-btn px-3 py-2 bg-card inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> {t("back")}</Link>}
      />

      <div className="brutal-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-bold">{t("trips_final_odometer")} *</label>
            <Input type="number" required value={finalOdo} onChange={(e) => setFinalOdo(e.target.value)} min={vehicle.odometerKm} className="brutal-input" />
            <div className="text-xs text-muted-foreground">{t("trips_current_odometer", { km: vehicle.odometerKm })}</div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-bold">{t("trips_actual_distance")} *</label>
              <Input type="number" required value={actDist} onChange={(e) => setActDist(e.target.value)} className="brutal-input" />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-bold">{t("trips_fuel_consumed")}</label>
              <Input type="number" value={fuel} onChange={(e) => setFuel(e.target.value)} placeholder="0" className="brutal-input" />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-bold">{t("trips_fuel_cost")}</label>
            <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Leave blank if 0" className="brutal-input" />
          </div>

          <div className="pt-4 border-t border-border-soft">
            <Button type="submit" disabled={loading} className="w-full brutal-btn bg-success text-success-foreground hover:bg-success/90">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {loading ? t("trips_completing") : t("trips_confirm_complete")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
