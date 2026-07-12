import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Truck, Users, Route, Wrench, Fuel, Receipt, BarChart3, Sparkles, Bell, Settings, ChevronsLeft, ChevronsRight, AlertTriangle,
} from "lucide-react";
import { useAuth, useUI, roleAccess } from "@/lib/store";
import { cn } from "@/lib/utils";

const items = [
  { key: "dashboard", to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { key: "vehicles", to: "/vehicles", icon: Truck, label: "Vehicles" },
  { key: "drivers", to: "/drivers", icon: Users, label: "Drivers" },
  { key: "trips", to: "/trips", icon: Route, label: "Trips" },
  { key: "maintenance", to: "/maintenance", icon: Wrench, label: "Maintenance" },
  { key: "fuel", to: "/fuel", icon: Fuel, label: "Fuel" },
  { key: "expenses", to: "/expenses", icon: Receipt, label: "Expenses" },
  { key: "reports", to: "/reports", icon: BarChart3, label: "Reports & Analytics" },
  { key: "incidents", to: "/incidents", icon: AlertTriangle, label: "Review Incidents" },
  { key: "report-incident", to: "/report-incident", icon: AlertTriangle, label: "Report Incident" },
  { key: "ai-copilot", to: "/ai-copilot", icon: Sparkles, label: "AI Copilot" },
  { key: "notifications", to: "/notifications", icon: Bell, label: "Notifications" },
  { key: "settings", to: "/settings", icon: Settings, label: "Settings" },
] as const;

export function AppSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUI();
  const user = useAuth((s) => s.user);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const allowed = user ? roleAccess[user.role] : [];

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-[width] duration-200",
        sidebarCollapsed ? "w-[72px]" : "w-[248px]",
      )}
    >
      <div className="flex items-center gap-2 px-4 h-16 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center brutal-border brutal-shadow-sm">
          <Truck className="h-5 w-5" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <div className="font-extrabold tracking-tight leading-none">TransitOps</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Smart Transport Ops</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items
          .filter((i) => allowed.includes(i.key))
          .map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground brutal-shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
      </nav>

      <button
        onClick={toggleSidebar}
        className="mx-2 mb-3 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-sidebar-accent"
      >
        {sidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : (<><ChevronsLeft className="h-4 w-4" /> Collapse</>)}
      </button>
    </aside>
  );
}
