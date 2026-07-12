import { createFileRoute, useParams } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { useTransitStore } from "@/lib/store";
import { useTranslation, type I18nKey } from "@/lib/i18n";
import { money, shortDate } from "@/lib/format";
import type { Expense } from "@/lib/mock-data";

const CAT_KEYS: Record<Expense["category"], I18nKey> = {
  fuel: "expenses_cat_fuel",
  maintenance: "expenses_cat_maintenance",
  tolls: "expenses_cat_tolls",
  insurance: "expenses_cat_insurance",
  other: "expenses_cat_other",
};

export const Route = createFileRoute("/_app/expenses/$expenseId")({
  head: () => ({ meta: [{ title: "Expense — TransitOps" }] }),
  component: ExpenseDetailPage,
});

function ExpenseDetailPage() {
  const { t } = useTranslation();
  const { expenseId } = useParams({ from: "/_app/expenses/$expenseId" });
  const { expenses, vehicles } = useTransitStore();
  const e = expenses.find((x) => x.id === expenseId);
  if (!e) return <EmptyState title={t("expenses_not_found")} />;
  const v = vehicles.find((x) => x.id === e.vehicleId);

  return (
    <div>
      <PageHeader title={money(e.amount)} subtitle={e.note} />
      <div className="brutal-card p-6 max-w-lg space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">{t("category")}</span><span className="font-semibold">{t(CAT_KEYS[e.category])}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">{t("vehicle")}</span><span className="font-semibold">{v?.name ?? "—"}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">{t("date")}</span><span className="font-semibold">{shortDate(e.date)}</span></div>
      </div>
    </div>
  );
}
