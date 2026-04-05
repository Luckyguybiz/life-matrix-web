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

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
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
  const [time, setTime] = useState(0);

  const c = size / 2;
  const maxR = size / 2 - 70;
  const n = spheres.length;
  const step = n > 0 ? 360 / n : 0;

  // Animation loop for pulsing
  useEffect(() => {
    let frame: number;
    function tick() {
      setTime((t) => t + 1);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

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
      return { x: clientX - rect.left, y: clientY - rect.top };
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
      const level = localLevels[dragging] ?? 0;
      onLevelChange(dragging, level);
      setDragging(null);
    }
  }, [dragging, localLevels, onLevelChange]);

  if (n < 3) return null;

  const currentValues = spheres.map((s) => getLevel(s.id));
  const targetValues = spheres.map((s) => Number(s.target_level) || 10);

  // Animated pulse factor per sphere (offset by index)
  const pulse = (i: number) => Math.sin(time * 0.03 + i * 1.2) * 0.5 + 0.5;

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      className="select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ filter: "drop-shadow(0 0 40px rgba(139,92,246,0.06))" }}
    >
      <defs>
        {/* Sphere glow filters — one per sphere color */}
        {spheres.map((s) => {
          const rgb = hexToRgb(s.color || "#8b5cf6");
          return (
            <filter key={`glow-${s.id}`} id={`glow-${s.id}`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feFlood floodColor={`rgb(${rgb.r},${rgb.g},${rgb.b})`} floodOpacity="0.6" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          );
        })}

        {/* Center radial gradient */}
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.08" />
          <stop offset="40%" stopColor="#8b5cf6" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>

        {/* Web fill gradient */}
        <radialGradient id="webFill" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.03" />
        </radialGradient>
      </defs>

      {/* Ambient background glow */}
      <circle cx={c} cy={c} r={maxR + 40} fill="url(#centerGlow)" />

      {/* Rotating subtle ring */}
      <circle
        cx={c}
        cy={c}
        r={maxR + 8}
        fill="none"
        stroke="#8b5cf6"
        strokeWidth={0.3}
        strokeDasharray="4,12"
        opacity={0.15}
        style={{
          transformOrigin: `${c}px ${c}px`,
          transform: `rotate(${time * 0.15}deg)`,
        }}
      />

      {/* Grid rings — animated opacity */}
      {GRID_LEVELS.map((lev, li) => {
        const r = (lev / MAX_LEVEL) * maxR;
        const points = Array.from({ length: n }, (_, i) => {
          const p = polar(c, c, r, i * step);
          return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        }).join(" ");
        const gridPulse = 0.15 + Math.sin(time * 0.02 + li * 0.8) * 0.08;

        return (
          <polygon
            key={lev}
            points={points}
            fill="none"
            stroke={lev === 10 ? "#8b5cf6" : "#fff"}
            strokeWidth={lev === 10 ? 0.8 : 0.3}
            opacity={lev === 10 ? 0.2 : gridPulse}
          />
        );
      })}

      {/* Axis lines — subtle glow at ends */}
      {spheres.map((s, i) => {
        const p = polar(c, c, maxR, i * step);
        const color = s.color || "#8b5cf6";
        return (
          <g key={`ax-${i}`}>
            <line
              x1={c}
              y1={c}
              x2={p.x}
              y2={p.y}
              stroke="#fff"
              strokeWidth={0.3}
              opacity={0.08}
            />
            {/* Tiny glow dot at grid edge */}
            <circle
              cx={p.x}
              cy={p.y}
              r={1.5}
              fill={color}
              opacity={0.15 + pulse(i) * 0.15}
            />
          </g>
        );
      })}

      {/* Target polygon — subtle dashed */}
      <polygon
        points={spheres
          .map((s, i) => {
            const v = Number(s.target_level) || 10;
            const r = (v / MAX_LEVEL) * maxR;
            const p = polar(c, c, r, i * step);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          })
          .join(" ")}
        fill="none"
        stroke="#fff"
        strokeWidth={0.5}
        strokeDasharray="3,6"
        opacity={0.1}
      />

      {/* Current area — gradient fill with animated stroke */}
      <polygon
        points={currentValues
          .map((v, i) => {
            const r = ((Number(v) || 0) / MAX_LEVEL) * maxR;
            const p = polar(c, c, r, i * step);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          })
          .join(" ")}
        fill="url(#webFill)"
        stroke="#8b5cf6"
        strokeWidth={1.2}
        opacity={0.7 + Math.sin(time * 0.025) * 0.15}
      />

      {/* Connection lines from each sphere to adjacent — thread effect */}
      {spheres.map((s, i) => {
        const level = getLevel(s.id);
        const nextI = (i + 1) % n;
        const nextLevel = getLevel(spheres[nextI].id);
        const r1 = (level / MAX_LEVEL) * maxR;
        const r2 = (nextLevel / MAX_LEVEL) * maxR;
        const p1 = polar(c, c, r1, i * step);
        const p2 = polar(c, c, r2, nextI * step);
        const color = s.color || "#8b5cf6";

        return (
          <line
            key={`conn-${i}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={color}
            strokeWidth={0.6}
            opacity={0.12 + pulse(i) * 0.08}
          />
        );
      })}

      {/* ====== SPHERE ORBS ====== */}
      {spheres.map((s, i) => {
        const level = getLevel(s.id);
        const r = (level / MAX_LEVEL) * maxR;
        const dot = polar(c, c, r, i * step);
        const color = s.color || "#8b5cf6";
        const rgb = hexToRgb(color);
        const isActive = dragging === s.id || hovered === s.id;
        const p = pulse(i);

        // Sphere radii
        const coreR = isActive ? 14 : 10;
        const ring1R = coreR + 6 + p * 4;
        const ring2R = coreR + 14 + p * 8;
        const ring3R = coreR + 22 + p * 10;

        return (
          <g key={`orb-${s.id}`}>
            {/* Outermost pulse ring */}
            <circle
              cx={dot.x}
              cy={dot.y}
              r={ring3R}
              fill="none"
              stroke={color}
              strokeWidth={0.3}
              opacity={isActive ? 0.25 : 0.06 + p * 0.06}
            />

            {/* Middle ring */}
            <circle
              cx={dot.x}
              cy={dot.y}
              r={ring2R}
              fill="none"
              stroke={color}
              strokeWidth={isActive ? 0.8 : 0.4}
              opacity={isActive ? 0.35 : 0.08 + p * 0.08}
              strokeDasharray={isActive ? "none" : "2,4"}
            />

            {/* Inner ring */}
            <circle
              cx={dot.x}
              cy={dot.y}
              r={ring1R}
              fill={`rgba(${rgb.r},${rgb.g},${rgb.b},${isActive ? 0.08 : 0.03})`}
              stroke={color}
              strokeWidth={isActive ? 1 : 0.5}
              opacity={isActive ? 0.5 : 0.15 + p * 0.1}
            />

            {/* Ambient glow */}
            <circle
              cx={dot.x}
              cy={dot.y}
              r={coreR + 3}
              fill={`rgba(${rgb.r},${rgb.g},${rgb.b},${isActive ? 0.25 : 0.08 + p * 0.06})`}
            />

            {/* Hit area */}
            <circle
              cx={dot.x}
              cy={dot.y}
              r={28}
              fill="transparent"
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={handlePointerDown(s.id)}
              onPointerEnter={() => setHovered(s.id)}
              onPointerLeave={() => setHovered(null)}
            />

            {/* Core sphere */}
            <circle
              cx={dot.x}
              cy={dot.y}
              r={coreR}
              fill={color}
              filter={isActive ? `url(#glow-${s.id})` : undefined}
              opacity={isActive ? 1 : 0.85 + p * 0.15}
            />

            {/* Glass highlight on sphere */}
            <ellipse
              cx={dot.x - coreR * 0.2}
              cy={dot.y - coreR * 0.25}
              rx={coreR * 0.45}
              ry={coreR * 0.3}
              fill="white"
              opacity={isActive ? 0.35 : 0.15}
              className="pointer-events-none"
            />

            {/* Level text */}
            <text
              x={dot.x}
              y={dot.y + 1}
              fill="#fff"
              fontSize={isActive ? 11 : 9}
              fontWeight={800}
              textAnchor="middle"
              dominantBaseline="middle"
              className="pointer-events-none"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
            >
              {level.toFixed(level % 1 === 0 ? 0 : 1)}
            </text>
          </g>
        );
      })}

      {/* ====== LABELS ====== */}
      {spheres.map((s, i) => {
        const labelR = maxR + 50;
        const p = polar(c, c, labelR, i * step);
        const color = s.color || "#8b5cf6";
        const isActive = dragging === s.id || hovered === s.id;
        const name = s.name.length > 16 ? s.name.slice(0, 15) + "\u2026" : s.name;
        const level = getLevel(s.id);
        const target = Number(s.target_level) || 10;

        return (
          <g
            key={`lbl-${s.id}`}
            className="cursor-pointer"
            onClick={() => onSphereClick(s.id)}
            onPointerEnter={() => setHovered(s.id)}
            onPointerLeave={() => setHovered(null)}
          >
            {/* Label name */}
            <text
              x={p.x}
              y={p.y - 6}
              fill={isActive ? "#fff" : color}
              fontSize={isActive ? 13 : 11}
              fontWeight={isActive ? 700 : 600}
              textAnchor="middle"
              dominantBaseline="middle"
              opacity={isActive ? 1 : 0.8}
            >
              {name}
            </text>
            {/* Level sub-label */}
            <text
              x={p.x}
              y={p.y + 8}
              fill={isActive ? "#aaa" : "#555"}
              fontSize={9}
              fontWeight={500}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {level}/{target}
            </text>
          </g>
        );
      })}

      {/* Center orb */}
      <circle cx={c} cy={c} r={4} fill="#8b5cf6" opacity={0.2 + Math.sin(time * 0.04) * 0.1} />
      <circle cx={c} cy={c} r={2} fill="#8b5cf6" opacity={0.5} />
    </svg>
  );
}
