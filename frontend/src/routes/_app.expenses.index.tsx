import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { useTransitStore } from "@/lib/store";
import { useTranslation, type I18nKey } from "@/lib/i18n";
import { money, shortDate } from "@/lib/format";
import { Plus, Fuel, Wrench, Receipt, ShieldCheck, MoreHorizontal } from "lucide-react";
import type { Expense } from "@/lib/mock-data";

const icons: Record<Expense["category"], React.ComponentType<{ className?: string }>> = {
  fuel: Fuel, maintenance: Wrench, tolls: Receipt, insurance: ShieldCheck, other: MoreHorizontal,
};

const CAT_KEYS: Record<Expense["category"], I18nKey> = {
  fuel: "expenses_cat_fuel",
  maintenance: "expenses_cat_maintenance",
  tolls: "expenses_cat_tolls",
  insurance: "expenses_cat_insurance",
  other: "expenses_cat_other",
};

export const Route = createFileRoute("/_app/expenses/")({
  head: () => ({ meta: [{ title: "Expenses — TransitOps" }] }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const { t } = useTranslation();
  const { expenses, vehicles } = useTransitStore();
  const byCat = expenses.reduce<Record<string, number>>((a, e) => ({ ...a, [e.category]: (a[e.category] ?? 0) + e.amount }), {});
  const headers = ["date", "category", "vehicle", "expenses_col_note", "amount"] as const;

  return (
    <div>
      <PageHeader
        title={t("expenses_title")}
        subtitle={t("total_spend", { amount: money(expenses.reduce((a, e) => a + e.amount, 0)) })}
        actions={
          <div className="flex gap-2">
            <Link to="/expenses/history" className="brutal-btn px-3 py-2 bg-card">{t("history")}</Link>
            <Link to="/expenses/new">
              <Button className="brutal-btn bg-primary text-primary-foreground">
                <Plus className="h-4 w-4 mr-1" /> {t("expenses_add")}
              </Button>
            </Link>
          </div>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {(["fuel", "maintenance", "tolls", "insurance", "other"] as const).map((c) => {
          const Icon = icons[c];
          return (
            <div key={c} className="brutal-card p-4">
              <div className="flex items-center justify-between"><Icon className="h-4 w-4 text-muted-foreground" /></div>
              <div className="mt-2 text-2xl font-black">{money(byCat[c] ?? 0)}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{t(CAT_KEYS[c])}</div>
            </div>
          );
        })}
      </div>
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
            {expenses.map((e) => {
              const v = vehicles.find((x) => x.id === e.vehicleId);
              return (
                <tr key={e.id} className="border-t border-border-soft">
                  <td className="px-4 py-3">{shortDate(e.date)}</td>
                  <td className="px-4 py-3">{t(CAT_KEYS[e.category])}</td>
                  <td className="px-4 py-3">{v?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.note}</td>
                  <td className="px-4 py-3 font-semibold">{money(e.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
