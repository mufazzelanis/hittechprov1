"use client";

import { useState } from "react";

// Single-series bar chart: revenue per day. No legend needed, the card title names the series.
export default function RevenueChart({ data }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = 220, PL = 44, PB = 26, PT = 12;
  const max = Math.max(1000, ...data.map((d) => d.value));
  const nice = Math.ceil(max / 1000) * 1000;
  const bw = (W - PL) / data.length;
  const y = (v) => PT + (H - PT - PB) * (1 - v / nice);
  const ticks = [0, 0.5, 1].map((t) => Math.round(nice * t));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Revenue per day, last 14 days">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PL} x2={W} y1={y(t)} y2={y(t)} stroke="rgb(var(--line))" strokeWidth="1" />
            <text x={PL - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="rgb(var(--mist))">
              {t >= 1000 ? `${t / 1000}k` : t}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = PL + i * bw + bw * 0.2;
          const w = bw * 0.6;
          const h = Math.max(d.value ? 2 : 0, H - PB - y(d.value));
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={PL + i * bw} y={0} width={bw} height={H - PB} fill="transparent" />
              <path
                d={`M${x},${H - PB} v${-Math.max(0, h - 4)} q0,-4 4,-4 h${w - 8} q4,0 4,4 v${Math.max(0, h - 4)} z`}
                fill="#E8352B"
                opacity={hover === null || hover === i ? 1 : 0.45}
              />
              {(i % 2 === 0 || data.length < 8) && (
                <text x={x + w / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="rgb(var(--mist))">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -top-2 rounded-lg border border-line bg-panel2 px-3 py-2 text-xs shadow-glow"
          style={{ left: `${((PL + hover * bw + bw / 2) / W) * 100}%`, transform: "translateX(-50%)" }}
        >
          <p className="text-mist">{data[hover].label}</p>
          <p className="font-semibold">৳{data[hover].value.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
