"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail, Phone, User, UserRound } from "lucide-react";
import { track } from "@/lib/track";
import { navStart } from "@/components/LoadingSystem";
import { getVisitorId } from "@/lib/visitorId";
import Field, { EMAIL_RE, FormErrorBanner } from "@/components/FormField";

const PHONE_RE = /^[\d+\-\s()]{7,20}$/;

function strengthOf(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}
const STRENGTH_LABEL = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-400"];

function validateField(name, value, reg) {
  const v = String(value || "").trim();
  if (name === "name") return reg && v.length < 2 ? "Enter your full name" : "";
  if (name === "email") return !EMAIL_RE.test(v) ? "Enter a valid email address" : "";
  if (name === "phone") return v && !PHONE_RE.test(v) ? "Enter a valid phone number" : "";
  if (name === "password") {
    if (!v) return "Password is required";
    if (reg && v.length < 8) return "Use at least 8 characters";
  }
  return "";
}

export default function AuthForm({ initialMode = "login", next = "/account", affiliate = false }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const reg = mode === "register";
  const strength = reg ? strengthOf(password) : 0;

  const refs = { name: useRef(null), email: useRef(null), phone: useRef(null), password: useRef(null) };

  const onBlur = (e) => {
    const msg = validateField(e.target.name, e.target.value, reg);
    setFieldErrors((f) => ({ ...f, [e.target.name]: msg }));
  };
  const clearError = (name) => setFieldErrors((f) => (f[name] ? { ...f, [name]: "" } : f));

  function switchMode() {
    setMode(reg ? "login" : "register");
    setErr("");
    setFieldErrors({});
    setShowPw(false);
  }

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    const fields = reg ? ["name", "email", "phone", "password"] : ["email", "password"];
    const errors = {};
    for (const f of fields) errors[f] = validateField(f, body[f], reg);
    setFieldErrors(errors);
    const firstBad = fields.find((f) => errors[f]);
    if (firstBad) {
      refs[firstBad].current?.focus();
      return;
    }

    setBusy(true);
    setErr("");
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
    <motion.form
      layout
      onSubmit={submit}
      noValidate
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm mx-auto rounded-2xl border border-line bg-panel p-8 shadow-glow"
    >
      <div className="w-11 h-11 rounded-xl bg-brand/15 text-brand flex items-center justify-center mb-5"><UserRound size={20} /></div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: reg ? 16 : -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: reg ? -16 : 16 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-display text-2xl font-bold">{reg ? "Create your account" : "Welcome back"}</h1>
          <p className="text-mist text-sm mt-1 mb-6">{reg ? affiliate ? "Track orders and earn with our affiliate program." : "Track your orders and access." : "Sign in to your Client Area."}</p>

          <div className="space-y-4">
            {reg && (
              <Field
                ref={refs.name} icon={User} label="Full name" name="name" required autoComplete="name" autoFocus
                placeholder="Jane Rahman" error={fieldErrors.name} onBlur={onBlur} onChange={() => clearError("name")}
              />
            )}
            <Field
              ref={refs.email} icon={Mail} label="Email address" name="email" type="email" required
              autoComplete={reg ? "email" : "username"} autoFocus={!reg} placeholder="you@example.com" value={email}
              valid={!fieldErrors.email && EMAIL_RE.test(email)} error={fieldErrors.email}
              onChange={(e) => { setEmail(e.target.value); clearError("email"); }} onBlur={onBlur}
            />
            {reg && (
              <Field
                ref={refs.phone} icon={Phone} label="Phone (optional)" name="phone" type="tel" autoComplete="tel"
                placeholder="+880 1XXX-XXXXXX" error={fieldErrors.phone} onBlur={onBlur} onChange={() => clearError("phone")}
              />
            )}
            <div>
              <Field
                ref={refs.password} icon={Lock} label="Password" name="password" type={showPw ? "text" : "password"} required
                autoComplete={reg ? "new-password" : "current-password"} placeholder={reg ? "Min. 8 characters" : "Your password"}
                value={password} error={fieldErrors.password}
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
              {!reg && <Link href="/forgot-password" className="block text-right text-xs text-brand hover:underline mt-2">Forgot password?</Link>}
              {reg && password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? STRENGTH_COLOR[strength] : "bg-line"}`} />
                    ))}
                  </div>
                  <p className="text-[11px] text-mist mt-1">{STRENGTH_LABEL[strength]}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <FormErrorBanner>{err}</FormErrorBanner>

      <button disabled={busy} aria-busy={busy} className="btn-primary w-full mt-6 justify-center py-3">
        {busy && <Loader2 size={16} className="animate-spin" />} {reg ? "Create account" : "Sign in"}
      </button>
      <p className="text-sm text-mist text-center mt-5">
        {reg ? "Already have an account?" : "New here?"}{" "}
        <button type="button" className="text-brand hover:underline font-medium" onClick={switchMode}>
          {reg ? "Sign in" : "Create an account"}
        </button>
      </p>
    </motion.form>
  );
}
