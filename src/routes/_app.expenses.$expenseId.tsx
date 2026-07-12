import { createFileRoute, useParams } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { useTransitStore } from "@/lib/store";
import { money, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_app/expenses/$expenseId")({
  head: () => ({ meta: [{ title: "Expense — TransitOps" }] }),
  component: () => {
    const { expenseId } = useParams({ from: "/_app/expenses/$expenseId" });
    const { expenses, vehicles } = useTransitStore();
    const e = expenses.find((x) => x.id === expenseId);
    if (!e) return <EmptyState title="Expense not found" />;
    const v = vehicles.find((x) => x.id === e.vehicleId);
    return (
      <div>
        <PageHeader title={money(e.amount)} subtitle={e.note} />
        <div className="brutal-card p-6 max-w-lg space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-semibold capitalize">{e.category}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Vehicle</span><span className="font-semibold">{v?.name ?? "—"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-semibold">{shortDate(e.date)}</span></div>
        </div>
      </div>
    );
  },
});
