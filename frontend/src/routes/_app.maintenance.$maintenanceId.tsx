import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import { useTransitStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { shortDate, money } from "@/lib/format";

export const Route = createFileRoute("/_app/maintenance/$maintenanceId")({
  head: () => ({ meta: [{ title: "Maintenance detail — TransitOps" }] }),
  component: MxDetail,
});

function MxDetail() {
  const { t } = useTranslation();
  const { maintenanceId } = useParams({ from: "/_app/maintenance/$maintenanceId" });
  const { maintenance, vehicles } = useTransitStore();
  const m = maintenance.find((x) => x.id === maintenanceId);
  if (!m) return <EmptyState title={t("maint_log_not_found")} />;
  const v = vehicles.find((x) => x.id === m.vehicleId);

  return (
    <div>
      <PageHeader
        title={m.issue}
        subtitle={v?.name}
        actions={
          <Link to="/maintenance/$maintenanceId/edit" params={{ maintenanceId: m.id }} className="brutal-btn px-3 py-2 bg-primary text-primary-foreground">{t("edit")}</Link>
        }
      />
      <div className="brutal-card p-6 max-w-3xl space-y-4">
        <div className="flex items-center gap-2">
          <StatusBadge status={m.status} />
          <span className="text-xs text-muted-foreground">{t("maint_created", { date: shortDate(m.createdAt) })}</span>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{t("description")}</div>
          <p className="mt-1">{m.description || "—"}</p>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-xs text-muted-foreground">{t("maint_technician")}</dt><dd className="font-semibold">{m.technician}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{t("cost")}</dt><dd className="font-semibold">{money(m.cost)}</dd></div>
          {m.completedAt && <div><dt className="text-xs text-muted-foreground">{t("maint_col_completed")}</dt><dd className="font-semibold">{shortDate(m.completedAt)}</dd></div>}
        </dl>
      </div>
    </div>
  );
}
