import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { vehiclesApi, type VehicleStatus } from "@/lib/vehicles-api";
import { useTransitStore } from "@/lib/store";
import { toast } from "sonner";
import { useTranslation, statusKey } from "@/lib/i18n";

export const Route = createFileRoute("/_app/vehicles/$vehicleId/edit")({
  head: () => ({ meta: [{ title: "Edit vehicle — TransitOps" }] }),
  component: EditVehiclePage,
});

type FormState = {
  registrationNumber: string;
  name: string;
  model: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
};

function EditVehiclePage() {
  const { t } = useTranslation();
  const { vehicleId } = useParams({ from: "/_app/vehicles/$vehicleId/edit" });
  const nav = useNavigate();
  const qc = useQueryClient();

  const vehicleTypes = useMemo(
    () => [
      { value: "Van", label: t("vehicles_type_van") },
      { value: "Truck", label: t("vehicles_type_truck") },
      { value: "Pickup", label: t("vehicles_type_pickup") },
      { value: "Trailer", label: t("vehicles_type_trailer") },
    ],
    [t],
  );

  const statusOptions = useMemo(
    () =>
      (["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"] as const).map((value) => ({
        value,
        label: t(statusKey(value) ?? "status_available"),
      })),
    [t],
  );

  const { data: vehicle, isLoading, isError } = useQuery({
    queryKey: ["vehicles", vehicleId],
    queryFn: () => vehiclesApi.getOne(vehicleId),
  });

  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (vehicle) {
      setForm({
        registrationNumber: vehicle.registrationNumber,
        name: vehicle.name,
        model: vehicle.model,
        type: vehicle.type,
        maxLoadCapacity: vehicle.maxLoadCapacity,
        odometer: vehicle.odometer,
        acquisitionCost: vehicle.acquisitionCost,
        status: vehicle.status,
      });
    }
  }, [vehicle]);

  const mutation = useMutation({
    mutationFn: (body: FormState) => vehiclesApi.update(vehicleId, {
      ...body,
      registrationNumber: body.registrationNumber.trim().toUpperCase(),
    }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.setQueryData(["vehicles", vehicleId], updated);
      useTransitStore.getState().syncWithBackend();
      toast.success(t("vehicles_updated"));
      nav({ to: "/vehicles/$vehicleId", params: { vehicleId } });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t("vehicles_update_failed")),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">{t("loading")}</div>;
  if (isError || !vehicle || !form) return <EmptyState title={t("vehicles_not_found")} />;

  return (
    <div>
      <PageHeader title={t("vehicles_edit_title", { name: vehicle.name })} subtitle={vehicle.registrationNumber} />
      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}
        className="brutal-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl"
      >
        <F label={t("vehicles_name")}>
          <Input className="brutal-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </F>
        <F label={t("vehicles_reg_number")}>
          <Input className="brutal-input" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
        </F>
        <F label={t("model")}>
          <Input className="brutal-input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        </F>
        <F label={t("type")}>
          <select className="brutal-input w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {vehicleTypes.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </F>
        <F label={t("vehicles_max_load")}>
          <Input type="number" min={0} className="brutal-input" value={form.maxLoadCapacity} onChange={(e) => setForm({ ...form, maxLoadCapacity: +e.target.value })} />
        </F>
        <F label={t("vehicles_odometer_km")}>
          <Input type="number" min={0} className="brutal-input" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: +e.target.value })} />
        </F>
        <F label={t("vehicles_acquisition_cost")}>
          <Input type="number" min={0} className="brutal-input" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: +e.target.value })} />
        </F>
        <F label={t("status")}>
          <select className="brutal-input w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}>
            {statusOptions.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </F>
        <div className="md:col-span-2 flex gap-2 justify-end pt-2">
          <Button type="button" variant="outline" onClick={() => nav({ to: "/vehicles/$vehicleId", params: { vehicleId } })} className="brutal-btn bg-card">{t("cancel")}</Button>
          <Button type="submit" className="brutal-btn bg-primary text-primary-foreground hover:bg-primary/90" disabled={mutation.isPending}>
            {mutation.isPending ? t("saving") : t("vehicles_save_changes")}
          </Button>
        </div>
      </form>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}</Label>{children}</div>;
}
