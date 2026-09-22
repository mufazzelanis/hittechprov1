const STYLE = {
  active: { dot: "bg-emerald-400", box: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  limited: { dot: "bg-amber-400", box: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  maintenance: { dot: "bg-orange-400", box: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  down: { dot: "bg-red-500", box: "bg-red-500/15 text-red-300 border-red-500/30" },
};

export default function StatusBadge({ status, label }) {
  const s = STYLE[status] || STYLE.active;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${s.box}`}>
      <span className="relative flex w-2 h-2" aria-hidden>
        {status === "active" && <span className={`absolute inline-flex w-full h-full rounded-full ${s.dot} opacity-70 animate-ping`} />}
        <span className={`relative inline-flex w-2 h-2 rounded-full ${s.dot}`} />
      </span>
      {label}
    </span>
  );
}
