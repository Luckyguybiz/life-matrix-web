"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import RadarChart from "@/components/RadarChart";
import type { Sphere } from "@/lib/types";

export default function RadarPage() {
  const [spheres, setSpheres] = useState<Sphere[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("spheres").select("*").order("sort_order")
      .then(({ data }) => { setSpheres(data || []); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border border-white/20 border-t-white/60 rounded-full animate-spin" /></div>;

  if (spheres.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in">
        <div className="w-12 h-12 rounded-full border border-white/10" />
        <p className="text-white/25 text-xs">Нужно минимум 3 сферы</p>
      </div>
    );
  }

  const totalLevel = spheres.reduce((s, sp) => s + (Number(sp.current_level) || 0), 0);
  const totalTarget = spheres.reduce((s, sp) => s + (Number(sp.target_level) || 10), 0);
  const overall = totalTarget > 0 ? Math.round((totalLevel / totalTarget) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-medium text-white/70 tracking-wide">Радар</h2>
        <div className="text-right">
          <span className="text-xl font-light text-white/50">{overall}%</span>
        </div>
      </div>

      <div className="border border-white/[0.04] rounded-2xl p-8 mb-6 flex justify-center">
        <RadarChart spheres={spheres} size={360} />
      </div>

      <div className="space-y-1">
        {spheres.map((s) => {
          const level = Number(s.current_level) || 0;
          const target = Number(s.target_level) || 10;
          const pct = target > 0 ? (level / target) * 100 : 0;
          return (
            <Link key={s.id} href={`/sphere/${s.id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition group">
              <div className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center shrink-0">
                <span className="text-[9px] text-white/40 font-medium">{level.toFixed(level % 1 === 0 ? 0 : 1)}</span>
              </div>
              <span className="flex-1 text-xs text-white/30 group-hover:text-white/50 transition truncate">{s.name}</span>
              <div className="w-16 h-px bg-white/[0.04] overflow-hidden">
                <div className="h-full bg-white/20 transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[9px] text-white/15 w-8 text-right">{level}/{target}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
