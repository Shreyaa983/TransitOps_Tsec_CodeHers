import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { vehiclesApi } from "@/lib/vehicles-api";
import { useTransitStore } from "@/lib/store";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/_app/vehicles/new")({
  head: () => ({ meta: [{ title: "Add vehicle — TransitOps" }] }),
  component: NewVehiclePage,
});

function NewVehiclePage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    registrationNumber: "",
    name: "",
    model: "",
    type: "Van",
    maxLoadCapacity: 1000,
    odometer: 0,
    acquisitionCost: 0,
  });

  const vehicleTypes = useMemo(
    () => [
      { value: "Van", label: t("vehicles_type_van") },
      { value: "Truck", label: t("vehicles_type_truck") },
      { value: "Pickup", label: t("vehicles_type_pickup") },
      { value: "Trailer", label: t("vehicles_type_trailer") },
    ],
    [t],
  );

  const mutation = useMutation({
    mutationFn: () =>
      vehiclesApi.create({
        registrationNumber: form.registrationNumber.trim().toUpperCase(),
        name: form.name.trim(),
        model: form.model.trim(),
        type: form.type,
        maxLoadCapacity: Number(form.maxLoadCapacity),
        odometer: Number(form.odometer),
        acquisitionCost: Number(form.acquisitionCost),
        status: "AVAILABLE",
      }),
    onSuccess: (v) => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      useTransitStore.getState().syncWithBackend();
      toast.success(t("vehicles_added", { name: v.name }));
      nav({ to: "/vehicles" });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t("vehicles_add_failed")),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.registrationNumber.trim() || !form.name.trim()) {
      return toast.error(t("vehicles_reg_required"));
    }
    if (!form.model.trim()) return toast.error(t("vehicles_model_required"));
    mutation.mutate();
  };

  return (
    <div>
      <PageHeader title={t("vehicles_new_title")} subtitle={t("vehicles_new_subtitle")} />
      <form onSubmit={submit} className="brutal-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <Field label={t("vehicles_reg_number")}>
          <Input className="brutal-input" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} placeholder={t("vehicles_reg_placeholder")} />
        </Field>
        <Field label={t("vehicles_name")}>
          <Input className="brutal-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label={t("model")}>
          <Input className="brutal-input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        </Field>
        <Field label={t("type")}>
          <select className="brutal-input w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {vehicleTypes.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label={t("vehicles_max_load")}>
          <Input type="number" min={0} className="brutal-input" value={form.maxLoadCapacity} onChange={(e) => setForm({ ...form, maxLoadCapacity: +e.target.value })} />
        </Field>
        <Field label={t("vehicles_odometer_km")}>
          <Input type="number" min={0} className="brutal-input" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: +e.target.value })} />
        </Field>
        <Field label={t("vehicles_acquisition_cost")}>
          <Input type="number" min={0} className="brutal-input" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: +e.target.value })} />
        </Field>
        <div className="md:col-span-2 flex gap-2 justify-end pt-2">
          <Button type="button" variant="outline" onClick={() => nav({ to: "/vehicles" })} className="brutal-btn bg-card">{t("cancel")}</Button>
          <Button type="submit" className="brutal-btn bg-primary text-primary-foreground hover:bg-primary/90" disabled={mutation.isPending}>
            {mutation.isPending ? t("saving") : t("vehicles_save")}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}</Label>{children}</div>;
}
