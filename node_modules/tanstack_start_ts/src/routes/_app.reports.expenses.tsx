import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/reports/expenses")({
  beforeLoad: () => { throw redirect({ to: "/reports" }); },
});
