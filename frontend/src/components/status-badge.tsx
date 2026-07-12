import { cn } from "@/lib/utils";
import { useTranslation, statusKey } from "@/lib/i18n";

type Kind = string;

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
  eligible: "bg-success/15 text-success border-success/40",
};

export function StatusBadge({ status, className }: { status: Kind; className?: string }) {
  const { t } = useTranslation();
  const normalized = status ? status.toLowerCase().replace(/-/g, "_") : "available";
  const key = statusKey(normalized);
  const label = key ? t(key) : status;

  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
      styles[normalized] ?? "bg-muted text-muted-foreground border-border-soft",
      className,
    )}>
      {label}
    </span>
  );
}
