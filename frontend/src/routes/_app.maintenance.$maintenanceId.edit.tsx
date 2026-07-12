import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { useTranslation, statusKey } from "@/lib/i18n";

export const Route = createFileRoute("/_app/maintenance/$maintenanceId/edit")({
  head: () => ({ meta: [{ title: "Edit maintenance — TransitOps" }] }),
  component: EditMx,
});

function EditMx() {
  const { t } = useTranslation();
  const { maintenanceId } = useParams({ from: "/_app/maintenance/$maintenanceId/edit" });
  const m = useTransitStore((s) => s.maintenance.find((x) => x.id === maintenanceId));
  const update = useTransitStore((s) => s.updateMaintenance);
  const nav = useNavigate();
  const [form, setForm] = useState(m);

  const statusOptions = useMemo(
    () =>
      (["open", "in_progress", "completed"] as const).map((value) => ({
        value,
        label: t(statusKey(value) ?? "status_open"),
      })),
    [t],
  );

  if (!m || !form) return <EmptyState title={t("maint_log_not_found")} />;

  return (
    <div>
      <PageHeader title={t("maint_edit_title")} />
      <form onSubmit={(e) => { e.preventDefault(); update(m.id, form); toast.success(t("maint_updated")); nav({ to: "/maintenance/$maintenanceId", params: { maintenanceId: m.id } }); }}
        className="brutal-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <F label={t("maint_issue")}><Input className="brutal-input" value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} /></F>
        <F label={t("maint_technician")}><Input className="brutal-input" value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })} /></F>
        <F label={t("maint_cost_usd")}><Input type="number" className="brutal-input" value={form.cost} onChange={(e) => setForm({ ...form, cost: +e.target.value })} /></F>
        <F label={t("status")}>
          <select className="brutal-input w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}>
            {statusOptions.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </F>
        <div className="md:col-span-2"><Label className="text-xs font-semibold">{t("description")}</Label>
          <Textarea className="brutal-input min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="md:col-span-2 flex justify-end gap-2">
          <Button variant="outline" type="button" className="brutal-btn bg-card" onClick={() => nav({ to: "/maintenance" })}>{t("cancel")}</Button>
          <Button className="brutal-btn bg-primary text-primary-foreground">{t("save")}</Button>
        </div>
      </form>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}</Label>{children}</div>;
}
