import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings/security")({
  component: () => (
    <form onSubmit={(e) => { e.preventDefault(); toast.success("Password updated (demo)"); }} className="brutal-card p-6 max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1.5"><Label className="text-xs font-semibold">Current password</Label><Input type="password" className="brutal-input" /></div>
      <div className="space-y-1.5"><Label className="text-xs font-semibold">New password</Label><Input type="password" className="brutal-input" /></div>
      <div className="md:col-span-2 flex justify-end"><Button className="brutal-btn bg-primary text-primary-foreground">Update password</Button></div>
    </form>
  ),
});
