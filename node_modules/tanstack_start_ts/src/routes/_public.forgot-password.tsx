import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Truck, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_public/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — TransitOps" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen grid place-items-center p-8">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
        <div className="brutal-card p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center brutal-border brutal-shadow-sm">
              <Truck className="h-5 w-5" />
            </div>
            <div className="font-extrabold tracking-tight">TransitOps</div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Reset your password</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter the email associated with your account. We'll send a reset link.</p>

          {sent ? (
            <div className="mt-6 rounded-xl border-2 border-success/40 bg-success/10 p-4 text-sm text-success">
              If <b>{email}</b> matches an account, a reset link is on its way.
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); if (!email) return toast.error("Enter your email"); setSent(true); }}
              className="mt-6 space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="brutal-input h-11" />
              </div>
              <Button type="submit" className="w-full h-11 brutal-btn bg-primary text-primary-foreground hover:bg-primary/90">
                Send reset link
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
