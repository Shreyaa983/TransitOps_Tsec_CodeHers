import { Outlet, createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — TransitOps" }] }),
  component: SettingsLayout,
});
const tabs = [
  { to: "/settings/profile", label: "Profile" },
  { to: "/settings/account", label: "Account" },
  { to: "/settings/roles", label: "Roles" },
  { to: "/settings/preferences", label: "Preferences" },
  { to: "/settings/security", label: "Security" },
] as const;
function SettingsLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account, roles and workspace preferences." />
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {tabs.map((t) => (
          <Link key={t.to} to={t.to} className={`text-xs font-semibold px-3 py-1.5 rounded-lg brutal-border ${path === t.to ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}>{t.label}</Link>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
