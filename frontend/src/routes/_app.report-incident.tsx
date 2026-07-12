import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useTransitStore, useAuth } from "@/lib/store";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/_app/report-incident")({
    head: () => ({ meta: [{ title: "Report Incident — TransitOps" }] }),
    component: ReportIncidentPage,
});

function ReportIncidentPage() {
    const { drivers, vehicles, trips, addMaintenance } = useTransitStore();
    const user = useAuth((s) => s.user);
    const driver = drivers.find((d) => d.id === user?.driverId) ?? drivers.find((d) => d.name.toLowerCase() === user?.name?.toLowerCase());
    const myTrips = trips.filter((t) => t.driverId === driver?.id || (driver && t.code.includes(driver.name)));
    const currentTrip = myTrips.find((t) => t.status === "dispatched" || t.status === "draft");
    const assignedVehicle = vehicles.find((v) => v.id === currentTrip?.vehicleId || v.status === "on_trip");

    const [incidentText, setIncidentText] = useState("");
    const [aiReport, setAiReport] = useState<any>(null);

    const loadingSteps = [
        "🧠 Understanding driver observations...",
        "🔍 Identifying possible issue...",
        "⚠ Assessing safety...",
        "📄 Preparing incident report..."
    ];
    const [loadingStepIndex, setLoadingStepIndex] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isSuccess, setIsSuccess] = useState(false);

    const chips = [
        "🚨 Vehicle stopped", "🔥 Smoke", "🔊 Strange noise",
        "🛑 Brake issue", "⚠ Steering problem", "💡 Warning light"
    ];

    const handleAnalyze = async () => {
        if (!incidentText.trim()) return toast.error("Describe the incident first.");
        setIsAnalyzing(true);
        setAiReport(null);
        setIsSuccess(false);

        let step = 0;
        const interval = setInterval(() => {
            step++;
            if (step < loadingSteps.length) {
                setLoadingStepIndex(step);
            }
        }, 600);

        try {
            const res = await api.post<any>("/ai/analyze-incident", { incidentReport: incidentText });
            clearInterval(interval);

            if (res.success) {
                setAiReport(res.data);
            } else {
                toast.error("Failed to analyze incident.");
            }
        } catch (e: any) {
            clearInterval(interval);
            toast.error(e.message || "Failed to analyze incident.");
        } finally {
            clearInterval(interval);
            setIsAnalyzing(false);
            setLoadingStepIndex(0);
        }
    };

    const handleSubmit = async () => {
        if (!aiReport || !assignedVehicle) return toast.error("Report missing or vehicle not assigned.");
        setIsSubmitting(true);

        try {
            const payload = {
                driver: driver?.id || user?._id,
                vehicle: assignedVehicle.id,
                observation: incidentText,
                aiAnalysis: aiReport
            };

            await api.post("/incidents", payload);

            setIsSuccess(true);
            setAiReport(null);
            setIncidentText("");
        } catch (e: any) {
            toast.error(e.message || "Failed to submit incident.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">

            {isSuccess && (
                <div className="brutal-card p-10 bg-card border-success border-2 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in zoom-in duration-500">
                    <div className="h-16 w-16 bg-success text-success-foreground rounded-full grid place-items-center mb-2 brutal-shadow-sm border-2 border-foreground">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-foreground tracking-tight">Incident Submitted</h2>
                    <p className="text-base font-bold text-muted-foreground">The Fleet Manager has been notified.</p>
                    <p className="text-sm font-black text-success tracking-widest uppercase mt-4 border border-success/30 bg-success/5 px-4 py-2 rounded-lg brutal-shadow-sm">
                        Reference: INC-{new Date().getFullYear()}-{Math.floor(100 + Math.random() * 900)}
                    </p>
                </div>
            )}

            {/* Driver Input Form */}
            <div className="brutal-card p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    {assignedVehicle ? (
                        <div className="bg-muted/30 border border-border-soft rounded-lg px-5 py-4 w-full">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Reporting for</p>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🚐</span>
                                <div>
                                    <p className="font-black text-xl leading-tight">{assignedVehicle.name}</p>
                                    <p className="text-sm font-semibold text-muted-foreground mt-0.5">Registration: <span className="font-mono text-foreground">{assignedVehicle.registration}</span></p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-warning/10 border border-warning/30 rounded-lg px-5 py-4 w-full text-warning-foreground text-sm font-semibold text-center">
                            ⚠ You do not have a vehicle assigned right now. Talk to dispatch.
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <label className="text-sm font-black uppercase tracking-wider text-foreground pl-1">Describe Issue</label>
                    <textarea
                        value={incidentText}
                        onChange={(e) => setIncidentText(e.target.value)}
                        placeholder="Example: The vehicle suddenly lost power."
                        className="w-full h-[140px] p-4 bg-background border-2 border-border-soft rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary resize-none font-medium placeholder:text-muted-foreground/60 transition-all"
                    />

                    <div className="flex flex-wrap gap-2.5 pt-1 pb-3">
                        {chips.map(c => (
                            <button
                                key={c}
                                onClick={() => setIncidentText(c)}
                                className="px-3 py-1.5 bg-muted/40 hover:bg-primary/10 border border-border-soft hover:border-primary/40 rounded-full text-[13px] font-bold text-muted-foreground hover:text-primary transition-colors whitespace-nowrap brutal-shadow-sm"
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    {!aiReport && (
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || !incidentText.trim() || !assignedVehicle}
                            className="brutal-btn w-full py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest disabled:opacity-50 transition-all hover:scale-[1.01]"
                        >
                            {isAnalyzing ? loadingSteps[loadingStepIndex] : "Create Incident Report"}
                        </button>
                    )}
                </div>
            </div>

            {/* Output / Review */}
            {aiReport && (
                <div className="border-2 border-border-soft bg-card rounded-xl overflow-hidden shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-500">
                    <div className="bg-muted/10 p-5 border-b border-border-soft flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary font-black tracking-widest uppercase text-[11px]">
                            <CheckCircle2 className="w-4 h-4" /> AI Analysis Complete
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                            <div>
                                <h3 className="font-black text-2xl text-foreground flex items-center gap-2">
                                    {aiReport.category}
                                </h3>
                                <p className="text-[11px] font-black text-muted-foreground uppercase mt-1 tracking-widest">{aiReport.subcategory}</p>
                            </div>
                            <div className="flex gap-3 items-center">
                                {!aiReport.dispatchAllowed && <span className="text-xs uppercase font-black text-danger border border-danger/40 bg-danger/10 px-3 py-1.5 rounded flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> No Dispatch</span>}
                                {aiReport.requiresImmediateStop && <span className="text-xs uppercase font-black text-danger border border-danger bg-danger/20 px-3 py-1.5 rounded flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Immediate Stop</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-muted/20 rounded-lg p-4 border border-border-soft">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">AI Confidence</p>
                                <p className="font-black text-xl">{(aiReport.confidence * 100).toFixed(0)}%</p>
                            </div>
                            <div className="bg-muted/20 rounded-lg p-4 border border-border-soft">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Est. Downtime</p>
                                <p className="font-bold text-base mt-2">{aiReport.estimatedDowntime}</p>
                            </div>
                            <div className="col-span-2 bg-muted/20 rounded-lg p-4 border border-border-soft">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">🔩 Likely Parts</p>
                                <p className="font-semibold text-foreground text-sm mt-2">{aiReport.likelyParts.join(", ")}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-background rounded-xl p-5 border border-border-soft brutal-shadow-sm">
                                <p className="font-bold text-foreground mb-2 uppercase text-[11px] tracking-widest text-muted-foreground">Technical Summary</p>
                                <p className="font-medium text-[15px] leading-relaxed">{aiReport.summary}</p>
                            </div>
                            <div className="bg-warning/10 rounded-xl p-5 border border-warning/30 brutal-shadow-sm">
                                <p className="font-bold mb-2 uppercase text-[11px] tracking-widest text-warning">Recommended Action</p>
                                <p className="font-semibold text-[15px] leading-relaxed text-warning-foreground opacity-95">{aiReport.recommendedAction}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-border-soft bg-muted/10">
                        <p className="text-[11px] font-black uppercase tracking-widest text-center text-muted-foreground mb-4">Review AI Report ↑</p>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !assignedVehicle}
                            className="brutal-btn w-full py-4 bg-foreground text-background font-black uppercase tracking-widest disabled:opacity-50 hover:bg-muted-foreground transition-transform hover:scale-[1.01] text-sm"
                        >
                            {isSubmitting ? "Submitting Official Report..." : "Submit Official Incident"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
