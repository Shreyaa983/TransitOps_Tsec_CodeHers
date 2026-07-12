import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/drivers/$driverId/edit")({
  head: () => ({ meta: [{ title: "Edit driver — TransitOps" }] }),
  component: EditDriver,
});
function EditDriver() {
  const { driverId } = useParams({ from: "/_app/drivers/$driverId/edit" });
  const d = useTransitStore((s) => s.drivers.find((x) => x.id === driverId));
  const update = useTransitStore((s) => s.updateDriver);
  const nav = useNavigate();
  const [form, setForm] = useState(d);
  if (!d || !form) return <EmptyState title="Driver not found" />;

  return (
    <div>
      <PageHeader title={`Edit ${d.name}`} />
      <form
        onSubmit={(e) => { e.preventDefault(); update(d.id, form); toast.success("Driver updated"); nav({ to: "/drivers/$driverId", params: { driverId: d.id } }); }}
        className="brutal-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl"
      >
        <F label="Name"><Input className="brutal-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></F>
        <F label="License #"><Input className="brutal-input" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} /></F>
        <F label="Phone"><Input className="brutal-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></F>
        <F label="Safety score"><Input type="number" className="brutal-input" value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: +e.target.value })} /></F>
        <F label="Status">
          <select className="brutal-input w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}>
            <option value="on_duty">On Duty</option><option value="off_duty">Off Duty</option><option value="suspended">Suspended</option>
          </select>
        </F>
        <div className="md:col-span-2 flex gap-2 justify-end">
          <Button type="button" variant="outline" className="brutal-btn bg-card" onClick={() => nav({ to: "/drivers/$driverId", params: { driverId: d.id } })}>Cancel</Button>
          <Button type="submit" className="brutal-btn bg-primary text-primary-foreground">Save</Button>
        </div>
      </form>
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}</Label>{children}</div>;
}
