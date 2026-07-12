import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportsAnalytics } from "./reports-api";
import { money } from "./format";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatMetric(value: string | number | null | undefined, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

export function exportReportsCsv(data: ReportsAnalytics) {
  const summaryRows = [
    ["Metric", "Value"],
    ["Fuel Efficiency (km/L)", data.summary.fuelEfficiencyKmPerLiter ?? ""],
    ["Total Distance (km)", data.summary.totalDistanceKm],
    ["Total Fuel (L)", data.summary.totalFuelLiters],
    ["Fleet Utilization (%)", data.summary.fleetUtilizationPct],
    ["Operational Cost", data.summary.operationalCost],
    ["Total Revenue", data.summary.totalRevenue],
    ["Average ROI (%)", data.summary.avgRoiPct ?? ""],
    [],
    ["Vehicle", "Registration", "Acquisition", "Revenue", "Fuel", "Maintenance", "Net Return", "ROI %"],
    ...data.vehicleRoi.map((v) => [
      v.name,
      v.registration,
      v.acquisitionCost,
      v.revenue,
      v.fuelCost,
      v.maintenanceCost,
      v.netReturn,
      v.roiPct ?? "",
    ]),
  ];

  const csv = summaryRows.map((row) => row.join(",")).join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "transitops-reports-analytics.csv");
}

export function exportReportsPdf(data: ReportsAnalytics) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const generatedAt = new Date().toLocaleString();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("TransitOps — Reports & Analytics", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Generated ${generatedAt}`, 14, 25);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 32,
    head: [["Summary Metric", "Value", "Formula"]],
    body: [
      [
        "Fuel Efficiency",
        data.summary.fuelEfficiencyKmPerLiter != null
          ? `${data.summary.fuelEfficiencyKmPerLiter} km/L`
          : "—",
        data.formulas.fuelEfficiency,
      ],
      [
        "Fleet Utilization",
        `${data.summary.fleetUtilizationPct}% (${data.summary.onTripCount}/${data.summary.activeFleetCount} vehicles)`,
        data.formulas.fleetUtilization,
      ],
      ["Operational Cost", money(data.summary.operationalCost), data.formulas.operationalCost],
      [
        "Average Vehicle ROI",
        data.summary.avgRoiPct != null ? `${data.summary.avgRoiPct}%` : "—",
        data.formulas.vehicleRoi,
      ],
      ["Total Revenue", money(data.summary.totalRevenue), data.formulas.revenueNote],
      [
        "Distance / Fuel",
        `${data.summary.totalDistanceKm.toLocaleString()} km / ${data.summary.totalFuelLiters.toLocaleString()} L`,
        "Completed trip distance vs fuel consumed",
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 58 },
      2: { cellWidth: pageWidth - 14 - 14 - 42 - 58 },
    },
  });

  const afterSummaryY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Fuel Efficiency Trend", 14, afterSummaryY);

  autoTable(doc, {
    startY: afterSummaryY + 4,
    head: [["Month", "Fuel Efficiency (km/L)", "Distance (km)", "Fuel (L)"]],
    body: data.charts.fuelEfficiencyTrend.map((row) => [
      row.month,
      formatMetric(row.efficiency),
      row.distanceKm.toLocaleString(),
      row.fuelLiters.toLocaleString(),
    ]),
    theme: "striped",
    headStyles: { fillColor: [180, 120, 20], fontStyle: "bold" },
    styles: { fontSize: 9 },
  });

  const afterFuelY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Operational Cost Trend", 14, afterFuelY);
  doc.text("Cost Breakdown", 110, afterFuelY);

  autoTable(doc, {
    startY: afterFuelY + 4,
    head: [["Month", "Cost"]],
    body: data.charts.operationalCostTrend.map((row) => [row.month, money(row.amount)]),
    theme: "striped",
    headStyles: { fillColor: [71, 85, 105], fontStyle: "bold" },
    styles: { fontSize: 9 },
    tableWidth: 80,
  });

  const costTableFinalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: afterFuelY + 4,
    margin: { left: 110 },
    head: [["Cost Category", "Amount"]],
    body: data.charts.costBreakdown.map((row) => [row.category, money(row.amount)]),
    theme: "striped",
    headStyles: { fillColor: [71, 85, 105], fontStyle: "bold" },
    styles: { fontSize: 9 },
    tableWidth: 80,
  });

  const afterCostY = Math.max(
    costTableFinalY,
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY,
  ) + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Vehicle ROI", 14, afterCostY);

  autoTable(doc, {
    startY: afterCostY + 4,
    head: [["Vehicle", "Reg #", "Acquisition", "Revenue", "Fuel", "Maint.", "Net Return", "ROI %"]],
    body: data.vehicleRoi.length
      ? data.vehicleRoi.map((row) => [
          row.name,
          row.registration,
          money(row.acquisitionCost),
          money(row.revenue),
          money(row.fuelCost),
          money(row.maintenanceCost),
          money(row.netReturn),
          row.roiPct != null ? `${row.roiPct}%` : "—",
        ])
      : [["No active vehicles", "—", "—", "—", "—", "—", "—", "—"]],
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 22 },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `TransitOps Reports & Analytics — Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" },
    );
    doc.setTextColor(0);
  }

  doc.save("transitops-reports-analytics.pdf");
}
