export default function ToolMarquee({ names, label }) {
  if (!names.length) return null;
  const loop = [...names, ...names];
  return (
    <div className="border-y border-line bg-panel/40 py-5 overflow-hidden" aria-label="Tools available">
      <p className="text-center text-[11px] uppercase tracking-[0.2em] text-mist mb-4">{label}</p>
      <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <div className="marquee-track flex gap-3 w-max" style={{ animationDuration: "60s" }}>
          {loop.map((n, i) => (
            <span key={n + i} className="px-4 py-2 rounded-full border border-line bg-panel text-sm text-mist whitespace-nowrap hover:text-fg hover:border-brand/50 transition-colors">{n}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
