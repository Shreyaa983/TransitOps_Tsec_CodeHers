import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_app/maintenance/$maintenanceId/edit")({
  head: () => ({ meta: [{ title: "Edit maintenance — TransitOps" }] }),
  component: EditMx,
});
function EditMx() {
  const { maintenanceId } = useParams({ from: "/_app/maintenance/$maintenanceId/edit" });
  const m = useTransitStore((s) => s.maintenance.find((x) => x.id === maintenanceId));
  const update = useTransitStore((s) => s.updateMaintenance);
  const nav = useNavigate();
  const [form, setForm] = useState(m);
  if (!m || !form) return <EmptyState title="Log not found" />;
  return (
    <div>
      <PageHeader title="Edit maintenance log" />
      <form onSubmit={(e) => { e.preventDefault(); update(m.id, form); toast.success("Updated"); nav({ to: "/maintenance/$maintenanceId", params: { maintenanceId: m.id } }); }}
        className="brutal-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <F label="Issue"><Input className="brutal-input" value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} /></F>
        <F label="Technician"><Input className="brutal-input" value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })} /></F>
        <F label="Cost"><Input type="number" className="brutal-input" value={form.cost} onChange={(e) => setForm({ ...form, cost: +e.target.value })} /></F>
        <F label="Status">
          <select className="brutal-input w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}>
            <option value="open">Open</option><option value="in_progress">In Progress</option><option value="completed">Completed</option>
          </select>
        </F>
        <div className="md:col-span-2"><Label className="text-xs font-semibold">Description</Label>
          <Textarea className="brutal-input min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="md:col-span-2 flex justify-end gap-2">
          <Button variant="outline" type="button" className="brutal-btn bg-card" onClick={() => nav({ to: "/maintenance" })}>Cancel</Button>
          <Button className="brutal-btn bg-primary text-primary-foreground">Save</Button>
        </div>
      </form>
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}</Label>{children}</div>;
}
