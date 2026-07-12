import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { toast } from "sonner";
import type { MaintenanceLog } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/maintenance/new")({
  head: () => ({ meta: [{ title: "New maintenance — TransitOps" }] }),
  component: NewMx,
});
function NewMx() {
  const { vehicles, addMaintenance } = useTransitStore();
  const nav = useNavigate();
  const [form, setForm] = useState({ vehicleId: "", issue: "", description: "", technician: "", cost: 0 });
  return (
    <div>
      <PageHeader title="New maintenance log" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.vehicleId || !form.issue) return toast.error("Vehicle and issue required");
          const m: MaintenanceLog = { id: `m${Date.now()}`, ...form, status: "open", createdAt: new Date().toISOString() };
          addMaintenance(m); toast.success("Log created"); nav({ to: "/maintenance" });
        }}
        className="brutal-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl"
      >
        <F label="Vehicle">
          <select className="brutal-input w-full" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
            <option value="">Select…</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </F>
        <F label="Issue"><Input className="brutal-input" value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} /></F>
        <F label="Technician"><Input className="brutal-input" value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })} /></F>
        <F label="Cost ($)"><Input type="number" className="brutal-input" value={form.cost} onChange={(e) => setForm({ ...form, cost: +e.target.value })} /></F>
        <div className="md:col-span-2"><Label className="text-xs font-semibold">Description</Label>
          <Textarea className="brutal-input min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="md:col-span-2 flex justify-end gap-2">
          <Button variant="outline" type="button" className="brutal-btn bg-card" onClick={() => nav({ to: "/maintenance" })}>Cancel</Button>
          <Button className="brutal-btn bg-primary text-primary-foreground">Create</Button>
        </div>
      </form>
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}</Label>{children}</div>;
}
