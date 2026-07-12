import { Outlet, createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — TransitOps" }] }),
  component: ReportsLayout,
});
const tabs = [
  { to: "/reports/fleet", label: "Fleet" },
  { to: "/reports/fuel", label: "Fuel" },
  { to: "/reports/expenses", label: "Expenses" },
  { to: "/reports/roi", label: "ROI" },
  { to: "/reports/export", label: "Export" },
] as const;
function ReportsLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div>
      <PageHeader title="Reports" subtitle="Analytics across your fleet operations." />
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {tabs.map((t) => (
          <Link key={t.to} to={t.to} className={`text-xs font-semibold px-3 py-1.5 rounded-lg brutal-border ${path === t.to ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}>{t.label}</Link>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
