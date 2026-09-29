"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Wallet, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

// Sits above the SMM Services table: shows the live SMMIU account balance (so the admin can see at a
// glance if it needs topping up before orders start failing) and a one-click "Sync" that pulls the
// provider's current catalog - brand-new services land inactive with a suggested price, existing ones
// only get their provider-side numbers refreshed (never the admin's own pricing/visibility choices).
export default function SmmSyncPanel() {
  const router = useRouter();
  const [balance, setBalance] = useState(null);
  const [balanceErr, setBalanceErr] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const loadBalance = async () => {
    setBalanceErr("");
    try {
      const r = await fetch("/api/admin/smm/balance");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setBalance(j);
    } catch (e) {
      setBalanceErr(e.message || "Could not load balance");
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const sync = async () => {
    setSyncing(true);
    setErr("");
    setResult(null);
    try {
      const r = await fetch("/api/admin/smm/sync", { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Sync failed");
      setResult(j);
      router.refresh();
    } catch (e) {
      setErr(e.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-panel p-5 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-3 min-w-[220px]">
        <span className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
          <Wallet size={18} />
        </span>
        <div>
          <p className="text-xs text-mist">SMMIU balance</p>
          {balanceErr ? (
            <p className="text-sm text-red-400 flex items-center gap-1"><AlertTriangle size={13} /> {balanceErr}</p>
          ) : balance ? (
            <p className="font-display font-bold text-lg">{balance.balance.toFixed(2)} {balance.currency}</p>
          ) : (
            <Loader2 size={15} className="animate-spin text-mist mt-1" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-[200px]">
        <p className="font-display font-semibold">Service catalog</p>
        <p className="text-xs text-mist mt-0.5 leading-relaxed">
          Pull the latest services, prices and limits from SMMIU. New services are added as hidden with a suggested price - review and switch them on below.
        </p>
      </div>

      <button
        type="button"
        onClick={sync}
        disabled={syncing}
        className="shrink-0 flex items-center gap-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
      >
        {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
        {syncing ? "Syncing…" : "Sync from SMMIU"}
      </button>

      {result && (
        <p className="w-full text-sm text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 size={14} /> Synced {result.total} services — {result.created} new, {result.updated} updated.
        </p>
      )}
      {err && (
        <p className="w-full text-sm text-red-400 flex items-center gap-1.5">
          <AlertTriangle size={14} /> {err}
        </p>
      )}
    </div>
  );
}
