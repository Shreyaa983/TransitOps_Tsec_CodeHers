import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { driversApi } from "@/lib/drivers-api";
import { Plus, Search, AlertTriangle, Phone } from "lucide-react";
import { daysUntil, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/_app/drivers/")({
  head: () => ({ meta: [{ title: "Drivers — TransitOps" }] }),
  component: DriversPage,
});

function DriversPage() {
  const user = useAuth((s) => s.user);
  const canEdit = user?.role === "fleet_manager";
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "eligible" | "suspended" | "expiring">("all");

  const { data: drivers = [], isLoading, isError } = useQuery({
    queryKey: ["drivers", filter],
    queryFn: () => {
      switch (filter) {
        case "available": return driversApi.getAvailable();
        case "eligible": return driversApi.getEligible();
        case "suspended": return driversApi.getSuspended();
        case "expiring": return driversApi.getLicenseExpiring(30);
        default: return driversApi.list();
      }
    },
  });

  const filtered = drivers.filter((d) => !q || `${d.name} ${d.licenseNumber}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Driver management"
        subtitle={`${drivers.length} drivers · safety scores in real time`}
        actions={
          canEdit ? (
            <Link to="/drivers/new">
              <Button className="brutal-btn bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" /> Add driver</Button>
            </Link>
          ) : undefined
        }
      />

      <div className="brutal-card p-4 mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {([
            ["all", "All"],
            ["available", "Available"],
            ["eligible", "Eligible"],
            ["suspended", "Suspended"],
            ["expiring", "Expiring (30d)"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "brutal-btn px-3 py-1.5 text-xs",
                filter === key ? "bg-primary text-primary-foreground" : "bg-card",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search drivers, license #…" className="pl-9 brutal-input" />
        </div>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading drivers…</div>}
      {isError && <div className="text-sm text-destructive">Failed to load drivers. Make sure you are signed in and the backend is running.</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((d) => {
          const days = daysUntil(d.licenseExpiry);
          const expired = days < 0;
          const soon = days >= 0 && days < 15;
          return (
            <Link key={d.id} to="/drivers/$driverId" params={{ driverId: d.id }} className="block">
              <div className="brutal-card brutal-card-hover p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center font-black text-lg brutal-border">
                      {d.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="font-bold">{d.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{d.licenseNumber}</div>
                    </div>
                  </div>
                  <StatusBadge status={d.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">Category</div>
                    <div className="font-semibold">{d.category}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">License expiry</div>
                    <div className={cn("font-semibold flex items-center gap-1", (expired || soon) && "text-warning", expired && "text-destructive")}>
                      {(expired || soon) && <AlertTriangle className="h-3 w-3" />}
                      {shortDate(d.licenseExpiry)}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {d.phone}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Safety score</span>
                    <span className="font-bold">{d.safetyScore}</span>
                  </div>
                  <Progress value={d.safetyScore} className="h-2" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
