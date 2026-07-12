import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { useTransitStore } from "@/lib/store";
import { useTranslation, resolveNotification, isIncidentNotification } from "@/lib/i18n";
import { shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — TransitOps" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { t } = useTranslation();
  const { notifications, markAllNotificationsRead, markNotificationRead } = useTransitStore();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="pb-20">
      <PageHeader
        title={t("notif_title")}
        subtitle={t("notif_unread", { count: unread })}
        actions={
          <Button onClick={markAllNotificationsRead} className="brutal-btn bg-card">
            <CheckCheck className="h-4 w-4 mr-1" /> {t("mark_all_read")}
          </Button>
        }
      />
      <div className="space-y-4 max-w-3xl">
        {notifications.map((n) => {
          const { title, body } = resolveNotification(n, t);
          return (
          <button
            key={n.id}
            onClick={() => markNotificationRead(n.id)}
            className={cn("w-full text-left brutal-card p-4 flex items-start gap-3", !n.read && "brutal-card-hover")}
          >
            <span className={cn(
              "mt-1 h-2.5 w-2.5 rounded-full shrink-0",
              n.level === "danger" && "bg-destructive",
              n.level === "warning" && "bg-warning",
              n.level === "success" && "bg-success",
              n.level === "info" && "bg-primary",
            )} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{title}</div>
                <div className="text-xs text-muted-foreground">{shortDate(n.createdAt)}</div>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{body}</p>
            </div>
          </button>
          );
        })}
      </div>
    </div>
  );
}
