import { createFileRoute } from "@tanstack/react-router";
import { useAuth, roleLabel } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/settings/profile")({
  component: () => {
    const user = useAuth((s) => s.user);
    return (
      <div className="brutal-card p-6 max-w-2xl space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-primary text-primary-foreground grid place-items-center text-xl font-black brutal-border">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div className="font-bold">{user?.name}</div>
            <div className="text-xs text-muted-foreground">{user ? roleLabel[user.role] : ""}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label className="text-xs font-semibold">Full name</Label><Input className="brutal-input" defaultValue={user?.name} /></div>
          <div className="space-y-1.5"><Label className="text-xs font-semibold">Email</Label><Input className="brutal-input" defaultValue={user?.email} /></div>
        </div>
      </div>
    );
  },
});
