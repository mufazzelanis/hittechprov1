"use client";

import { useState } from "react";

// Illustrative growth curve (example data, not real payouts).
const DATA = [["Jan", 1200], ["Feb", 1800], ["Mar", 2400], ["Apr", 3200], ["May", 4100], ["Jun", 5200]];

export default function AffiliateChart() {
  const [h, setH] = useState(null);
  const W = 560, H = 240, PL = 44, PR = 16, PT = 16, PB = 28, MAX = 6000;
  const x = (i) => PL + ((W - PL - PR) * i) / (DATA.length - 1);
  const y = (v) => PT + (H - PT - PB) * (1 - v / MAX);
  const path = DATA.map(([, v], i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  const area = `${path} L${x(DATA.length - 1)},${H - PB} L${x(0)},${H - PB} Z`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Example monthly affiliate earnings growth from January to June" onMouseLeave={() => setH(null)}>
        <defs>
          <linearGradient id="affg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#E8352B" stopOpacity="0.35" />
            <stop offset="1" stopColor="#E8352B" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1500, 3000, 4500, 6000].map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke="rgb(var(--line))" />
            <text x={PL - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="rgb(var(--mist))">{t}</text>
          </g>
        ))}
        <path d={area} fill="url(#affg)" />
        <path d={path} fill="none" stroke="#E8352B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset="1" style={{ animation: "draw 1.6s ease forwards" }} />
        {DATA.map(([m, v], i) => (
          <g key={m} onMouseEnter={() => setH(i)}>
            <rect x={x(i) - 30} y={PT} width="60" height={H - PT - PB} fill="transparent" />
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="rgb(var(--mist))">{m}</text>
            <circle cx={x(i)} cy={y(v)} r={h === i ? 6 : 4} fill="rgb(var(--brand))" stroke="rgb(var(--panel))" strokeWidth="2" />
          </g>
        ))}
      </svg>
      {h !== null && (
        <div className="pointer-events-none absolute top-0 rounded-lg border border-line bg-panel2 px-3 py-2 text-xs" style={{ left: `${(x(h) / W) * 100}%`, transform: "translateX(-50%)" }}>
          <p className="text-mist">{DATA[h][0]}</p>
          <p className="font-semibold">৳{DATA[h][1].toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
