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
const GRID_LEVELS = [2, 4, 6, 8, 10];

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function InteractiveRadar({
  spheres,
  size,
  onLevelChange,
  onSphereClick,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [localLevels, setLocalLevels] = useState<Record<string, number>>({});

  const c = size / 2;
  const maxR = size / 2 - 60;
  const n = spheres.length;
  const step = n > 0 ? 360 / n : 0;

  useEffect(() => {
    const levels: Record<string, number> = {};
    spheres.forEach((s) => {
      levels[s.id] = Number(s.current_level) || 0;
    });
    setLocalLevels(levels);
  }, [spheres]);

  const getLevel = (id: string) => localLevels[id] ?? 0;

  const getSvgPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    []
  );

  const calcLevel = useCallback(
    (px: number, py: number) => {
      const dx = px - c;
      const dy = py - c;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const level = Math.round((dist / maxR) * MAX_LEVEL * 2) / 2;
      return Math.max(0, Math.min(MAX_LEVEL, level));
    },
    [c, maxR]
  );

  const handlePointerDown = (sphereId: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(sphereId);
    (e.target as SVGElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const pt = getSvgPoint(e.clientX, e.clientY);
      const newLevel = calcLevel(pt.x, pt.y);
      setLocalLevels((prev) => ({ ...prev, [dragging]: newLevel }));
    },
    [dragging, getSvgPoint, calcLevel]
  );

  const handlePointerUp = useCallback(() => {
    if (dragging) {
      const level = getLevel(dragging);
      onLevelChange(dragging, level);
      setDragging(null);
    }
  }, [dragging, localLevels, onLevelChange]);

  if (n < 3) return null;

  // Build points string
  function pts(values: number[]) {
    return values
      .map((v, i) => {
        const r = ((Number(v) || 0) / MAX_LEVEL) * maxR;
        const p = polar(c, c, r, i * step);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");
  }

  const currentValues = spheres.map((s) => getLevel(s.id));
  const targetValues = spheres.map((s) => Number(s.target_level) || 10);

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
      {/* Glow filter */}
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a1a2e" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx={c} cy={c} r={maxR + 20} fill="url(#bgGrad)" />

      {/* Grid rings */}
      {GRID_LEVELS.map((lev) => {
        const r = (lev / MAX_LEVEL) * maxR;
        const points = Array.from({ length: n }, (_, i) => {
          const p = polar(c, c, r, i * step);
          return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        }).join(" ");

        return (
          <polygon
            key={lev}
            points={points}
            fill="none"
            stroke="#222"
            strokeWidth={lev === 10 ? 1.5 : 0.5}
            opacity={lev === 10 ? 0.8 : 0.5}
          />
        );
      })}

      {/* Axis lines */}
      {spheres.map((_, i) => {
        const p = polar(c, c, maxR, i * step);
        return (
          <line
            key={`ax-${i}`}
            x1={c}
            y1={c}
            x2={p.x}
            y2={p.y}
            stroke="#222"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Target polygon */}
      <polygon
        points={pts(targetValues)}
        fill="none"
        stroke="#333"
        strokeWidth={1}
        strokeDasharray="4,4"
        opacity={0.6}
      />

      {/* Current area - gradient fill */}
      <polygon
        points={pts(currentValues)}
        fill="rgba(139,92,246,0.12)"
        stroke="rgba(139,92,246,0.6)"
        strokeWidth={1.5}
      />

      {/* Colored segments from center to each dot */}
      {spheres.map((s, i) => {
        const level = getLevel(s.id);
        const r = (level / MAX_LEVEL) * maxR;
        const p = polar(c, c, r, i * step);
        const color = s.color || "#8b5cf6";

        return (
          <line
            key={`seg-${i}`}
            x1={c}
            y1={c}
            x2={p.x}
            y2={p.y}
            stroke={color}
            strokeWidth={2}
            opacity={0.2}
          />
        );
      })}

      {/* Interactive dots */}
      {spheres.map((s, i) => {
        const level = getLevel(s.id);
        const r = (level / MAX_LEVEL) * maxR;
        const dot = polar(c, c, r, i * step);
        const color = s.color || "#8b5cf6";
        const isActive = dragging === s.id || hovered === s.id;

        return (
          <g key={`dot-${s.id}`}>
            {/* Hit area (larger invisible circle for easier grabbing) */}
            <circle
              cx={dot.x}
              cy={dot.y}
              r={20}
              fill="transparent"
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={handlePointerDown(s.id)}
              onPointerEnter={() => setHovered(s.id)}
              onPointerLeave={() => setHovered(null)}
            />

            {/* Pulse ring on active */}
            {isActive && (
              <circle
                cx={dot.x}
                cy={dot.y}
                r={16}
                fill="none"
                stroke={color}
                strokeWidth={1}
                opacity={0.3}
              >
                <animate
                  attributeName="r"
                  from="10"
                  to="20"
                  dur="1s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.4"
                  to="0"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {/* Outer glow */}
            <circle
              cx={dot.x}
              cy={dot.y}
              r={isActive ? 10 : 7}
              fill={color}
              opacity={0.2}
              filter="url(#glow)"
            />

            {/* Dot */}
            <circle
              cx={dot.x}
              cy={dot.y}
              r={isActive ? 8 : 6}
              fill={color}
              stroke="#000"
              strokeWidth={2}
              className="transition-all duration-150"
            />

            {/* Level number inside dot */}
            <text
              x={dot.x}
              y={dot.y + 1}
              fill="#fff"
              fontSize={isActive ? 9 : 7}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="middle"
              className="pointer-events-none"
            >
              {level.toFixed(level % 1 === 0 ? 0 : 1)}
            </text>
          </g>
        );
      })}

      {/* Labels */}
      {spheres.map((s, i) => {
        const labelR = maxR + 36;
        const p = polar(c, c, labelR, i * step);
        const color = s.color || "#8b5cf6";
        const isActive = dragging === s.id || hovered === s.id;
        const name =
          s.name.length > 16 ? s.name.slice(0, 15) + "..." : s.name;

        return (
          <text
            key={`lbl-${s.id}`}
            x={p.x}
            y={p.y}
            fill={isActive ? "#fff" : color}
            fontSize={isActive ? 13 : 11}
            fontWeight={isActive ? 700 : 500}
            textAnchor="middle"
            dominantBaseline="middle"
            className="cursor-pointer transition-all"
            onClick={() => onSphereClick(s.id)}
            onPointerEnter={() => setHovered(s.id)}
            onPointerLeave={() => setHovered(null)}
          >
            {name}
          </text>
        );
      })}

      {/* Center dot */}
      <circle cx={c} cy={c} r={3} fill="#333" />
    </svg>
  );
}
