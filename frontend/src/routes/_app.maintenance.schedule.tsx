import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { useTransitStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { shortDate } from "@/lib/format";

export const Route = createFileRoute("/_app/maintenance/schedule")({
  head: () => ({ meta: [{ title: "Maintenance schedule — TransitOps" }] }),
  component: Schedule,
});

function Schedule() {
  const { t } = useTranslation();
  const { vehicles } = useTransitStore();
  const headers = ["vehicle", "vehicles_col_odometer", "maint_col_next_service", "maint_col_eta"] as const;

  const rows = vehicles.map((v) => {
    const nextKm = Math.ceil(v.odometerKm / 25000) * 25000;
    const daysToNext = Math.max(0, Math.round((nextKm - v.odometerKm) / 200));
    return { v, nextKm, dueDate: new Date(Date.now() + daysToNext * 86400000).toISOString() };
  }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div>
      <PageHeader title={t("maint_schedule_title")} subtitle={t("maint_schedule_subtitle")} />
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
            {rows.map(({ v, nextKm, dueDate }) => (
              <tr key={v.id} className="border-t border-border-soft hover:bg-muted/40">
                <td className="px-4 py-3 font-semibold">{v.name}</td>
                <td className="px-4 py-3">{v.odometerKm.toLocaleString()} km</td>
                <td className="px-4 py-3">{nextKm.toLocaleString()} km</td>
                <td className="px-4 py-3 text-muted-foreground">{shortDate(dueDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
