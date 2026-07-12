import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/store";
import { useTranslation, roleKey } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/settings/profile")({
  component: ProfileSettings,
});

function ProfileSettings() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const rKey = user?.role ? roleKey(user.role) : null;

  return (
    <div className="brutal-card p-6 max-w-2xl space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-xl bg-primary text-primary-foreground grid place-items-center text-xl font-black brutal-border">{user?.name?.[0]?.toUpperCase()}</div>
        <div>
          <div className="font-bold">{user?.name}</div>
          <div className="text-xs text-muted-foreground">{rKey ? t(rKey) : ""}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label className="text-xs font-semibold">{t("settings_full_name")}</Label><Input className="brutal-input" defaultValue={user?.name} /></div>
        <div className="space-y-1.5"><Label className="text-xs font-semibold">{t("email")}</Label><Input className="brutal-input" defaultValue={user?.email} /></div>
      </div>
    </div>
  );
}
