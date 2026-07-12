import { createFileRoute } from "@tanstack/react-router";
import { useUI } from "@/lib/store";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_app/settings/preferences")({
  component: () => {
    const { theme, setTheme, sidebarCollapsed, toggleSidebar } = useUI();
    return (
      <div className="brutal-card p-6 max-w-2xl space-y-5">
        <Row title="Dark mode" desc="Use a dark UI palette."><Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} /></Row>
        <Row title="Collapse sidebar by default" desc="Save horizontal space."><Switch checked={sidebarCollapsed} onCheckedChange={toggleSidebar} /></Row>
      </div>
    );
  },
});
function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div><div className="font-semibold">{title}</div><div className="text-xs text-muted-foreground">{desc}</div></div>
      {children}
    </div>
  );
}
