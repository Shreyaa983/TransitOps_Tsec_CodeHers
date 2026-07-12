import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_app/settings/account")({
  component: () => (
    <div className="brutal-card p-6 max-w-2xl">
      <h3 className="font-bold mb-2">Workspace</h3>
      <p className="text-sm text-muted-foreground">TransitOps · Demo workspace · Plan: Enterprise (trial).</p>
    </div>
  ),
});
