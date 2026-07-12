import { Outlet, createFileRoute, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useAuth, roleAccess } from "@/lib/store";

export const Route = createFileRoute("/_app")({
  ssr: false, // auth lives in localStorage; skip prerender for authed shell
  component: AppLayout,
});

function AppLayout() {
  const user = useAuth((s) => s.user);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!user && typeof window !== "undefined") {
      // Client-side redirect after hydration if session missing
      window.location.replace("/login");
    }
  }, [user]);

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
