import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { toast } from "sonner";
import type { Expense } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/expenses/new")({
  head: () => ({ meta: [{ title: "Add expense — TransitOps" }] }),
  component: () => {
    const { vehicles, addExpense } = useTransitStore();
    const nav = useNavigate();
    const [f, setF] = useState<{ vehicleId: string; category: Expense["category"]; amount: number; note: string }>({ vehicleId: "", category: "fuel", amount: 0, note: "" });
    return (
      <div>
        <PageHeader title="Add expense" />
        <form onSubmit={(e) => { e.preventDefault(); addExpense({ id: `e${Date.now()}`, ...f, date: new Date().toISOString() }); toast.success("Expense added"); nav({ to: "/expenses" }); }}
          className="brutal-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          <div className="space-y-1.5"><Label className="text-xs font-semibold">Category</Label>
            <select className="brutal-input w-full" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Expense["category"] })}>
              <option value="fuel">Fuel</option><option value="maintenance">Maintenance</option><option value="tolls">Tolls</option><option value="insurance">Insurance</option><option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs font-semibold">Vehicle (optional)</Label>
            <select className="brutal-input w-full" value={f.vehicleId} onChange={(e) => setF({ ...f, vehicleId: e.target.value })}>
              <option value="">—</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs font-semibold">Amount ($)</Label><Input type="number" className="brutal-input" value={f.amount} onChange={(e) => setF({ ...f, amount: +e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs font-semibold">Note</Label><Input className="brutal-input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
          <div className="md:col-span-2 flex justify-end gap-2"><Button variant="outline" type="button" className="brutal-btn bg-card" onClick={() => nav({ to: "/expenses" })}>Cancel</Button><Button className="brutal-btn bg-primary text-primary-foreground">Save</Button></div>
        </form>
      </div>
    );
  },
});
