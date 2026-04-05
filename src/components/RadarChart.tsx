"use client";

import type { Sphere } from "@/lib/types";

const MAX = 10;
const RINGS = [2, 4, 6, 8, 10];

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function RadarChart({ spheres, size = 340 }: { spheres: Sphere[]; size?: number }) {
  if (spheres.length < 3) return null;
  const c = size / 2, maxR = size / 2 - 44, n = spheres.length, step = 360 / n;

  return (
    <svg width={size} height={size}>
      {RINGS.map((lev) => (
        <circle key={lev} cx={c} cy={c} r={(lev / MAX) * maxR} fill="none" stroke="#fff"
          strokeWidth={lev === 10 ? 0.6 : 0.2} opacity={lev === 10 ? 0.1 : 0.05} />
      ))}
      {spheres.map((_, i) => {
        const p = polar(c, c, maxR, i * step);
        return <line key={i} x1={c} y1={c} x2={p.x} y2={p.y} stroke="#fff" strokeWidth={0.2} opacity={0.05} />;
      })}
      <polygon
        points={spheres.map((s, i) => {
          const p = polar(c, c, ((Number(s.score) || 0) / MAX) * maxR, i * step);
          return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        }).join(" ")}
        fill="rgba(255,255,255,0.03)" stroke="#fff" strokeWidth={0.6} opacity={0.4} />
      {spheres.map((s, i) => {
        const v = Number(s.score) || 0;
        const dot = polar(c, c, (v / MAX) * maxR, i * step);
        const lbl = polar(c, c, maxR + 22, i * step);
        const name = s.name.length > 14 ? s.name.slice(0, 13) + "\u2026" : s.name;
        return (
          <g key={s.id}>
            <circle cx={dot.x} cy={dot.y} r={4} fill="#0a0a0a" stroke="#fff" strokeWidth={0.6} opacity={0.6} />
            <text x={lbl.x} y={lbl.y} fill="#fff" fontSize={10} textAnchor="middle" dominantBaseline="middle" opacity={0.3}>{name}</text>
          </g>
        );
      })}
      <circle cx={c} cy={c} r={1.5} fill="#fff" opacity={0.1} />
    </svg>
  );
}
