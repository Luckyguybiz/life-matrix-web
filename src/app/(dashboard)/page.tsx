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

  const [radarSize, setRadarSize] = useState(500);

  useEffect(() => {
    function updateSize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Leave space for sidebar (224px) and padding
      const available = Math.min(w - 224 - 80, h - 160);
      setRadarSize(Math.max(320, Math.min(600, available)));
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

      // Optimistic update
      setSpheres((prev) =>
        prev.map((s) =>
          s.id === sphereId ? { ...s, current_level: newLevel } : s
        )
      );

      await supabase
        .from("spheres")
        .update({
          current_level: newLevel,
          updated_at: new Date().toISOString(),
        })
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
        <div className="text-zinc-500">Загрузка...</div>
      </div>
    );
  }

  if (spheres.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-6xl opacity-20">◎</div>
        <p className="text-zinc-400 text-lg">Нет сфер</p>
        <p className="text-zinc-600 text-sm">
          Добавьте сферы жизни, чтобы увидеть паутину
        </p>
        <Link
          href="/sphere/new"
          className="bg-white text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-200 transition mt-2"
        >
          + Добавить сферу
        </Link>
      </div>
    );
  }

  if (spheres.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-6xl opacity-20">◎</div>
        <p className="text-zinc-400">
          Нужно минимум 3 сферы для паутины
        </p>
        <p className="text-zinc-600 text-sm">
          Сейчас: {spheres.length}. Добавьте ещё.
        </p>
        <Link
          href="/sphere/new"
          className="bg-white text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-200 transition mt-2"
        >
          + Добавить сферу
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-full">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-2">
        <div>
          <h2 className="text-xl font-bold">Матрица жизни</h2>
          <p className="text-zinc-500 text-xs mt-0.5">
            Перетаскивай кружки, чтобы менять уровень
          </p>
        </div>
        <Link
          href="/sphere/new"
          className="bg-zinc-900 border border-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:border-zinc-600 transition"
        >
          + Сфера
        </Link>
      </div>

      {/* Radar */}
      <div className="flex-1 flex items-center justify-center">
        <InteractiveRadar
          spheres={spheres}
          size={radarSize}
          onLevelChange={handleLevelChange}
          onSphereClick={handleSphereClick}
        />
      </div>

      {/* Bottom cards */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
        {spheres.map((s) => {
          const color = s.color || "#8b5cf6";
          const level = Number(s.current_level) || 0;
          const target = Number(s.target_level) || 10;
          const pct = target > 0 ? (level / target) * 100 : 0;

          return (
            <Link
              key={s.id}
              href={`/sphere/${s.id}`}
              className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl px-3 py-2.5 hover:border-zinc-600 transition group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-medium text-zinc-300 truncate group-hover:text-white transition">
                  {s.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-[10px] text-zinc-500 font-medium">
                  {level}/{target}
                </span>
              </div>
              {saving === s.id && (
                <div
                  className="text-[9px] mt-1 font-medium"
                  style={{ color }}
                >
                  Сохранение...
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
