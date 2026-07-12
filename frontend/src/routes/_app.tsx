import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useAuth, roleAccess, useTransitStore } from "@/lib/store";

export const Route = createFileRoute("/_app")({
  ssr: false, // auth lives in localStorage; skip prerender for authed shell
  component: AppLayout,
});

function AppLayout() {
  const user = useAuth((s) => s.user);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const notifications = useTransitStore((s) => s.notifications);
  const pendingIncidentsCount = useTransitStore((s) => s.pendingIncidents.length);
  const markNotificationRead = useTransitStore((s) => s.markNotificationRead);
  // Track which notification IDs we've already toasted so we don't repeat
  const toastedIds = useRef<Set<string>>(new Set());

  // Initial sync on login
  useEffect(() => {
    if (!user && typeof window !== "undefined") {
      window.location.replace("/login");
    } else if (user) {
      useTransitStore.getState().syncWithBackend();
    }
  }, [user]);

  // Polling sync every 30 seconds while logged in
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      useTransitStore.getState().syncWithBackend();
    }, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  // Fire a single global summary toast for fleet-manager incident batches,
  // instead of one toast per pending incident item.
  useEffect(() => {
    if (!user) return;

    const unreadIncidentNotifications = notifications.filter((n) => {
      if (n.read) return false;
      return n.id.startsWith("inc-") || n.title.toLowerCase().includes("incident");
    });

    if (user.role === "fleet_manager" && pendingIncidentsCount > 1) {
      const summaryToastId = "fleet-manager-pending-incidents-summary";
      if (toastedIds.current.has(summaryToastId)) return;

      toastedIds.current.add(summaryToastId);
      toast.error("Pending Incident Reports", {
        description: `${pendingIncidentsCount} driver incident reports need your review.`,
        duration: 8000,
        action: {
          label: "Review →",
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

      if (n.level === "danger") {
        toast.error(n.title, {
          description: n.body,
          duration: 8000,
          action: user.role === "fleet_manager"
            ? {
                label: "Review →",
                onClick: () => {
                  markNotificationRead(n.id);
                  window.location.assign("/incidents");
                },
              }
            : undefined,
        });
      } else if (n.level === "success") {
        toast.success(n.title, { description: n.body, duration: 6000 });
      } else if (n.level === "warning") {
        toast.warning(n.title, { description: n.body, duration: 6000 });
      } else {
        toast.info(n.title, { description: n.body, duration: 5000 });
      }
    });
  }, [notifications, pendingIncidentsCount, user, markNotificationRead]);

  // Role gate: if the current top-level segment isn't allowed, show 403 inline
  const topSeg = pathname.split("/")[1] ?? "";
  const forbidden = user && topSeg && !roleAccess[user.role].includes(topSeg);

  if (!user) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">Redirecting…</div>;
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
  return (
    <div className="brutal-card p-10 text-center max-w-lg mx-auto mt-10">
      <div className="text-5xl font-black tracking-tight">403</div>
      <h2 className="mt-2 text-xl font-bold">Access restricted</h2>
      <p className="text-sm text-muted-foreground mt-1">Your role doesn't have access to this section. Contact your fleet administrator.</p>
    </div>
  );
}
