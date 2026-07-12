import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { Plus, Play, CheckCircle2 } from "lucide-react";
import { shortDate, money } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/maintenance/")({
  head: () => ({ meta: [{ title: "Maintenance — TransitOps" }] }),
  component: MxPage,
});

function MxPage() {
  const { t } = useTranslation();
  const { maintenance, vehicles, startMaintenance, completeMaintenance } = useTransitStore();
  const headers = ["vehicle", "maint_col_issue", "maint_col_technician", "cost", "maint_col_created", "status", "actions"] as const;

  return (
    <div>
      <PageHeader
        title={t("maint_title")}
        subtitle={t("maint_subtitle")}
        actions={
          <div className="flex gap-2">
            <Link to="/maintenance/schedule" className="brutal-btn px-3 py-2 bg-card">{t("maint_schedule")}</Link>
            <Link to="/maintenance/new">
              <Button className="brutal-btn bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-1" /> {t("maint_new_log")}
              </Button>
            </Link>
          </div>
        }
      />
      <div className="brutal-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr className="text-left">
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {maintenance.map((m) => {
              const v = vehicles.find((x) => x.id === m.vehicleId);
              return (
                <tr key={m.id} className="border-t border-border-soft hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold">
                    {v ? <Link to="/vehicles/$vehicleId" params={{ vehicleId: v.id }} className="hover:text-primary">{v.name}</Link> : "—"}
                  </td>
                  <td className="px-4 py-3">{m.issue}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.technician}</td>
                  <td className="px-4 py-3">{money(m.cost)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{shortDate(m.createdAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {m.status === "open" && (
                        <button onClick={() => { startMaintenance(m.id); toast.success(t("maint_started")); }}
                          className="brutal-btn px-2 py-1 text-xs bg-warning/20 text-warning"><Play className="h-3 w-3" /></button>
                      )}
                      {m.status !== "completed" && (
                        <button onClick={() => { completeMaintenance(m.id); toast.success(t("maint_completed_toast")); }}
                          className="brutal-btn px-2 py-1 text-xs bg-success/20 text-success"><CheckCircle2 className="h-3 w-3" /></button>
                      )}
                      <Link to="/maintenance/$maintenanceId" params={{ maintenanceId: m.id }} className="brutal-btn px-2 py-1 text-xs bg-card">{t("view")}</Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
