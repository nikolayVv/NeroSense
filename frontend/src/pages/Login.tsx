import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { login, getUser } from "@/lib/auth";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    document.title = "Sign in — Nero Sense";
    if (getUser()) navigate("/app/missions", { replace: true });
  }, [navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password required");
      return;
    }
    login(email, name || undefined);
    toast.success(mode === "signup" ? "Account created" : "Welcome back");
    navigate("/app/missions");
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* subtle scanline backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            "repeating-linear-gradient(0deg,transparent,transparent 2px,hsl(var(--primary)/0.04) 2px,hsl(var(--primary)/0.04) 4px)",
        }}
      />
      <Card className="relative w-full max-w-md p-8 border-primary/20 bg-card/80 backdrop-blur">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center mb-3">
            <span className="text-primary font-bold text-xl">N</span>
          </div>
          <h1 className="text-2xl font-bold tracking-wide">
            Nero<span className="text-primary">Sense</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
            PhytoWatch Console
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Researcher"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@nerosense.io"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            {mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          {mode === "login"
            ? "No account? Create one"
            : "Already have an account? Sign in"}
        </button>

        <p className="mt-6 text-[10px] text-muted-foreground text-center">
          Prototype mode — no real authentication.
        </p>
      </Card>
    </main>
  );
}
