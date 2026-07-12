import { createFileRoute } from "@tanstack/react-router";
import { useUI } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_app/settings/preferences")({
  component: PreferencesSettings,
});

function PreferencesSettings() {
  const { t } = useTranslation();
  const { theme, setTheme, sidebarCollapsed, toggleSidebar } = useUI();
  return (
    <div className="brutal-card p-6 max-w-2xl space-y-5">
      <Row title={t("settings_dark_mode")} desc={t("settings_dark_mode_desc")}><Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} /></Row>
      <Row title={t("settings_collapse_sidebar")} desc={t("settings_collapse_sidebar_desc")}><Switch checked={sidebarCollapsed} onCheckedChange={toggleSidebar} /></Row>
    </div>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div><div className="font-semibold">{title}</div><div className="text-xs text-muted-foreground">{desc}</div></div>
      {children}
    </div>
  );
}
