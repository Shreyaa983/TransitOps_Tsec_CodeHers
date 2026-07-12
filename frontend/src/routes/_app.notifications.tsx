import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { useTransitStore } from "@/lib/store";
import { shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — TransitOps" }] }),
  component: () => {
    const { notifications, markAllNotificationsRead, markNotificationRead } = useTransitStore();
    return (
      <div>
        <PageHeader title="Notification center" subtitle={`${notifications.filter((n) => !n.read).length} unread`}
          actions={<Button onClick={markAllNotificationsRead} className="brutal-btn bg-card"><CheckCheck className="h-4 w-4 mr-1" /> Mark all read</Button>} />
        <div className="space-y-2 max-w-3xl">
          {notifications.map((n) => (
            <button key={n.id} onClick={() => markNotificationRead(n.id)} className={cn("w-full text-left brutal-card p-4 flex items-start gap-3", !n.read && "brutal-card-hover")}>
              <span className={cn("mt-1 h-2.5 w-2.5 rounded-full shrink-0",
                n.level === "danger" && "bg-destructive", n.level === "warning" && "bg-warning",
                n.level === "success" && "bg-success", n.level === "info" && "bg-primary")} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{shortDate(n.createdAt)}</div>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  },
});
