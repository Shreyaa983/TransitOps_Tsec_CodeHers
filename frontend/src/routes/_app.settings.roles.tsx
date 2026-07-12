import { createFileRoute } from "@tanstack/react-router";
import { roleAccess, type Role } from "@/lib/store";
import { useTranslation, roleKey, crumbKey } from "@/lib/i18n";

export const Route = createFileRoute("/_app/settings/roles")({
  component: RolesSettings,
});

function RolesSettings() {
  const { t } = useTranslation();
  const roles: Role[] = ["fleet_manager", "dispatcher", "safety_officer", "financial_analyst"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {roles.map((r) => {
        const key = roleKey(r);
        return (
          <div key={r} className="brutal-card p-5">
            <div className="font-bold">{key ? t(key) : r}</div>
            <div className="text-xs text-muted-foreground mt-1">{t("settings_sections_accessible", { count: roleAccess[r].length })}</div>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {roleAccess[r].map((s) => {
                const cKey = crumbKey(s);
                return (
                  <li key={s} className="text-[11px] px-2 py-0.5 rounded brutal-border bg-muted">
                    {cKey ? t(cKey) : s.replace("-", " ")}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
