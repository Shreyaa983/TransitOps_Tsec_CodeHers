import type { I18nKey } from "./en";

/** Map status strings to i18n keys */
const STATUS_KEYS: Record<string, I18nKey> = {
  available: "status_available",
  on_trip: "status_on_trip",
  in_shop: "status_in_shop",
  retired: "status_retired",
  draft: "status_draft",
  dispatched: "status_dispatched",
  completed: "status_completed",
  cancelled: "status_cancelled",
  open: "status_open",
  in_progress: "status_in_progress",
  on_duty: "status_on_duty",
  off_duty: "status_off_duty",
  suspended: "status_suspended",
  eligible: "status_eligible",
};

/** Map URL path segments to breadcrumb i18n keys */
const CRUMB_KEYS: Record<string, I18nKey> = {
  dashboard: "crumb_dashboard",
  vehicles: "crumb_vehicles",
  drivers: "crumb_drivers",
  trips: "crumb_trips",
  maintenance: "crumb_maintenance",
  fuel: "crumb_fuel",
  expenses: "crumb_expenses",
  reports: "crumb_reports",
  incidents: "crumb_incidents",
  notifications: "crumb_notifications",
  settings: "crumb_settings",
  "ai-copilot": "crumb_ai_copilot",
  "report-incident": "crumb_report_incident",
  new: "crumb_new",
  edit: "crumb_edit",
  history: "crumb_history",
  schedule: "crumb_schedule",
  documents: "crumb_documents",
  licenses: "crumb_licenses",
  profile: "crumb_profile",
  account: "crumb_account",
  roles: "crumb_roles",
  preferences: "crumb_preferences",
  security: "crumb_security",
  dispatch: "crumb_dispatch",
  complete: "crumb_complete",
  export: "crumb_export",
};

export function statusKey(status: string): I18nKey | null {
  const normalized = status?.toLowerCase().replace(/-/g, "_") ?? "";
  return STATUS_KEYS[normalized] ?? STATUS_KEYS[normalized.replace(/ /g, "_")] ?? null;
}

export function crumbKey(segment: string): I18nKey | null {
  return CRUMB_KEYS[segment.toLowerCase()] ?? null;
}

export function roleKey(role: string): I18nKey | null {
  const key = `role_${role}` as I18nKey;
  return key;
}

type NotificationLike = {
  id: string;
  titleKey?: string;
  bodyKey?: string;
  titleParams?: Record<string, string | number>;
  bodyParams?: Record<string, string | number>;
  tags?: string[];
  /** @deprecated legacy persisted shape */
  title?: string;
  /** @deprecated legacy persisted shape */
  body?: string;
};

export function resolveNotification(
  n: NotificationLike,
  t: (key: I18nKey, vars?: Record<string, string | number>) => string,
) {
  if (n.titleKey && n.bodyKey) {
    return {
      title: t(n.titleKey as I18nKey, n.titleParams),
      body: t(n.bodyKey as I18nKey, n.bodyParams),
    };
  }
  return { title: n.title ?? "", body: n.body ?? "" };
}

export function isIncidentNotification(n: { id: string; tags?: string[] }) {
  return n.id.startsWith("inc-") || n.tags?.includes("incident") === true;
}

function notificationMatchesRole(tags: string[] | undefined, role: string): boolean {
  const t = tags ?? [];
  if (role === "driver") return t.includes("trip");
  if (role === "financial_analyst") return t.includes("expense") || t.includes("fuel");
  if (role === "safety_officer") return t.includes("license") || t.includes("maintenance");
  if (role === "dispatcher") return t.includes("trip") || t.includes("license");
  return true;
}

export { notificationMatchesRole };
