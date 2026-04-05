"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";
import type { Project, Milestone } from "@/lib/types";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [progress, setProgress] = useState(0);
  const [newMs, setNewMs] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  async function load() {
    const [projRes, msRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase
        .from("milestones")
        .select("*")
        .eq("project_id", id)
        .order("sort_order"),
    ]);
    if (projRes.data) {
      setProject(projRes.data);
      setProgress(projRes.data.progress);
    }
    setMilestones(msRes.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function recalcSphere(sphereId: string) {
    const { data: projects } = await supabase
      .from("projects")
      .select("progress")
      .eq("sphere_id", sphereId)
      .in("status", ["active", "completed"]);

    if (!projects || projects.length === 0) {
      await supabase
        .from("spheres")
        .update({ current_level: 0 })
        .eq("id", sphereId);
      return;
    }
    const avg =
      projects.reduce((s, p) => s + p.progress, 0) / projects.length;
    const level = Math.round((avg / 10) * 10) / 10;
    await supabase
      .from("spheres")
      .update({ current_level: level })
      .eq("id", sphereId);
  }

  async function handleProgress(val: number) {
    setProgress(val);
    if (!project) return;
    await supabase.from("projects").update({ progress: val }).eq("id", id);
    await recalcSphere(project.sphere_id);
  }

  async function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!newMs.trim() || !project) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("milestones").insert({
      user_id: user.id,
      project_id: id,
      title: newMs.trim(),
      sort_order: milestones.length,
    });
    setNewMs("");
    load();
  }

  async function toggleMilestone(msId: string, completed: boolean) {
    await supabase.from("milestones").update({
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
    }).eq("id", msId);
    load();
  }

  async function deleteMilestone(msId: string) {
    await supabase.from("milestones").delete().eq("id", msId);
    load();
  }

  async function handleDelete() {
    if (!project || !confirm(`Удалить "${project.title}"?`)) return;
    const sphereId = project.sphere_id;
    await supabase.from("projects").delete().eq("id", id);
    await recalcSphere(sphereId);
    router.push(`/sphere/${sphereId}`);
    router.refresh();
  }

  async function toggleStatus() {
    if (!project) return;
    const newStatus = project.status === "active" ? "completed" : "active";
    const newProgress = newStatus === "completed" ? 100 : project.progress;
    await supabase
      .from("projects")
      .update({ status: newStatus, progress: newProgress })
      .eq("id", id);
    await recalcSphere(project.sphere_id);
    setProgress(newProgress);
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-500">Загрузка...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-500">Проект не найден</div>
      </div>
    );
  }

  const completed = milestones.filter((m) => m.is_completed).length;

  return (
    <div className="max-w-2xl">
      <Link
        href={`/sphere/${project.sphere_id}`}
        className="text-zinc-500 hover:text-white text-sm mb-4 inline-block"
      >
        ← Назад к сфере
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">{project.title}</h2>
        <div className="flex gap-2">
          <button
            onClick={toggleStatus}
            className={`text-xs px-3 py-1.5 rounded-lg border transition ${
              project.status === "completed"
                ? "border-green-500/30 text-green-400"
                : "border-zinc-700 text-zinc-400 hover:text-white"
            }`}
          >
            {project.status === "completed" ? "✓ Завершён" : "Активный"}
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-zinc-600 hover:text-red-400 transition"
          >
            Удалить
          </button>
        </div>
      </div>

      {/* Points A → B */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
            Точка А
          </div>
          <div className="text-sm">{project.point_a || "—"}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
            Точка Б
          </div>
          <div className="text-sm">{project.point_b || "—"}</div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
          Прогресс
        </div>
        <ProgressBar progress={progress} color="#8b5cf6" />
        <div className="flex gap-2 mt-3">
          {[0, 25, 50, 75, 100].map((v) => (
            <button
              key={v}
              onClick={() => handleProgress(v)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                progress === v
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-900 text-zinc-500 hover:text-white"
              }`}
            >
              {v}%
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3">
          <button
            onClick={() => handleProgress(Math.max(0, progress - 5))}
            className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center transition"
          >
            −
          </button>
          <span className="text-lg font-bold w-16 text-center">
            {progress}%
          </span>
          <button
            onClick={() => handleProgress(Math.min(100, progress + 5))}
            className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center transition"
          >
            +
          </button>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="mb-6">
          <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
            Описание
          </div>
          <p className="text-sm text-zinc-300">{project.description}</p>
        </div>
      )}

      {/* Milestones */}
      <div className="mb-6">
        <div className="text-xs text-zinc-500 uppercase tracking-wide mb-3">
          Этапы ({completed}/{milestones.length})
        </div>

        <div className="space-y-1">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 py-2 border-b border-zinc-900"
            >
              <button
                onClick={() => toggleMilestone(m.id, !m.is_completed)}
                className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs transition ${
                  m.is_completed
                    ? "bg-green-500/20 border-green-500 text-green-400"
                    : "border-zinc-700 text-transparent hover:border-zinc-500"
                }`}
              >
                ✓
              </button>
              <span
                className={`flex-1 text-sm ${
                  m.is_completed
                    ? "text-zinc-600 line-through"
                    : "text-white"
                }`}
              >
                {m.title}
              </span>
              <button
                onClick={() => deleteMilestone(m.id)}
                className="text-zinc-700 hover:text-red-400 text-sm transition"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddMilestone} className="flex gap-2 mt-3">
          <input
            type="text"
            value={newMs}
            onChange={(e) => setNewMs(e.target.value)}
            placeholder="Новый этап..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
          <button
            type="submit"
            disabled={!newMs.trim()}
            className="bg-violet-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-violet-500 transition disabled:opacity-30"
          >
            +
          </button>
        </form>
      </div>
    </div>
  );
}
