import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import type { Driver } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/drivers/new")({
  head: () => ({ meta: [{ title: "Add driver — TransitOps" }] }),
  component: NewDriver,
});

function NewDriver() {
  const add = useTransitStore((s) => s.addDriver);
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "", licenseNumber: "", category: "C", licenseExpiry: "", phone: "", safetyScore: 85,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.licenseNumber) return toast.error("Name and license number required");
    const d: Driver = {
      id: `d${Date.now()}`,
      name: form.name,
      licenseNumber: form.licenseNumber,
      category: form.category as Driver["category"],
      licenseExpiry: form.licenseExpiry || new Date(Date.now() + 365 * 86400000).toISOString(),
      phone: form.phone,
      safetyScore: Number(form.safetyScore),
      status: "off_duty",
    };
    add(d);
    toast.success(`${d.name} added`);
    nav({ to: "/drivers" });
  };

  return (
    <div>
      <PageHeader title="Add driver" subtitle="Register a new driver." />
      <form onSubmit={submit} className="brutal-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <F label="Full name"><Input className="brutal-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></F>
        <F label="License number"><Input className="brutal-input" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} /></F>
        <F label="Category">
          <select className="brutal-input w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option>B</option><option>C</option><option>C+E</option><option>D</option>
          </select>
        </F>
        <F label="License expiry"><Input type="date" className="brutal-input" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value ? new Date(e.target.value).toISOString() : "" })} /></F>
        <F label="Phone"><Input className="brutal-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></F>
        <F label="Safety score (0-100)"><Input type="number" className="brutal-input" value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: +e.target.value })} /></F>
        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => nav({ to: "/drivers" })} className="brutal-btn bg-card">Cancel</Button>
          <Button type="submit" className="brutal-btn bg-primary text-primary-foreground hover:bg-primary/90">Save driver</Button>
        </div>
      </form>
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}</Label>{children}</div>;
}
