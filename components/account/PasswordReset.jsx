"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, ShieldAlert } from "lucide-react";
import Field, { EMAIL_RE, FormErrorBanner } from "@/components/FormField";

const CARD = "w-full max-w-sm mx-auto rounded-2xl border border-line bg-panel p-8 shadow-glow";
const ICON_WRAP = "w-11 h-11 rounded-xl bg-brand/15 text-brand flex items-center justify-center mb-5";

// `admin` only changes which flavour of email the server sends (see /api/auth/forgot-password) and
// which "back to sign in" link is shown here - the request/response shape is identical either way,
// since admin and customer accounts are both just User rows.
export function ForgotPasswordCard({ admin = false, backHref, backLabel = "Back to sign in" }) {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) { setErr("Enter a valid email address"); return; }
    setBusy(true);
    setErr("");
    try {
      await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, admin }) });
    } catch {}
    setBusy(false);
    // Always show the same success state, whether or not that email has an account - never let this
    // form be used to check which emails are registered.
    setDone(true);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className={CARD}>
      <div className={ICON_WRAP}><KeyRound size={20} /></div>
      {done ? (
        <>
          <h1 className="font-display text-2xl font-bold">Check your email</h1>
          <p className="text-mist text-sm mt-2 leading-relaxed">
            If an account exists for <span className="text-fg font-medium">{email}</span>, we've sent a link to reset
            the password. It can take a couple of minutes to arrive - if you don't see it, please check your
            spam/junk folder too. The link works once and expires in 45 minutes.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl font-bold">Forgot password?</h1>
          <p className="text-mist text-sm mt-1 mb-6">Enter your email and we'll send you a link to reset it.</p>
          <form onSubmit={submit} noValidate className="space-y-4">
            <Field
              icon={Mail} label="Email address" name="email" type="email" required autoFocus autoComplete="email"
              placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }}
            />
            <FormErrorBanner>{err}</FormErrorBanner>
            <button disabled={busy} aria-busy={busy} className="btn-primary w-full justify-center py-3">
              {busy && <Loader2 size={16} className="animate-spin" />} Send reset link
            </button>
          </form>
        </>
      )}
      <Link href={backHref} className="mt-6 flex items-center justify-center gap-1.5 text-sm text-mist hover:text-fg transition-colors">
        <ArrowLeft size={14} /> {backLabel}
      </Link>
    </motion.div>
  );
}

export function ResetPasswordCard({ signInHref, forgotHref }) {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={CARD}>
        <div className={`${ICON_WRAP} !bg-amber-500/15 !text-amber-400`}><ShieldAlert size={20} /></div>
        <h1 className="font-display text-2xl font-bold">Link incomplete</h1>
        <p className="text-mist text-sm mt-2 leading-relaxed">This reset link is missing its token. Please request a new one.</p>
        <Link href={forgotHref} className="btn-primary w-full justify-center py-3 mt-6">Request a new link</Link>
      </motion.div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    if (password.length < 8) return setErr("Use at least 8 characters");
    if (password !== confirm) return setErr("Passwords don't match");
    setBusy(true);
    setErr("");
    const r = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) setDone(true);
    else setErr(j.error || "Something went wrong");
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className={CARD}>
      {done ? (
        <>
          <div className={`${ICON_WRAP} !bg-emerald-500/15 !text-emerald-400`}><CheckCircle2 size={20} /></div>
          <h1 className="font-display text-2xl font-bold">Password updated</h1>
          <p className="text-mist text-sm mt-2 leading-relaxed mb-6">You can sign in with your new password now.</p>
          <button onClick={() => router.push(signInHref)} className="btn-primary w-full justify-center py-3">Sign in</button>
        </>
      ) : (
        <>
          <div className={ICON_WRAP}><Lock size={20} /></div>
          <h1 className="font-display text-2xl font-bold">Set a new password</h1>
          <p className="text-mist text-sm mt-1 mb-6">Choose a new password for your account.</p>
          <form onSubmit={submit} noValidate className="space-y-4">
            <Field
              icon={Lock} label="New password" name="password" type={showPw ? "text" : "password"} required autoFocus
              autoComplete="new-password" placeholder="Min. 8 characters" value={password}
              onChange={(e) => { setPassword(e.target.value); setErr(""); }}
              right={
                <button type="button" tabIndex={-1} onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-mist hover:text-fg transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
            <Field
              icon={Lock} label="Confirm new password" name="confirm" type={showPw ? "text" : "password"} required
              autoComplete="new-password" placeholder="Repeat the password" value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setErr(""); }}
            />
            <FormErrorBanner>{err}</FormErrorBanner>
            <button disabled={busy} aria-busy={busy} className="btn-primary w-full justify-center py-3">
              {busy && <Loader2 size={16} className="animate-spin" />} Update password
            </button>
          </form>
        </>
      )}
    </motion.div>
  );
}
