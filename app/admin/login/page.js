"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { navStart } from "@/components/LoadingSystem";

export default function LoginPage() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: f.get("email"), password: f.get("password") }),
    });
    if (res.ok) {
      navStart();
      router.replace("/admin");
      router.refresh();
    } else {
      setErr((await res.json().catch(() => ({}))).error || "Login failed");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh bg-ink bg-grain flex items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line bg-panel p-8 shadow-glow">
        <div className="w-11 h-11 rounded-xl bg-brand/15 text-brand flex items-center justify-center mb-5">
          <Lock size={20} />
        </div>
        <h1 className="font-display text-2xl font-bold">Admin sign in</h1>
        <p className="text-mist text-sm mt-1 mb-6">HiT Tech Pro control panel</p>

        <label className="text-xs text-mist">Email</label>
        <input name="email" type="email" required autoFocus className="input mt-1 mb-4" />
        <label className="text-xs text-mist">Password</label>
        <input name="password" type="password" required className="input mt-1" />

        {err && <p className="text-sm text-red-400 mt-4">{err}</p>}

        <button disabled={busy} className="btn-primary w-full mt-6 justify-center">
          {busy && <Loader2 size={16} className="animate-spin" />} Sign in
        </button>
      </form>
    </main>
  );
}
