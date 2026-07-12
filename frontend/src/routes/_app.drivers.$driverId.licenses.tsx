import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { driversApi } from "@/lib/drivers-api";
import { shortDate, daysUntil } from "@/lib/format";
import { IdCard } from "lucide-react";

export const Route = createFileRoute("/_app/drivers/$driverId/licenses")({
  head: () => ({ meta: [{ title: "Driver licenses — TransitOps" }] }),
  component: DriverLicenses,
});

function DriverLicenses() {
  const { driverId } = useParams({ from: "/_app/drivers/$driverId/licenses" });

  const { data: license, isLoading, isError } = useQuery({
    queryKey: ["drivers", driverId, "license"],
    queryFn: () => driversApi.getLicense(driverId),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading license…</div>;
  if (isError || !license) return <EmptyState title="Driver not found" />;

  const days = daysUntil(license.licenseExpiry);

  return (
    <div>
      <PageHeader title={`${license.name} — Licenses`} subtitle="License, endorsements and medical certifications." />
      <div className="brutal-card p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 grid place-items-center rounded-xl bg-primary/10 text-primary brutal-border"><IdCard className="h-6 w-6" /></div>
          <div>
            <div className="font-bold">Commercial driver's license</div>
            <div className="text-xs text-muted-foreground font-mono">{license.licenseNumber}</div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-xs text-muted-foreground">Category</dt><dd className="font-semibold">{license.category}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Expiry</dt><dd className="font-semibold">{shortDate(license.licenseExpiry)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Status</dt><dd className={`font-semibold ${days < 0 ? "text-destructive" : days < 15 ? "text-warning" : "text-success"}`}>{days < 0 ? "Expired" : `Valid · ${days} days left`}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Endorsements</dt><dd className="font-semibold">Hazmat, Tanker</dd></div>
        </dl>
      </div>
    </div>
  );
}
