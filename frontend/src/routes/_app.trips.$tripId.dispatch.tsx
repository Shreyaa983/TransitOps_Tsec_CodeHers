import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/trips/$tripId/dispatch")({
  head: () => ({ meta: [{ title: "Dispatch trip — TransitOps" }] }),
  component: DispatchAction,
});

function DispatchAction() {
  const { tripId } = useParams({ from: "/_app/trips/$tripId/dispatch" });
  const dispatch = useTransitStore((s) => s.dispatchTrip);
  const nav = useNavigate();

  useEffect(() => {
    const res = dispatch(tripId);
    if (res.ok) { toast.success("Trip dispatched"); nav({ to: "/trips/$tripId", params: { tripId } }); }
    else { toast.error(res.error ?? "Unable to dispatch"); }
  }, [tripId]);

  return (
    <div>
      <PageHeader title="Dispatching…" subtitle="Applying business rules." />
      <div className="brutal-card p-6"><Button className="brutal-btn" onClick={() => nav({ to: "/trips/$tripId", params: { tripId } })}>Back to trip</Button></div>
    </div>
  );
}
