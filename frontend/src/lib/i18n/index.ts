import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EN_TEXTS, type I18nKey } from "./en";

export type { I18nKey };
export { EN_TEXTS };
export { statusKey, crumbKey, roleKey, resolveNotification, isIncidentNotification, notificationMatchesRole } from "./helpers";

export const LANGUAGES = [
  { code: "en", label: "English", geminiName: "English" },
  { code: "es", label: "Español", geminiName: "Spanish" },
  { code: "hi", label: "हिन्दी", geminiName: "Hindi" },
  { code: "fr", label: "Français", geminiName: "French" },
  { code: "ja", label: "日本語", geminiName: "Japanese" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

type I18nState = {
  lang: LangCode;
  texts: Record<I18nKey, string>;
  cache: Partial<Record<LangCode, Record<I18nKey, string>>>;
  loading: boolean;
  setLanguage: (code: LangCode) => Promise<void>;
  t: (key: I18nKey, vars?: Record<string, string | number>) => string;
};

const API_URL = "http://localhost:5000/api/ai/translate";

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      lang: "en",
      texts: { ...EN_TEXTS },
      cache: {},
      loading: false,

      t: (key, vars) => {
        let value = get().texts[key] ?? EN_TEXTS[key] ?? key;
        if (vars) {
          for (const [k, v] of Object.entries(vars)) {
            value = value.replace(`{${k}}`, String(v));
          }
        }
        return value;
      },

      setLanguage: async (code) => {
        const { cache } = get();

        if (code === "en") {
          set({ lang: "en", texts: { ...EN_TEXTS }, loading: false });
          return;
        }

        const langMeta = LANGUAGES.find((l) => l.code === code);
        if (!langMeta) return;

        const existingCache: Record<string, string> = (cache[code] as Record<string, string>) ?? {};
        const allKeys = Object.keys(EN_TEXTS) as I18nKey[];
        const missingKeys = allKeys.filter(
          (k) => !existingCache[k] || existingCache[k] === EN_TEXTS[k],
        );

        set({
          lang: code,
          texts: { ...EN_TEXTS, ...existingCache },
          loading: missingKeys.length > 0,
        });

        if (missingKeys.length === 0) {
          return;
        }

        const missingContent: Record<string, string> = {};
        for (const k of missingKeys) {
          missingContent[k] = EN_TEXTS[k];
        }

        try {
          const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: missingContent,
              targetLanguage: langMeta.geminiName,
            }),
          });

          const data = await res.json();

          if (!res.ok || !data.success || !data.translated) {
            console.error("[i18n] Translation failed:", data.error ?? res.status);
            set({ loading: false });
            return;
          }

          const updatedCache = {
            ...existingCache,
            ...data.translated,
          } as Record<I18nKey, string>;

          set((s) => ({
            texts: { ...EN_TEXTS, ...updatedCache },
            cache: { ...s.cache, [code]: updatedCache },
            loading: false,
          }));
        } catch (err) {
          console.error("[i18n] Network error:", err);
          set({ loading: false });
        }
      },
    }),
    {
      name: "transitops-i18n-v1",
      partialize: (s) => ({ lang: s.lang, cache: s.cache }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.lang === "en") {
          state.texts = { ...EN_TEXTS };
        } else {
          const cached = state.cache[state.lang] ?? {};
          state.texts = { ...EN_TEXTS, ...cached };
          setTimeout(() => {
            useI18n.getState().setLanguage(state.lang);
          }, 50);
        }
      },
    },
  ),
);

/** Convenience hook — same API as useAITranslator from your previous project. */
export function useTranslation() {
  const lang = useI18n((s) => s.lang);
  const loading = useI18n((s) => s.loading);
  const setLanguage = useI18n((s) => s.setLanguage);
  const t = useI18n((s) => s.t);
  const texts = useI18n((s) => s.texts);
  return { lang, loading, changeLanguage: setLanguage, t, texts };
}
