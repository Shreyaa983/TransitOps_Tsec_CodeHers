import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Truck, ArrowRight } from "lucide-react";
import { useAuth, type Role } from "@/lib/store";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_public/login")({
  head: () => ({ meta: [{ title: "Sign in — TransitOps" }] }),
  component: LoginPage,
});

/** Shape of the backend /api/auth/login success response */
type LoginResponse = {
  success: boolean;
  data: {
    token: string;
    user: { _id: string; name: string; email: string; role: string; driver?: any };
  };
};

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuth((s) => s.setAuth);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Enter email and password");

    setLoading(true);
    try {
      const res = await api.post<LoginResponse>("/auth/login", { email, password });

      // Backend role is UPPERCASE (e.g. "FLEET_MANAGER") — normalise to lowercase for frontend
      const role = res.data.user.role.toLowerCase() as Role;
      const driverId = typeof res.data.user.driver === "object" ? res.data.user.driver?._id : res.data.user.driver;

      setAuth(
        { email: res.data.user.email, name: res.data.user.name, role, _id: res.data.user._id, driverId },
        res.data.token,
      );

      toast.success(`Welcome back, ${res.data.user.name}!`);
      nav({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
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
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@transitops.com"
                className="brutal-input h-11"
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="brutal-input h-11"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 brutal-btn bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? "Signing in…" : <span className="flex items-center justify-center gap-1">Sign in <ArrowRight className="h-4 w-4" /></span>}
            </Button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 rounded-xl border-2 border-dashed border-muted p-4 text-xs text-muted-foreground space-y-1.5">
            <p className="font-semibold text-foreground mb-1">Click any role to quick-fill credentials (password: <span className="font-mono">Password123!</span>)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {[
                { label: "Fleet Manager", email: "amina@transitops.com" },
                { label: "Dispatcher", email: "jonas@transitops.com" },
                { label: "Safety Officer", email: "tariq@transitops.com" },
                { label: "Financial Analyst", email: "leah@transitops.com" },
                { label: "Truck Driver (Samuel)", email: "samuel@transitops.com" },
                { label: "Truck Driver (Grace)", email: "grace@transitops.com" },
              ].map((item) => (
                <button
                  key={item.email}
                  type="button"
                  onClick={() => {
                    setEmail(item.email);
                    setPassword("Password123!");
                  }}
                  className="text-left px-2 py-1 rounded bg-muted/40 hover:bg-muted border border-border-soft flex items-center justify-between group transition-colors"
                >
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground group-hover:text-primary">{item.email}</span>
                </button>
              ))}
            </div>
          </div>
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
        </div>
      </div>
    </div>
  );
}
