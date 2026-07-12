import { useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Moon, Search, Sun, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth, useTransitStore, useUI, roleLabel } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function AppTopbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { theme, setTheme } = useUI();
  const notifications = useTransitStore((s) => s.notifications);
  const markAll = useTransitStore((s) => s.markAllNotificationsRead);
  const markNotificationRead = useTransitStore((s) => s.markNotificationRead);
  const pendingIncidentsCount = useTransitStore((s) => s.pendingIncidents.length);
  const unread = notifications.filter((n) => !n.read).length;
  const unreadIncidentNotifications = notifications.filter((n) => !n.read && (n.id.startsWith("inc-") || n.title.toLowerCase().includes("incident")));
  const [q, setQ] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const handleLogout = () => {
    logout();
    nav({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur border-b border-border-soft flex items-center gap-4 px-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search vehicles, drivers, trips…"
          className="pl-9 h-10 brutal-input"
        />
      </div>

      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="h-10 w-10 grid place-items-center rounded-lg hover:bg-accent transition-colors"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <Sheet>
        <SheetTrigger asChild>
          <button className="relative h-10 w-10 grid place-items-center rounded-lg hover:bg-accent transition-colors">
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold grid place-items-center">
                {unread}
              </span>
            )}
          </button>
        </SheetTrigger>
        <SheetContent className="w-[380px]">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>Notifications</span>
              <button onClick={markAll} className="text-xs font-medium text-primary hover:underline">Mark all read</button>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2 overflow-y-auto pr-1">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={cn(
                  "w-full rounded-xl border-2 p-3 text-left transition-colors",
                  n.read ? "border-border-soft bg-muted/40" : "border-border bg-card brutal-shadow-sm",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    n.level === "danger" && "bg-destructive",
                    n.level === "warning" && "bg-warning",
                    n.level === "success" && "bg-success",
                    n.level === "info" && "bg-primary",
                  )} />
                  <div className="text-sm font-semibold">{n.title}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{n.body}</p>
              </button>
            ))}
            {user?.role === "fleet_manager" && unreadIncidentNotifications.length > 0 && (
              <div onClick={() => {
                unreadIncidentNotifications.forEach((n) => markNotificationRead(n.id));
                nav({ to: "/incidents" });
              }} className="rounded-xl border-2 border-border bg-danger/10 brutal-shadow-sm p-3 cursor-pointer transition-colors hover:bg-danger/20">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  <div className="text-sm font-semibold text-danger">Pending Incident Reports</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">You have {pendingIncidentsCount} new AI incident reports pending review.</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-accent transition-colors">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold brutal-border">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-semibold leading-tight">{user?.name}</div>
              <div className="text-[11px] text-muted-foreground leading-tight">{user ? roleLabel[user.role] : ""}</div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => nav({ to: "/settings/profile" })}>
            <UserIcon className="h-4 w-4 mr-2" /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => nav({ to: "/settings" })}>
            <UserIcon className="h-4 w-4 mr-2" /> Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
