import { Link, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { ChevronRight, Home } from "lucide-react";
import { useTranslation, crumbKey } from "@/lib/i18n";

export function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation();
  const parts = useMemo(() => pathname.split("/").filter(Boolean), [pathname]);

  const crumbs: { label: string; href: string }[] = [
    { label: t("crumb_dashboard"), href: "/dashboard" },
  ];

  let acc = "";
  for (const p of parts) {
    acc += `/${p}`;
    if (p === "dashboard") continue;
    const key = crumbKey(p);
    crumbs.push({ label: key ? t(key) : prettify(p), href: acc });
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Home className="h-3.5 w-3.5" />
      {crumbs.map((c, i) => (
        <div key={c.href} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
          {i === crumbs.length - 1 ? (
            <span className="font-semibold text-foreground">{c.label}</span>
          ) : (
            <Link to={c.href} className="hover:text-foreground transition-colors">
              {c.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

function prettify(seg: string) {
  if (seg.length <= 3 && !/^[a-z]/.test(seg)) return seg.toUpperCase();
  if (/^[a-z0-9]{1,4}$/i.test(seg) && /\d/.test(seg)) return `#${seg}`;
  return seg
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
