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
  const [saving, setSaving] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const [radarSize, setRadarSize] = useState(520);

  useEffect(() => {
    function updateSize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const available = Math.min(w - 224 - 80, h - 180);
      setRadarSize(Math.max(360, Math.min(640, available)));
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

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

  const handleLevelChange = useCallback(
    async (sphereId: string, newLevel: number) => {
      setSaving(sphereId);
      setSpheres((prev) =>
        prev.map((s) =>
          s.id === sphereId ? { ...s, current_level: newLevel } : s
        )
      );
      await supabase
        .from("spheres")
        .update({ current_level: newLevel, updated_at: new Date().toISOString() })
        .eq("id", sphereId);
      setSaving(null);
    },
    [supabase]
  );

  const handleSphereClick = useCallback(
    (sphereId: string) => {
      router.push(`/sphere/${sphereId}`);
    },
    [router]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (spheres.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 animate-fade-in">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-violet-500/5 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-violet-500/20 animate-pulse-soft" />
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-zinc-300 text-lg font-medium">
            {spheres.length === 0 ? "Нет сфер" : "Нужно минимум 3 сферы"}
          </p>
          <p className="text-zinc-600 text-sm mt-1">
            {spheres.length === 0
              ? "Добавьте сферы жизни, чтобы увидеть паутину"
              : `Сейчас: ${spheres.length}. Добавьте ещё.`}
          </p>
        </div>
        <Link
          href="/sphere/new"
          className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-100 transition-all hover:shadow-lg hover:shadow-white/10"
        >
          + Добавить сферу
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-full animate-fade-in relative">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {spheres.slice(0, 4).map((s, i) => {
          const positions = [
            { top: "10%", left: "20%" },
            { top: "60%", right: "10%" },
            { bottom: "20%", left: "30%" },
            { top: "30%", right: "30%" },
          ];
          return (
            <div
              key={s.id}
              className="absolute w-[200px] h-[200px] rounded-full blur-[100px] animate-pulse-soft"
              style={{
                backgroundColor: s.color || "#8b5cf6",
                opacity: 0.03,
                animationDelay: `${i * 0.5}s`,
                ...positions[i],
              }}
            />
          );
        })}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between w-full mb-1 relative z-10">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Матрица жизни</h2>
          <p className="text-zinc-600 text-[11px] mt-0.5">
            Перетаскивай сферы — меняй уровень
          </p>
        </div>
        <Link
          href="/sphere/new"
          className="bg-white/[0.05] border border-white/[0.08] text-zinc-300 px-4 py-2 rounded-xl text-xs font-medium hover:bg-white/[0.1] hover:text-white transition-all"
        >
          + Сфера
        </Link>
      </div>

      {/* Radar */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <InteractiveRadar
          spheres={spheres}
          size={radarSize}
          onLevelChange={handleLevelChange}
          onSphereClick={handleSphereClick}
        />
      </div>

      {/* Bottom sphere cards */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1 relative z-10">
        {spheres.map((s) => {
          const color = s.color || "#8b5cf6";
          const rgb = hexToRgb(color);
          const level = Number(s.current_level) || 0;
          const target = Number(s.target_level) || 10;
          const pct = target > 0 ? (level / target) * 100 : 0;
          const isSaving = saving === s.id;

          return (
            <Link
              key={s.id}
              href={`/sphere/${s.id}`}
              className="group relative bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-3 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300"
            >
              {/* Glow on hover */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at center, rgba(${rgb.r},${rgb.g},${rgb.b},0.06) 0%, transparent 70%)`,
                }}
              />

              <div className="relative flex items-center gap-2.5 mb-2">
                {/* Mini sphere orb */}
                <div className="relative">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      background: `radial-gradient(circle at 35% 35%, ${color}, ${color}aa)`,
                      boxShadow: `0 0 12px rgba(${rgb.r},${rgb.g},${rgb.b},0.2)`,
                    }}
                  >
                    <span className="text-[9px] font-bold text-white">
                      {level.toFixed(level % 1 === 0 ? 0 : 1)}
                    </span>
                  </div>
                  {/* Pulsing ring */}
                  <div
                    className="absolute inset-0 rounded-full animate-pulse-soft"
                    style={{
                      boxShadow: `0 0 8px rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`,
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-zinc-300 truncate block group-hover:text-white transition">
                    {s.name}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {level}/{target}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative h-1 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${color}88, ${color})`,
                    boxShadow: `0 0 8px rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`,
                  }}
                />
              </div>

              {isSaving && (
                <div className="absolute top-1.5 right-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: color }}
                  />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}
