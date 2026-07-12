import { createFileRoute, useParams } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { useTransitStore } from "@/lib/store";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/_app/vehicles/$vehicleId/documents")({
  head: () => ({ meta: [{ title: "Vehicle documents — TransitOps" }] }),
  component: VehicleDocsPage,
});

const mockDocs = [
  { name: "Registration certificate.pdf", size: "218 KB", added: "2 months ago" },
  { name: "Insurance policy 2026.pdf", size: "412 KB", added: "3 weeks ago" },
  { name: "Inspection report Q4.pdf", size: "156 KB", added: "1 week ago" },
];

function VehicleDocsPage() {
  const { vehicleId } = useParams({ from: "/_app/vehicles/$vehicleId/documents" });
  const v = useTransitStore((s) => s.vehicles.find((x) => x.id === vehicleId));
  return (
    <div>
      <PageHeader title={`${v?.name ?? "Vehicle"} — Documents`} subtitle="Registration, insurance, inspections and more." />
      <div className="brutal-card p-0 overflow-hidden">
        <ul className="divide-y divide-border-soft">
          {mockDocs.map((d) => (
            <li key={d.name} className="flex items-center gap-3 px-5 py-4">
              <div className="h-9 w-9 grid place-items-center rounded-lg bg-primary/10 text-primary brutal-border"><FileText className="h-4 w-4" /></div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{d.name}</div>
                <div className="text-xs text-muted-foreground">{d.size} · Added {d.added}</div>
              </div>
              <button className="brutal-btn px-3 py-1.5 text-xs bg-card">Download</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
