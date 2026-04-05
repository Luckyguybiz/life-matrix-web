"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
      await supabase.from("spheres").update({ current_level: 0 }).eq("id", sphereId);
      return;
    }
    const avg = projects.reduce((s, p) => s + p.progress, 0) / projects.length;
    const level = Math.round((avg / 10) * 10) / 10;
    await supabase.from("spheres").update({ current_level: level }).eq("id", sphereId);
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
    const { data: { user } } = await supabase.auth.getUser();
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
    await supabase.from("projects").update({ status: newStatus, progress: newProgress }).eq("id", id);
    await recalcSphere(project.sphere_id);
    setProgress(newProgress);
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        Проект не найден
      </div>
    );
  }

  const completed = milestones.filter((m) => m.is_completed).length;
  const msPct = milestones.length > 0 ? (completed / milestones.length) * 100 : 0;

  return (
    <div className="max-w-2xl animate-fade-in relative">
      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 w-[250px] h-[250px] rounded-full bg-violet-600/[0.03] blur-[100px] pointer-events-none" />

      <Link
        href={`/sphere/${project.sphere_id}`}
        className="text-zinc-600 hover:text-zinc-300 text-xs mb-6 inline-flex items-center gap-1.5 transition"
      >
        <span>←</span> Назад к сфере
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{project.title}</h2>
          {project.description && (
            <p className="text-zinc-500 text-sm mt-2 leading-relaxed">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <button
            onClick={toggleStatus}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              project.status === "completed"
                ? "border-green-500/20 text-green-400 bg-green-400/[0.06]"
                : "border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            {project.status === "completed" ? "✓ Завершён" : "○ Активный"}
          </button>
          <button
            onClick={handleDelete}
            className="text-zinc-700 hover:text-red-400 text-xs px-2 py-1.5 rounded-lg hover:bg-red-400/[0.06] transition-all"
          >
            ×
          </button>
        </div>
      </div>

      {/* Points A → B */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-zinc-700 rounded-r" />
          <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2 pl-2">
            Точка А
          </div>
          <div className="text-sm text-zinc-300 pl-2">{project.point_a || "—"}</div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-violet-500/50 rounded-r" />
          <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2 pl-2">
            Точка Б
          </div>
          <div className="text-sm text-zinc-300 pl-2">{project.point_b || "—"}</div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-zinc-600 uppercase tracking-widest">Прогресс</span>
          <span className="text-2xl font-bold tracking-tight">{progress}%</span>
        </div>

        {/* Glowing progress bar */}
        <div className="h-2.5 bg-white/[0.04] rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #7c3aed, #8b5cf6, #a78bfa)",
              boxShadow: "0 0 16px rgba(139,92,246,0.4)",
            }}
          />
        </div>

        {/* Quick buttons */}
        <div className="flex gap-1.5">
          {[0, 10, 25, 50, 75, 100].map((v) => (
            <button
              key={v}
              onClick={() => handleProgress(v)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                progress === v
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                  : "bg-white/[0.03] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06]"
              }`}
            >
              {v}%
            </button>
          ))}
        </div>

        {/* Fine controls */}
        <div className="flex items-center justify-center gap-5 mt-4">
          <button
            onClick={() => handleProgress(Math.max(0, progress - 5))}
            className="w-9 h-9 rounded-full bg-white/[0.04] text-zinc-500 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-all text-sm"
          >
            −
          </button>
          <div className="w-16 text-center">
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => handleProgress(Number(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer"
            />
          </div>
          <button
            onClick={() => handleProgress(Math.min(100, progress + 5))}
            className="w-9 h-9 rounded-full bg-white/[0.04] text-zinc-500 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-all text-sm"
          >
            +
          </button>
        </div>
      </div>

      {/* Milestones */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-zinc-600 uppercase tracking-widest">
            Этапы · {completed}/{milestones.length}
          </span>
          {milestones.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-20 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${msPct}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-600">{Math.round(msPct)}%</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          {milestones.map((m) => (
            <div
              key={m.id}
              className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 group ${
                m.is_completed ? "bg-white/[0.01]" : "hover:bg-white/[0.02]"
              }`}
            >
              <button
                onClick={() => toggleMilestone(m.id, !m.is_completed)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] transition-all shrink-0 ${
                  m.is_completed
                    ? "bg-green-500/20 border-green-500/50 text-green-400"
                    : "border-zinc-700 text-transparent hover:border-zinc-500"
                }`}
              >
                ✓
              </button>
              <span
                className={`flex-1 text-sm transition ${
                  m.is_completed ? "text-zinc-600 line-through" : "text-zinc-300"
                }`}
              >
                {m.title}
              </span>
              <button
                onClick={() => deleteMilestone(m.id)}
                className="text-zinc-800 hover:text-red-400 opacity-0 group-hover:opacity-100 text-xs transition-all"
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
            className="flex-1 bg-white/[0.03] border border-white/[0.05] rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/30 transition-all"
          />
          <button
            type="submit"
            disabled={!newMs.trim()}
            className="bg-violet-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-violet-500 transition-all disabled:opacity-20 disabled:hover:bg-violet-600"
          >
            +
          </button>
        </form>
      </div>
    </div>
  );
}
