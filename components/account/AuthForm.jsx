"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserRound } from "lucide-react";
import { track } from "@/lib/track";
import { navStart } from "@/components/LoadingSystem";
import { getVisitorId } from "@/lib/visitorId";

export default function AuthForm({ initialMode = "login", next = "/account", affiliate = false }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const reg = mode === "register";

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    if (reg) body.visitorId = getVisitorId();
    const r = await fetch(`/api/auth/${reg ? "register" : "login"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      if (reg) track("CompleteRegistration", { content_name: "account" });
      navStart();
      router.replace(next);
      router.refresh();
    } else {
      setErr((await r.json().catch(() => ({}))).error || "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm mx-auto rounded-2xl border border-line bg-panel p-8 shadow-glow">
      <div className="w-11 h-11 rounded-xl bg-brand/15 text-brand flex items-center justify-center mb-5"><UserRound size={20} /></div>
      <h1 className="font-display text-2xl font-bold">{reg ? "Create your account" : "Welcome back"}</h1>
      <p className="text-mist text-sm mt-1 mb-6">{reg ? affiliate ? "Track orders and earn with our affiliate program." : "Track your orders and access." : "Sign in to your Client Area."}</p>

      <div className="space-y-3">
        {reg && <input name="name" required placeholder="Full name" className="input" />}
        <input name="email" type="email" required placeholder="Email" className="input" />
        {reg && <input name="phone" placeholder="Phone (optional)" className="input" />}
        <input name="password" type="password" required minLength={reg ? 8 : 1} placeholder={reg ? "Password (min 8 characters)" : "Password"} className="input" />
      </div>
      {err && <p className="text-sm text-red-400 mt-4">{err}</p>}
      <button disabled={busy} className="btn-primary w-full mt-6 justify-center py-3">
        {busy && <Loader2 size={16} className="animate-spin" />} {reg ? "Create account" : "Sign in"}
      </button>
      <p className="text-sm text-mist text-center mt-5">
        {reg ? "Already have an account?" : "New here?"}{" "}
        <button type="button" className="text-brand hover:underline" onClick={() => { setMode(reg ? "login" : "register"); setErr(""); }}>
          {reg ? "Sign in" : "Create an account"}
        </button>
      </p>
    </form>
  );
}
