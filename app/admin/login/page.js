"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { navStart } from "@/components/LoadingSystem";
import Field, { EMAIL_RE, FormErrorBanner } from "@/components/FormField";

function validate(name, value) {
  const v = String(value || "").trim();
  if (name === "email") return !EMAIL_RE.test(v) ? "Enter a valid email address" : "";
  if (name === "password") return !v ? "Password is required" : "";
  return "";
}

export default function LoginPage() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const refs = { email: useRef(null), password: useRef(null) };

  const onBlur = (e) => setFieldErrors((f) => ({ ...f, [e.target.name]: validate(e.target.name, e.target.value) }));
  const clearError = (name) => setFieldErrors((f) => (f[name] ? { ...f, [name]: "" } : f));

  async function submit(e) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const errors = { email: validate("email", body.email), password: validate("password", body.password) };
    setFieldErrors(errors);
    const firstBad = ["email", "password"].find((f) => errors[f]);
    if (firstBad) {
      refs[firstBad].current?.focus();
      return;
    }

    setBusy(true);
    setErr("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
    <main className="min-h-dvh bg-ink bg-grain flex items-center justify-center px-5 py-10">
      <motion.form
        onSubmit={submit}
        noValidate
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm rounded-2xl border border-line bg-panel p-8 shadow-glow"
      >
        <div className="w-11 h-11 rounded-xl bg-brand/15 text-brand flex items-center justify-center mb-5">
          <Lock size={20} />
        </div>
        <h1 className="font-display text-2xl font-bold">Admin sign in</h1>
        <p className="text-mist text-sm mt-1 mb-6">HiT Tech Pro control panel</p>

        <div className="space-y-4">
          <Field
            ref={refs.email} icon={Mail} label="Email address" name="email" type="email" required
            autoComplete="username" autoFocus placeholder="you@company.com" value={email}
            valid={!fieldErrors.email && EMAIL_RE.test(email)} error={fieldErrors.email}
            onChange={(e) => { setEmail(e.target.value); clearError("email"); }} onBlur={onBlur}
          />
          <Field
            ref={refs.password} icon={Lock} label="Password" name="password" type={showPw ? "text" : "password"} required
            autoComplete="current-password" placeholder="Your password" value={password} error={fieldErrors.password}
            onChange={(e) => { setPassword(e.target.value); clearError("password"); }} onBlur={onBlur}
            right={
              <button
                type="button" tabIndex={-1} onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mist hover:text-fg transition-colors"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <Link href="/admin/forgot-password" className="block text-right text-xs text-brand hover:underline -mt-2">Forgot password?</Link>
        </div>

        <FormErrorBanner>{err}</FormErrorBanner>

        <button disabled={busy} aria-busy={busy} className="btn-primary w-full mt-6 justify-center py-3">
          {busy && <Loader2 size={16} className="animate-spin" />} Sign in
        </button>

        <p className="flex items-center justify-center gap-1.5 text-xs text-mist mt-6">
          <ShieldCheck size={13} className="shrink-0" /> Restricted access — sign-in attempts are monitored and rate-limited.
        </p>
      </motion.form>
    </main>
  );
}
