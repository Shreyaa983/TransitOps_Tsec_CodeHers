import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/fuel/new")({
  head: () => ({ meta: [{ title: "Log fuel — TransitOps" }] }),
  component: NewFuelPage,
});

function NewFuelPage() {
  const { t } = useTranslation();
  const { vehicles, addFuel } = useTransitStore();
  const nav = useNavigate();
  const [f, setF] = useState({ vehicleId: "", litres: 50, pricePerL: 1.42, odometer: 0 });

  return (
    <div>
      <PageHeader title={t("fuel_new_title")} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!f.vehicleId) return toast.error(t("fuel_select_vehicle"));
          addFuel({ id: `f${Date.now()}`, ...f, date: new Date().toISOString() });
          toast.success(t("fuel_logged"));
          nav({ to: "/fuel" });
        }}
        className="brutal-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl"
      >
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("vehicle")}</Label>
          <select className="brutal-input w-full" value={f.vehicleId} onChange={(e) => setF({ ...f, vehicleId: e.target.value })}>
            <option value="">{t("select_placeholder")}</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs font-semibold">{t("fuel_litres")}</Label><Input type="number" className="brutal-input" value={f.litres} onChange={(e) => setF({ ...f, litres: +e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs font-semibold">{t("fuel_price_per_l")}</Label><Input type="number" step="0.01" className="brutal-input" value={f.pricePerL} onChange={(e) => setF({ ...f, pricePerL: +e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs font-semibold">{t("fuel_col_odometer")}</Label><Input type="number" className="brutal-input" value={f.odometer} onChange={(e) => setF({ ...f, odometer: +e.target.value })} /></div>
        <div className="md:col-span-2 flex justify-end gap-2">
          <Button variant="outline" type="button" className="brutal-btn bg-card" onClick={() => nav({ to: "/fuel" })}>{t("cancel")}</Button>
          <Button className="brutal-btn bg-primary text-primary-foreground">{t("save")}</Button>
        </div>
      </form>
    </div>
  );
}
