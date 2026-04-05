"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { Sphere } from "@/lib/types";

interface Props {
  spheres: Sphere[];
  size: number;
  onLevelChange: (sphereId: string, newLevel: number) => void;
  onSphereClick: (sphereId: string) => void;
}

const MAX_LEVEL = 10;
const RINGS = [2, 4, 6, 8, 10];

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function InteractiveRadar({ spheres, size, onLevelChange, onSphereClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [localLevels, setLocalLevels] = useState<Record<string, number>>({});

  const c = size / 2;
  const maxR = size / 2 - 64;
  const n = spheres.length;
  const step = n > 0 ? 360 / n : 0;

  useEffect(() => {
    const levels: Record<string, number> = {};
    spheres.forEach((s) => { levels[s.id] = Number(s.current_level) || 0; });
    setLocalLevels(levels);
  }, [spheres]);

  const getLevel = (id: string) => localLevels[id] ?? 0;

  const getSvgPoint = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const calcLevel = useCallback((px: number, py: number) => {
    const dx = px - c;
    const dy = py - c;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const level = Math.round((dist / maxR) * MAX_LEVEL * 2) / 2;
    return Math.max(0, Math.min(MAX_LEVEL, level));
  }, [c, maxR]);

  const handlePointerDown = (id: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(id);
    (e.target as SVGElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const pt = getSvgPoint(e.clientX, e.clientY);
    setLocalLevels((prev) => ({ ...prev, [dragging]: calcLevel(pt.x, pt.y) }));
  }, [dragging, getSvgPoint, calcLevel]);

  const handlePointerUp = useCallback(() => {
    if (dragging) {
      onLevelChange(dragging, localLevels[dragging] ?? 0);
      setDragging(null);
    }
  }, [dragging, localLevels, onLevelChange]);

  if (n < 3) return null;

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      className="select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Grid rings — concentric circles */}
      {RINGS.map((lev) => {
        const r = (lev / MAX_LEVEL) * maxR;
        return (
          <circle
            key={lev}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke="#fff"
            strokeWidth={lev === 10 ? 0.8 : 0.3}
            opacity={lev === 10 ? 0.12 : 0.06}
          />
        );
      })}

      {/* Axis lines */}
      {spheres.map((_, i) => {
        const p = polar(c, c, maxR, i * step);
        return (
          <line key={`ax-${i}`} x1={c} y1={c} x2={p.x} y2={p.y}
            stroke="#fff" strokeWidth={0.3} opacity={0.06} />
        );
      })}

      {/* Web — filled area */}
      <polygon
        points={spheres.map((s, i) => {
          const r = ((getLevel(s.id)) / MAX_LEVEL) * maxR;
          const p = polar(c, c, r, i * step);
          return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        }).join(" ")}
        fill="rgba(255,255,255,0.02)"
        stroke="#fff"
        strokeWidth={0.5}
        opacity={0.4}
      />

      {/* Connection threads between adjacent nodes */}
      {spheres.map((s, i) => {
        const next = spheres[(i + 1) % n];
        const r1 = (getLevel(s.id) / MAX_LEVEL) * maxR;
        const r2 = (getLevel(next.id) / MAX_LEVEL) * maxR;
        const p1 = polar(c, c, r1, i * step);
        const p2 = polar(c, c, r2, ((i + 1) % n) * step);
        return (
          <line key={`conn-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke="#fff" strokeWidth={0.4} opacity={0.1} />
        );
      })}

      {/* ====== NODES ====== */}
      {spheres.map((s, i) => {
        const level = getLevel(s.id);
        const r = (level / MAX_LEVEL) * maxR;
        const dot = polar(c, c, r, i * step);
        const isActive = dragging === s.id || hovered === s.id;
        const nodeR = isActive ? 20 : 16;

        return (
          <g key={`node-${s.id}`}>
            {/* Outer ring */}
            {isActive && (
              <circle cx={dot.x} cy={dot.y} r={nodeR + 6}
                fill="none" stroke="#fff" strokeWidth={0.5} opacity={0.15} />
            )}

            {/* Hit area */}
            <circle cx={dot.x} cy={dot.y} r={28}
              fill="transparent"
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={handlePointerDown(s.id)}
              onPointerEnter={() => setHovered(s.id)}
              onPointerLeave={() => setHovered(null)}
            />

            {/* Node — dark circle with white border */}
            <circle cx={dot.x} cy={dot.y} r={nodeR}
              fill="#0a0a0a"
              stroke="#fff"
              strokeWidth={isActive ? 1.5 : 0.8}
              opacity={isActive ? 1 : 0.7}
            />

            {/* Level text */}
            <text x={dot.x} y={dot.y + 1}
              fill="#fff"
              fontSize={isActive ? 12 : 10}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="middle"
              className="pointer-events-none"
              opacity={isActive ? 1 : 0.6}
            >
              {level.toFixed(level % 1 === 0 ? 0 : 1)}
            </text>
          </g>
        );
      })}

      {/* ====== LABELS ====== */}
      {spheres.map((s, i) => {
        const p = polar(c, c, maxR + 40, i * step);
        const isActive = dragging === s.id || hovered === s.id;
        const level = getLevel(s.id);
        const target = Number(s.target_level) || 10;
        const name = s.name.length > 18 ? s.name.slice(0, 17) + "\u2026" : s.name;

        return (
          <g key={`lbl-${s.id}`}
            className="cursor-pointer"
            onClick={() => onSphereClick(s.id)}
            onPointerEnter={() => setHovered(s.id)}
            onPointerLeave={() => setHovered(null)}
          >
            <text x={p.x} y={p.y - 5}
              fill="#fff"
              fontSize={11}
              fontWeight={isActive ? 600 : 400}
              textAnchor="middle"
              dominantBaseline="middle"
              opacity={isActive ? 0.9 : 0.4}
              className="transition-all"
            >
              {name}
            </text>
            <text x={p.x} y={p.y + 9}
              fill="#fff"
              fontSize={9}
              fontWeight={400}
              textAnchor="middle"
              dominantBaseline="middle"
              opacity={isActive ? 0.5 : 0.2}
            >
              {level}/{target}
            </text>
          </g>
        );
      })}

      {/* Center dot */}
      <circle cx={c} cy={c} r={2} fill="#fff" opacity={0.15} />
    </svg>
  );
}
