import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Trash2, Pencil, Eye } from "lucide-react";
import { useTransitStore } from "@/lib/store";
import { PageHeader } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { VehicleStatus } from "@/lib/mock-data";
import { money, km, kg } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/vehicles/")({
  head: () => ({ meta: [{ title: "Vehicles — TransitOps" }] }),
  component: VehiclesPage,
});

const statuses: (VehicleStatus | "all")[] = ["all", "available", "on_trip", "in_shop", "retired"];

function VehiclesPage() {
  const vehicles = useTransitStore((s) => s.vehicles);
  const deleteVehicle = useTransitStore((s) => s.deleteVehicle);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<VehicleStatus | "all">("all");

  const rows = useMemo(() => {
    return vehicles.filter((v) => {
      if (filter !== "all" && v.status !== filter) return false;
      if (q && !`${v.name} ${v.registration} ${v.model}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [vehicles, q, filter]);

  return (
    <div>
      <PageHeader
        title="Vehicle registry"
        subtitle={`${vehicles.length} vehicles in your fleet`}
        actions={
          <Link to="/vehicles/new">
            <Button className="brutal-btn bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-1" /> Add vehicle
            </Button>
          </Link>
        }
      />

      <div className="brutal-card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search registration, model, name…" className="pl-9 brutal-input" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg brutal-border ${filter === s ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
              >
                {s === "all" ? "All" : s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="brutal-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 sticky top-0">
              <tr className="text-left">
                <Th>Reg #</Th><Th>Vehicle</Th><Th>Model</Th><Th>Type</Th>
                <Th>Capacity</Th><Th>Odometer</Th><Th>Cost</Th><Th>Status</Th><Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} className="border-t border-border-soft hover:bg-muted/40">
                  <Td className="font-mono font-semibold">{v.registration}</Td>
                  <Td className="font-semibold">{v.name}</Td>
                  <Td className="text-muted-foreground">{v.model}</Td>
                  <Td>{v.type}</Td>
                  <Td>{kg(v.capacityKg)}</Td>
                  <Td>{km(v.odometerKm)}</Td>
                  <Td>{money(v.acquisitionCost)}</Td>
                  <Td><StatusBadge status={v.status} /></Td>
                  <Td className="text-right">
                    <div className="inline-flex gap-1">
                      <Link to="/vehicles/$vehicleId" params={{ vehicleId: v.id }} className="brutal-btn p-2 bg-card hover:bg-accent"><Eye className="h-3.5 w-3.5" /></Link>
                      <Link to="/vehicles/$vehicleId/edit" params={{ vehicleId: v.id }} className="brutal-btn p-2 bg-card hover:bg-accent"><Pencil className="h-3.5 w-3.5" /></Link>
                      <button
                        onClick={() => { deleteVehicle(v.id); toast.success(`${v.name} removed`); }}
                        className="brutal-btn p-2 bg-card hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={9} className="text-center text-muted-foreground py-10">No vehicles match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
