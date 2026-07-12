import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/_app/settings/security")({
  component: SecuritySettings,
});

function SecuritySettings() {
  const { t } = useTranslation();
  return (
    <form onSubmit={(e) => { e.preventDefault(); toast.success(t("settings_password_updated")); }} className="brutal-card p-6 max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1.5"><Label className="text-xs font-semibold">{t("settings_current_password")}</Label><Input type="password" className="brutal-input" /></div>
      <div className="space-y-1.5"><Label className="text-xs font-semibold">{t("settings_new_password")}</Label><Input type="password" className="brutal-input" /></div>
      <div className="md:col-span-2 flex justify-end"><Button className="brutal-btn bg-primary text-primary-foreground">{t("settings_update_password")}</Button></div>
    </form>
  );
}
