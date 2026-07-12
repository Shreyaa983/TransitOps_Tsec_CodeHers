/**
 * Lightweight API client for the TransitOps backend (http://localhost:5000).
 * Reads the JWT token from Zustand state and attaches it as a Bearer header
 * on every authenticated request automatically.
 */

const API_BASE = "http://localhost:5000/api";

/** Grab the current JWT from the persisted Zustand auth store. */
function getToken(): string | null {
  try {
    const raw = localStorage.getItem("transitops-auth-v1");
    return raw ? (JSON.parse(raw)?.state?.token ?? null) : null;
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Surface the backend error message when available
    throw new Error((data as { message?: string }).message ?? `Request failed (${res.status})`);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
