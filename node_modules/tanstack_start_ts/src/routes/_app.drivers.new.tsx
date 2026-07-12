import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { driversApi } from "@/lib/drivers-api";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/drivers/new")({
  head: () => ({ meta: [{ title: "Add driver — TransitOps" }] }),
  component: NewDriver,
});

function NewDriver() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    licenseNumber: "",
    licenseCategory: "C",
    licenseExpiry: "",
    phone: "",
    safetyScore: 85,
  });

  const mutation = useMutation({
    mutationFn: () =>
      driversApi.create({
        name: form.name,
        licenseNumber: form.licenseNumber,
        licenseCategory: form.licenseCategory,
        licenseExpiry: form.licenseExpiry || new Date(Date.now() + 365 * 86400000).toISOString(),
        phone: form.phone,
        safetyScore: Number(form.safetyScore),
        status: "AVAILABLE",
      }),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
      toast.success(`${d.name} added`);
      nav({ to: "/drivers" });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to add driver"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.licenseNumber) return toast.error("Name and license number required");
    mutation.mutate();
  };

  return (
    <div>
      <PageHeader title="Add driver" subtitle="Register a new driver." />
      <form onSubmit={submit} className="brutal-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <F label="Full name"><Input className="brutal-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></F>
        <F label="License number"><Input className="brutal-input" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} /></F>
        <F label="Category">
          <Input className="brutal-input" value={form.licenseCategory} onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })} placeholder="e.g. Heavy Goods, C, C+E" />
        </F>
        <F label="License expiry"><Input type="date" className="brutal-input" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value ? new Date(e.target.value).toISOString() : "" })} /></F>
        <F label="Phone"><Input className="brutal-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></F>
        <F label="Safety score (0-100)"><Input type="number" className="brutal-input" value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: +e.target.value })} /></F>
        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => nav({ to: "/drivers" })} className="brutal-btn bg-card">Cancel</Button>
          <Button type="submit" className="brutal-btn bg-primary text-primary-foreground hover:bg-primary/90" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save driver"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}</Label>{children}</div>;
}
