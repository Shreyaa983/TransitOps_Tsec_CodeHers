import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Send } from "lucide-react";
import { useTransitStore } from "@/lib/store";
import { useTranslation, type I18nKey } from "@/lib/i18n";
import { daysUntil, money } from "@/lib/format";

export const Route = createFileRoute("/_app/ai-copilot")({
  head: () => ({ meta: [{ title: "AI Copilot — TransitOps" }] }),
  component: AICopilot,
});

const SUGGESTION_KEYS: I18nKey[] = [
  "copilot_suggest_1",
  "copilot_suggest_2",
  "copilot_suggest_3",
  "copilot_suggest_4",
  "copilot_suggest_5",
];

type Msg = { role: "user" | "assistant"; content: string };

function AICopilot() {
  const { t, lang } = useTranslation();
  const store = useTransitStore();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: t("copilot_greeting") },
  ]);
  const [input, setInput] = useState("");

  useEffect(() => {
    setMessages((m) => {
      if (m.length === 1 && m[0].role === "assistant") {
        return [{ role: "assistant", content: t("copilot_greeting") }];
      }
      return m;
    });
  }, [lang, t]);

  const answer = (q: string) => {
    const low = q.toLowerCase();
    if (low.includes("maintenance") && low.includes("cost")) {
      const totals = store.maintenance.reduce<Record<string, number>>((a, m) => ({ ...a, [m.vehicleId]: (a[m.vehicleId] ?? 0) + m.cost }), {});
      const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
      const v = store.vehicles.find((x) => x.id === top?.[0]);
      return t("copilot_maint_cost_answer", {
        name: v?.name ?? t("copilot_unknown_vehicle"),
        amount: money(top?.[1] ?? 0),
      });
    }
    if (low.includes("license") || low.includes("expiring")) {
      const soon = store.drivers.filter((d) => daysUntil(d.licenseExpiry) < 30);
      const header = t("copilot_license_expiring_header", { count: soon.length });
      const items = soon.map((d) =>
        t("copilot_license_expiring_item", { name: d.name, days: daysUntil(d.licenseExpiry) }),
      ).join("\n");
      return `${header}\n\n${items}`;
    }
    if (low.includes("450") || (low.includes("recommend") && low.includes("vehicle"))) {
      const match = store.vehicles.filter((v) => v.status === "available" && v.capacityKg >= 450).sort((a, b) => a.capacityKg - b.capacityKg)[0];
      return match
        ? t("copilot_vehicle_recommend", { name: match.name, model: match.model, capacity: match.capacityKg })
        : t("copilot_vehicle_no_match");
    }
    if (low.includes("utilization")) {
      const onTrip = store.vehicles.filter((v) => v.status === "on_trip").length;
      const total = store.vehicles.filter((v) => v.status !== "retired").length;
      const pct = total > 0 ? Math.round((onTrip / total) * 100) : 0;
      return t("copilot_utilization_answer", { pct, onTrip, total });
    }
    if (low.includes("summar") || low.includes("today")) {
      const active = store.trips.filter((trip) => trip.status === "dispatched").length;
      const done = store.trips.filter((trip) => trip.status === "completed").length;
      const inShop = store.vehicles.filter((v) => v.status === "in_shop").length;
      const onDuty = store.drivers.filter((d) => d.status === "on_duty").length;
      return t("copilot_today_summary", { active, done, inShop, onDuty });
    }
    return t("copilot_fallback");
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setTimeout(() => setMessages((m) => [...m, { role: "assistant", content: answer(text) }]), 400);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> {t("copilot_title")}
          </span> as unknown as string
        }
        subtitle={t("copilot_subtitle")}
      />
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
            {SUGGESTION_KEYS.map((key) => (
              <button key={key} onClick={() => send(t(key))} className="text-xs px-3 py-1.5 rounded-lg brutal-border bg-card hover:bg-accent">{t(key)}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
            <Input className="brutal-input flex-1" placeholder={t("copilot_placeholder")} value={input} onChange={(e) => setInput(e.target.value)} />
            <Button type="submit" className="brutal-btn bg-primary text-primary-foreground"><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      </div>
    </div>
  );
}
