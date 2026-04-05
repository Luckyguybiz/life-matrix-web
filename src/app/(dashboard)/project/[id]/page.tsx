"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Project, Milestone } from "@/lib/types";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [progress, setProgress] = useState(0);
  const [newMs, setNewMs] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  async function load() {
    const [p, m] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("milestones").select("*").eq("project_id", id).order("sort_order"),
    ]);
    if (p.data) { setProject(p.data); setProgress(p.data.progress); }
    setMilestones(m.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function recalc(sphereId: string) {
    const { data } = await supabase.from("projects").select("progress").eq("sphere_id", sphereId).in("status", ["active", "completed"]);
    if (!data || data.length === 0) { await supabase.from("spheres").update({ current_level: 0 }).eq("id", sphereId); return; }
    const avg = data.reduce((s, p) => s + p.progress, 0) / data.length;
    await supabase.from("spheres").update({ current_level: Math.round((avg / 10) * 10) / 10 }).eq("id", sphereId);
  }

  async function setP(val: number) {
    setProgress(val);
    if (!project) return;
    await supabase.from("projects").update({ progress: val }).eq("id", id);
    await recalc(project.sphere_id);
  }

  async function addMs(e: React.FormEvent) {
    e.preventDefault();
    if (!newMs.trim() || !project) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("milestones").insert({ user_id: user.id, project_id: id, title: newMs.trim(), sort_order: milestones.length });
    setNewMs(""); load();
  }

  async function toggleMs(msId: string, done: boolean) {
    await supabase.from("milestones").update({ is_completed: done, completed_at: done ? new Date().toISOString() : null }).eq("id", msId);
    load();
  }

  async function delMs(msId: string) {
    await supabase.from("milestones").delete().eq("id", msId); load();
  }

  async function del() {
    if (!project || !confirm(`Удалить?`)) return;
    await supabase.from("projects").delete().eq("id", id);
    await recalc(project.sphere_id);
    router.push(`/sphere/${project.sphere_id}`); router.refresh();
  }

  async function toggleStatus() {
    if (!project) return;
    const s = project.status === "active" ? "completed" : "active";
    const p = s === "completed" ? 100 : project.progress;
    await supabase.from("projects").update({ status: s, progress: p }).eq("id", id);
    await recalc(project.sphere_id); setProgress(p); load();
  }

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border border-white/20 border-t-white/60 rounded-full animate-spin" /></div>;
  if (!project) return <div className="flex items-center justify-center h-full text-white/20">Не найден</div>;

  const done = milestones.filter((m) => m.is_completed).length;

  return (
    <div className="max-w-xl animate-fade-in">
      <Link href={`/sphere/${project.sphere_id}`} className="text-white/20 hover:text-white/40 text-[11px] mb-8 inline-block transition">← Сфера</Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-lg font-medium text-white/80">{project.title}</h2>
          {project.description && <p className="text-white/25 text-xs mt-2 leading-relaxed">{project.description}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <button onClick={toggleStatus}
            className={`text-[10px] px-3 py-1 rounded-full border transition ${
              project.status === "completed" ? "border-white/20 text-white/50" : "border-white/[0.06] text-white/20 hover:text-white/40"
            }`}>
            {project.status === "completed" ? "✓ Готов" : "○ Актив"}
          </button>
          <button onClick={del} className="text-white/10 hover:text-white/30 text-xs transition">×</button>
        </div>
      </div>

      {/* Points */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="border border-white/[0.04] rounded-lg p-4">
          <div className="text-[9px] text-white/15 uppercase tracking-widest mb-2">Точка А</div>
          <div className="text-xs text-white/40">{project.point_a || "—"}</div>
        </div>
        <div className="border border-white/[0.04] rounded-lg p-4">
          <div className="text-[9px] text-white/15 uppercase tracking-widest mb-2">Точка Б</div>
          <div className="text-xs text-white/40">{project.point_b || "—"}</div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] text-white/15 uppercase tracking-widest">Прогресс</span>
          <span className="text-xl font-light text-white/60">{progress}%</span>
        </div>

        <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden mb-4">
          <div className="h-full bg-white/30 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex gap-1">
          {[0, 10, 25, 50, 75, 100].map((v) => (
            <button key={v} onClick={() => setP(v)}
              className={`flex-1 py-2 rounded-lg text-[10px] transition-all ${
                progress === v ? "bg-white/10 text-white/70" : "text-white/15 hover:text-white/30 hover:bg-white/[0.03]"
              }`}>
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mt-3">
          <button onClick={() => setP(Math.max(0, progress - 5))}
            className="w-8 h-8 rounded-full border border-white/[0.06] text-white/20 hover:text-white/40 flex items-center justify-center transition text-xs">−</button>
          <input type="range" min={0} max={100} value={progress} onChange={(e) => setP(Number(e.target.value))}
            className="w-24 accent-white opacity-30 hover:opacity-60 transition cursor-pointer" />
          <button onClick={() => setP(Math.min(100, progress + 5))}
            className="w-8 h-8 rounded-full border border-white/[0.06] text-white/20 hover:text-white/40 flex items-center justify-center transition text-xs">+</button>
        </div>
      </div>

      {/* Milestones */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[9px] text-white/15 uppercase tracking-widest">Этапы · {done}/{milestones.length}</span>
        </div>

        <div className="space-y-0.5">
          {milestones.map((m) => (
            <div key={m.id} className={`flex items-center gap-3 py-2.5 px-2 rounded-lg group ${m.is_completed ? "" : "hover:bg-white/[0.02]"} transition`}>
              <button onClick={() => toggleMs(m.id, !m.is_completed)}
                className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8px] transition shrink-0 ${
                  m.is_completed ? "border-white/20 text-white/40" : "border-white/10 text-transparent hover:border-white/20"
                }`}>✓</button>
              <span className={`flex-1 text-xs transition ${m.is_completed ? "text-white/15 line-through" : "text-white/40"}`}>{m.title}</span>
              <button onClick={() => delMs(m.id)} className="text-white/0 group-hover:text-white/15 hover:!text-white/30 text-xs transition">×</button>
            </div>
          ))}
        </div>

        <form onSubmit={addMs} className="flex gap-2 mt-3">
          <input type="text" value={newMs} onChange={(e) => setNewMs(e.target.value)} placeholder="Новый этап..."
            className="flex-1 bg-transparent border border-white/[0.04] rounded-lg px-3 py-2 text-xs text-white/50 placeholder-white/10 focus:outline-none focus:border-white/10 transition" />
          <button type="submit" disabled={!newMs.trim()}
            className="border border-white/10 text-white/30 px-3 py-2 rounded-lg text-xs hover:text-white/50 transition disabled:opacity-10">+</button>
        </form>
      </div>
    </div>
  );
}
