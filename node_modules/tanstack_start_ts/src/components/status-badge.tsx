import { cn } from "@/lib/utils";
import type { VehicleStatus, TripStatus, MaintenanceStatus } from "@/lib/mock-data";

type Kind = VehicleStatus | TripStatus | MaintenanceStatus | "on_duty" | "off_duty" | "suspended" | "AVAILABLE" | "ON_TRIP" | "IN_SHOP" | "RETIRED" | "OFF_DUTY" | "SUSPENDED";

const styles: Record<string, string> = {
  available: "bg-success/15 text-success border-success/40",
  on_trip: "bg-primary/15 text-primary border-primary/40",
  in_shop: "bg-warning/15 text-warning border-warning/40",
  retired: "bg-muted text-muted-foreground border-border-soft",
  draft: "bg-muted text-muted-foreground border-border-soft",
  dispatched: "bg-primary/15 text-primary border-primary/40",
  completed: "bg-success/15 text-success border-success/40",
  cancelled: "bg-destructive/15 text-destructive border-destructive/40",
  open: "bg-warning/15 text-warning border-warning/40",
  in_progress: "bg-primary/15 text-primary border-primary/40",
  on_duty: "bg-success/15 text-success border-success/40",
  off_duty: "bg-muted text-muted-foreground border-border-soft",
  suspended: "bg-destructive/15 text-destructive border-destructive/40",
  AVAILABLE: "bg-success/15 text-success border-success/40",
  ON_TRIP: "bg-primary/15 text-primary border-primary/40",
  IN_SHOP: "bg-warning/15 text-warning border-warning/40",
  RETIRED: "bg-muted text-muted-foreground border-border-soft",
  OFF_DUTY: "bg-muted text-muted-foreground border-border-soft",
  SUSPENDED: "bg-destructive/15 text-destructive border-destructive/40",
};

const labels: Record<string, string> = {
  available: "Available",
  on_trip: "On Trip",
  in_shop: "In Shop",
  retired: "Retired",
  draft: "Draft",
  dispatched: "Dispatched",
  completed: "Completed",
  cancelled: "Cancelled",
  open: "Open",
  in_progress: "In Progress",
  on_duty: "On Duty",
  off_duty: "Off Duty",
  suspended: "Suspended",
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  IN_SHOP: "In Shop",
  RETIRED: "Retired",
  OFF_DUTY: "Off Duty",
  SUSPENDED: "Suspended",
};

export function StatusBadge({ status, className }: { status: Kind | string; className?: string }) {
  const normalized = status ? (typeof status === "string" ? status.toLowerCase() : status) : "available";
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
      styles[normalized] ?? "bg-muted text-muted-foreground border-border-soft",
      className,
    )}>
      {labels[normalized] ?? status}
    </span>
  );
}
