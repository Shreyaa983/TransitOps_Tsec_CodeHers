import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { money, shortDate } from "@/lib/format";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/fuel/")({
  head: () => ({ meta: [{ title: "Fuel — TransitOps" }] }),
  component: FuelPage,
});

function FuelPage() {
  const { t } = useTranslation();
  const { fuel, vehicles } = useTransitStore();
  const headers = ["vehicle", "fuel_col_litres", "fuel_col_price", "total", "fuel_col_odometer", "date"] as const;

  return (
    <div>
      <PageHeader
        title={t("fuel_title")}
        subtitle={t("entries", { count: fuel.length })}
        actions={
          <div className="flex gap-2">
            <Link to="/fuel/history" className="brutal-btn px-3 py-2 bg-card">{t("history")}</Link>
            <Link to="/fuel/new">
              <Button className="brutal-btn bg-primary text-primary-foreground">
                <Plus className="h-4 w-4 mr-1" /> {t("fuel_log")}
              </Button>
            </Link>
          </div>
        }
      />
      <div className="brutal-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr className="text-left">
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fuel.map((f) => {
              const v = vehicles.find((x) => x.id === f.vehicleId);
              return (
                <tr key={f.id} className="border-t border-border-soft hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold">
                    <Link to="/fuel/$fuelLogId" params={{ fuelLogId: f.id }} className="hover:text-primary">{v?.name ?? "—"}</Link>
                  </td>
                  <td className="px-4 py-3">{f.litres} L</td>
                  <td className="px-4 py-3">${f.pricePerL.toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold">{money(f.litres * f.pricePerL)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.odometer.toLocaleString()} km</td>
                  <td className="px-4 py-3 text-muted-foreground">{shortDate(f.date)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
