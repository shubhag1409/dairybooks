import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { showApiError } from "@/lib/dairy";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session: Session | null) => {
      if (session) navigate("/", { replace: true });
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      showApiError(err, mode === "signin" ? "Could not sign in" : "Could not create account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-cream">
      {/* Left — brand canvas */}
      <div className="hidden lg:flex relative overflow-hidden bg-forest text-cream flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🐄</span>
          <span className="font-display text-2xl">DairyBook</span>
        </div>

        <div className="relative z-10">
          <h1 className="font-display text-[52px] leading-[1.05] tracking-tight max-w-md">
            A clean ledger for the<br />
            <span className="italic text-turmeric-l">distributor’s desk.</span>
          </h1>
          <p className="mt-6 text-cream/70 text-base max-w-md leading-relaxed">
            Track daily purchases from the company. Bill customers route by route. Reconcile crates.
            Email your CA a tidy spreadsheet on the first of every month.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            {[
              { k: "Purchases", v: "by date" },
              { k: "Sales", v: "per shop" },
              { k: "Crates", v: "auto-rolling" },
            ].map((b) => (
              <div key={b.k} className="border border-cream/15 rounded-md p-3">
                <div className="font-display text-xl text-turmeric-l">{b.k}</div>
                <div className="text-[11px] text-cream/55 mt-0.5 uppercase tracking-wider">{b.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-cream/40 uppercase tracking-[0.18em]">
          Private · isolated per account
        </div>

        {/* Decorative concentric arc */}
        <div className="pointer-events-none absolute -right-40 -bottom-40 w-[520px] h-[520px] rounded-full border border-cream/10" />
        <div className="pointer-events-none absolute -right-32 -bottom-32 w-[420px] h-[420px] rounded-full border border-cream/10" />
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="text-2xl">🐄</span>
            <span className="font-display text-xl">DairyBook</span>
          </div>

          <h2 className="font-display text-3xl text-ink">
            {mode === "signin" ? "Welcome back." : "Create your ledger."}
          </h2>
          <p className="text-ink-3 text-sm mt-1.5">
            {mode === "signin" ? "Sign in to continue your books." : "Set up an account to start tracking."}
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-2 mb-1.5 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full h-11 px-3.5 rounded-md border border-border bg-card text-ink text-sm outline-none focus:border-turmeric focus:ring-2 focus:ring-turmeric/20 transition-shadow"
                placeholder="you@business.in"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-2 mb-1.5 block">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="w-full h-11 px-3.5 rounded-md border border-border bg-card text-ink text-sm outline-none focus:border-turmeric focus:ring-2 focus:ring-turmeric/20 transition-shadow"
                placeholder="At least 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-md bg-forest text-cream font-medium text-sm hover:bg-forest-l transition-colors press disabled:opacity-60"
            >
              {busy ? (mode === "signin" ? "Signing in…" : "Creating…") : (mode === "signin" ? "Sign in" : "Create account")}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-ink-3">
            {mode === "signin" ? (
              <>
                New here?{" "}
                <button onClick={() => setMode("signup")} className="text-forest font-medium underline-offset-4 hover:underline">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="text-forest font-medium underline-offset-4 hover:underline">
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
