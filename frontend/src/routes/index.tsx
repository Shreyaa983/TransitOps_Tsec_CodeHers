import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Auth state lives in localStorage — checked on the client. During SSR/prerender,
    // localStorage is unavailable, so treat as unauthenticated and let the client
    // hydrate onto /dashboard if a session exists.
    if (typeof window === "undefined") throw redirect({ to: "/login" });
    try {
      const raw = window.localStorage.getItem("transitops-auth-v1");
      const user = raw ? JSON.parse(raw)?.state?.user : null;
      throw redirect({ to: user ? "/dashboard" : "/login" });
    } catch (e) {
      if ((e as { to?: string })?.to) throw e;
      throw redirect({ to: "/login" });
    }
  },
});
