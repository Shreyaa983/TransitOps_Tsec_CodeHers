import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Send } from "lucide-react";
import { useTransitStore } from "@/lib/store";
import { daysUntil, money } from "@/lib/format";

export const Route = createFileRoute("/_app/ai-copilot")({
  head: () => ({ meta: [{ title: "AI Copilot — TransitOps" }] }),
  component: AICopilot,
});

const suggestions = [
  "Which vehicle has the highest maintenance cost?",
  "Which drivers have licenses expiring soon?",
  "Recommend the best vehicle for a 450kg shipment.",
  "Why is fleet utilization low?",
  "Summarize today's operations.",
];

type Msg = { role: "user" | "assistant"; content: string };

function AICopilot() {
  const store = useTransitStore();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm your TransitOps copilot. Ask me anything about your fleet, drivers, trips, fuel or expenses." },
  ]);
  const [input, setInput] = useState("");

  const answer = (q: string) => {
    const low = q.toLowerCase();
    if (low.includes("maintenance") && low.includes("cost")) {
      const totals = store.maintenance.reduce<Record<string, number>>((a, m) => ({ ...a, [m.vehicleId]: (a[m.vehicleId] ?? 0) + m.cost }), {});
      const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
      const v = store.vehicles.find((x) => x.id === top?.[0]);
      return `**${v?.name ?? "Unknown"}** has the highest maintenance cost at ${money(top?.[1] ?? 0)}.`;
    }
    if (low.includes("license") || low.includes("expiring")) {
      const soon = store.drivers.filter((d) => daysUntil(d.licenseExpiry) < 30);
      return `${soon.length} driver(s) have licenses expiring within 30 days:\n\n${soon.map((d) => `- **${d.name}** — expires in ${daysUntil(d.licenseExpiry)} days`).join("\n")}`;
    }
    if (low.includes("450") || low.includes("recommend") && low.includes("vehicle")) {
      const match = store.vehicles.filter((v) => v.status === "available" && v.capacityKg >= 450).sort((a, b) => a.capacityKg - b.capacityKg)[0];
      return match ? `Recommended: **${match.name}** (${match.model}) — capacity ${match.capacityKg}kg, currently available.` : `No available vehicle matches that spec right now.`;
    }
    if (low.includes("utilization")) {
      const onTrip = store.vehicles.filter((v) => v.status === "on_trip").length;
      const total = store.vehicles.filter((v) => v.status !== "retired").length;
      return `Fleet utilization is at **${Math.round((onTrip / total) * 100)}%** (${onTrip} of ${total} active vehicles on trip). It's typically low when trips are still in draft or vehicles are in shop.`;
    }
    if (low.includes("summar") || low.includes("today")) {
      const active = store.trips.filter((t) => t.status === "dispatched").length;
      const done = store.trips.filter((t) => t.status === "completed").length;
      return `**Today's summary:** ${active} trip(s) in progress, ${done} completed. ${store.vehicles.filter((v) => v.status === "in_shop").length} vehicle(s) in maintenance. Drivers on duty: ${store.drivers.filter((d) => d.status === "on_duty").length}.`;
    }
    return "I don't have a specific answer yet, but I can help with fleet utilization, driver licenses, maintenance costs, vehicle recommendations, and daily operations summaries. Try one of the suggested prompts.";
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setTimeout(() => setMessages((m) => [...m, { role: "assistant", content: answer(text) }]), 400);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title={<span className="inline-flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI Copilot</span> as unknown as string} subtitle="Ask questions about your fleet in natural language." />
      <div className="brutal-card p-0 flex flex-col h-[68vh]">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-primary text-primary-foreground brutal-border brutal-shadow-sm" : "bg-muted text-foreground brutal-border"}`}>
                <div className="text-sm whitespace-pre-line">{m.content}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border-soft">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-lg brutal-border bg-card hover:bg-accent">{s}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
            <Input className="brutal-input flex-1" placeholder="Ask anything…" value={input} onChange={(e) => setInput(e.target.value)} />
            <Button type="submit" className="brutal-btn bg-primary text-primary-foreground"><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      </div>
    </div>
  );
}
