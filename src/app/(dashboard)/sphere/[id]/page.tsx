"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";
import type { Sphere, Project } from "@/lib/types";

const STATUS: Record<string, { label: string; color: string }> = {
  active: { label: "Активный", color: "#4ade80" },
  completed: { label: "Завершён", color: "#3b82f6" },
  paused: { label: "На паузе", color: "#fbbf24" },
  archived: { label: "Архив", color: "#666" },
};

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export default function SphereDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [sphere, setSphere] = useState<Sphere | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      supabase.from("spheres").select("*").eq("id", id).single(),
      supabase
        .from("projects")
        .select("*")
        .eq("sphere_id", id)
        .order("created_at", { ascending: false }),
    ]).then(([sphereRes, projectsRes]) => {
      setSphere(sphereRes.data);
      setProjects(projectsRes.data || []);
      setLoading(false);
    });
  }, [id]);

  async function handleDelete() {
    if (!confirm("Удалить сферу? Все проекты внутри будут удалены.")) return;
    await supabase.from("spheres").delete().eq("id", id);
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!sphere) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        Сфера не найдена
      </div>
    );
  }

  const color = sphere.color || "#8b5cf6";
  const rgb = hexToRgb(color);
  const level = Number(sphere.current_level) || 0;
  const target = Number(sphere.target_level) || 10;
  const pct = target > 0 ? (level / target) * 100 : 0;

  return (
    <div className="max-w-2xl animate-fade-in relative">
      {/* Ambient glow */}
      <div
        className="absolute -top-20 -left-20 w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: color, opacity: 0.04 }}
      />

      <Link
        href="/"
        className="text-zinc-600 hover:text-zinc-300 text-xs mb-6 inline-flex items-center gap-1.5 transition"
      >
        <span>←</span> Матрица
      </Link>

      {/* Sphere header */}
      <div className="flex items-center gap-5 mb-8">
        <div className="relative">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${color}, ${color}aa)`,
              boxShadow: `0 0 30px rgba(${rgb.r},${rgb.g},${rgb.b},0.25), 0 0 60px rgba(${rgb.r},${rgb.g},${rgb.b},0.1)`,
            }}
          >
            <span className="text-white text-xl font-bold">
              {level.toFixed(level % 1 === 0 ? 0 : 1)}
            </span>
          </div>
          {/* Pulsing ring */}
          <div
            className="absolute -inset-1 rounded-2xl animate-pulse-soft"
            style={{
              border: `1px solid rgba(${rgb.r},${rgb.g},${rgb.b},0.2)`,
            }}
          />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{sphere.name}</h2>
          <p className="text-zinc-500 text-sm mt-1">
            Уровень {level} из {target}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="text-zinc-700 hover:text-red-400 text-xs px-3 py-1.5 rounded-lg hover:bg-red-400/[0.06] transition-all"
        >
          Удалить
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-10">
        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${color}88, ${color})`,
              boxShadow: `0 0 12px rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`,
            }}
          />
        </div>
      </div>

      {/* Projects section */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
          Проекты · {projects.length}
        </h3>
        <Link
          href={`/project/new?sphereId=${id}`}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
          style={{
            color,
            backgroundColor: `rgba(${rgb.r},${rgb.g},${rgb.b},0.08)`,
          }}
        >
          + Проект
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: `rgba(${rgb.r},${rgb.g},${rgb.b},0.06)` }}
          >
            <span style={{ color }} className="text-lg">+</span>
          </div>
          <p className="text-zinc-500 text-sm">Нет проектов</p>
          <p className="text-zinc-700 text-xs mt-1">Добавьте первый проект в эту сферу</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((p) => {
            const st = STATUS[p.status] || STATUS.active;
            const stRgb = hexToRgb(st.color);
            return (
              <Link
                key={p.id}
                href={`/project/${p.id}`}
                className="group bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 relative overflow-hidden"
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at top left, rgba(${rgb.r},${rgb.g},${rgb.b},0.04) 0%, transparent 60%)`,
                  }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-semibold text-sm group-hover:text-white transition">
                      {p.title}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                      style={{
                        backgroundColor: `rgba(${stRgb.r},${stRgb.g},${stRgb.b},0.1)`,
                        color: st.color,
                      }}
                    >
                      {st.label}
                    </span>
                  </div>
                  {(p.point_a || p.point_b) && (
                    <p className="text-[11px] text-zinc-600 mb-2.5">
                      {p.point_a || "—"}{" "}
                      <span className="text-zinc-700 mx-1">→</span>{" "}
                      {p.point_b || "—"}
                    </p>
                  )}
                  <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${p.progress}%`,
                        background: `linear-gradient(90deg, ${color}88, ${color})`,
                      }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
