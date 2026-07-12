import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
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

export const Route = createFileRoute("/_app/expenses/history")({
  head: () => ({ meta: [{ title: "Expense history — TransitOps" }] }),
  component: ExpenseHistoryPage,
});

function ExpenseHistoryPage() {
  const { t } = useTranslation();
  const { expenses } = useTransitStore();
  const headers = ["date", "category", "amount", "note"] as const;

  return (
    <div>
      <PageHeader title={t("expenses_history_title")} subtitle={t("entries", { count: expenses.length })} />
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
            {expenses.map((e) => (
              <tr key={e.id} className="border-t border-border-soft">
                <td className="px-4 py-3">{shortDate(e.date)}</td>
                <td className="px-4 py-3">{t(CAT_KEYS[e.category])}</td>
                <td className="px-4 py-3 font-semibold">{money(e.amount)}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
