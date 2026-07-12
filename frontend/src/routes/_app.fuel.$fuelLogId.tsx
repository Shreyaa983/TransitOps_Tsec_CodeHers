import { createFileRoute, useParams } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { useTransitStore } from "@/lib/store";
import { money, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_app/fuel/$fuelLogId")({
  head: () => ({ meta: [{ title: "Fuel entry — TransitOps" }] }),
  component: () => {
    const { fuelLogId } = useParams({ from: "/_app/fuel/$fuelLogId" });
    const { fuel, vehicles } = useTransitStore();
    const f = fuel.find((x) => x.id === fuelLogId);
    if (!f) return <EmptyState title="Fuel entry not found" />;
    const v = vehicles.find((x) => x.id === f.vehicleId);
    return (
      <div>
        <PageHeader title={`Fuel entry`} subtitle={v?.name} />
        <div className="brutal-card p-6 max-w-lg space-y-3 text-sm">
          <Row label="Vehicle">{v?.name ?? "—"}</Row>
          <Row label="Litres">{f.litres} L</Row>
          <Row label="Price / L">${f.pricePerL.toFixed(2)}</Row>
          <Row label="Total">{money(f.litres * f.pricePerL)}</Row>
          <Row label="Odometer">{f.odometer.toLocaleString()} km</Row>
          <Row label="Date">{shortDate(f.date)}</Row>
        </div>
      </div>
    );
  },
});
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex justify-between border-b border-border-soft pb-2 last:border-0"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{children}</span></div>;
}
