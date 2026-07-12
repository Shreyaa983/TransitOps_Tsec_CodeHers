import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Mic, Square, Volume2, VolumeX, Pause, Play } from "lucide-react";
import { useTransitStore } from "@/lib/store";
import { useTranslation, type I18nKey } from "@/lib/i18n";
import { daysUntil, money } from "@/lib/format";
import { createSpeechRecognition } from "@/lib/speechToText";
import { speakText, stopSpeaking, pauseSpeaking, resumeSpeaking } from "@/lib/speech";
import { api } from "@/lib/api";

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
  const [isThinking, setIsThinking] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const loopRef = useRef(false);

  const startListeningRef = useRef<(() => void) | null>(null);
  const sendRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    setMessages((m) => {
      if (m.length === 1 && m[0].role === "assistant") {
        return [{ role: "assistant", content: t("copilot_greeting") }];
      }
      return m;
    });
  }, [lang, t]);

  useEffect(() => {
    return () => {
      loopRef.current = false;
      stopSpeaking();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const answer = useCallback((q: string) => {
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
  }, [store.maintenance, store.vehicles, store.drivers, store.trips, t]);

  const send = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userText = text.trim();
    setMessages((m) => [...m, { role: "user", content: userText }]);
    setInput("");
    setIsThinking(true);

    try {
      let aiResponseText = answer(userText);
      if (aiResponseText === t("copilot_fallback")) {
        try {
          const res = await api.post<{ success: boolean; answer?: string }>("/ai/chat", {
            message: userText,
            context: {
              vehiclesCount: store.vehicles.length,
              driversCount: store.drivers.length,
              tripsCount: store.trips.length,
              vehicles: store.vehicles.map((v) => ({ name: v.name, model: v.model, status: v.status, capacityKg: v.capacityKg })),
              drivers: store.drivers.map((d) => ({ name: d.name, status: d.status })),
              activeTrips: store.trips.filter((trip) => trip.status === "dispatched").length,
            },
          });
          if (res && res.success && res.answer) {
            aiResponseText = res.answer;
          }
        } catch (err) {
          console.error("Gemini fallback error:", err);
        }
      }

      setIsThinking(false);
      setMessages((m) => [...m, { role: "assistant", content: aiResponseText }]);

      if (loopRef.current || isListening) {
        speakText(aiResponseText, {
          onStart: () => {
            setIsSpeaking(true);
            setIsSpeechPaused(false);
          },
          onEnd: () => {
            setIsSpeaking(false);
            setIsSpeechPaused(false);
            if (loopRef.current && startListeningRef.current) {
              startListeningRef.current();
            }
          },
          onError: () => {
            setIsSpeaking(false);
            setIsSpeechPaused(false);
          },
        });
      }
    } catch (err) {
      setIsThinking(false);
      const errMsg = "I encountered an error while processing your request.";
      setMessages((m) => [...m, { role: "assistant", content: errMsg }]);
      if (loopRef.current || isListening) {
        speakText(errMsg, {
          onStart: () => {
            setIsSpeaking(true);
            setIsSpeechPaused(false);
          },
          onEnd: () => {
            setIsSpeaking(false);
            setIsSpeechPaused(false);
            if (loopRef.current && startListeningRef.current) {
              startListeningRef.current();
            }
          },
          onError: () => {
            setIsSpeaking(false);
            setIsSpeechPaused(false);
          },
        });
      }
    }
  }, [answer, store.vehicles, store.drivers, store.trips, t, isListening]);

  const stopListeningAndSend = useCallback((finalText?: string) => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    const textToSend = finalText || transcript;
    if (textToSend.trim() && sendRef.current) {
      setTranscript("");
      sendRef.current(textToSend);
    }
  }, [transcript]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        return;
      } catch (e) {}
    }

    loopRef.current = true;
    stopSpeaking();
    setIsSpeaking(false);
    setIsSpeechPaused(false);

    recognitionRef.current = createSpeechRecognition({
      onStart: () => setIsListening(true),
      onEnd: () => {
        setIsListening(false);
        if (loopRef.current && !isThinking) {
          setTimeout(() => {
            if (loopRef.current && startListeningRef.current) {
              startListeningRef.current();
            }
          }, 300);
        }
      },
      onResult: ({ finalTranscript, interimTranscript }) => {
        const text = finalTranscript || interimTranscript;
        setTranscript(text);

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        if (finalTranscript) {
          silenceTimerRef.current = setTimeout(() => {
            stopListeningAndSend(finalTranscript);
          }, 2500);
        }
      },
      onError: (err) => {
        if (err.error === "not-allowed") loopRef.current = false;
        setIsListening(false);
      },
    });

    try {
      recognitionRef.current?.start();
    } catch (e) {
      setIsListening(false);
    }
  }, [stopListeningAndSend, isThinking]);

  const stopAllVoice = useCallback(() => {
    loopRef.current = false;
    stopSpeaking();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setIsListening(false);
    setIsSpeaking(false);
    setIsSpeechPaused(false);
    setTranscript("");
  }, []);

  useEffect(() => {
    startListeningRef.current = startListening;
    sendRef.current = send;
  }, [startListening, send]);

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
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 relative group ${m.role === "user" ? "bg-primary text-primary-foreground brutal-border brutal-shadow-sm" : "bg-muted text-foreground brutal-border"}`}>
                <div className="text-sm whitespace-pre-line">{m.content}</div>
                {m.role === "assistant" && (
                  <button
                    onClick={() => {
                      if (isSpeaking) {
                        stopSpeaking();
                        setIsSpeaking(false);
                        setIsSpeechPaused(false);
                      } else {
                        speakText(m.content, {
                          onStart: () => { setIsSpeaking(true); setIsSpeechPaused(false); },
                          onEnd: () => { setIsSpeaking(false); setIsSpeechPaused(false); },
                          onError: () => { setIsSpeaking(false); setIsSpeechPaused(false); },
                        });
                      }
                    }}
                    type="button"
                    className={`absolute -right-9 top-2 transition-opacity p-1.5 rounded-lg bg-card border border-border hover:bg-accent text-foreground ${
                      isSpeaking ? "opacity-100 bg-red-500/20 text-red-500 border-red-500" : "opacity-0 group-hover:opacity-100"
                    }`}
                    title={isSpeaking ? "Stop / Mute Speaker" : "Speak answer aloud"}
                  >
                    {isSpeaking ? <VolumeX className="h-3.5 w-3.5 animate-pulse" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border-soft">
          {isSpeaking && (
            <div className="mb-3 px-3 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between text-sm shadow-sm animate-pulse">
              <span className="flex items-center gap-2 font-medium text-amber-500">
                <Volume2 className="h-4 w-4 animate-bounce" />
                Assistant speaking...
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeechPaused) {
                      resumeSpeaking();
                      setIsSpeechPaused(false);
                    } else {
                      pauseSpeaking();
                      setIsSpeechPaused(true);
                    }
                  }}
                  className="px-3 py-1 text-xs rounded-lg bg-card border border-border hover:bg-accent text-foreground font-semibold flex items-center gap-1"
                  title={isSpeechPaused ? "Resume speech" : "Pause speech"}
                >
                  {isSpeechPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  {isSpeechPaused ? "Resume" : "Pause"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopSpeaking();
                    setIsSpeaking(false);
                    setIsSpeechPaused(false);
                  }}
                  className="px-3 py-1 text-xs rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center gap-1.5 transition-colors"
                  title="Stop speaking immediately"
                >
                  <VolumeX className="h-3.5 w-3.5" /> Stop / Mute
                </button>
              </div>
            </div>
          )}
          {isListening && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-accent/20 border border-accent flex items-center justify-between text-sm animate-pulse">
              <span className="flex items-center gap-2 font-medium">
                <Mic className="h-4 w-4 text-red-500 animate-bounce" />
                Listening... {transcript ? `"${transcript}"` : "Speak your question now"}
              </span>
              <button onClick={stopAllVoice} type="button" className="text-xs text-muted-foreground hover:text-foreground underline">Stop</button>
            </div>
          )}
          {isThinking && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2 text-sm text-primary">
              <Sparkles className="h-4 w-4 animate-spin" />
              Thinking / Processing voice answer...
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {SUGGESTION_KEYS.map((key) => (
              <button key={key} type="button" onClick={() => send(t(key))} disabled={isThinking} className="text-xs px-3 py-1.5 rounded-lg brutal-border bg-card hover:bg-accent disabled:opacity-50">{t(key)}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
            <Input className="brutal-input flex-1" placeholder={t("copilot_placeholder")} value={input} onChange={(e) => setInput(e.target.value)} disabled={isThinking} />
            <button
              type="button"
              onClick={isListening || isThinking || isSpeaking ? stopAllVoice : startListening}
              className={`brutal-btn flex items-center justify-center px-4 transition-all ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                  : isSpeaking
                  ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                  : isThinking
                  ? "bg-amber-500 text-white"
                  : "bg-card text-foreground hover:bg-accent"
              }`}
              title={isListening || isThinking || isSpeaking ? "Stop Voice Mode" : "Start Voice Mode"}
            >
              {isListening || isThinking || isSpeaking ? <Square className="h-4 w-4 text-white" /> : <Mic className="h-4 w-4" />}
            </button>
            <Button type="submit" disabled={isThinking || !input.trim()} className="brutal-btn bg-primary text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      </div>
    </div>
  );
}

