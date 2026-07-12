import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/trips/$tripId/complete")({
  head: () => ({ meta: [{ title: "Complete trip — TransitOps" }] }),
  component: CompleteAction,
});

function CompleteAction() {
  const { t } = useTranslation();
  const { tripId } = useParams({ from: "/_app/trips/$tripId/complete" });
  const complete = useTransitStore((s) => s.completeTrip);
  const nav = useNavigate();

  useEffect(() => {
    complete(tripId);
    toast.success(t("trips_completed"));
    nav({ to: "/trips/$tripId", params: { tripId } });
  }, [tripId, complete, nav, t]);

  return (
    <div>
      <PageHeader title={t("trips_completing")} />
      <div className="brutal-card p-6">
        <Button className="brutal-btn" onClick={() => nav({ to: "/trips/$tripId", params: { tripId } })}>{t("trips_back_to_trip")}</Button>
      </div>
    </div>
  );
}
