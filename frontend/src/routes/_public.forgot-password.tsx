import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Truck, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

export const Route = createFileRoute("/_public/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — TransitOps" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen grid place-items-center p-8 relative">
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {t("back_to_sign_in")}
        </Link>
        <div className="brutal-card p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center brutal-border brutal-shadow-sm">
              <Truck className="h-5 w-5" />
            </div>
            <div className="font-extrabold tracking-tight">{t("brandName")}</div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t("reset_password")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("reset_password_subtitle")}</p>

          {sent ? (
            <div className="mt-6 rounded-xl border-2 border-success/40 bg-success/10 p-4 text-sm text-success">
              {t("reset_sent", { email })}
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); if (!email) return toast.error(t("enter_email")); setSent(true); }}
              className="mt-6 space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="brutal-input h-11" />
              </div>
              <Button type="submit" className="w-full h-11 brutal-btn bg-primary text-primary-foreground hover:bg-primary/90">
                {t("send_reset_link")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
