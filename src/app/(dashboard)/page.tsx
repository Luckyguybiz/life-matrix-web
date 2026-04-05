"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import InteractiveRadar from "@/components/InteractiveRadar";
import type { Sphere } from "@/lib/types";

export default function MatrixPage() {
  const [spheres, setSpheres] = useState<Sphere[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const [radarSize, setRadarSize] = useState(520);

  useEffect(() => {
    function updateSize() {
      const available = Math.min(window.innerWidth - 224 - 80, window.innerHeight - 160);
      setRadarSize(Math.max(360, Math.min(640, available)));
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    supabase.from("spheres").select("*").order("sort_order")
      .then(({ data }) => { setSpheres(data || []); setLoading(false); });
  }, []);

  const handleScoreChange = useCallback(async (sphereId: string, newScore: number) => {
    setSpheres((prev) => prev.map((s) => s.id === sphereId ? { ...s, score: newScore } : s));
    await supabase.from("spheres").update({ score: newScore, updated_at: new Date().toISOString() }).eq("id", sphereId);
  }, [supabase]);

  const handleSphereClick = useCallback((sphereId: string) => { router.push(`/sphere/${sphereId}`); }, [router]);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border border-white/20 border-t-white/60 rounded-full animate-spin" /></div>;

  if (spheres.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 animate-fade-in">
        <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border border-white/10" />
        </div>
        <p className="text-white/40 text-sm">{spheres.length === 0 ? "Нет сфер" : `${spheres.length} из 3 минимальных`}</p>
        <Link href="/sphere/new" className="border border-white/15 text-white/60 px-5 py-2 rounded-full text-xs hover:text-white hover:border-white/30 transition-all">+ Добавить сферу</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-full animate-fade-in">
      <div className="flex items-center justify-between w-full mb-2">
        <h2 className="text-sm font-medium text-white/70 tracking-wide">Матрица</h2>
        <Link href="/sphere/new" className="border border-white/10 text-white/40 px-3 py-1.5 rounded-full text-[11px] hover:text-white/70 hover:border-white/20 transition-all">+ Сфера</Link>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <InteractiveRadar spheres={spheres} size={radarSize} onScoreChange={handleScoreChange} onSphereClick={handleSphereClick} />
      </div>

      <div className="w-full flex justify-center gap-6 mt-2 flex-wrap">
        {spheres.map((s) => {
          const score = Number(s.score) || 0;
          const pct = (score / 10) * 100;
          return (
            <Link key={s.id} href={`/sphere/${s.id}`} className="group flex flex-col items-center gap-2 hover:opacity-100 opacity-50 transition-all duration-300">
              <div className="w-10 h-10 rounded-full border border-white/20 bg-black flex items-center justify-center group-hover:border-white/50 transition-all relative">
                <span className="text-[10px] text-white/60 font-medium group-hover:text-white/90 transition">{score.toFixed(score % 1 === 0 ? 0 : 1)}</span>
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="19" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.05" />
                  <circle cx="20" cy="20" r="19" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.2"
                    strokeDasharray={`${pct * 1.194} 200`} strokeLinecap="round" className="transition-all duration-700" />
                </svg>
              </div>
              <span className="text-[10px] text-white/30 group-hover:text-white/60 transition truncate max-w-[80px] text-center">{s.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
