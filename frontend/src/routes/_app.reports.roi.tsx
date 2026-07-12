import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/reports/roi")({
  beforeLoad: () => { throw redirect({ to: "/reports" }); },
});
