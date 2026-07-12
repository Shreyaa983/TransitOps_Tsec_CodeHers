import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { driversApi, type DriverStatus } from "@/lib/drivers-api";
import { toast } from "sonner";
import { useTranslation, statusKey } from "@/lib/i18n";

export const Route = createFileRoute("/_app/drivers/$driverId/edit")({
  head: () => ({ meta: [{ title: "Edit driver — TransitOps" }] }),
  component: EditDriver,
});

type FormState = {
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  phone: string;
  safetyScore: number;
  status: DriverStatus;
};

function EditDriver() {
  const { t } = useTranslation();
  const { driverId } = useParams({ from: "/_app/drivers/$driverId/edit" });
  const nav = useNavigate();
  const qc = useQueryClient();

  const statusOptions = useMemo(
    () =>
      (["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"] as const).map((value) => ({
        value,
        label: t(statusKey(value) ?? "status_available"),
      })),
    [t],
  );

  const { data: driver, isLoading, isError } = useQuery({
    queryKey: ["drivers", driverId],
    queryFn: () => driversApi.getOne(driverId),
  });

  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (driver) {
      setForm({
        name: driver.name,
        licenseNumber: driver.licenseNumber,
        licenseCategory: driver.category,
        phone: driver.phone,
        safetyScore: driver.safetyScore,
        status: driver.status,
      });
    }
  }, [driver]);

  const mutation = useMutation({
    mutationFn: (body: FormState) => driversApi.update(driverId, body),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
      qc.setQueryData(["drivers", driverId], updated);
      toast.success(t("drivers_updated"));
      nav({ to: "/drivers/$driverId", params: { driverId } });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t("drivers_update_failed")),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">{t("drivers_loading_one")}</div>;
  if (isError || !driver || !form) return <EmptyState title={t("drivers_not_found")} />;

  return (
    <div>
      <PageHeader title={t("drivers_edit_title", { name: driver.name })} />
      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}
        className="brutal-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl"
      >
        <F label={t("drivers_full_name")}><Input className="brutal-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></F>
        <F label={t("drivers_license_hash")}><Input className="brutal-input" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} /></F>
        <F label={t("category")}><Input className="brutal-input" value={form.licenseCategory} onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })} /></F>
        <F label={t("drivers_phone")}><Input className="brutal-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></F>
        <F label={t("drivers_safety_score_label")}><Input type="number" className="brutal-input" value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: +e.target.value })} /></F>
        <F label={t("status")}>
          <select className="brutal-input w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DriverStatus })}>
            {statusOptions.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </F>
        <div className="md:col-span-2 flex gap-2 justify-end">
          <Button type="button" variant="outline" className="brutal-btn bg-card" onClick={() => nav({ to: "/drivers/$driverId", params: { driverId } })}>{t("cancel")}</Button>
          <Button type="submit" className="brutal-btn bg-primary text-primary-foreground" disabled={mutation.isPending}>
            {mutation.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}</Label>{children}</div>;
}
