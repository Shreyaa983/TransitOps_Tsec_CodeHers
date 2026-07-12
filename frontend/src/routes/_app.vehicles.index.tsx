import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search, Trash2, Pencil, Eye } from "lucide-react";
import { PageHeader } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { vehiclesApi, type VehicleStatus } from "@/lib/vehicles-api";
import { useTransitStore, useAuth } from "@/lib/store";
import { money, km, kg } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/vehicles/")({
  head: () => ({ meta: [{ title: "Vehicles — TransitOps" }] }),
  component: VehiclesPage,
});

type StatusFilter = VehicleStatus | "all";

const statuses: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "AVAILABLE", label: "Available" },
  { key: "ON_TRIP", label: "On Trip" },
  { key: "IN_SHOP", label: "In Shop" },
  { key: "RETIRED", label: "Retired" },
];

function VehiclesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const { data: vehicles = [], isLoading, isError } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehiclesApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: vehiclesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      useTransitStore.getState().syncWithBackend();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete vehicle"),
  });

  const user = useAuth((s) => s.user);
  const canEdit = user?.role === "fleet_manager";

  const rows = useMemo(() => {
    return vehicles.filter((v) => {
      if (filter !== "all" && v.status !== filter) return false;
      if (q && !`${v.name} ${v.registrationNumber} ${v.model}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [vehicles, q, filter]);

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from the fleet?`)) return;
    deleteMutation.mutate(id, { onSuccess: () => toast.success(`${name} removed`) });
  };

  return (
    <div>
      <PageHeader
        title="Vehicle registry"
        subtitle={`${vehicles.length} vehicles in your fleet`}
        actions={
          canEdit ? (
            <Link to="/vehicles/new">
              <Button className="brutal-btn bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-1" /> Add vehicle
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="brutal-card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search registration, model, name…" className="pl-9 brutal-input" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {statuses.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  "text-xs font-semibold px-3 py-1.5 rounded-lg brutal-border",
                  filter === key ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground mb-4">Loading vehicles…</div>}
      {isError && (
        <div className="text-sm text-destructive mb-4">
          Failed to load vehicles. Make sure you are signed in and the backend is running.
        </div>
      )}

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
                  <Td className="font-mono font-semibold">{v.registrationNumber}</Td>
                  <Td className="font-semibold">{v.name}</Td>
                  <Td className="text-muted-foreground">{v.model}</Td>
                  <Td>{v.type}</Td>
                  <Td>{kg(v.maxLoadCapacity)}</Td>
                  <Td>{km(v.odometer)}</Td>
                  <Td>{money(v.acquisitionCost)}</Td>
                  <Td><StatusBadge status={v.status} /></Td>
                  <Td className="text-right">
                    <div className="inline-flex gap-1">
                      <Link to="/vehicles/$vehicleId" params={{ vehicleId: v.id }} className="brutal-btn p-2 bg-card hover:bg-accent"><Eye className="h-3.5 w-3.5" /></Link>
                      {canEdit && (
                        <>
                          <Link to="/vehicles/$vehicleId/edit" params={{ vehicleId: v.id }} className="brutal-btn p-2 bg-card hover:bg-accent"><Pencil className="h-3.5 w-3.5" /></Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(v.id, v.name)}
                            disabled={deleteMutation.isPending}
                            className="brutal-btn p-2 bg-card hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
              {!isLoading && rows.length === 0 && (
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
