import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { driversApi } from "@/lib/drivers-api";
import { shortDate, daysUntil } from "@/lib/format";
import { IdCard } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/_app/drivers/$driverId/licenses")({
  head: () => ({ meta: [{ title: "Driver licenses — TransitOps" }] }),
  component: DriverLicenses,
});

function DriverLicenses() {
  const { t } = useTranslation();
  const { driverId } = useParams({ from: "/_app/drivers/$driverId/licenses" });

  const { data: license, isLoading, isError } = useQuery({
    queryKey: ["drivers", driverId, "license"],
    queryFn: () => driversApi.getLicense(driverId),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">{t("drivers_license_loading")}</div>;
  if (isError || !license) return <EmptyState title={t("drivers_not_found")} />;

  const days = daysUntil(license.licenseExpiry);

  return (
    <div>
      <PageHeader title={t("drivers_licenses_title", { name: license.name })} subtitle={t("drivers_licenses_subtitle")} />
      <div className="brutal-card p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 grid place-items-center rounded-xl bg-primary/10 text-primary brutal-border"><IdCard className="h-6 w-6" /></div>
          <div>
            <div className="font-bold">{t("drivers_cdl")}</div>
            <div className="text-xs text-muted-foreground font-mono">{license.licenseNumber}</div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-xs text-muted-foreground">{t("category")}</dt><dd className="font-semibold">{license.category}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{t("expiry")}</dt><dd className="font-semibold">{shortDate(license.licenseExpiry)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{t("status")}</dt><dd className={`font-semibold ${days < 0 ? "text-destructive" : days < 15 ? "text-warning" : "text-success"}`}>{days < 0 ? t("drivers_expired") : t("drivers_valid_days", { days })}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{t("drivers_endorsements")}</dt><dd className="font-semibold">{t("drivers_hazmat")}</dd></div>
        </dl>
      </div>
    </div>
  );
}
