import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/_app/settings/account")({
  component: AccountSettings,
});

function AccountSettings() {
  const { t } = useTranslation();
  return (
    <div className="brutal-card p-6 max-w-2xl">
      <h3 className="font-bold mb-2">{t("settings_workspace")}</h3>
      <p className="text-sm text-muted-foreground">{t("settings_workspace_desc")}</p>
    </div>
  );
}
