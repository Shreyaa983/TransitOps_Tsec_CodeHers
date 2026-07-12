import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/trips/$tripId/complete")({
  head: () => ({ meta: [{ title: "Complete trip — TransitOps" }] }),
  component: CompleteAction,
});

function CompleteAction() {
  const { tripId } = useParams({ from: "/_app/trips/$tripId/complete" });
  const complete = useTransitStore((s) => s.completeTrip);
  const nav = useNavigate();
  useEffect(() => { complete(tripId); toast.success("Trip completed"); nav({ to: "/trips/$tripId", params: { tripId } }); }, [tripId]);
  return (
    <div>
      <PageHeader title="Completing…" />
      <div className="brutal-card p-6"><Button className="brutal-btn" onClick={() => nav({ to: "/trips/$tripId", params: { tripId } })}>Back to trip</Button></div>
    </div>
  );
}
