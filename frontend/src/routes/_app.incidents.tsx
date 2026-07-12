import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { api } from "@/lib/api";
import { shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CheckCheck, X, Wrench, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useTransitStore } from "@/lib/store";

export const Route = createFileRoute("/_app/incidents")({
    head: () => ({ meta: [{ title: "Review Incidents — TransitOps" }] }),
    component: IncidentsPage,
});

function IncidentsPage() {
    const [incidents, setIncidents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const { addMaintenance, updateVehicle, syncWithBackend } = useTransitStore();

    const loadIncidents = async () => {
        setIsLoading(true);
        try {
            const res = await api.get<any>("/incidents?status=PENDING");
            if (res.success) {
                setIncidents(res.data);
            }
        } catch (e: any) {
            toast.error(e.message || "Failed to load incidents");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadIncidents();
    }, []);

    const handleApprove = async (incident: any) => {
        setIsProcessing(incident._id);
        try {
            const res = await api.patch<any>(`/incidents/${incident._id}/approve`, {});
            if (res.success) {
                toast.success("Incident officially approved. Maintenance created.");

                // Optimistically update store
                const p = incident.aiAnalysis;
                addMaintenance({
                    id: res.data.maintenanceLog || Math.random().toString(36).substring(7),
                    vehicleId: incident.vehicle?._id || incident.vehicle,
                    issue: `[AI] ${p.category} - ${p.subcategory}`,
                    technician: "Pending Assignment",
                    cost: 0,
                    status: "open",
                    date: new Date().toISOString()
                } as any);

                if (p.requiresImmediateStop) {
                    updateVehicle(incident.vehicle?._id || incident.vehicle, { status: "in_shop" });
                }

                // Remove from list
                setIncidents(prev => prev.filter(i => i._id !== incident._id));

                // Sync to make sure we have everything aligned
                syncWithBackend();
            }
        } catch (e: any) {
            toast.error(e.message || "Failed to approve incident");
        } finally {
            setIsProcessing(null);
        }
    };

    const handleReject = async (id: string) => {
        setIsProcessing(id);
        try {
            const res = await api.patch<any>(`/incidents/${id}/reject`, {});
            if (res.success) {
                toast("Incident report rejected and dismissed.");
                setIncidents(prev => prev.filter(i => i._id !== id));
            }
        } catch (e: any) {
            toast.error(e.message || "Failed to reject incident");
        } finally {
            setIsProcessing(null);
        }
    };

    return (
        <div className="pb-20">
            <PageHeader
                title="Pending Incidents"
                subtitle={`${incidents.length} awaiting review`}
                actions={
                    <button onClick={loadIncidents} className="brutal-btn bg-card text-xs py-2 px-3">
                        Refresh
                    </button>
                }
            />

            <div className="space-y-4 max-w-3xl mt-6">
                {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground font-semibold">Loading incidents...</div>
                ) : incidents.length === 0 ? (
                    <div className="brutal-card p-12 text-center flex flex-col items-center justify-center">
                        <CheckCheck className="w-12 h-12 text-success/50 mb-3" />
                        <p className="font-extrabold text-xl text-foreground">All Caught Up!</p>
                        <p className="text-muted-foreground text-sm font-semibold mt-1">No pending driver incidents require your review.</p>
                    </div>
                ) : (
                    incidents.map((n) => (
                        <div key={n._id} className="w-full text-left brutal-card p-5 border-2 border-danger/40 bg-danger/5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2 text-danger font-black uppercase tracking-widest text-sm">
                                    <AlertTriangle className="w-4 h-4 text-danger animate-pulse" /> Pending Review
                                </div>
                                <div className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {shortDate(n.createdAt)}</div>
                            </div>

                            <div className="bg-background rounded-xl p-4 border border-border-soft mb-4 text-sm font-medium leading-relaxed whitespace-pre-wrap brutal-shadow-sm">
                                <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block mb-1">Driver Observation</span>
                                {n.observation}
                            </div>

                            <div className="bg-muted/30 rounded-xl p-4 border border-border-soft mb-5 space-y-2">
                                <p className="text-[11px] font-black uppercase text-muted-foreground tracking-widest mb-2">AI Diagnosis Output</p>
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-black text-foreground">{n.aiAnalysis?.category} - {n.aiAnalysis?.subcategory}</p>
                                    <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded", {
                                        "bg-danger/20 text-danger": n.aiAnalysis?.requiresImmediateStop,
                                        "bg-warning/20 text-warning": !n.aiAnalysis?.requiresImmediateStop && n.aiAnalysis?.severity === "HIGH",
                                        "bg-primary/20 text-primary": !n.aiAnalysis?.requiresImmediateStop && n.aiAnalysis?.severity !== "HIGH",
                                    })}>
                                        {n.aiAnalysis?.severity}
                                    </span>
                                </div>
                                <p className="text-xs font-semibold">Summary: <span className="font-medium text-muted-foreground">{n.aiAnalysis?.summary}</span></p>
                                <p className="text-xs font-semibold">Recommended: <span className="font-medium text-muted-foreground">{n.aiAnalysis?.recommendedAction}</span></p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    disabled={isProcessing === n._id}
                                    onClick={(e) => { e.stopPropagation(); handleApprove(n); }}
                                    className="brutal-btn flex items-center justify-center gap-2 bg-success text-success-foreground font-black uppercase tracking-widest py-3 px-5 flex-1 disabled:opacity-50"
                                >
                                    <Wrench className="w-4 h-4" /> {isProcessing === n._id ? "Approving..." : "Approve & Create Maintenance"}
                                </button>
                                <button
                                    disabled={isProcessing === n._id}
                                    onClick={(e) => { e.stopPropagation(); handleReject(n._id); }}
                                    className="brutal-btn flex items-center justify-center gap-2 bg-background border border-border hover:bg-muted-foreground hover:text-background font-black uppercase tracking-widest py-3 px-5 disabled:opacity-50"
                                >
                                    <X className="w-4 h-4" /> Reject
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
