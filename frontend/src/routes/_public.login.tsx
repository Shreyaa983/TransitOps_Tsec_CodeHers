import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Truck, ArrowRight } from "lucide-react";
import { useAuth, type Role, roleLabel } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/_public/login")({
  head: () => ({ meta: [{ title: "Sign in — TransitOps" }] }),
  component: LoginPage,
});

const roles: Role[] = ["fleet_manager", "dispatcher", "safety_officer", "financial_analyst"];

function LoginPage() {
  const [email, setEmail] = useState("marcus@transitops.io");
  const [password, setPassword] = useState("demo1234");
  const [role, setRole] = useState<Role>("fleet_manager");
  const [remember, setRemember] = useState(true);
  const login = useAuth((s) => s.login);
  const nav = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Enter email and password");
    login(email, password, role, email.split("@")[0].replace(/\b\w/g, (c) => c.toUpperCase()));
    toast.success(`Welcome back, ${roleLabel[role]}`);
    nav({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground grid place-items-center brutal-border brutal-shadow-sm">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight">TransitOps</div>
              <div className="text-xs text-muted-foreground">Smart Transport Operations Platform</div>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight">Sign in to your dashboard</h1>
          <p className="text-sm text-muted-foreground mt-2">Enter your credentials to access the operations console.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="brutal-input h-11" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="brutal-input h-11" />
            </div>
            <div className="space-y-1.5">
              <Label>Sign in as</Label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`brutal-btn px-3 py-2.5 text-xs text-left ${role === r ? "bg-primary text-primary-foreground" : "bg-card"}`}
                  >
                    {roleLabel[r]}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
              Remember me
            </label>

            <Button type="submit" className="w-full h-11 brutal-btn bg-primary text-primary-foreground hover:bg-primary/90">
              Sign in <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            Demo build — any email & password works. Pick a role to see role-based navigation.
          </p>
        </div>
      </div>

      {/* Right: gradient panel */}
      <div className="hidden lg:flex items-center justify-center relative bg-gradient-to-br from-primary via-primary to-secondary p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 0, transparent 40%), radial-gradient(circle at 80% 70%, white 0, transparent 40%)" }} />
        <div className="relative max-w-md text-primary-foreground">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold">
            <Truck className="h-3.5 w-3.5" /> Fleet ops, reimagined
          </div>
          <h2 className="mt-6 text-4xl font-extrabold tracking-tight leading-tight">Run your entire transport operation from one console.</h2>
          <p className="mt-4 text-primary-foreground/90">
            Real-time fleet utilization, dispatch workflows, maintenance tracking, fuel + expense analytics, and an AI copilot that answers the questions your team actually asks.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            <li>• Live vehicle & driver status</li>
            <li>• Trip dispatch with built-in safety rules</li>
            <li>• Fuel, maintenance & ROI analytics</li>
            <li>• AI copilot for instant answers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
