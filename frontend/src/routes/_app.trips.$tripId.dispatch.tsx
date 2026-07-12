import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/trips/$tripId/dispatch")({
  head: () => ({ meta: [{ title: "Dispatch trip — TransitOps" }] }),
  component: DispatchAction,
});

function DispatchAction() {
  const { t } = useTranslation();
  const { tripId } = useParams({ from: "/_app/trips/$tripId/dispatch" });
  const dispatch = useTransitStore((s) => s.dispatchTrip);
  const nav = useNavigate();

  useEffect(() => {
    dispatch(tripId).then((res) => {
      if (res.ok) {
        toast.success(t("trips_dispatched", { code: tripId }));
        nav({ to: "/trips/$tripId", params: { tripId } });
      } else {
        toast.error(res.error ?? t("trips_dispatch_failed"));
      }
    });
  }, [tripId, dispatch, nav, t]);

  return (
    <div>
      <PageHeader title={t("trips_dispatching")} subtitle={t("trips_dispatching_sub")} />
      <div className="brutal-card p-6">
        <Button className="brutal-btn" onClick={() => nav({ to: "/trips/$tripId", params: { tripId } })}>{t("trips_back_to_trip")}</Button>
      </div>
    </div>
  );
}
