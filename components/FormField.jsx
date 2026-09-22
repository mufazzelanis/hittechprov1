"use client";

import { forwardRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check } from "lucide-react";

export const EMAIL_RE = /^\S+@\S+\.\S+$/;

const Field = forwardRef(function Field({ icon: Icon, error, valid, right, label, name, id, ...props }, ref) {
  const fieldId = id || `field-${name}`;
  return (
    <div>
      <label htmlFor={fieldId} className="block text-xs font-medium text-mist mb-1.5">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist pointer-events-none" aria-hidden />
        <input
          ref={ref}
          id={fieldId}
          name={name}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-err` : undefined}
          className={`input pl-9 ${right ? "pr-10" : ""} ${error ? "!border-red-500/70 focus:!border-red-500" : valid ? "!border-emerald-500/50" : ""}`}
          {...props}
        />
        {valid && !right && <Check size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" aria-hidden />}
        {right}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${fieldId}-err`}
            role="alert"
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: "auto", opacity: 1, marginTop: 6 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.18 }}
            className="text-xs text-red-400 flex items-center gap-1 overflow-hidden"
          >
            <AlertCircle size={12} className="shrink-0" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});
export default Field;

export function FormErrorBanner({ children }) {
  return (
    <AnimatePresence>
      {children && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: "auto", marginTop: 16, x: [0, -6, 6, -4, 0] }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ x: { duration: 0.35 } }}
          className="text-sm text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2.5 flex items-center gap-2 overflow-hidden"
        >
          <AlertCircle size={15} className="shrink-0" /> {children}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
