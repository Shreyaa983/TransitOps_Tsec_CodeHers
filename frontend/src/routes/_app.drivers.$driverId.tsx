import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { StatusBadge } from "@/components/status-badge";
import { useTransitStore } from "@/lib/store";
import { driversApi, type DriverStatus } from "@/lib/drivers-api";
import { Progress } from "@/components/ui/progress";
import { daysUntil, shortDate } from "@/lib/format";
import { AlertTriangle, Pencil, ArrowLeft, IdCard } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS: { value: DriverStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Available" },
  { value: "ON_TRIP", label: "On Trip" },
  { value: "OFF_DUTY", label: "Off Duty" },
];

export const Route = createFileRoute("/_app/drivers/$driverId")({
  head: () => ({ meta: [{ title: "Driver — TransitOps" }] }),
  component: DriverDetail,
});

function DriverDetail() {
  const { driverId } = useParams({ from: "/_app/drivers/$driverId" });
  const { trips, vehicles } = useTransitStore();
  const qc = useQueryClient();

  const { data: driver, isLoading, isError } = useQuery({
    queryKey: ["drivers", driverId],
    queryFn: () => driversApi.getOne(driverId),
  });

  const statusMutation = useMutation({
    mutationFn: (status: DriverStatus) => driversApi.updateStatus(driverId, status),
    onSuccess: (updated) => {
      qc.setQueryData(["drivers", driverId], updated);
      qc.invalidateQueries({ queryKey: ["drivers"] });
      toast.success(`Status changed to ${updated.status.replace("_", " ")}`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update status"),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading driver…</div>;
  if (isError || !driver) return <EmptyState title="Driver not found" />;

  const driverTrips = trips.filter((t) => t.driverId === driver.id);
  const days = daysUntil(driver.licenseExpiry);
  const expired = days < 0;

  return (
    <div>
      <PageHeader
        title={driver.name}
        subtitle={`License ${driver.licenseNumber} · Category ${driver.category}`}
        actions={
          <div className="flex gap-2">
            <Link to="/drivers" className="brutal-btn px-3 py-2 bg-card inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Back</Link>
            <Link to="/drivers/$driverId/licenses" params={{ driverId: driver.id }} className="brutal-btn px-3 py-2 bg-card inline-flex items-center gap-1"><IdCard className="h-4 w-4" /> Licenses</Link>
            <Link to="/drivers/$driverId/edit" params={{ driverId: driver.id }} className="brutal-btn px-3 py-2 bg-primary text-primary-foreground inline-flex items-center gap-1"><Pencil className="h-4 w-4" /> Edit</Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="brutal-card p-5">
          <h3 className="font-bold mb-3">Profile</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Status"><StatusBadge status={driver.status} /></Row>
            <Row label="Phone">{driver.phone}</Row>
            <Row label="License expiry" tone={expired ? "danger" : days < 15 ? "warning" : "default"}>
              {(expired || days < 15) && <AlertTriangle className="h-3 w-3 inline mr-1" />}{shortDate(driver.licenseExpiry)}
            </Row>
          </dl>
          <div className="mt-4 pt-3 border-t border-border-soft">
            <div className="text-xs font-bold text-muted-foreground mb-2">Update Driver Status:</div>
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate(value)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    driver.status === value ? "bg-primary text-primary-foreground scale-105" : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="brutal-card p-5 lg:col-span-2">
          <h3 className="font-bold mb-3">Safety score</h3>
          <div className="text-5xl font-black">{driver.safetyScore}<span className="text-lg text-muted-foreground">/100</span></div>
          <Progress value={driver.safetyScore} className="mt-3 h-3" />
          <p className="text-xs text-muted-foreground mt-3">Composite score of speeding events, harsh braking, idle time and completed safety trainings over the past 90 days.</p>
        </div>
      </div>

      <div className="brutal-card p-5">
        <h3 className="font-bold mb-3">Trip history</h3>
        {driverTrips.length === 0 ? <div className="text-sm text-muted-foreground">No trips assigned.</div> : (
          <ul className="space-y-2 text-sm">
            {driverTrips.map((t) => {
              const v = vehicles.find((x) => x.id === t.vehicleId);
              return (
                <li key={t.id} className="flex items-center justify-between border-b border-border-soft last:border-0 pb-2">
                  <div>
                    <Link to="/trips/$tripId" params={{ tripId: t.id }} className="font-semibold hover:text-primary">{t.code}</Link>
                    <span className="text-muted-foreground ml-2">{t.source} → {t.destination}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{v?.name}</span>
                    <StatusBadge status={t.status} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Row({ label, children, tone = "default" }: { label: string; children: React.ReactNode; tone?: "default" | "warning" | "danger" }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`font-semibold ${tone === "warning" ? "text-warning" : tone === "danger" ? "text-destructive" : ""}`}>{children}</dd>
    </div>
  );
}
