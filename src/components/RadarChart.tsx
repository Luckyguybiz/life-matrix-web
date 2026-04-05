"use client";

import type { Sphere } from "@/lib/types";

interface Props {
  spheres: Sphere[];
  size?: number;
}

const MAX_LEVEL = 10;
const GRID_LEVELS = [2.5, 5, 7.5, 10];

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function RadarChart({ spheres, size = 340 }: Props) {
  if (spheres.length < 3) return null;

  const c = size / 2;
  const maxR = size / 2 - 44;
  const n = spheres.length;
  const step = 360 / n;

  function pts(values: number[]) {
    return values
      .map((v, i) => {
        const s = Number(v) || 0;
        const r = (s / MAX_LEVEL) * maxR;
        const { x, y } = polar(c, c, r, i * step);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  const current = spheres.map((s) => Number(s.current_level) || 0);
  const target = spheres.map((s) => Number(s.target_level) || 1);

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Grid */}
      {GRID_LEVELS.map((lev) => (
        <polygon
          key={lev}
          points={Array.from({ length: n }, (_, i) => {
            const r = (lev / MAX_LEVEL) * maxR;
            const { x, y } = polar(c, c, r, i * step);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(" ")}
          fill="none"
          stroke="#333"
          strokeWidth={1}
        />
      ))}

      {/* Axes */}
      {spheres.map((_, i) => {
        const { x, y } = polar(c, c, maxR, i * step);
        return (
          <line
            key={i}
            x1={c}
            y1={c}
            x2={x}
            y2={y}
            stroke="#333"
            strokeWidth={1}
          />
        );
      })}

      {/* Target */}
      <polygon
        points={pts(target)}
        fill="rgba(255,255,255,0.04)"
        stroke="#555"
        strokeWidth={1.5}
        strokeDasharray="6,4"
      />

      {/* Current */}
      <polygon
        points={pts(current)}
        fill="rgba(139,92,246,0.2)"
        stroke="#8b5cf6"
        strokeWidth={2}
      />

      {/* Dots + Labels */}
      {spheres.map((s, i) => {
        const val = Number(s.current_level) || 0;
        const r = (val / MAX_LEVEL) * maxR;
        const dot = polar(c, c, r, i * step);
        const label = polar(c, c, maxR + 26, i * step);
        const name = s.name.length > 14 ? s.name.slice(0, 13) + "..." : s.name;

        return (
          <g key={s.id}>
            <circle
              cx={dot.x}
              cy={dot.y}
              r={4}
              fill={s.color || "#8b5cf6"}
              stroke="#000"
              strokeWidth={1.5}
            />
            <text
              x={label.x}
              y={label.y}
              fill={s.color || "#8b5cf6"}
              fontSize={11}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
