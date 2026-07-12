import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { useTransitStore } from "@/lib/store";
import { money, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_app/expenses/history")({
  head: () => ({ meta: [{ title: "Expense history — TransitOps" }] }),
  component: () => {
    const { expenses } = useTransitStore();
    return (
      <div>
        <PageHeader title="Expense history" subtitle={`${expenses.length} entries`} />
        <div className="brutal-card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60"><tr className="text-left">{["Date", "Category", "Amount", "Note"].map((h) => <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>{expenses.map((e) => (
              <tr key={e.id} className="border-t border-border-soft"><td className="px-4 py-3">{shortDate(e.date)}</td><td className="px-4 py-3 capitalize">{e.category}</td><td className="px-4 py-3 font-semibold">{money(e.amount)}</td><td className="px-4 py-3 text-muted-foreground">{e.note}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );
  },
});
