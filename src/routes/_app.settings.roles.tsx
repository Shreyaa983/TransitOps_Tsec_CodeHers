import { createFileRoute } from "@tanstack/react-router";
import { roleLabel, roleAccess, type Role } from "@/lib/store";

export const Route = createFileRoute("/_app/settings/roles")({
  component: () => {
    const roles: Role[] = ["fleet_manager", "dispatcher", "safety_officer", "financial_analyst"];
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((r) => (
          <div key={r} className="brutal-card p-5">
            <div className="font-bold">{roleLabel[r]}</div>
            <div className="text-xs text-muted-foreground mt-1">{roleAccess[r].length} sections accessible</div>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {roleAccess[r].map((s) => <li key={s} className="text-[11px] px-2 py-0.5 rounded brutal-border bg-muted capitalize">{s.replace("-", " ")}</li>)}
            </ul>
          </div>
        ))}
      </div>
    );
  },
});
