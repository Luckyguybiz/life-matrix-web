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
  archived: { label: "Архив", color: "#888" },
};

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
        <div className="text-zinc-500">Загрузка...</div>
      </div>
    );
  }

  if (!sphere) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-500">Сфера не найдена</div>
      </div>
    );
  }

  const pct =
    (Number(sphere.target_level) || 1) > 0
      ? ((Number(sphere.current_level) || 0) /
          (Number(sphere.target_level) || 1)) *
        100
      : 0;

  return (
    <div className="max-w-2xl">
      <Link
        href="/"
        className="text-zinc-500 hover:text-white text-sm mb-4 inline-block"
      >
        ← Назад
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
          style={{ backgroundColor: (sphere.color || "#8b5cf6") + "20" }}
        >
          <span style={{ color: sphere.color || "#8b5cf6" }}>●</span>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{sphere.name}</h2>
          <p className="text-zinc-500 text-sm">
            Уровень: {Number(sphere.current_level) || 0} /{" "}
            {Number(sphere.target_level) || 10}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="text-zinc-600 hover:text-red-400 text-sm transition"
        >
          Удалить
        </button>
      </div>

      <div className="mb-6">
        <ProgressBar
          progress={pct}
          color={sphere.color || "#8b5cf6"}
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
          Проекты ({projects.length})
        </h3>
        <Link
          href={`/project/new?sphereId=${id}`}
          className="bg-white text-black px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-zinc-200 transition"
        >
          + Проект
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 text-zinc-600 text-sm">
          Нет проектов. Добавьте первый.
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((p) => {
            const st = STATUS[p.status] || STATUS.active;
            return (
              <Link
                key={p.id}
                href={`/project/${p.id}`}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{p.title}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: st.color + "20",
                      color: st.color,
                    }}
                  >
                    {st.label}
                  </span>
                </div>
                {(p.point_a || p.point_b) && (
                  <p className="text-xs text-zinc-500 mb-2">
                    {p.point_a || "—"} → {p.point_b || "—"}
                  </p>
                )}
                <ProgressBar
                  progress={p.progress}
                  color={sphere.color || "#8b5cf6"}
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
