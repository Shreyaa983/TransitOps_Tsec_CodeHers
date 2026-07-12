import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useAuth, roleAccess, useTransitStore } from "@/lib/store";
import { useTranslation, resolveNotification, isIncidentNotification } from "@/lib/i18n";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const notifications = useTransitStore((s) => s.notifications);
  const pendingIncidentsCount = useTransitStore((s) => s.pendingIncidents.length);
  const markNotificationRead = useTransitStore((s) => s.markNotificationRead);
  const toastedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user && typeof window !== "undefined") {
      window.location.replace("/login");
    } else if (user) {
      useTransitStore.getState().syncWithBackend();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      useTransitStore.getState().syncWithBackend();
    }, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const unreadIncidentNotifications = notifications.filter((n) => {
      if (n.read) return false;
      return isIncidentNotification(n);
    });

    if (user.role === "fleet_manager" && pendingIncidentsCount > 1) {
      const summaryToastId = "fleet-manager-pending-incidents-summary";
      if (toastedIds.current.has(summaryToastId)) return;

      toastedIds.current.add(summaryToastId);
      toast.error(t("incidents_toast_title"), {
        description: t("incidents_toast_body", { count: pendingIncidentsCount }),
        duration: 8000,
        action: {
          label: t("incidents_review"),
          onClick: () => {
            unreadIncidentNotifications.forEach((n) => markNotificationRead(n.id));
            window.location.assign("/incidents");
          },
        },
      });
      return;
    }

    unreadIncidentNotifications.forEach((n) => {
      if (toastedIds.current.has(n.id)) return;
      toastedIds.current.add(n.id);

      const { title, body } = resolveNotification(n, t);

      if (n.level === "danger") {
        toast.error(title, {
          description: body,
          duration: 8000,
          action: user.role === "fleet_manager"
            ? {
                label: t("incidents_review"),
                onClick: () => {
                  markNotificationRead(n.id);
                  window.location.assign("/incidents");
                },
              }
            : undefined,
        });
      } else if (n.level === "success") {
        toast.success(title, { description: body, duration: 6000 });
      } else if (n.level === "warning") {
        toast.warning(title, { description: body, duration: 6000 });
      } else {
        toast.info(title, { description: body, duration: 5000 });
      }
    });
  }, [notifications, pendingIncidentsCount, user, markNotificationRead, t]);

  const topSeg = pathname.split("/")[1] ?? "";
  const forbidden = user && topSeg && !roleAccess[user.role].includes(topSeg);

  if (!user) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">{t("redirecting")}</div>;
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopbar />
        <div className="px-6 pt-4">
          <Breadcrumbs />
        </div>
        <main className="flex-1 px-6 py-6">
          {forbidden ? <Forbidden /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}

function Forbidden() {
  const { t } = useTranslation();
  return (
    <div className="brutal-card p-10 text-center max-w-lg mx-auto mt-10">
      <div className="text-5xl font-black tracking-tight">403</div>
      <h2 className="mt-2 text-xl font-bold">{t("access_restricted")}</h2>
      <p className="text-sm text-muted-foreground mt-1">{t("access_restricted_body")}</p>
    </div>
  );
}
