import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsLayout,
});

function ReportsLayout() {
  return <Outlet />;
}
