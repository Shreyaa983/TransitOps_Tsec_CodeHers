import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useTransitStore } from "@/lib/store";

export const Route = createFileRoute("/_app/reports/export")({
  component: () => {
    const store = useTransitStore();
    const downloadCSV = () => {
      const rows = store.vehicles.map((v) => `${v.registration},${v.name},${v.model},${v.status},${v.odometerKm}`);
      const blob = new Blob(["registration,name,model,status,odometer\n" + rows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "vehicles.csv"; a.click(); URL.revokeObjectURL(url);
      toast.success("CSV exported");
    };
    return (
      <div className="brutal-card p-6 max-w-lg space-y-4">
        <h3 className="font-bold">Export data</h3>
        <p className="text-sm text-muted-foreground">Download your fleet data as CSV. PDF reports are being prepared for enterprise plans.</p>
        <div className="flex gap-2">
          <Button onClick={downloadCSV} className="brutal-btn bg-primary text-primary-foreground"><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
          <Button variant="outline" onClick={() => toast.info("PDF export coming soon")} className="brutal-btn bg-card"><Download className="h-4 w-4 mr-1" /> Export PDF</Button>
        </div>
      </div>
    );
  },
});
