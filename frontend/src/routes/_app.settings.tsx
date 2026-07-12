import { Outlet, createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { useTranslation, type I18nKey } from "@/lib/i18n";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — TransitOps" }] }),
  component: SettingsLayout,
});

const tabs: { to: "/settings/profile" | "/settings/account" | "/settings/roles" | "/settings/preferences" | "/settings/security"; labelKey: I18nKey }[] = [
  { to: "/settings/profile", labelKey: "settings_tab_profile" },
  { to: "/settings/account", labelKey: "settings_tab_account" },
  { to: "/settings/roles", labelKey: "settings_tab_roles" },
  { to: "/settings/preferences", labelKey: "settings_tab_preferences" },
  { to: "/settings/security", labelKey: "settings_tab_security" },
];

function SettingsLayout() {
  const { t } = useTranslation();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div>
      <PageHeader title={t("settings_title")} subtitle={t("settings_subtitle")} />
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg brutal-border ${path === tab.to ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
          >
            {t(tab.labelKey)}
          </Link>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
