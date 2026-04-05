"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import RadarChart from "@/components/RadarChart";
import type { Sphere } from "@/lib/types";

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export default function RadarPage() {
  const [spheres, setSpheres] = useState<Sphere[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("spheres")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        setSpheres(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (spheres.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-violet-500/5 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-violet-500/10 animate-pulse-soft" />
        </div>
        <p className="text-zinc-400">Нужно минимум 3 сферы для радара</p>
        <p className="text-zinc-700 text-xs">Сейчас: {spheres.length}</p>
      </div>
    );
  }

  // Calculate overall score
  const totalLevel = spheres.reduce((s, sp) => s + (Number(sp.current_level) || 0), 0);
  const totalTarget = spheres.reduce((s, sp) => s + (Number(sp.target_level) || 10), 0);
  const overallPct = totalTarget > 0 ? Math.round((totalLevel / totalTarget) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Радарная диаграмма</h2>
          <p className="text-zinc-600 text-[11px] mt-0.5">Обзор баланса всех сфер</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tracking-tight">{overallPct}%</div>
          <div className="text-[10px] text-zinc-600">общий прогресс</div>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8 mb-6 flex justify-center">
        <RadarChart spheres={spheres} size={380} />
      </div>

      <div className="grid gap-2">
        {spheres.map((s) => {
          const color = s.color || "#8b5cf6";
          const rgb = hexToRgb(color);
          const level = Number(s.current_level) || 0;
          const target = Number(s.target_level) || 10;
          const pct = target > 0 ? (level / target) * 100 : 0;

          return (
            <Link
              key={s.id}
              href={`/sphere/${s.id}`}
              className="group flex items-center gap-3 bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${color}, ${color}aa)`,
                  boxShadow: `0 0 10px rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`,
                }}
              >
                <span className="text-[9px] text-white font-bold">
                  {level.toFixed(level % 1 === 0 ? 0 : 1)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition block truncate">
                  {s.name}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${color}88, ${color})`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-600 shrink-0">{level}/{target}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
